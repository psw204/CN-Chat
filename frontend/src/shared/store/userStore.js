import { create } from "zustand";
import * as api from "../api";

// 유저 상태 관리
export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,

  // 유저 정보 가져오기 (JWT 토큰 사용)
  fetchUserInfo: async (token) => {
    if (!token) {
      set({ currentUser: null, isLoading: false });
      return;
    }
    try {
      const user = await api.fetchUserInfo(token);
      set({ currentUser: user, isLoading: false });
    } catch (err) {
      set({ currentUser: null, isLoading: false });
    }
  },
}));

export const useOnlineUserStore = create((set) => ({
  onlineUserIds: [],
  setOnlineUserIds: (ids) => set({ onlineUserIds: ids }),
}));
