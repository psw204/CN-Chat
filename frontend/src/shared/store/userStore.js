import { create } from "zustand";
import * as api from "../api";
import { useChatStore } from "./chatStore";

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

  // 로그아웃
  logout: () => {
    localStorage.removeItem("token");
    useChatStore.getState().resetChat();
    set({ currentUser: null, isLoading: false });
  },
}));
