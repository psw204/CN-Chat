import { create } from "zustand";
import { useUserStore } from "./userStore";
import * as api from "../api";
import ChatRoom from "../../features/chat/ChatRoom";

// 채팅 상태 관리
export const useChatStore = create((set) => ({
  chatId: null,
  ChatRoomName: null, // 단체 채팅방 이름 - J
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  // 채팅방 변경
  changeChat: async (chatId, user, chatRoomName) => {
    const currentUser = useUserStore.getState().currentUser;
    if (!user) {
      set({ chatId: null, ChatRoomName, user: null, isCurrentUserBlocked: false, isReceiverBlocked: false });
      return;
    }
    try {
      // 유저 정보 및 차단 상태 API로 확인
      const userData = await api.fetchUser({ userId: user.id });
      const myData = await api.fetchUserInfo(localStorage.getItem("token"));

      if (
        userData.blocked?.includes?.(myData.id) &&
        myData.blocked?.includes?.(userData.id)
      ) {
        // 서로 차단
        set({
          chatId,
          user: userData,
          isCurrentUserBlocked: true,
          isReceiverBlocked: true,
        });
      } else if (userData.blocked?.includes?.(myData.id)) {
        // 상대가 나를 차단
        set({
          chatId,
          user: userData,
          isCurrentUserBlocked: true,
          isReceiverBlocked: false,
        });
      } else if (myData.blocked?.includes?.(userData.id)) {
        // 내가 상대를 차단
        set({
          chatId,
          user: userData,
          isCurrentUserBlocked: false,
          isReceiverBlocked: true,
        });
      } else {
        set({
          chatId,
          user: userData,
          chatRoomName,
          isCurrentUserBlocked: false,
          isReceiverBlocked: false,
        });
      }
      
    } catch (err) {
      set({ chatId, user, isCurrentUserBlocked: false, isReceiverBlocked: false });
    }
  },

  // 차단 토글
  toggleBlock: () => set((state) => ({
    ...state,
    isReceiverBlocked: !state.isReceiverBlocked,
  })),

  // 채팅 상태 초기화
  resetChat: () =>
    set({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    }),
}));
