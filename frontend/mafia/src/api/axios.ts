import axios from 'axios';

const api = axios.create({
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // console.log(
    //   'API 호출:',
    //   config?.url,
    //   '전체 URL:',
    //   `${config?.baseURL || ''}${config?.url || ''}`,
    // );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API 에러:', {
      url: error.config?.url,
      fullUrl: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
      status: error.response?.status,
      data: error.response?.data,
      error: error.message,
    });
    return Promise.reject(error);
  },
);

export default api;
