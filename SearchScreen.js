import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from './Style';
import { searchApi } from './apiService';
import { openBill, openChat, openTask } from './navigation';

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

function filterChatsLocally(chats, filters) {
  if (!filters || filters.length === 0) return chats;
  return chats.filter((item) => {
    return filters.every((filter) => {
      const f = filter.toLowerCase();
      if (f === 'unread') return (item.unread || 0) > 0;
      if (f === 'has tasks') return (item.taskCount || 0) > 0;
      if (f === 'has bills') return (item.billCount || 0) > 0;
      if (f === 'groups') return item.isGroup || item.contextLabel?.toLowerCase().includes('group') || item.type === 'group';
      if (f === 'direct messages' || f === 'private') return !item.isGroup && item.type !== 'group';
      return true;
    });
  });
}

function filterGroupedLocally(groups, filters, tab) {
  if (!filters || filters.length === 0) return groups;

  return groups
    .map((group) => {
      const filteredItems = (group.items || []).filter((item) => {
        return filters.every((filter) => {
          const f = filter.toLowerCase();

          if (tab === 'Tasks') {
            if (f === 'completed') return !!item.completed;
            if (f === 'in progress') return !item.completed;
            if (f === 'high priority') return item.priority?.toLowerCase() === 'high';
            if (f === 'assigned to me') return item.assignee?.isMe || item.assignedToMe;
            if (f === 'assigned to others') return !item.assignee?.isMe;
            if (f === 'due this week') return !item.isOverdue;
          }

          if (tab === 'Bills') {
            const status = (item.status || '').toLowerCase();
            if (f === 'owed to me') return status.includes('owed') || status.includes('you owe');
            if (f === 'i owe') return status.includes('i owe') || status.includes('you owe');
            if (f === 'awaiting payment') return status.includes('awaiting');
            if (f === 'overdue') return status.includes('overdue');
          }

          return true;
        });
      });

      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
}

export default function SearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Chats');
  const [activeFilters, setActiveFilters] = useState([]);
  const [chatResults, setChatResults] = useState([]);
  const [groupedResults, setGroupedResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const debounceTimerRef = useRef(null);
  const requestIdRef = useRef(0);

  const handleSearch = useCallback(async (query, tab, filters) => {
    const trimmed = (query || '').trim();
    if (!trimmed) {
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
        const list = data?.results || data?.chats || data?.data || data?.items || [];
        const rawList = Array.isArray(list) ? list : [];
        setChatResults(filterChatsLocally(rawList, filters));
        setGroupedResults([]);
      } else {
        const list = data?.groups || data?.results || data?.items || data?.data || [];
        const rawList = Array.isArray(list) ? list : [];
        setGroupedResults(filterGroupedLocally(rawList, filters, tab));
        setChatResults([]);
      }
    } catch (err) {
      if (thisRequest !== requestIdRef.current) return;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch results from backend.';
      setErrorMsg(msg);
      setChatResults([]);
      setGroupedResults([]);
    } finally {
      if (thisRequest === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (searchQuery.trim().length > 0) {
        handleSearch(searchQuery, activeTab, activeFilters);
      }
    }, [searchQuery, activeTab, activeFilters, handleSearch])
  );

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      handleSearch(searchQuery, activeTab, activeFilters);
    }, 300);
    return () => clearTimeout(debounceTimerRef.current);
  }, [searchQuery, activeTab, activeFilters, handleSearch]);

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

  const renderHighlightedText = (text, query) => {
    const stringText = safeString(text, '');
    if (!query || !stringText) return <Text>{stringText}</Text>;
    const parts = stringText.split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
    return (
      <Text>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text key={i} style={styles.highlightedText}>{part}</Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const getBillStatusStyle = (status = '') => {
    const s = safeString(status).toUpperCase();
    if (s.includes('PAID')) return { bg: '#E8F5E9', text: '#2E7D32' };
    if (s.includes('OVERDUE')) return { bg: '#FFEBEE', text: '#C62828' };
    if (s.includes('YOU OWE') || s.includes('OFFER') || s.includes('PENDING'))
      return { bg: '#FFF3E0', text: '#E65100' };
    return { bg: '#E3F2FD', text: '#007AFF' };
  };

  const renderChatItem = ({ item }) => {
    const targetId = item.id || item.chatId;
    const title = item.title || item.name || '';
    const initials =
      item.avatarInitials || safeString(title, 'CH').substring(0, 2).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => openChat({ id: targetId, chat: item, searchQuery })}
      >
        <View style={[styles.avatarCircle, { backgroundColor: item.avatarColor || '#007AFF' }]}>
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

  const renderGroupedItem = ({ item: groupItem }) => {
    const groupId = groupItem.id || groupItem.chat?.id;
    const items = groupItem.items || [];
    const chat = groupItem.chat || {};

    return (
      <View style={styles.groupCard}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() =>
            openChat({
              id: groupId,
              chat: {
                ...chat,
                relatedItems: items,
                activeTabType: activeTab,
              },
              searchQuery,
            })
          }
        >
          <View
            style={[
              styles.avatarCircleSmall,
              { backgroundColor: chat.avatarColor || '#007AFF', marginRight: 8 },
            ]}
          >
            <Text style={styles.avatarTextSmall}>
              {safeString(
                chat.avatarInitials,
                safeString(chat.title || groupItem.groupTitle, 'G').substring(0, 2).toUpperCase()
              )}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupTitle}>
              {safeString(chat.title || groupItem.groupTitle, '')}
            </Text>
            <Text style={styles.groupSubtitle}>{safeString(chat.contextLabel, '')}</Text>
          </View>
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeText}>{items.length}</Text>
          </View>
        </TouchableOpacity>

        {items.map((subItem, index) => {
          const itemId = subItem.id ?? index;
          const title = subItem.title || subItem.name || '';
          return (
            <TouchableOpacity
              key={String(itemId)}
              style={styles.itemRow}
              onPress={() => {
                if (activeTab === 'Tasks') {
                  openTask({
                    id: itemId,
                    task: { ...subItem, chat },
                  });
                } else {
                  openBill({
                    id: itemId,
                    bill: { ...subItem, chat },
                  });
                }
              }}
            >
              {activeTab === 'Tasks' && (
                <Ionicons
                  name={subItem.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={subItem.completed ? '#34C759' : '#8E8E93'}
                  style={{ marginRight: 10 }}
                />
              )}
              {activeTab === 'Bills' && (
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color="#007AFF"
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
                {(subItem.secondaryLine ||
                  subItem.note ||
                  subItem.attachmentsCount != null) && (
                  <Text style={styles.rowSecondaryNote} numberOfLines={1}>
                    {subItem.priority === 'High' ? '🔥 ' : ''}
                    {safeString(
                      subItem.secondaryLine ||
                        subItem.note ||
                        (subItem.attachmentsCount != null
                          ? `${subItem.attachmentsCount} files attached`
                          : '')
                    )}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  {activeTab === 'Tasks' && (
                    <View
                      style={[
                        styles.duePill,
                        subItem.isOverdue ? styles.duePillOverdue : styles.duePillNormal,
                      ]}
                    >
                      <Text
                        style={
                          subItem.isOverdue
                            ? styles.duePillTextOverdue
                            : styles.duePillTextNormal
                        }
                      >
                        {safeString(
                          subItem.dueDateLabel || subItem.dueDate,
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
                        '#F4A261',
                      marginLeft: 6,
                    },
                  ]}
                >
                  <Text style={styles.avatarTextMicro}>
                    {safeString(
                      subItem.assignee.initials ||
                        (subItem.assignee.name || 'A').substring(0, 1),
                      'A'
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
      <Text style={styles.screenHeaderTitle}>Search</Text>

      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

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
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={isActive ? '#FFFFFF' : '#8E8E93'}
                style={styles.tabIcon}
              />
              <Text style={isActive ? styles.activeTabText : styles.inactiveTabText}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
              >
                <Text style={isActive ? styles.activePillText : styles.inactivePillText}>
                  {filterKey}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : errorMsg ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) => String(item.id || item.chat?.id || index)}
          renderItem={activeTab === 'Chats' ? renderChatItem : renderGroupedItem}
          style={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searchQuery.trim().length > 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}