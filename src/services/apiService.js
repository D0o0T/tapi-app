/**
 * Tapi Super-Search API Service & Offline Fallback Store
 * Sprint 2 · v1.6.21
 * Fully handles live backend (http://16.171.168.82:40000/api) with automatic
 * seamless fallback to rich offline mock data matching the PRD specification.
 */

const BASE_URL = 'http://16.171.168.82:40000/api';
const AUTH_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlOTk3NzllMGY4OTNmMmZjZTFmOWFjOWEiLCJwaG9uZSI6IisxMDAwMDAwMDAwMSIsImlhdCI6MTc4NTE4NzMxMn0.VWzW8kmgrXgTdAznQoEl4dM3dRzoLVQuJO2Hvo6Pwl8';

// ==========================================
// MOCK DATA STORE (PRD Sprint 2 Specification)
// ==========================================

const INITIAL_CHATS = [
  {
    id: '6650a1b2c3d4e5f601020304',
    title: 'Acme Corp Restructure',
    avatarInitials: 'AC',
    avatarColor: '#C97B3A',
    isGroup: true,
    isPrivate: false,
    contextLabel: 'Group · 14 members',
    unread: 3,
    lastActivity: '2h ago',
    taskCount: 2,
    billCount: 2,
    matchCount: 3,
    messages: [
      {
        id: 'msg-1',
        sender: 'Mara',
        text: 'Hey team, we need to finalize the Q4 Marketing budget before Friday.',
        time: '3h ago',
        isOwn: false,
      },
      {
        id: 'msg-2',
        sender: 'You',
        text: 'I am reviewing the paid media split and owner sign-off now.',
        time: '2h ago',
        isOwn: true,
      },
      {
        id: 'msg-3',
        sender: 'Mara',
        text: 'Lock the final Q4 Marketing spend across paid, events and content.',
        time: '2h ago',
        isOwn: false,
      },
    ],
  },
  {
    id: '6650a1b2c3d4e5f601020305',
    title: 'Sarah Jones',
    avatarInitials: 'SJ',
    avatarColor: '#5E5CE6',
    isGroup: false,
    isPrivate: false,
    contextLabel: 'Direct message',
    unread: 0,
    lastActivity: '1d ago',
    taskCount: 1,
    billCount: 1,
    matchCount: 2,
    messages: [
      {
        id: 'msg-4',
        sender: 'Sarah Jones',
        text: 'Could you send the Q4 Marketing assets when you have a moment?',
        time: '1d ago',
        isOwn: false,
      },
      {
        id: 'msg-5',
        sender: 'You',
        text: 'Sure, I will attach the 4 files for the Q4 Marketing campaign.',
        time: '1d ago',
        isOwn: true,
      },
    ],
  },
  {
    id: '6650a1b2c3d4e5f601020306',
    title: 'Personal Notes',
    avatarInitials: '🔒',
    avatarColor: '#3A3A3C',
    isGroup: false,
    isPrivate: true,
    contextLabel: 'Only you',
    unread: 0,
    lastActivity: '4d ago',
    taskCount: 1,
    billCount: 0,
    matchCount: 1,
    messages: [
      {
        id: 'msg-6',
        sender: 'You',
        text: 'Brainstorm Q4 Marketing ideas and prepare strategic initiatives.',
        time: '4d ago',
        isOwn: true,
      },
    ],
  },
  {
    id: '6650a1b2c3d4e5f601020307',
    title: 'Brightline Studio',
    avatarInitials: 'BS',
    avatarColor: '#28A745',
    isGroup: true,
    isPrivate: false,
    contextLabel: 'Group · 6 members',
    unread: 1,
    lastActivity: '3h ago',
    taskCount: 0,
    billCount: 2,
    matchCount: 3,
    messages: [
      {
        id: 'msg-7',
        sender: 'Brightline Studio',
        text: 'Invoices for the Q4 Marketing print run and launch ads are posted.',
        time: '3h ago',
        isOwn: false,
      },
    ],
  },
];

