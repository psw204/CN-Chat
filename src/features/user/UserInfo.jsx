import { auth } from "../../shared/firebase";
import { useUserStore } from "../../shared/store/userStore";
import { useChatStore } from "../../shared/store/chatStore";
import "../../assets/styles/userInfo.css";
import profileImg from "../../assets/images/profile.jpg";

const UserInfo = () => {
  const { currentUser } = useUserStore();
  const { resetChat } = useChatStore();

  const handleLogout = () => {
    auth.signOut();
    resetChat();
  };

  return (
    <div className="profile-card">
      <div className="profile-avatar-wrap">
        <img
          className="profile-avatar"
          src={currentUser.avatar || profileImg}
          alt="프로필"
        />
      </div>
      <div className="profile-main">
        <h2 className="profile-name">{currentUser.username}</h2>
        <span className="profile-role">My Account</span>
      </div>
      <div className="profile-actions">
        <button
          className="logout-text-btn"
          onClick={handleLogout}
          title="로그아웃"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};

export default UserInfo;
