import { useUserStore } from "../../shared/store/userStore";
import { useChatStore } from "../../shared/store/chatStore";
import "../../assets/styles/userInfo.css";
import profileImg from "../../assets/images/profile.jpg";

const UserInfo = () => {
  const { currentUser } = useUserStore();
  const { resetChat } = useChatStore();

  const handleLogout = () => {
    localStorage.removeItem("token");
    resetChat();
    window.location.reload();
  };

  // 프로필 이미지 경로 안전 처리 함수
  const getAvatarSrc = () => {
    const avatar = currentUser.avatar;
    if (!avatar || avatar === "null" || avatar === "") {
      return profileImg;
    }
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      return avatar;
    }
    if (avatar.startsWith("/")) {
      return `${window.location.origin}${avatar}`;
    }
    // 혹시 avatars/xxx.jpg 등으로 올 경우
    return `${window.location.origin}/media/${avatar}`;
  };


  const DJANGO_SERVER = "http://localhost:8000"; // 백엔드 주소

const avatarSrc =
  currentUser.avatar &&
  currentUser.avatar !== "null" &&
  currentUser.avatar !== ""
    ? currentUser.avatar.startsWith("/media/")
      ? `${DJANGO_SERVER}${currentUser.avatar}`
      : currentUser.avatar
    : profileImg;

  return (
    <div className="profile-card">
      <div className="profile-avatar-wrap">
        <img
          className="profile-avatar"
          src={avatarSrc}
          alt="프로필"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = profileImg;
          }}
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
