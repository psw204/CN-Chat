import { useEffect, useState } from "react";
import "../../assets/styles/chatList.css";
import AddUser from "./AddUser.jsx";   
import { useUserStore } from "../../shared/store/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../shared/firebase";
import { useChatStore } from "../../shared/store/chatStore";
import plusImg from "../../assets/images/plus.png";
import minusImg from "../../assets/images/minus.png";
import searchImg from "../../assets/images/search.png";
import profileImg from "../../assets/images/profile.jpg";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        if (!res.exists()) return;
        
        const items = res.data().chats;
        const promises = items.map(async (item) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);
          const user = userDocSnap.exists() ? userDocSnap.data() : null;
          return { ...item, user };
        });
        const chatData = await Promise.all(promises);
        setChats(chatData.filter(chat => chat.user).sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );
    return () => unSub();
  }, [currentUser.id]);

  // 채팅방 클릭 시: 같은 채팅방을 다시 클릭하면 닫기
  const handleSelect = async (chat) => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      if (chatId === chat.chatId) {
        await changeChat(null, null);
        setIsLoading(false);
        return;
      }
      
      const userChats = chats.map((item) => {
        const { user, ...rest } = item;
        return rest;
      });
      
      const chatIndex = userChats.findIndex(
        (item) => item.chatId === chat.chatId
      );
      
      if (chatIndex !== -1) {
        userChats[chatIndex].isSeen = true;

        const userChatsRef = doc(db, "userchats", currentUser.id);
        await updateDoc(userChatsRef, {
          chats: userChats,
        });
      }
      
      // 비동기 changeChat 호출
      await changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.error("채팅방 선택 중 오류:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user?.username?.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chat-list-panel">
      {/* 상단 검색/추가 영역 */}
      <div className="chatlist-search">
        <div className="chatlist-search-bar">
          <img src={searchImg}  alt="검색" />
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

      {/* 채팅 목록 */}
      {filteredChats.map((chat) => (
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
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}

      {/* 유저 추가 모드 */}
      {addMode && <AddUser onClose={() => setAddMode(false)} />}
      
      {/* 로딩 표시 */}
      {isLoading && <div className="loading-overlay">로딩 중...</div>}
    </div>
  );
};

export default ChatList;
