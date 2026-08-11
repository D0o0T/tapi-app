import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './Style';
import { searchApi } from './apiService';
import { goBack, openTask, openBill } from './navigation';

function safeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function ChatDetailScreen({ route }) {
  const { chat: routeChat, id: routeId, searchQuery } = route?.params || {};
  const chatId = routeId || routeChat?.id;

  const getInitialMessages = () => {
    if (Array.isArray(routeChat?.messages) && routeChat.messages.length > 0) {
      return routeChat.messages;
    }
    if (routeChat?.lastMessage) {
      return [
        {
          id: 'msg_last',
          text: routeChat.lastMessage,
          sender: routeChat.title || 'Chat',
          time: routeChat.lastActivity || routeChat.timeAgo || 'Recently',
          isOwn: false,
        },
      ];
    }
    return [];
  };

  const [chat, setChat] = useState(routeChat && typeof routeChat === 'object' ? routeChat : null);
  const [messages, setMessages] = useState(getInitialMessages());
  const [isLoading, setIsLoading] = useState(true);

  const loadChat = useCallback(async () => {
    if (routeChat && typeof routeChat === 'object') {
      setChat((prev) => prev || routeChat);
      const initMsgs = getInitialMessages();
      if (initMsgs.length > 0) {
        setMessages((prev) => (prev.length > 0 ? prev : initMsgs));
      }
    }

    if (!chatId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchApi.getChatDetail(chatId);
      const payload = data?.chat || data?.data || data;
      if (payload && typeof payload === 'object') {
        setChat((prev) => ({ ...(prev || {}), ...payload }));
        const msgs =
          payload.messages ||
          data?.messages ||
          payload.data?.messages ||
          [];
        if (Array.isArray(msgs) && msgs.length > 0) {
          setMessages(msgs);
        }
      }
    } catch (_) {
      // keep seed from search params
    } finally {
      setIsLoading(false);
    }
  }, [chatId, routeChat]);

  useEffect(() => {
    loadChat();
  }, [loadChat]);

  const highlightText = (text, query, isOwn) => {
    const baseStyle = isOwn ? styles.messageTextOwn : styles.messageTextOther;
    if (!query || !text) return <Text style={baseStyle}>{text}</Text>;
    const parts = String(text).split(new RegExp(`(${escapeRegex(query)})`, 'gi'));
    return (
      <Text style={baseStyle}>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
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

  const displayChat = chat || (typeof routeChat === 'object' ? routeChat : null) || {};
  const title = safeString(
    displayChat.title || displayChat.name || displayChat.groupTitle,
    'Chat'
  );
  const initials = safeString(
    displayChat.avatarInitials,
    title.substring(0, 2).toUpperCase()
  );
  const contextLabel = safeString(
    displayChat.contextLabel || displayChat.subtitle,
    'Group · open chat'
  );
  const relatedItems = Array.isArray(displayChat.relatedItems) ? displayChat.relatedItems : [];

  const renderMessage = ({ item }) => {
    const isOwn = item.isOwn || item.sender === 'You' || item.mine === true;
    const body = item.text || item.body || item.content || item.message || '';
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
              fontWeight: '600',
              color: '#007AFF',
              marginBottom: 4,
            }}
          >
            {item.sender}
          </Text>
        )}
        {searchQuery && !isOwn
          ? highlightText(body, searchQuery, false)
          : (
            <Text style={isOwn ? styles.messageTextOwn : styles.messageTextOther}>
              {safeString(body, '')}
            </Text>
          )}
        {!!(item.time || item.createdAt) && (
          <Text
            style={[
              styles.messageTime,
              isOwn ? styles.messageTimeOwn : styles.messageTimeOther,
            ]}
          >
            {item.time || item.createdAt}
          </Text>
        )}
      </View>
    );
  };

  const renderHeaderComponent = () => (
    <View>
      {/* Chat meta from search */}
      <View style={[styles.sourceChatCard, { marginHorizontal: 0, marginTop: 0, marginBottom: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sourceChatTitle}>{title}</Text>
          <Text style={styles.sourceChatSub}>{contextLabel}</Text>
          <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 4 }}>
            {`${displayChat.taskCount ?? 0} tasks · ${displayChat.billCount ?? 0} bills`}
            {(displayChat.matchCount || displayChat.matches)
              ? ` · ${displayChat.matchCount || displayChat.matches} matches`
              : ''}
          </Text>
        </View>
      </View>

      {/* Related Tasks / Bills section when navigating from header click */}
      {relatedItems.length > 0 && (
        <View style={[styles.sectionCard, { marginHorizontal: 0, marginTop: 0, marginBottom: 16 }]}>
          <Text style={styles.sectionLabel}>
            RELATED {displayChat.activeTabType ? displayChat.activeTabType.toUpperCase() : 'TASKS & ITEMS'} ({relatedItems.length})
          </Text>
          {relatedItems.map((item, idx) => (
            <TouchableOpacity
              key={String(item.id || idx)}
              style={styles.itemRow}
              onPress={() => {
                if (displayChat.activeTabType === 'Tasks') {
                  openTask({ id: item.id, task: { ...item, chat: displayChat } });
                } else {
                  openBill({ id: item.id, bill: { ...item, chat: displayChat } });
                }
              }}
            >
              <Ionicons
                name={displayChat.activeTabType === 'Tasks' ? 'checkbox-outline' : 'receipt-outline'}
                size={18}
                color="#007AFF"
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.boldText, { flex: 1 }]}>
                {safeString(item.title || item.name, 'Item')}
              </Text>
              {item.amountLabel && (
                <Text style={styles.amountText}>{item.amountLabel}</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color="#C7C7CC" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.backButtonText}>Search</Text>
        </TouchableOpacity>
        <View style={styles.chatDetailHeaderInfo}>
          <View
            style={[
              styles.avatarCircleSmall,
              {
                backgroundColor: displayChat.avatarColor || '#007AFF',
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
            <Text style={{ fontSize: 12, color: '#8E8E93' }} numberOfLines={1}>
              {contextLabel}
            </Text>
          </View>
        </View>
      </View>

      {isLoading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderMessage}
          ListHeaderComponent={renderHeaderComponent}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={40} color="#C7C7CC" />
              <Text style={[styles.emptyText, { marginTop: 12 }]}>
                No messages loaded for this chat yet.
              </Text>
              <Text style={[styles.emptyText, { marginTop: 4 }]}>
                {searchQuery
                  ? `Search matched “${searchQuery}” in this conversation.`
                  : 'Conversation context loaded successfully.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}