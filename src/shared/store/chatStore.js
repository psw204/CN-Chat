import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { create } from "zustand";
import { useUserStore } from "./userStore";

// 채팅 관련 상태 관리
export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  // 채팅방 변경 시 차단 여부 검사 (비동기 함수로 변경)
  changeChat: async (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    // user가 null이면(채팅방 닫기 등) 안전하게 처리
    if (!user) {
      return set({
        chatId,
        user: null,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }

    try {
      // 최신 상대방 정보 가져오기
      const userDoc = await getDoc(doc(db, "users", user.id));
      const userData = userDoc.exists() ? userDoc.data() : user;
      
      // 최신 내 정보 가져오기
      const myDoc = await getDoc(doc(db, "users", currentUser.id));
      const myData = myDoc.exists() ? myDoc.data() : currentUser;

      // 상대가 나를 차단한 경우
      if (userData.blocked?.includes?.(myData.id)) {
        return set({
          chatId,
          user: userData,
          isCurrentUserBlocked: true,
          isReceiverBlocked: false,
        });
      }
      
      // 내가 상대를 차단한 경우
      if (myData.blocked?.includes?.(userData.id)) {
        return set({
          chatId,
          user: userData,
          isCurrentUserBlocked: false,
          isReceiverBlocked: true,
        });
      }
      
      // 차단 상태가 없는 경우
      return set({
        chatId,
        user: userData,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    } catch (err) {
      console.error("채팅방 정보 로딩 중 오류:", err);
      return set({
        chatId,
        user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: false,
      });
    }
  },

  // 상대방 차단 상태 토글
  toggleBlock: () => {
    set((state) => ({
      ...state,
      isReceiverBlocked: !state.isReceiverBlocked,
    }));
  },

  // 채팅 상태 초기화
  resetChat: () => {
    set({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
}));
