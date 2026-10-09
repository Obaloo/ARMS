import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL.replace(/\/$/, '')}/api` : '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('arms_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];

const flushQueue = (token) => {
  queue.forEach((resolver) => resolver(token));
  queue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!error.response || error.response.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('arms_refresh_token');
    if (!refreshToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      const token = await new Promise((resolve) => queue.push(resolve));
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshUrl = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL.replace(/\/$/, '')}/api/auth/refresh` : '/api/auth/refresh';
      const response = await axios.post(refreshUrl, { refreshToken });
      const token = response.data.accessToken;
      localStorage.setItem('arms_access_token', token);
      flushQueue(token);
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      localStorage.removeItem('arms_access_token');
      localStorage.removeItem('arms_refresh_token');
      localStorage.removeItem('arms_user');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
