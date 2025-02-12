import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    global: {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // server: {
  //   port:3000,
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:8080',
  //       changeOrigin: true,
  //       secure: false,
  //       ws: true,
  //     }
  //   }
  // }
  //로컬용
  // server: {
  //   port: 3000,
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:8080',
  //       changeOrigin: true,
  //       secure: false,
  //       ws: true
  //     },
  //     '/oauth2': {  // 카카오 로그인을 위한 프록시 설정 추가
  //       target: 'http://localhost:8080',
  //       changeOrigin: true,
  //       secure: false
  //     }
  //   }
  // }
  server: {
    port: 3000,
    proxy: {
      // '/api': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      //   secure: true,
      //   ws: true
      // },
      // '/oauth2': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      //   secure: true
      // },
      // '/login': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      //   secure: true
      // }//cnrk
      '/api': {
        target: 'https://i12d101.p.ssafy.io',
        changeOrigin: true,
        secure: true,
        ws: true
      },
      '/oauth2': {
        target: 'https://i12d101.p.ssafy.io',
        changeOrigin: true,
        secure: true
      },
      '/login': {
        target: 'https://i12d101.p.ssafy.io',
        changeOrigin: true,
        secure: true
      }
    }
  }
});