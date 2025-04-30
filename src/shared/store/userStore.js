import { doc, getDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "../firebase";

// 유저 상태 관리
export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,

  // 유저 정보 가져오기
  fetchUserInfo: async (uid) => {
    if (!uid) {
      set({ currentUser: null, isLoading: false });
      return;
    }
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        set({ currentUser: docSnap.data(), isLoading: false });
      } else {
        set({ currentUser: null, isLoading: false });
      }
    } catch (err) {
      console.error("유저 정보 불러오기 오류:", err);
      set({ currentUser: null, isLoading: false });
    }
  },
}));
