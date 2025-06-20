import { create } from "zustand";

export const useOnlineUserStore = create((set) => ({
  onlineUsers: {}, // { userId: isOnline }
  setOnlineUser: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),
}));