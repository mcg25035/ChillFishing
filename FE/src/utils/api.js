import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001') + '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include the SECRET_IDENTIFY_TEXT for admin requests
api.interceptors.request.use(
  (config) => {
    const secretIdentifyText = localStorage.getItem('SECRET_IDENTIFY_TEXT');
    if (secretIdentifyText && config.url.includes('/admin')) {
      config.headers['X-Secret-Identify-Text'] = secretIdentifyText;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