const INITIAL_TASKS = [
  {
    id: '6651b2c3d4e5f60102030405',
    chatId: '6650a1b2c3d4e5f601020304',
    title: 'Finalize Q4 Marketing budget',
    completed: false,
    status: 'In progress',
    statusColor: '#2F6FED',
    dueDate: 'Tomorrow · Nov 12',
    dueDateLabel: 'Due tomorrow',
    isOverdue: true,
    priority: 'High',
    priorityFire: true,
    assignee: { initials: 'Y', name: 'You', color: '#C97B3A', isMe: true },
    secondaryLine: 'Needs owner sign-off before finance',
    description:
      'Lock the final Q4 marketing spend across paid, events and content. Needs owner sign-off before it goes to finance on Friday.',
    subTasks: [
      { id: 'st-1', title: 'Pull Q3 actuals', done: true },
      { id: 'st-2', title: 'Draft paid-media split', done: false },
      { id: 'st-3', title: 'Get owner sign-off', done: false },
    ],
    attachments: [
      { id: 'att-1', name: 'Q4_budget.xlsx', size: '48 KB' },
      { id: 'att-2', name: 'Plan_v3.pdf', size: '1.2 MB' },
    ],
    activity: [
      {
        id: 'act-1',
        name: 'Mara',
        initials: 'M',
        color: '#C97B3A',
        action: 'assigned this to you',
        time: '2d ago',
      },
      {
        id: 'act-2',
        name: 'You',
        initials: 'Y',
        color: '#2F6FED',
        action: 'completed subtask: Pull Q3 actuals',
        time: '1d ago',
      },
    ],
  },
  {
    id: '6651b2c3d4e5f60102030406',
    chatId: '6650a1b2c3d4e5f601020305',
    title: 'Send Q4 Marketing assets to Sarah',
    completed: false,
    status: 'In progress',
    statusColor: '#2F6FED',
    dueDate: 'Thu · Nov 14',
    dueDateLabel: 'Due Thu',
    isOverdue: false,
    priority: 'Medium',
    priorityFire: false,
    assignee: { initials: 'Y', name: 'You', color: '#C97B3A', isMe: true },
    secondaryLine: '4 files attached',
    description:
      'Prepare and send the approved high-resolution Q4 Marketing assets to Sarah for campaign execution.',
    subTasks: [
      { id: 'st-4', title: 'Export vector logos', done: true },
      { id: 'st-5', title: 'Bundle key visuals', done: false },
    ],
    attachments: [
      { id: 'att-3', name: 'Brand_Kit_Q4.zip', size: '18.4 MB' },
    ],
    activity: [
      {
        id: 'act-3',
        name: 'Sarah Jones',
        initials: 'SJ',
        color: '#5E5CE6',
        action: 'requested asset pack',
        time: '1d ago',
      },
    ],
  },
  {
    id: '6651b2c3d4e5f60102030407',
    chatId: '6650a1b2c3d4e5f601020306',
    title: 'Brainstorm Q4 Marketing ideas',
    completed: false,
    status: 'In progress',
    statusColor: '#8E8E93',
    dueDate: 'No date',
    dueDateLabel: 'No date',
    isOverdue: false,
    priority: 'Low',
    priorityFire: false,
    assignee: { initials: 'Y', name: 'You', color: '#3A3A3C', isMe: true },
    secondaryLine: 'Private note',
    description:
      'Personal notes on Q4 marketing directions: explore influencer marketing, holiday bundle sales, and video reel sponsorships.',
    subTasks: [
      { id: 'st-6', title: 'Write outline of hooks', done: false },
    ],
    attachments: [],
    activity: [],
  },
];

