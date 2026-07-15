import axios from 'axios';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000/api',

  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  response => response,

  error => {
    if (
      typeof window !== 'undefined' &&
      error.response?.status === 401
    ) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

export default api;