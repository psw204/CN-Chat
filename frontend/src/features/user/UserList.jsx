import { useEffect, useState } from "react";
import "../../assets/styles/chatList.css";
import AddUser from "./AddUser.jsx";
import { useUserStore } from "../../shared/store/userStore";
import { useChatStore } from "../../shared/store/chatStore";
import plusImg from "../../assets/images/plus.png";
import minusImg from "../../assets/images/minus.png";
import searchImg from "../../assets/images/search.png";
import profileImg from "../../assets/images/profile.jpg";
import * as api from "../../shared/api";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  // 채팅 목록 불러오기 (REST API)
  useEffect(() => {
    if (!currentUser?.id) return;
    let ignore = false;

    const fetchChats = async () => {
      try {
        const data = await api.fetchUserChats({ userId: currentUser.id });
        if (!ignore) setChats(data);
      } catch (err) {
        console.error("채팅 목록 가져오기 실패:", err);
      }
    };

    fetchChats();
    const interval = setInterval(fetchChats, 5000); // 5초마다 자동 갱신

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  // 채팅방 클릭 시
  const handleSelect = async (chat) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (chatId === chat.chatId) {
        await changeChat(null, null);
        setIsLoading(false);
        return;
      }

      // 읽음 처리 (API 호출)
      if (!chat.isSeen) {
        await api.markChatAsSeen({ userId: currentUser.id, chatId: chat.chatId });
      }

      await changeChat(chat.chatId, chat.user);
    } catch (err) {
      // 에러 핸들링
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 필터링
  const filteredChats = chats.filter((c) =>
    c.user?.username?.toLowerCase().includes(input.toLowerCase())
  );

  // 최신 메시지 순 정렬
  const sortedChats = [...filteredChats].sort((a, b) => {
    const aTime = a.lastMessage?.created_at || a.updatedAt;
    const bTime = b.lastMessage?.created_at || b.updatedAt;
    return new Date(bTime) - new Date(aTime);
  });

  return (
    <div className="chat-list-panel">
      <div className="chatlist-search">
        <div className="chatlist-search-bar">
          <img src={searchImg} alt="검색" />
          <input
            type="text"
            placeholder="채팅방, 유저 검색"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? minusImg : plusImg}
          alt="유저 추가"
          className="chatlist-add-btn"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {sortedChats.map((chat) => (
        <div
          className="chatlist-item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#4ae89133",
            borderLeft: chat?.isSeen ? "none" : "4px solid #4ae891",
          }}
        >
          <img
            src={
              chat.user.blocked?.includes?.(currentUser.id)
                ? profileImg
                : chat.user.avatar || profileImg
            }
            alt=""
          />
          <div className="chatlist-item-texts">
            <span>
              {chat.user.blocked?.includes?.(currentUser.id)
                ? "User"
                : chat.user.username}
            </span>
            <span>
              {chat.lastMessage
                ? chat.lastMessage.text
                  ? chat.lastMessage.text
                  : "[사진]"
                : ""}
            </span>
          </div>
        </div>
      ))}
      {addMode && (
        <AddUser
          onClose={() => setAddMode(false)}
          onChatCreated={async () => {
            setAddMode(false);
            // 채팅 생성 후 목록 갱신
            const data = await api.fetchUserChats({ userId: currentUser.id });
            setChats(data);
          }}
          isLoading={isLoading}
        />
      )}
      {isLoading && <div className="loading-overlay">로딩 중...</div>}
    </div>
  );
};

export default ChatList;
