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

const AddUser = ({ onClose, onChatCreated = () => {}, multiSelect = false }) => {
  const [user, setUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useUserStore();
  const [userList, setUserList] = useState([]);                      // 여러 명 저장 - J
  const [selectedUsers, setSelectedUsers] = useState([]);            // 선택된 유저 id 배열 - J
  const [roomName, setRoomName] = useState("");                      // 단체 채팅방 이름 - J
  const [showRoomNameModal, setShowRoomNameModal] = useState(false); // 단체 채팅방 이름 입력 모달 - J

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
        if (multiSelect) {          // 멀티 선택 모드일 때 - J
          setUserList((prev) =>
            prev.some((u) => u.id === foundUser.id) ? prev : [...prev, foundUser]
          );
        }
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
    if (multiSelect) {                            // 여러명 추가할 때 - J
      if (selectedUsers.length === 0 || !roomName.trim()) return;
      try {
        await api.createChat({ user_ids: selectedUsers, name: roomName });
        if (onChatCreated) onChatCreated();
        onClose();
      } catch (err) {
        setError(err.message);
      }
    } else {
      if (!user) return;                            //기존에 혼자만 추가할 때 - J
      try {
        await api.createChat({userId: user.id});
        if (onChatCreated) onChatCreated(); 
        onClose();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // 유저 선택 (멀티 선택 모드일 때)
    const handleSelect = (userId) => {
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId]
      );
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
      {multiSelect ? (
        <>
          <div className="searched-user-list">
            {userList.map((u) => (
              <label key={u.id} className="searched-user-detail">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(u.id)}
                  onChange={() => handleSelect(u.id)}
                />
                <img src={getAvatarSrc(u.avatar)} alt="" />
                <span>{u.username}</span>
              </label>
            ))}
          </div>
          <button
            onClick={() => setShowRoomNameModal(true)}
            disabled={selectedUsers.length === 0}
          >
            단체 채팅방 만들기
          </button>
          {showRoomNameModal && (                           // 단체 채팅방 이름 입력 - J 
            <div className="room-name-modal">
              <div className="room-name-modal-content">
                <h3>채팅방 이름을 입력하세요</h3>
                <input
                  type="text"
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="채팅방 이름"
                  className="chatroom-name-input"
                />
                <button
                  onClick={() => {
                    if (roomName.trim()) {
                      handleAdd();
                    }
                  }}
                  disabled={!roomName.trim()}
                >
                  만들기
                </button>
                <button 
                  onClick={() => {
                    setShowRoomNameModal(false);  
                    onClose();                        // 친구 추가 팝업창도 같이 닫기 - J 
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        user && (
          <div className="searched-user-detail">
            <img src={getAvatarSrc(user.avatar)} alt="" />
            <span>{user.username}</span>
            <button onClick={handleAdd}>채팅방 만들기</button>
          </div>
        )
      )}
    </div>
  );
};

export default AddUser;
