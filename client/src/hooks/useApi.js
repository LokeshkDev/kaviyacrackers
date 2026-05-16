import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || '') + '/api' 
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const useApi = () => {
  const fetchData = async () => {
    try {
      const response = await api.get('/data');
      return response.data;
    } catch (error) {
      console.error('API Fetch Error:', error);
      return null;
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/login', { username, password });
      return response.data;
    } catch (error) {
      console.error('API Login Error:', error);
      return { success: false, message: error.response?.data?.message || 'Server error' };
    }
  };

  const createOrder = async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('API Create Order Error:', error);
      return { success: false };
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const response = await api.patch(`/orders/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error('API Update Status Error:', error);
      return { success: false };
    }
  };

  return { fetchData, login, createOrder, updateOrderStatus };
};

export { api };