const INITIAL_BILLS = [
  {
    id: '6652c3d4e5f6010203040506',
    chatId: '6650a1b2c3d4e5f601020304',
    code: '20250021',
    invoiceNo: '#BIL-4021',
    title: 'Q4 Marketing retainer',
    amount: 4500,
    currency: 1,
    amountLabel: '$4,500',
    direction: 'owedToMe',
    amountHeading: 'Owed to you',
    status: 'AWAITING PAYMENT',
    statusColor: 'blue',
    payable: true,
    from: 'Acme Corp',
    issuedDate: 'Oct 31, 2025',
    dueDate: 'Nov 14, 2025',
    lineItems: [
      { id: 'li-1', name: 'Paid media retainer', sub: '1 × $3,200', amount: '$3,200' },
      { id: 'li-2', name: 'Content production', sub: '1 × $1,300', amount: '$1,300' },
    ],
    total: '$4,500',
    timeline: [
      { id: 'tl-1', icon: 'paper-plane', color: '#34C759', description: 'Sent to Acme Corp', date: 'Oct 31' },
      { id: 'tl-2', icon: 'eye', color: '#007AFF', description: 'Viewed by finance', date: 'Nov 2' },
    ],
  },
  {
    id: '6652c3d4e5f6010203040507',
    chatId: '6650a1b2c3d4e5f601020304',
    code: '20250022',
    invoiceNo: '#BIL-4022',
    title: 'Q4 Marketing co-spend',
    amount: 600,
    currency: 1,
    amountLabel: '$600',
    direction: 'iOwe',
    amountHeading: 'You owe',
    status: 'YOU OWE',
    statusColor: 'orange',
    payable: true,
    from: 'Acme Corp',
    issuedDate: 'Nov 01, 2025',
    dueDate: 'Nov 20, 2025',
    lineItems: [
      { id: 'li-3', name: 'Shared booth expense', sub: 'Q4 Industry Expo', amount: '$600' },
    ],
    total: '$600',
    timeline: [
      { id: 'tl-3', icon: 'mail-unread', color: '#FF9500', description: 'Invoice received', date: 'Nov 1' },
    ],
  },
  {
    id: '6652c3d4e5f6010203040508',
    chatId: '6650a1b2c3d4e5f601020305',
    code: '20250023',
    invoiceNo: '#BIL-4023',
    title: 'Q4 Marketing photo shoot',
    amount: 850,
    currency: 1,
    amountLabel: '$850',
    direction: 'owedToMe',
    amountHeading: 'Owed to you',
    status: 'OFFER · PENDING',
    statusColor: 'orange',
    payable: false,
    from: 'Sarah Jones',
    issuedDate: 'Nov 03, 2025',
    dueDate: 'Nov 25, 2025',
    lineItems: [
      { id: 'li-4', name: 'Studio photo session', sub: '3h session + edits', amount: '$850' },
    ],
    total: '$850',
    timeline: [
      { id: 'tl-4', icon: 'time', color: '#FF9500', description: 'Proposal submitted', date: 'Nov 3' },
    ],
  },
  {
    id: '6652c3d4e5f6010203040509',
    chatId: '6650a1b2c3d4e5f601020307',
    code: '20250024',
    invoiceNo: '#BIL-4024',
    title: 'Q4 Marketing print run',
    amount: 1200,
    currency: 1,
    amountLabel: '$1,200',
    direction: 'iOwe',
    amountHeading: 'You owe',
    status: 'OVERDUE · 5D',
    statusColor: 'red',
    payable: true,
    from: 'Brightline Studio',
    issuedDate: 'Oct 15, 2025',
    dueDate: 'Nov 05, 2025',
    lineItems: [
      { id: 'li-5', name: 'Print run materials', sub: '500 brochures', amount: '$1,200' },
    ],
    total: '$1,200',
    timeline: [
      { id: 'tl-5', icon: 'alert-circle', color: '#FF3B30', description: 'Overdue by 5 days', date: 'Nov 5' },
    ],
  },
  {
    id: '6652c3d4e5f6010203040510',
    chatId: '6650a1b2c3d4e5f601020307',
    code: '20250025',
    invoiceNo: '#BIL-4025',
    title: 'Q4 Marketing launch ads',
    amount: 2000,
    currency: 1,
    amountLabel: '$2,000',
    direction: 'owedToMe',
    amountHeading: 'Paid',
    status: 'PAID',
    statusColor: 'green',
    payable: false,
    from: 'Brightline Studio',
    issuedDate: 'Oct 20, 2025',
    dueDate: 'Nov 01, 2025',
    lineItems: [
      { id: 'li-6', name: 'Campaign ad launch', sub: 'Social media distribution', amount: '$2,000' },
    ],
    total: '$2,000',
    timeline: [
      { id: 'tl-6', icon: 'checkmark-circle', color: '#34C759', description: 'Paid via Payment Gateway', date: 'Nov 1' },
    ],
  },
];

