import "../../assets/styles/addUser.css";
import { useState } from "react";
import { useUserStore } from "../../shared/store/userStore";
import profileImg from "../../assets/images/profile.jpg";
import * as api from "../../shared/api";

const DJANGO_SERVER = "http://localhost:8000";

function getAvatarSrc(avatar) {
  if (!avatar || avatar === "null" || avatar === "") return profileImg;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  if (avatar.startsWith("/media/")) return `${DJANGO_SERVER}${avatar}`;
  return `${DJANGO_SERVER}/media/${avatar}`;
}

const AddUser = ({ onClose, onChatCreated = () => {} }) => {
  const [user, setUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useUserStore();

  // 유저 검색
  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setError("");
    setUser(null);

    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const foundUser = await api.searchUser({ username });
      if (foundUser && foundUser.id !== currentUser.id) {
        setUser(foundUser);
      } else {
        setUser(null);
        setError("유저를 찾을 수 없습니다.");
      }
    } catch (err) {
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setSearching(false);
    }
  };

  // 채팅방 생성
  const handleAdd = async () => {
    if (!user) return;
    try {
      await api.createChat({userId: user.id});
      if (onChatCreated) onChatCreated(); 
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="add-user-modal">
      <button className="close-btn" onClick={onClose} title="닫기">
        ×
      </button>
      <form className="add-user-form" onSubmit={handleSearch}>
        <input type="text" placeholder="닉네임으로 유저 검색" name="username" />
        <button disabled={searching}>{searching ? "검색 중..." : "검색"}</button>
      </form>
      {error && <div className="searched-user">{error}</div>}
      {user && (
        <div className="searched-user">
          <div className="searched-user-detail">
            <img src={getAvatarSrc(user.avatar)} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>채팅 시작</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
