import { useEffect } from "react";
import ChatRoom from "../features/chat/ChatRoom";
import ListPanel from "../features/user/ListPanel";
import AuthScreen from "../features/auth/Login";
import AuthNotification from "../features/auth/AuthNotification";
import { useUserStore } from "../shared/store/userStore";
import { useChatStore } from "../shared/store/chatStore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserInfo(token);
    } else {
      useUserStore.setState({ isLoading: false });
    }
  }, [fetchUserInfo]);

  return (
    <div>
      <AuthNotification />
      {isLoading ? (
        // 로딩 스피너 등으로 대체하거나, 그냥 null로 둬도 됨
        <div className="loading-overlay">로딩 중...</div>
      ) : !currentUser ? (
        <AuthScreen />
      ) : (
        <div className="wrapper">
          <ListPanel />
          {chatId ? <ChatRoom /> : null}
        </div>
      )}
    </div>
  );
};

export default App;
