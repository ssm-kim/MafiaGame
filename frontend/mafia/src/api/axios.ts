// import axios from 'axios';

// const api = axios.create({
//   // baseURL: 'http://localhost:8080', cors에러 떠서 일단 지우고 ....
//   timeout: 5000,
//   withCredentials: true,
// });

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   },
// );

// export default api;

// import axios from 'axios';

// const api = axios.create({
//   baseURL: 'http://localhost:8080', // 백엔드 서버 주소 추가
//   timeout: 5000,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Access-Control-Allow-Origin': 'http://localhost:3000', // 프론트엔드 주소
//   },
// });

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   },
// );

// export default api;

// import axios from 'axios';

// const api = axios.create({
//   baseURL: 'https://i12d101.p.ssafy.io',
//   timeout: 5000,
//   withCredentials: true, // CORS를 위해 필요
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // 요청 로깅을 위한 인터셉터
// api.interceptors.request.use(
//   (config) => {
//     console.log('API 호출:', config.url);
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   },
// );

// // 에러 처리를 위한 인터셉터
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     console.error('API 에러:', error.config.url, error.response?.status);
//     return Promise.reject(error);
//   },
// );

// export default api;

import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://i12d101.p.ssafy.io',
  baseURL: 'http://localhost:8080',
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    console.log(
      'API 호출:',
      config?.url,
      '전체 URL:',
      `${config?.baseURL || ''}${config?.url || ''}`,
    );
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
