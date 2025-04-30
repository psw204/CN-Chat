import { useEffect } from "react";
import ChatRoom from "../features/chat/ChatRoom";
import ListPanel from "../features/user/ListPanel"; 
import AuthScreen from "../features/auth/Login";
import Alert from "../features/auth/AuthNotification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../shared/firebase";
import { useUserStore } from "../shared/store/userStore";
import { useChatStore } from "../shared/store/chatStore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid);
    });
    return () => unsubscribe();
  }, [fetchUserInfo]);

  if (isLoading) {
    return (
      <>
        <Alert /> {/* 항상 렌더링 */}
        <div className="loading-indicator">로딩 중...</div>
      </>
    );
  }

  return (
    <>
      <Alert /> {/* 항상 렌더링 */}
      {!currentUser ? (
        <AuthScreen />
      ) : (
        <div className="wrapper">
          <ListPanel />
          {chatId ? <ChatRoom /> : null}
        </div>
      )}
    </>
  );
};

export default App;

