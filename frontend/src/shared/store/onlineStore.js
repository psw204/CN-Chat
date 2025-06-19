import { create } from "zustand";

export const useOnlineUserStore = create((set) => ({
  onlineUsers: {}, // { userId: true/false }
  setOnlineUser: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),
}));