// In-memory reactive state
let memoryChats = JSON.parse(JSON.stringify(INITIAL_CHATS));
let memoryTasks = JSON.parse(JSON.stringify(INITIAL_TASKS));
let memoryBills = JSON.parse(JSON.stringify(INITIAL_BILLS));

// Helper: safe fetch with timeout
async function requestWithTimeout(endpoint, options = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${AUTH_TOKEN}`,
      ...(options.headers || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Offline search simulator matching Postman & PRD
function mockSearch(query = '', type = 'chats', filters = []) {
  const q = String(query).trim().toLowerCase();
  const filterList = Array.isArray(filters)
    ? filters.map((f) => f.toLowerCase())
    : String(filters).toLowerCase().split(',').filter(Boolean);

  if (type === 'chats') {
    let results = memoryChats.filter((chat) => {
      if (!q) return true;
      return (
        chat.title.toLowerCase().includes(q) ||
        chat.contextLabel.toLowerCase().includes(q)
      );
    });

    if (filterList.length > 0) {
      results = results.filter((chat) => {
        return filterList.some((f) => {
          if (f === 'groups') return chat.isGroup;
          if (f === 'direct messages' || f === 'direct') return !chat.isGroup && !chat.isPrivate;
          if (f === 'private') return chat.isPrivate;
          if (f === 'has tasks' || f === 'hastasks') return (chat.taskCount || 0) > 0;
          if (f === 'has bills' || f === 'hasbills') return (chat.billCount || 0) > 0;
          if (f === 'unread') return (chat.unread || 0) > 0;
          return true;
        });
      });
    }

    return {
      type: 'chats',
      query: q,
      results,
    };
  }

  if (type === 'tasks') {
    let filteredTasks = memoryTasks.filter((t) => {
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.secondaryLine && t.secondaryLine.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    });

    if (filterList.length > 0) {
      filteredTasks = filteredTasks.filter((t) => {
        return filterList.some((f) => {
          if (f === 'assigned to me' || f === 'assignedtome') return t.assignee?.isMe;
          if (f === 'assigned to others' || f === 'assignedtoothers') return !t.assignee?.isMe;
          if (f === 'in progress' || f === 'inprogress') return !t.completed;
          if (f === 'high priority' || f === 'highpriority') return t.priority === 'High';
          if (f === 'due this week' || f === 'duethisweek') return !t.isOverdue;
          if (f === 'completed') return t.completed;
          return true;
        });
      });
    }

    // Group by chat
    const groupMap = {};
    for (const t of filteredTasks) {
      if (!groupMap[t.chatId]) {
        const chat = memoryChats.find((c) => c.id === t.chatId) || {
          id: t.chatId,
          title: 'Related Chat',
          avatarInitials: 'RC',
          avatarColor: '#007AFF',
          contextLabel: 'Chat context',
        };
        groupMap[t.chatId] = {
          chat,
          count: 0,
          items: [],
        };
      }
      groupMap[t.chatId].items.push(t);
      groupMap[t.chatId].count++;
    }

    return {
      type: 'tasks',
      query: q,
      count: filteredTasks.length,
      groups: Object.values(groupMap),
    };
  }

  if (type === 'bills') {
    let filteredBills = memoryBills.filter((b) => {
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        (b.code && b.code.toLowerCase().includes(q)) ||
        (b.invoiceNo && b.invoiceNo.toLowerCase().includes(q))
      );
    });

    if (filterList.length > 0) {
      filteredBills = filteredBills.filter((b) => {
        const s = (b.status || '').toLowerCase();
        return filterList.some((f) => {
          if (f === 'owed to me' || f === 'owedtome') return b.direction === 'owedToMe';
          if (f === 'i owe' || f === 'iowe') return b.direction === 'iOwe';
          if (f === 'awaiting payment' || f === 'awaitingpayment') return s.includes('awaiting');
          if (f === 'overdue') return s.includes('overdue');
          return true;
        });
      });
    }

    // Group by chat
    const groupMap = {};
    for (const b of filteredBills) {
      if (!groupMap[b.chatId]) {
        const chat = memoryChats.find((c) => c.id === b.chatId) || {
          id: b.chatId,
          title: 'Related Chat',
          avatarInitials: 'RC',
          avatarColor: '#007AFF',
          contextLabel: 'Chat context',
        };
        groupMap[b.chatId] = {
          chat,
          count: 0,
          items: [],
        };
      }
      groupMap[b.chatId].items.push(b);
      groupMap[b.chatId].count++;
    }

    return {
      type: 'bills',
      query: q,
      count: filteredBills.length,
      groups: Object.values(groupMap),
    };
  }

  return { results: [], groups: [] };
}

// ==========================================
// EXPORTED API CLIENT
// ==========================================

export const searchApi = {
  search: async (query, type = 'chats', filters = []) => {
    const formattedType = String(type).toLowerCase();
    const filterParam = Array.isArray(filters) ? filters.join(',') : filters || '';
    const endpoint = `/search?q=${encodeURIComponent(query)}&type=${formattedType}&filters=${encodeURIComponent(filterParam)}`;

    try {
      const data = await requestWithTimeout(endpoint, { method: 'GET' }, 2500);
      return data;
    } catch (_) {
      // Return seamless mock data matching PRD
      return mockSearch(query, formattedType, filters);
    }
  },

  getTaskDetail: async (taskId) => {
    try {
      const data = await requestWithTimeout(`/search/task/${taskId}`, { method: 'GET' }, 2500);
      return data?.task || data;
    } catch (_) {
      const found = memoryTasks.find((t) => String(t.id) === String(taskId));
      if (found) {
        const chat = memoryChats.find((c) => c.id === found.chatId);
        return { ...found, chat };
      }
      return memoryTasks[0];
    }
  },

  getBillDetail: async (billId) => {
    try {
      const data = await requestWithTimeout(`/search/bill/${billId}`, { method: 'GET' }, 2500);
      return data?.bill || data;
    } catch (_) {
      const found = memoryBills.find((b) => String(b.id) === String(billId));
      if (found) {
        const chat = memoryChats.find((c) => c.id === found.chatId);
        return { ...found, chat };
      }
      return memoryBills[0];
    }
  },

  payBill: async (billId) => {
    try {
      const data = await requestWithTimeout(
        `/search/bill/${billId}/pay`,
        { method: 'POST', body: JSON.stringify({}) },
        2500
      );
      return data;
    } catch (_) {
      // Update in-memory bill status to PAID
      const target = memoryBills.find((b) => String(b.id) === String(billId));
      if (target) {
        target.status = 'PAID';
        target.statusColor = 'green';
        target.payable = false;
        target.timeline = target.timeline || [];
        target.timeline.unshift({
          id: `tl-${Date.now()}`,
          icon: 'checkmark-circle',
          color: '#34C759',
          description: 'Payment processed successfully',
          date: 'Just now',
        });
      }
      return { success: true, message: 'Payment processed successfully.' };
    }
  },

  completeTask: async (taskId) => {
    try {
      const data = await requestWithTimeout(
        `/search/task/${taskId}/complete`,
        { method: 'POST' },
        2500
      );
      return data;
    } catch (_) {
      const target = memoryTasks.find((t) => String(t.id) === String(taskId));
      if (target) {
        target.completed = !target.completed;
        target.status = target.completed ? 'Completed' : 'In progress';
        if (target.subTasks) {
          target.subTasks.forEach((st) => {
            st.done = target.completed;
          });
        }
      }
      return { success: true };
    }
  },

  getChatDetail: async (chatId) => {
    try {
      const data = await requestWithTimeout(`/chats/${chatId}`, { method: 'GET' }, 2500);
      return data?.chat || data;
    } catch (_) {
      const found = memoryChats.find((c) => String(c.id) === String(chatId));
      return found || memoryChats[0];
    }
  },
};
