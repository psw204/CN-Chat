import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ChatRoom from "../features/chat/ChatRoom";
import ListPanel from "../features/user/ListPanel";
import AuthScreen from "../features/auth/Login";
import AuthNotification from "../features/auth/AuthNotification";
import FeatureSelect from "../features/user/FeatureSelect";
import { useUserStore } from "../shared/store/userStore";
import { useChatStore } from "../shared/store/chatStore";

const PrivateRoute = ({ children }) => {
  const { currentUser, isLoading } = useUserStore();
  
  if (isLoading) {
    return <div className="loading-overlay">로딩 중...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

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

  if (isLoading) {
    return <div className="loading-overlay">로딩 중...</div>;
  }

  return (
    <Router>
      <div>
        <AuthNotification />
        <Routes>
          <Route path="/login" element={!currentUser ? <AuthScreen /> : <Navigate to="/features" />} />
          <Route
            path="/features"
            element={
              <PrivateRoute>
                <FeatureSelect />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <div className="wrapper">
                  <ListPanel />
                  {chatId ? <ChatRoom /> : null}
                </div>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to={currentUser ? "/features" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
