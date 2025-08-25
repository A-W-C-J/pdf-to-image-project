// Firebase 初始化模块

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { firebaseConfig } from '@/lib/constants/pdf-converter-constants'

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化 Analytics (仅在客户端且有 measurementId 的情况下)
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  getAnalytics(app);
}

export default app;