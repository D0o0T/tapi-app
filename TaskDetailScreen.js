import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './Style';
import { searchApi } from './apiService';
import { goBack, openChat } from './navigation';

function safeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

export default function TaskDetailScreen({ route }) {
  const { task: routeTask, id: routeId } = route?.params || {};
  const taskId = routeId || routeTask?.id;

  const seed = routeTask && typeof routeTask === 'object' ? routeTask : null;

  const [task, setTask] = useState(seed);
  const [completed, setCompleted] = useState(!!seed?.completed);
  const [subtasks, setSubtasks] = useState(
    Array.isArray(seed?.subtasks) ? seed.subtasks : []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const loadTask = useCallback(async () => {
    if (seed) {
      setTask((prev) => prev || seed);
      setCompleted(!!seed.completed);
      if (Array.isArray(seed.subtasks)) setSubtasks(seed.subtasks);
    }

    if (!taskId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchApi.getTaskDetail(taskId);
      const payload = data?.task || data?.data || data;
      if (payload && typeof payload === 'object') {
        setTask((prev) => ({ ...(prev || {}), ...payload }));
        if (payload.completed != null) setCompleted(!!payload.completed);
        if (Array.isArray(payload.subtasks)) setSubtasks(payload.subtasks);
      }
    } catch (_) {
      // keep seed
    } finally {
      setIsLoading(false);
    }
  }, [taskId, seed]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const toggleSubtask = (subId) => {
    setSubtasks((prev) =>
      prev.map((st) =>
        String(st.id) === String(subId) ? { ...st, done: !st.done } : st
      )
    );
  };

  const handleMarkComplete = async () => {
    const next = !completed;
    setCompleted(next);
    if (next) {
      setSubtasks((prev) => prev.map((st) => ({ ...st, done: true })));
    }
    setTask((prev) =>
      prev
        ? { ...prev, completed: next, status: next ? 'Completed' : prev.status || 'In progress' }
        : prev
    );

    setIsCompleting(true);
    try {
      if (taskId) {
        await searchApi.completeTask(taskId);
      }
    } catch (err) {
    } finally {
      setIsCompleting(false);
    }
  };

  const completedCount = subtasks.filter((st) => st.done).length;
  const display = task || seed || {};
  const chat = display.chat || {};
  const assignee = display.assignee || {};
  const attachments = Array.isArray(display.attachments) ? display.attachments : [];
  const activity = Array.isArray(display.activity) ? display.activity : [];

  if (isLoading && !display.title) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
            <Text style={styles.backButtonText}>Search</Text>
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>Task</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={20} color="#007AFF" />
          <Text style={styles.backButtonText}>Search</Text>
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>Task</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Source Chat */}
        <TouchableOpacity
          style={styles.sourceChatCard}
          onPress={() => openChat({ id: chat.id, chat })}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.avatarCircleSmall,
              {
                backgroundColor: chat.avatarColor || '#007AFF',
                marginRight: 10,
              },
            ]}
          >
            <Text style={styles.avatarTextSmall}>
              {safeString(
                chat.avatarInitials,
                safeString(chat.title, 'C').substring(0, 2).toUpperCase()
              )}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceChatTitle}>
              {safeString(chat.title, 'Chat')}
            </Text>
            <Text style={styles.sourceChatSub}>
              {safeString(chat.contextLabel, 'Group · open chat')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Title — tappable checkbox */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={handleMarkComplete}
            activeOpacity={0.6}
          >
            <Ionicons
              name={completed ? 'checkmark-circle' : 'ellipse-outline'}
              size={28}
              color={completed ? '#34C759' : '#8E8E93'}
              style={{ marginRight: 12 }}
            />
            <Text
              style={[
                styles.boldText,
                { fontSize: 18, flex: 1 },
                completed && styles.completedText,
              ]}
            >
              {safeString(display.title || display.name, 'Task')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2×2 grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>STATUS</Text>
            <View style={styles.gridValueRow}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: completed ? '#34C759' : '#007AFF',
                  marginRight: 6,
                }}
              />
              <Text style={styles.gridValueText}>
                {completed
                  ? 'Completed'
                  : safeString(display.status, 'In progress')}
              </Text>
            </View>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>DUE</Text>
            <Text
              style={[
                styles.gridValueText,
                { color: display.isOverdue ? '#C62828' : '#000' },
              ]}
            >
              {safeString(display.dueDate || display.dueDateLabel, '—')}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>PRIORITY</Text>
            <View style={styles.gridValueRow}>
              {(display.priority === 'High' || display.priority === 'high') && (
                <Text style={{ marginRight: 4 }}>🔥</Text>
              )}
              <Text style={styles.gridValueText}>
                {safeString(display.priority, '—')}
              </Text>
            </View>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>ASSIGNEE</Text>
            <View style={styles.gridValueRow}>
              {(assignee.name || assignee.initials) && (
                <View
                  style={[
                    styles.avatarCircleMicro,
                    {
                      backgroundColor:
                        assignee.color || assignee.avatarColor || '#F4A261',
                    },
                  ]}
                >
                  <Text style={styles.avatarTextMicro}>
                    {safeString(
                      assignee.initials ||
                        (assignee.name || '').substring(0, 1),
                      '?'
                    )}
                  </Text>
                </View>
              )}
              <Text style={styles.gridValueText}>
                {safeString(assignee.name, '—')}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={{ fontSize: 14, color: '#3A3A3C', lineHeight: 20 }}>
            {safeString(
              display.description || display.note || display.secondaryLine,
              'No description provided.'
            )}
          </Text>
        </View>

        {/* Subtasks */}
        <View style={styles.sectionCard}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text style={styles.sectionLabel}>SUBTASKS</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#8E8E93' }}>
              {`${completedCount}/${subtasks.length || 0}`}
            </Text>
          </View>
          {subtasks.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#8E8E93' }}>No subtasks</Text>
          ) : (
            subtasks.map((st) => (
              <TouchableOpacity
                key={String(st.id)}
                style={styles.subtaskRow}
                onPress={() => toggleSubtask(st.id)}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={st.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={st.done ? '#34C759' : '#8E8E93'}
                  style={{ marginRight: 10 }}
                />
                <Text
                  style={[
                    { fontSize: 14, color: '#000000', flex: 1 },
                    st.done && styles.completedText,
                  ]}
                >
                  {safeString(st.title, '')}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Attachments */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>ATTACHMENTS</Text>
          {attachments.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#8E8E93' }}>No attachments</Text>
          ) : (
            attachments.map((file, idx) => (
              <View key={file.id || idx} style={styles.attachmentCard}>
                <Ionicons
                  name="document-text"
                  size={24}
                  color="#007AFF"
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#000' }}>
                    {safeString(file.name || file.filename, 'File')}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#8E8E93' }}>
                    {safeString(file.size || file.fileSize, '')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Activity */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>ACTIVITY</Text>
          {activity.length === 0 ? (
            <Text style={{ fontSize: 13, color: '#8E8E93' }}>No activity yet</Text>
          ) : (
            activity.map((entry, idx) => (
              <View key={entry.id || idx} style={styles.activityRow}>
                <View
                  style={[
                    styles.avatarCircleMicro,
                    {
                      backgroundColor:
                        entry.color || entry.avatarColor || '#F4A261',
                    },
                  ]}
                >
                  <Text style={styles.avatarTextMicro}>
                    {safeString(
                      entry.initials || (entry.name || '').substring(0, 1),
                      '?'
                    )}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: '#3A3A3C', flex: 1 }}>
                  <Text style={{ fontWeight: '700' }}>
                    {safeString(entry.name, '')}
                  </Text>
                  {` ${safeString(entry.action, '')} · ${safeString(entry.time, '')}`}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.markCompleteButton,
          completed && styles.markCompleteButtonDisabled,
        ]}
        disabled={isCompleting}
        onPress={handleMarkComplete}
        activeOpacity={0.7}
      >
        {isCompleting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.markCompleteButtonText}>
              {completed ? 'Completed' : 'Mark complete'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}