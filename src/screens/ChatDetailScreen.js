import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/Style';
import { colors } from '../constants/theme';
import { searchApi } from '../services/apiService';

function safeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function ChatDetailScreen({ route, navigation }) {
  const { chatId, chat: routeChat, searchQuery } = route?.params || {};
  const seed = routeChat && typeof routeChat === 'object' ? routeChat : {};

  // State for chat metadata and message list
  const [chat, setChat] = useState(seed);
  const [messages, setMessages] = useState(
    Array.isArray(seed?.messages) ? seed.messages : []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Fetch chat details
  const fetchChatDetails = useCallback(async () => {
    const id = chatId || seed?.id;
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await searchApi.getChatDetail(id);
      const payload = data?.chat || data;
      if (payload && typeof payload === 'object') {
        setChat((prev) => ({ ...prev, ...payload }));
        if (Array.isArray(payload.messages) && payload.messages.length > 0) {
          setMessages(payload.messages);
        }
      }
    } catch (_) {
      // Keep seed data if server is unreachable
    } finally {
      setIsLoading(false);
    }
  }, [chatId, seed?.id]);

  useEffect(() => {
    fetchChatDetails();
  }, [fetchChatDetails]);

  const displayChat = chat || {};
  const title = safeString(displayChat.title, 'Chat');
  const initials = safeString(
    displayChat.avatarInitials,
    title.substring(0, 2).toUpperCase()
  );
  const contextLabel = safeString(
    displayChat.contextLabel,
    'Group · 14 members'
  );
  const relatedItems = Array.isArray(displayChat.relatedItems)
    ? displayChat.relatedItems
    : [];

  // Highlight search matches within message content
  const renderHighlightedMessage = (text, query, isOwn) => {
    const baseStyle = isOwn ? styles.messageTextOwn : styles.messageTextOther;
    if (!query || !text) return <Text style={baseStyle}>{text}</Text>;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return <Text style={baseStyle}>{text}</Text>;

    const parts = String(text).split(new RegExp(`(${escapeRegex(trimmedQuery)})`, 'gi'));
    return (
      <Text style={baseStyle}>
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

  const renderMessage = ({ item }) => {
    const isOwn = !!item.isOwn;
    const body = item.text || item.content || '';

    return (
      <View
        style={[
          styles.messageBubble,
          isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
        ]}
      >
        {!isOwn && !!item.sender && (
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.primary,
              marginBottom: 4,
            }}
          >
            {item.sender}
          </Text>
        )}

        {renderHighlightedMessage(body, searchQuery, isOwn)}

        {!!item.time && (
          <Text
            style={[
              styles.messageTime,
              isOwn ? styles.messageTimeOwn : styles.messageTimeOther,
            ]}
          >
            {item.time}
          </Text>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={{ marginBottom: 16 }}>
      {/* Chat Summary Card */}
      <View
        style={[
          styles.sourceChatCard,
          { marginHorizontal: 0, marginTop: 0, marginBottom: 12 },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.sourceChatTitle}>{title}</Text>
          <Text style={styles.sourceChatSub}>{contextLabel}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
            {`${displayChat.taskCount ?? 0} tasks · ${displayChat.billCount ?? 0} bills`}
            {displayChat.matchCount ? ` · ${displayChat.matchCount} matches` : ''}
          </Text>
        </View>
      </View>

      {/* Related Items List */}
      {relatedItems.length > 0 && (
        <View
          style={[
            styles.sectionCard,
            { marginHorizontal: 0, marginTop: 0, marginBottom: 12 },
          ]}
        >
          <Text style={styles.sectionLabel}>
            MATCHING {displayChat.activeTabType ? displayChat.activeTabType.toUpperCase() : 'ITEMS'} ({relatedItems.length})
          </Text>
          {relatedItems.map((item, idx) => (
            <TouchableOpacity
              key={String(item.id || idx)}
              style={styles.itemRow}
              activeOpacity={0.7}
              onPress={() => {
                if (displayChat.activeTabType === 'Tasks') {
                  navigation.navigate('TaskDetail', {
                    taskId: item.id,
                    task: { ...item, chat: displayChat },
                  });
                } else {
                  navigation.navigate('BillDetail', {
                    billId: item.id,
                    bill: { ...item, chat: displayChat },
                  });
                }
              }}
            >
              <Ionicons
                name={
                  displayChat.activeTabType === 'Tasks'
                    ? 'checkbox-outline'
                    : 'receipt-outline'
                }
                size={18}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.boldText, { flex: 1 }]}>
                {safeString(item.title, 'Item')}
              </Text>
              {!!item.amountLabel && (
                <Text style={styles.amountText}>{item.amountLabel}</Text>
              )}
              <Ionicons
                name="chevron-forward"
                size={16}
                color="#C7C7CC"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Detail Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>Search</Text>
        </TouchableOpacity>

        <View style={styles.chatDetailHeaderInfo}>
          <View
            style={[
              styles.avatarCircleSmall,
              {
                backgroundColor: displayChat.avatarColor || colors.primary,
                marginRight: 8,
              },
            ]}
          >
            <Text style={styles.avatarTextSmall}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailHeaderTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary }} numberOfLines={1}>
              {contextLabel}
            </Text>
          </View>
        </View>
      </View>

      {isLoading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderMessage}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={44} color="#C7C7CC" />
              <Text style={[styles.emptyText, { marginTop: 12 }]}>
                No messages found in this chat.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
