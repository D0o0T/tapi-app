/**
 * Expo Router navigation — pass data as JSON string in params.
 */
import { router } from 'expo-router';

export function goBack() {
  try {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  } catch (_) {
    router.replace('/(tabs)');
  }
}

function toParam(obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  try {
    return JSON.stringify(obj);
  } catch (_) {
    return '';
  }
}

export function openChat({ id, chat, searchQuery } = {}) {
  const chatId = id != null ? String(id) : chat?.id != null ? String(chat.id) : '0';
  router.push({
    pathname: '/chat/[id]',
    params: {
      id: chatId,
      searchQuery: searchQuery || '',
      chat: toParam(chat),
    },
  });
}

export function openTask({ id, task } = {}) {
  const taskId = id != null ? String(id) : task?.id != null ? String(task.id) : '0';
  router.push({
    pathname: '/task/[id]',
    params: {
      id: taskId,
      task: toParam(task),
    },
  });
}

export function openBill({ id, bill } = {}) {
  const billId = id != null ? String(id) : bill?.id != null ? String(bill.id) : '0';
  router.push({
    pathname: '/bill/[id]',
    params: {
      id: billId,
      bill: toParam(bill),
    },
  });
}

export function parseParam(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return value;
  if (Array.isArray(value)) value = value[0];
  try {
    return JSON.parse(value);
  } catch (_) {
    // try decode once (expo may encode)
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch (_) {
      return null;
    }
  }
}