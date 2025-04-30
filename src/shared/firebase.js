// Firebase 서비스 초기화 및 모듈 내보내기

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Firebase 프로젝트 설정
const config = {
  apiKey: "AIzaSyC_A8mscCmLtopJ-g_39gs_Sw7hh7iajkk",
  authDomain: "chat-9cdaa.firebaseapp.com",
  projectId: "chat-9cdaa",
  storageBucket: "chat-9cdaa.appspot.com", //storageBucket: "chat-9cdaa.firebasestorage.app", 
  messagingSenderId: "640786775243",
  appId: "1:640786775243:web:01273f8d1548b791302f4e",
  measurementId: "G-7W84XRPX5E",
};

// Firebase 앱 및 서비스 인스턴스 생성
const firebaseApp = initializeApp(config);
const analytics = getAnalytics(firebaseApp);

// 서비스 객체 내보내기
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
