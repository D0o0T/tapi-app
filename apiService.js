import axios from 'axios';

const BASE_URL = 'http://16.171.168.82:40000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlOTk3NzllMGY4OTNmMmZjZTFmOWFjOWEiLCJwaG9uZSI6IisxMDAwMDAwMDAwMSIsImlhdCI6MTc4NTE4NzMxMn0.VWzW8kmgrXgTdAznQoEl4dM3dRzoLVQuJO2Hvo6Pwl8';

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const searchApi = {
  search: async (query, type = 'chats', filters = []) => {
    const response = await apiClient.get('/search', {
      params: {
        q: query,
        type: String(type).toLowerCase(),
        filters: Array.isArray(filters) ? filters.join(',') : filters || '',
      },
    });
    return response.data;
  },

  getTaskDetail: async (taskId) => {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data;
  },

  getBillDetail: async (billId) => {
    const response = await apiClient.get(`/bills/${billId}`);
    return response.data;
  },

  payBill: async (billId, paymentDetails = {}) => {
    const response = await apiClient.post(`/bills/${billId}/pay`, paymentDetails);
    return response.data;
  },

  completeTask: async (taskId) => {
    const response = await apiClient.post(`/tasks/${taskId}/complete`);
    return response.data;
  },

  getChatDetail: async (chatId) => {
    const response = await apiClient.get(`/chats/${chatId}`);
    return response.data;
  },
};
