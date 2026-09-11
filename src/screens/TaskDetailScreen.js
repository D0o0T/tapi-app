import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
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

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId, task: routeTask } = route?.params || {};
  const seed = routeTask && typeof routeTask === 'object' ? routeTask : {};

  // State management for task data, completion status, and subtasks
  const [task, setTask] = useState(seed);
  const [completed, setCompleted] = useState(!!seed?.completed);
  const [subtasks, setSubtasks] = useState(
    Array.isArray(seed?.subTasks)
      ? seed.subTasks
      : Array.isArray(seed?.subtasks)
      ? seed.subtasks
      : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch full task details with graceful fallback
  const fetchTaskDetails = useCallback(async () => {
    const id = taskId || seed?.id;
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await searchApi.getTaskDetail(id);
      const payload = data?.task || data;
      if (payload && typeof payload === 'object') {
        setTask((prev) => ({ ...prev, ...payload }));
        if (payload.completed !== undefined) {
          setCompleted(!!payload.completed);
        }
        const subs = payload.subTasks || payload.subtasks;
        if (Array.isArray(subs) && subs.length > 0) {
          setSubtasks(subs);
        }
      }
    } catch (_) {
      // Keep seed data if server is unreachable
    } finally {
      setIsLoading(false);
    }
  }, [taskId, seed?.id]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  // Toggle individual subtask completion state
  const handleToggleSubtask = (subId, index) => {
    setSubtasks((prev) =>
      prev.map((item, idx) => {
        const match = item.id ? String(item.id) === String(subId) : idx === index;
        return match ? { ...item, done: !item.done } : item;
      })
    );
  };

  // Toggle primary task completion
  const handleMarkComplete = async () => {
    const nextState = !completed;
    setCompleted(nextState);

    if (nextState) {
      setSubtasks((prev) => prev.map((st) => ({ ...st, done: true })));
    }

    setTask((prev) => ({
      ...prev,
      completed: nextState,
      status: nextState ? 'Completed' : 'In progress',
    }));

    setIsUpdating(true);
    try {
      const id = taskId || task?.id;
      if (id) {
        await searchApi.completeTask(id);
      }
    } catch (_) {
    } finally {
      setIsUpdating(false);
    }
  };

  const display = task || {};
  const chat = display.chat || {};
  const assignee = display.assignee || {};
  const attachments = Array.isArray(display.attachments) ? display.attachments : [];
  const activity = Array.isArray(display.activity) ? display.activity : [];

  const completedSubtasksCount = subtasks.filter((st) => st.done).length;
  const isUrgent = display.isOverdue || display.due?.urgent;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>Search</Text>
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>Task</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading && !display.title ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* Source Chat Card */}
          <TouchableOpacity
            style={styles.sourceChatCard}
            activeOpacity={0.7}
            onPress={() => {
              if (chat.id) {
                navigation.navigate('ChatDetail', {
                  chatId: chat.id,
                  chat,
                });
              }
            }}
          >
            <View
              style={[
                styles.avatarCircleSmall,
                {
                  backgroundColor: chat.avatarColor || colors.primary,
                  marginRight: 12,
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
                {safeString(chat.title, 'Acme Corp Restructure')}
              </Text>
              <Text style={styles.sourceChatSub}>
                {safeString(chat.contextLabel, 'Group · open chat')}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Title & Interactive Checkbox */}
          <View style={styles.sectionCard}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={handleMarkComplete}
              activeOpacity={0.65}
            >
              <Ionicons
                name={completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={28}
                color={completed ? colors.success : colors.textSecondary}
                style={{ marginRight: 12 }}
              />
              <Text
                style={[
                  styles.boldText,
                  { fontSize: 18, flex: 1, lineHeight: 24 },
                  completed && styles.completedText,
                ]}
              >
                {safeString(display.title, 'Task Title')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Key Fields 2x2 Grid */}
          <View style={styles.gridContainer}>
            {/* STATUS */}
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>STATUS</Text>
              <View style={styles.gridValueRow}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: completed ? colors.success : colors.primary,
                    marginRight: 6,
                  }}
                />
                <Text style={styles.gridValueText}>
                  {completed ? 'Completed' : safeString(display.status, 'In progress')}
                </Text>
              </View>
            </View>

            {/* DUE */}
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>DUE</Text>
              <Text
                style={[
                  styles.gridValueText,
                  { color: isUrgent ? colors.danger : colors.text },
                ]}
              >
                {safeString(
                  display.dueDate || display.due?.date || display.dueDateLabel,
                  'Tomorrow · Nov 12'
                )}
              </Text>
            </View>

            {/* PRIORITY */}
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>PRIORITY</Text>
              <View style={styles.gridValueRow}>
                {display.priority === 'High' && (
                  <Text style={{ marginRight: 4 }}>🔥</Text>
                )}
                <Text style={styles.gridValueText}>
                  {safeString(display.priority, 'High')}
                </Text>
              </View>
            </View>

            {/* ASSIGNEE */}
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>ASSIGNEE</Text>
              <View style={styles.gridValueRow}>
                <View
                  style={[
                    styles.avatarCircleMicro,
                    {
                      marginLeft: 0,
                      marginRight: 6,
                      backgroundColor: assignee.color || '#C97B3A',
                    },
                  ]}
                >
                  <Text style={styles.avatarTextMicro}>
                    {safeString(
                      assignee.initials || (assignee.name || 'Y').substring(0, 1),
                      'Y'
                    )}
                  </Text>
                </View>
                <Text style={styles.gridValueText}>
                  {safeString(assignee.name, 'You')}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <Text style={{ fontSize: 14, color: colors.textTertiary, lineHeight: 22 }}>
              {safeString(
                display.description || display.secondaryLine,
                'Lock the final Q4 marketing spend across paid, events and content. Needs owner sign-off before it goes to finance on Friday.'
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
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
                {`${completedSubtasksCount}/${subtasks.length}`}
              </Text>
            </View>

            {subtasks.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>No subtasks</Text>
            ) : (
              subtasks.map((st, idx) => (
                <TouchableOpacity
                  key={String(st.id || idx)}
                  style={styles.subtaskRow}
                  activeOpacity={0.6}
                  onPress={() => handleToggleSubtask(st.id, idx)}
                >
                  <Ionicons
                    name={st.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={st.done ? colors.success : colors.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <Text
                    style={[
                      { fontSize: 14, color: colors.text, flex: 1 },
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
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>No attachments</Text>
            ) : (
              attachments.map((file, idx) => (
                <View key={String(file.id || idx)} style={styles.attachmentCard}>
                  <Ionicons
                    name="document-text"
                    size={26}
                    color={colors.primary}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                      {safeString(file.name, 'Document')}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      {safeString(file.size, '0 KB')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Activity Log */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>ACTIVITY</Text>
            {activity.length === 0 ? (
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>No activity logged yet</Text>
            ) : (
              activity.map((item, idx) => (
                <View key={String(item.id || idx)} style={styles.activityRow}>
                  <View
                    style={[
                      styles.avatarCircleMicro,
                      {
                        marginLeft: 0,
                        marginRight: 8,
                        backgroundColor: item.color || '#C97B3A',
                      },
                    ]}
                  >
                    <Text style={styles.avatarTextMicro}>
                      {safeString(
                        item.initials || (item.name || 'M').substring(0, 1),
                        'M'
                      )}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textTertiary, flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>
                      {safeString(item.name, 'User')}
                    </Text>
                    {` ${safeString(item.action, '')} · ${safeString(item.time, '')}`}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Mark Complete CTA Button */}
      <TouchableOpacity
        style={[
          styles.markCompleteButton,
          completed && styles.markCompleteButtonDisabled,
        ]}
        disabled={isUpdating}
        onPress={handleMarkComplete}
        activeOpacity={0.75}
      >
        {isUpdating ? (
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
