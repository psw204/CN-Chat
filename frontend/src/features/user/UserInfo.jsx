import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../shared/store/userStore";
import "../../assets/styles/userInfo.css";
import profileImg from "../../assets/images/profile.jpg";

const UserInfo = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const DJANGO_SERVER = `${window.location.protocol}//${window.location.hostname}:8000`;

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
