import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/Style';
import { colors } from '../constants/theme';
import { searchApi } from '../services/apiService';
import { useDebounce } from '../hooks/useDebounce';

const TABS = [
  { key: 'Chats', label: 'Chats', icon: 'chatbubbles-outline' },
  { key: 'Tasks', label: 'Tasks', icon: 'checkbox-outline' },
  { key: 'Bills', label: 'Bills', icon: 'receipt-outline' },
];

const TAB_FILTERS = {
  Chats: ['Groups', 'Direct messages', 'Private', 'Has tasks', 'Has bills', 'Unread'],
  Tasks: [
    'Assigned to me',
    'Assigned to others',
    'In progress',
    'High priority',
    'Due this week',
    'Completed',
  ],
  Bills: ['Owed to me', 'I owe', 'Awaiting payment', 'Overdue'],
};

function safeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function SearchScreen({ navigation }) {
  // State variables for query, active tab, active filters, results, and loading state
  const [searchQuery, setSearchQuery] = useState('Q4 Marketing');
  const [activeTab, setActiveTab] = useState('Chats');
  const [activeFilters, setActiveFilters] = useState([]);
  const [chatResults, setChatResults] = useState([]);
  const [groupedResults, setGroupedResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Debounce search query to prevent excessive API requests
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  // Track the latest request sequence to avoid race conditions
  const requestIdRef = useRef(0);

  // Memoized search execution function
  const executeSearch = useCallback(async (query, tab, filters) => {
    const trimmed = (query || '').trim();
    if (trimmed.length < 1) {
      setChatResults([]);
      setGroupedResults([]);
      setIsLoading(false);
      setErrorMsg(null);
      return;
    }

    const thisRequest = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await searchApi.search(trimmed, tab, filters);
      if (thisRequest !== requestIdRef.current) return;

      if (tab === 'Chats') {
        const list = data?.results || data?.chats || [];
        setChatResults(Array.isArray(list) ? list : []);
        setGroupedResults([]);
      } else {
        const groups = data?.groups || [];
        setGroupedResults(Array.isArray(groups) ? groups : []);
        setChatResults([]);
      }
    } catch (err) {
      if (thisRequest !== requestIdRef.current) return;
      setErrorMsg('Unable to retrieve results. Pull down to refresh.');
      setChatResults([]);
      setGroupedResults([]);
    } finally {
      if (thisRequest === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Trigger search when debounced query, active tab, or filters change
  useEffect(() => {
    executeSearch(debouncedSearchQuery, activeTab, activeFilters);
  }, [debouncedSearchQuery, activeTab, activeFilters, executeSearch]);

  const clearSearch = () => {
    setSearchQuery('');
    setChatResults([]);
    setGroupedResults([]);
    setErrorMsg(null);
  };

  const toggleFilter = (filterKey) => {
    setActiveFilters((prev) =>
      prev.includes(filterKey)
        ? prev.filter((f) => f !== filterKey)
        : [...prev, filterKey]
    );
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setActiveFilters([]);
  };

  // Render query text with blue background highlight
  const renderHighlightedText = (text, query) => {
    const stringText = safeString(text, '');
    if (!query || !stringText) return <Text>{stringText}</Text>;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return <Text>{stringText}</Text>;

    const parts = stringText.split(new RegExp(`(${escapeRegex(trimmedQuery)})`, 'gi'));
    return (
      <Text>
        {parts.map((part, i) =>
          part.toLowerCase() === trimmedQuery.toLowerCase() ? (
            <Text key={i} style={styles.highlightedText}>
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  // Status pill style resolution matching PRD requirements
  const getBillStatusStyle = (status = '') => {
    const s = safeString(status).toUpperCase();
    if (s.includes('PAID')) return { bg: colors.successBg, text: colors.success };
    if (s.includes('OVERDUE')) return { bg: colors.dangerBg, text: colors.danger };
    if (s.includes('YOU OWE') || s.includes('OFFER') || s.includes('PENDING')) {
      return { bg: colors.warningBg, text: colors.warningText };
    }
    return { bg: colors.primaryLight, text: colors.primary };
  };

  const handleToggleTaskCompleted = async (taskItem) => {
    await searchApi.completeTask(taskItem.id);
    executeSearch(searchQuery, activeTab, activeFilters);
  };

  // Render chat result card
  const renderChatItem = ({ item }) => {
    const title = item.title || item.name || '';
    const initials =
      item.avatarInitials || safeString(title, 'CH').substring(0, 2).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.chatCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('ChatDetail', {
            chatId: item.id,
            chat: item,
            searchQuery,
          })
        }
      >
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: item.avatarColor || colors.primary },
          ]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={styles.boldText} numberOfLines={1}>
                {renderHighlightedText(title, searchQuery)}
              </Text>
              {item.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{item.unread}</Text>
                </View>
              )}
            </View>
            <Text style={styles.timeAgoText}>
              {safeString(item.lastActivity || item.timeAgo, '')}
            </Text>
          </View>

          <Text style={styles.chatSummary}>
            {`${item.taskCount ?? 0} tasks · ${item.billCount ?? 0} bills`}
          </Text>

          {(item.matchCount > 0 || item.matches > 0) && (
            <View style={styles.matchesPill}>
              <Text style={styles.matchesPillText}>
                {`${item.matchCount || item.matches} matches`}
              </Text>
            </View>
          )}
        </View>

        <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  // Render grouped results (Tasks & Bills)
  const renderGroupedItem = ({ item: groupItem }) => {
    const items = groupItem.items || [];
    const chat = groupItem.chat || {};

    return (
      <View style={styles.groupCard}>
        {/* Group Header */}
        <TouchableOpacity
          style={styles.groupHeader}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('ChatDetail', {
              chatId: chat.id,
              chat: { ...chat, relatedItems: items, activeTabType: activeTab },
              searchQuery,
            })
          }
        >
          <View
            style={[
              styles.avatarCircleSmall,
              { backgroundColor: chat.avatarColor || colors.primary, marginRight: 10 },
            ]}
          >
            <Text style={styles.avatarTextSmall}>
              {safeString(
                chat.avatarInitials,
                safeString(chat.title, 'G').substring(0, 2).toUpperCase()
              )}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.groupTitle}>{safeString(chat.title, 'Chat')}</Text>
            <Text style={styles.groupSubtitle}>
              {safeString(chat.contextLabel, 'Conversation')}
            </Text>
          </View>

          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeText}>{items.length}</Text>
          </View>
        </TouchableOpacity>

        {/* Item Rows */}
        {items.map((subItem, index) => {
          const itemId = subItem.id ?? index;
          const title = subItem.title || subItem.name || '';

          return (
            <TouchableOpacity
              key={String(itemId)}
              style={styles.itemRow}
              activeOpacity={0.65}
              onPress={() => {
                if (activeTab === 'Tasks') {
                  navigation.navigate('TaskDetail', {
                    taskId: subItem.id,
                    task: { ...subItem, chat },
                  });
                } else {
                  navigation.navigate('BillDetail', {
                    billId: subItem.id,
                    bill: { ...subItem, chat },
                  });
                }
              }}
            >
              {activeTab === 'Tasks' && (
                <TouchableOpacity
                  onPress={() => handleToggleTaskCompleted(subItem)}
                  style={{ paddingRight: 4 }}
                >
                  <Ionicons
                    name={subItem.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={subItem.completed ? colors.success : colors.textSecondary}
                    style={{ marginRight: 8 }}
                  />
                </TouchableOpacity>
              )}

              {activeTab === 'Bills' && (
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 10 }}
                />
              )}

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.boldText,
                    subItem.completed && styles.completedText,
                    { flexShrink: 1 },
                  ]}
                  numberOfLines={1}
                >
                  {renderHighlightedText(title, searchQuery)}
                </Text>

                {(subItem.secondaryLine || subItem.priorityFire) && (
                  <Text style={styles.rowSecondaryNote} numberOfLines={1}>
                    {subItem.priorityFire || subItem.priority === 'High' ? '🔥 ' : ''}
                    {safeString(subItem.secondaryLine, '')}
                  </Text>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                  {activeTab === 'Tasks' && (
                    <View
                      style={[
                        styles.duePill,
                        subItem.isOverdue || subItem.due?.urgent
                          ? styles.duePillOverdue
                          : styles.duePillNormal,
                      ]}
                    >
                      <Text
                        style={
                          subItem.isOverdue || subItem.due?.urgent
                            ? styles.duePillTextOverdue
                            : styles.duePillTextNormal
                        }
                      >
                        {safeString(
                          subItem.due?.label || subItem.dueDateLabel || subItem.dueDate,
                          'No date'
                        )}
                      </Text>
                    </View>
                  )}

                  {activeTab === 'Bills' && subItem.status && (
                    <View
                      style={[
                        styles.statusBadgeSmall,
                        { backgroundColor: getBillStatusStyle(subItem.status).bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeTextSmall,
                          { color: getBillStatusStyle(subItem.status).text },
                        ]}
                      >
                        {safeString(subItem.status, '')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {activeTab === 'Tasks' && subItem.assignee && (
                <View
                  style={[
                    styles.avatarCircleMicro,
                    {
                      backgroundColor:
                        subItem.assignee.color ||
                        subItem.assignee.avatarColor ||
                        '#C97B3A',
                    },
                  ]}
                >
                  <Text style={styles.avatarTextMicro}>
                    {safeString(
                      subItem.assignee.initials ||
                        (subItem.assignee.name || 'Y').substring(0, 1),
                      'Y'
                    )}
                  </Text>
                </View>
              )}

              {activeTab === 'Bills' && (
                <Text style={styles.amountText}>
                  {safeString(
                    subItem.amountLabel ||
                      (subItem.amount != null ? `$${subItem.amount}` : ''),
                    ''
                  )}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const listData = activeTab === 'Chats' ? chatResults : groupedResults;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.screenHeaderTitle}>Search</Text>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats, tasks, bills..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content Type Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                isActive ? styles.activeTabButton : styles.inactiveTabButton,
              ]}
              onPress={() => handleTabChange(tab.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? '#FFFFFF' : colors.textSecondary}
                style={styles.tabIcon}
              />
              <Text style={isActive ? styles.activeTabText : styles.inactiveTabText}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sub-Filter Pills */}
      <View style={styles.subFilterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subFiltersContainer}
        >
          {TAB_FILTERS[activeTab]?.map((filterKey) => {
            const isActive = activeFilters.includes(filterKey);
            return (
              <TouchableOpacity
                key={filterKey}
                style={[
                  styles.subFilterPill,
                  isActive ? styles.activePill : styles.inactivePill,
                ]}
                onPress={() => toggleFilter(filterKey)}
                activeOpacity={0.7}
              >
                <Text style={isActive ? styles.activePillText : styles.inactivePillText}>
                  {filterKey}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Loading Indicator or Result List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : errorMsg ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) =>
            String(item.id || item.chat?.id || `group-${index}`)
          }
          renderItem={activeTab === 'Chats' ? renderChatItem : renderGroupedItem}
          style={styles.resultsList}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searchQuery.trim().length > 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={44} color="#C7C7CC" />
                <Text style={[styles.emptyText, { marginTop: 12 }]}>
                  No {activeTab.toLowerCase()} found matching “{searchQuery}”
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={44} color="#C7C7CC" />
                <Text style={[styles.emptyText, { marginTop: 12 }]}>
                  Type at least 1 character to search
                </Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
