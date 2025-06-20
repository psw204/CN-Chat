import { useEffect, useState } from "react";
import "../../assets/styles/chatList.css";
import AddUser from "./AddUser.jsx";
import { useUserStore } from "../../shared/store/userStore";
import { useChatStore } from "../../shared/store/chatStore";
import plusImg from "../../assets/images/plus.png";
import minusImg from "../../assets/images/minus.png";
import searchImg from "../../assets/images/search.png";
import profileImg from "../../assets/images/profile.jpg";
import makechattingroomImg from "../../assets/images/add_chatting_room.png";
import * as api from "../../shared/api";
import { useOnlineUserStore } from "../../shared/store/onlineStore";



// UserProfile을 ChatList 바깥에 선언
function UserProfile({ user }) {
  // user.is_online이 true면 online, 아니면 offline
  return (
    <img
      src={user.avatar || profileImg}
      className={user.is_online ? "online" : "offline"}
      alt={user.username}
    />
  );
}



const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createRoomMode, setCreateRoomMode] = useState(false); // 기존 코드에서 여러명의 인원 추가 - J

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  const setOnlineUserIds = useOnlineUserStore((state) => state.setOnlineUserIds);
  
  // 온라인 유저 목록을 5초마다 갱신
  useEffect(() => {
    let ignore = false;
    async function fetchOnline() {
      try {
        const users = await api.fetchOnlineUsers();
        console.log('온라인 유저 목록',users);
        if (!ignore) setOnlineUserIds(users.map(u => u.id));
      } catch (err) {
        // 에러 무시
      }
    }
    fetchOnline();
    const interval = setInterval(fetchOnline, 5000);
    return () => { ignore = true; clearInterval(interval); };
  }, [setOnlineUserIds]);

  


    // 토큰 기반 온오프라인
  const token = localStorage.getItem("token");
  const setOnlineUser = useOnlineUserStore((state) => state.setOnlineUser);

  useEffect(() => {
    const Socket = new WebSocket(`ws://192.168.45.225:8000/ws/status/?token=${token}`);

    Socket.onopen = () => console.log("웹소켓 연결 성공");
    Socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("백엔드에서 온 신호:", data);
      if (data.type === "user_status") {
        setOnlineUser(data.user_id, data.is_online);
      }
    };
    Socket.onerror = (error) => console.error("웹소켓 에러:", error);
    Socket.onclose = () => console.log("웹소켓 연결 종료");

    return () => Socket.close();
  }, [setOnlineUser, token]);

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

      await changeChat(                                               //채팅방 버튼 눌렀을 때 전달되는 내용들 - J
        chat.chatId, 
        chat.user,
        chat.chatRoomName || chat.displayName || chat.chat_room_name, // 방 이름 - J
        chat.isGroup,                                                  // 단체방 여부 - J
        chat.users                                                    // 참여자 정보도 같이 전달 - J
      );
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

  //   function useUserOnlineStatus(userId) {
  //   const setOnlineUser = useOnlineUserStore((state) => state.setOnlineUser);
  //   useEffect(() => {
  //     const socket = new WebSocket("ws://192.168.45.225:8000/ws/status/");
  //     socket.onmessage = (event) => {
  //       const data = JSON.parse(event.data);
  //       if (data.type === "user_status" && data.user_id === userId) {
  //         setOnlineUser(data.user_id, data.is_online);
  //       }
  //     };
  //     return () => socket.close();
  //   }, [userId, setOnlineUser]);
  
  //   const onlineUsers = useOnlineUserStore((state) => state.onlineUsers);
  //   return onlineUsers[userId] || false;
  // }
  
  // function UserProfile({ user, currentUserId,isBlocked}) {
  //   const onlineUsers = useOnlineUserStore((state) => state.onlineUsers);
  //   const isOnline = isBlocked ? false : onlineUsers[user.id] || false;
  
  //   useUserOnlineStatus(user?.id); // 커스텀 훅 사용
  
  //   if (!user) return null;

  //   const profileSrc = user.blocked?.includes?.(currentUserId)
  //   ? profileImg
  //   : user.avatar || profileImg;

  //   return (
  //   <img
  //     src={profileSrc}
  //     className={isOnline ? "online" : "offline"}
  //     alt=""
  //   />
  // );
  // }

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
        <img                        //채팅방 생성 버튼 - J
          src={addMode ? minusImg : makechattingroomImg}
          alt="채팅방 만들기"
          className="makechattingroom-btn"
          onClick={() => { setCreateRoomMode((prev) => !prev);}}
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
          }} // 채팅방 프로필
        > 
         <UserProfile user={chat.user} currentUserId={currentUser.id} />
          {/* <img
            src={
              chat.user.blocked?.includes?.(currentUser.id)
                ? profileImg
                : chat.user.avatar || profileImg
            }
            
            alt=""
          /> */}
          <div className="chatlist-item-texts">
            <span>
              {chat.isGroup
                ? chat.displayName || chat.chat_room_name // 단체방이면 방 이름 - J
                : chat.user.blocked?.includes?.(currentUser.id)
                  ? "User"
                  : chat.user.username // 1:1이면 유저 이름 - J
              }
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

      {createRoomMode && (
        <AddUser
          onClose={() => setCreateRoomMode(false)}
          onChatCreated={async () => {
            setCreateRoomMode(false);
            const data = await api.fetchUserChats({ userId: currentUser.id });
            setChats(data);
          }}
          isLoading={isLoading}
          multiSelect={true} // 여러 명 선택
        />
      )}


      {isLoading && <div className="loading-overlay">로딩 중...</div>}
    </div>
  );
};

export default ChatList;
