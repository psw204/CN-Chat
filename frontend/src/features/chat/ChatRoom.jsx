import { useEffect, useRef, useState } from "react";
import "../../assets/styles/chat.css";
import { useChatStore } from "../../shared/store/chatStore";
import { useUserStore } from "../../shared/store/userStore";
import profileImg from "../../assets/images/profile.jpg";
import * as api from "../../shared/api";
//import { format } from "timeago.js";                                // 몇시간 지났는지 확인하는 라이브인데 이제는 곧 안쓸듯여 - J
import { format } from "date-fns";                                 // 00:00분으로 서버에 입력된 시간을 기준으로 내용 변경할 예정      
import { connectChatSocket, sendChatMessage, closeChatSocket } from "../../shared/socket";
import { useOnlineUserStore } from "../../shared/store/onlineStore";

const DJANGO_SERVER = "http://192.168.45.225:8000";

function getAvatarSrc(avatar) {
  if (!avatar || avatar === "null" || avatar === "") return profileImg;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  if (avatar.startsWith("/media/")) return `${DJANGO_SERVER}${avatar}`;
  return `${DJANGO_SERVER}/media/${avatar}`;
}



function UserProfile({ user }) {
  // user.is_online이 true면 online, 아니면 offline
  const onlineUserIds = useOnlineUserStore((state) => state.onlineUserIds);
  const isOnline = onlineUserIds.includes(user.id);
  return (
    <img
      src={getAvatarSrc(user.avatar)}
      className={isOnline ? "online" : "offline"}
      alt={`${user.username} avatar`}
    />
  );
}

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [media, setMedia] = useState({ file: null, url: "" });
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [isUpdatingBlock, setIsUpdatingBlock] = useState(false);

  const { currentUser } = useUserStore();
  const { chatId, user, chatRoomName, isGroup, isCurrentUserBlocked, isReceiverBlocked, changeChat, users } = useChatStore();

  const messagesEndRef = useRef(null);
  const mediaInputRef = useRef(null);

  const setOnlineUserIds = useOnlineUserStore((state) => state.setOnlineUserIds);

  // 온라인 유저 목록을 5초마다 갱신
  useEffect(() => {
    let ignore = false;
    async function fetchOnline() {
      try {
        const users = await api.fetchOnlineUsers();
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

    Socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "user_status") {
        setOnlineUser(data.user_id, data.is_online);
      }
    };

    return () => Socket.close();
  }, [setOnlineUser]);
  


  // 메시지 내역 불러오기 + WebSocket 연결
  useEffect(() => {
    if (!chatId) return;
    setMessages([]); // 채팅방 전환 시 초기화

    api.fetchMessages({ chatId })
      .then(setMessages)
      .catch(() => setMessages([]));

    const socket = connectChatSocket(chatId, (data) => {
      if (data.type === "message" || !data.type || data.type === "system") {      // 시스템 메시지도 받아옴 - J
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      closeChatSocket();
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 차단 상태 실시간 갱신 (폴링)
  useEffect(() => {
    if (!chatId || !user) return;
    const interval = setInterval(async () => {
      try {
        await changeChat(chatId, user, chatRoomName, isGroup, users); //단체 채팅방 여부와 채팅방 이름도 같이 업데이트 - J
      } catch (err) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [chatId, user, changeChat]);

  // 미디어 파일 선택
  const handleMediaUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setMedia({
        file: selectedFile,
        url: URL.createObjectURL(selectedFile),
      });
    }
  };

  const openImagePreview = (imageUrl) => setEnlargedImage(imageUrl);
  const triggerMediaUpload = () => mediaInputRef.current.click();

  // 메시지 전송
  const sendMessageHandler = async () => {
    if (!messageText.trim() && !media.file) return;
    let imgPath = null;
    try {
      if (media.file) {
        imgPath = await api.uploadMedia(media.file); // 반드시 "uploads/xxx.jpg"만
      }
      const savedMessage = await api.sendMessage({ chatId, text: messageText, img: imgPath });
      const getAbsoluteImgUrl = (img_url) => {
        if (!img_url) return null;
        if (img_url.startsWith("http")) return img_url;
        return `${DJANGO_SERVER}${img_url}`;
      };
      sendChatMessage({
        type: "message",
        chatId,
        senderId: currentUser.id,
        text: savedMessage.text,
        img: getAbsoluteImgUrl(savedMessage.img_url || savedMessage.img),
        img_url: getAbsoluteImgUrl(savedMessage.img_url || savedMessage.img),
        createdAt: savedMessage.created_at || savedMessage.createdAt,
      });
    } catch (err) {
      // 에러 처리
    } finally {
      setMedia({ file: null, url: "" });
      setMessageText("");
    }
  };

  // 차단/차단해제
  const handleBlock = async () => {
    if (!user || isUpdatingBlock) return;
    setIsUpdatingBlock(true);
    try {
      await api.toggleBlock({ userId: currentUser.id, targetId: user.id, block: !isReceiverBlocked });
      await changeChat(chatId, user, users); // 서버에서 최신 blocked 상태 반영
    } catch (err) {
      // 에러 처리
    } finally {
      setIsUpdatingBlock(false);
    }
  };

  // 단체 채팅방 나가기 - J
  const handleLeaveGroup = async () => {
    if (!chatId) return;
    console.log("나가기 버튼 클릭됨", chatId);
    try {
      await api.leaveGroupChat({ chatId });
      window.location.reload();
    } catch (err) {
      alert("채팅방 나가기 실패");
    }
  };

  
  // useEffect(() => {
  //   if (!currentUser) return;

  //   // [수정1] 토큰 포함된 주소로 웹소켓 연결
  //   const ws = new WebSocket(getStatusWebSocketUrl());

  //   ws.onopen = () => {
  //     console.log("온오프라인 상태 웹소켓 연결 성공");
  //   };

  //   ws.onmessage = (event) => {
  //     const data = JSON.parse(event.data);
  //     console.log("백엔드에서 온 신호:", data); // 여기서 신호 확인 가능
  //     if (data.type === "user_status") {
  //       // [수정2] Zustand 등으로 온라인 상태 저장
  //       useOnlineUserStore.getState().setOnlineUser(data.user_id, data.is_online);
  //     }
  //   };

  //   ws.onerror = (error) => {
  //     console.error("온오프라인 웹소켓 에러:", error);
  //   };

  //   ws.onclose = () => {
  //     console.log("온오프라인 상태 웹소켓 연결 종료");
  //   };

  //   // [수정3] 컴포넌트 언마운트 시 연결 해제
  //   return () => {
  //     if (ws && ws.readyState === 1) ws.close();
  //   };
  // }, [currentUser]); // [수정3] currentUser가 바뀔 때만 재연결


  
  if (!user) return null;

  if (isCurrentUserBlocked || isReceiverBlocked) {                              //차단된 상태의 채팅방 개인 챗방에서만 쓰는거라 단체 챗방하고 맞출 필요는 없을듯 합니다 - J
    return (
      <div className="chatroom">
        <div className="chatroom-header">
          <div className="user-info">
              <UserProfile user={user} currentUserId={currentUser.id} />
            <div className="user-details">
              <h4>{user?.username}</h4>
              <p>{isCurrentUserBlocked ? "상대방에게 차단당했습니다." : "상대방을 차단한 상태입니다."}</p>
            </div>
          </div>
          <button
            className={`block-btn${isReceiverBlocked ? " unblocked" : ""}`}
            onClick={handleBlock}
            disabled={isUpdatingBlock}
          >
            {isUpdatingBlock
              ? "처리중..."
              : isReceiverBlocked
              ? "차단 해제"
              : "차단"}
          </button>
        </div>
        <div className="blocked-message">
          {isCurrentUserBlocked
            ? "상대방에게 차단당해 메시지를 보낼 수 없습니다."
            : "상대방을 차단한 상태입니다."}
        </div>
      </div>
    );
  }

  return (                                                                      //차단되지 않은 상태의 채팅방 - J
    <div className="chatroom">
      <div className="chatroom-header">
        <div className="user-info">
          {/* 유저 프로필 */}
            <UserProfile user={user} currentUserId={currentUser.id} />
          <div className="user-details">
            <h3> {isGroup ? chatRoomName : user?.username} </h3> 
            <p> {isGroup && users ? `${users.length}명 참여중` : user?.username} </p>                                     
          </div>
        </div>
        {isGroup ? (
          <button
            className="block-btn"
            onClick={handleLeaveGroup}
            disabled={isUpdatingBlock}
          >
            {isUpdatingBlock ? "처리중..." : "나가기"}
          </button>
        ) : (
          <button
            className={`block-btn${isReceiverBlocked ? " unblocked" : ""}`}
            onClick={handleBlock}
            disabled={isUpdatingBlock}
          >
            {isUpdatingBlock ? "처리중..." : isReceiverBlocked ? "차단 해제" : "차단"}
          </button>
        )}
      </div>
      <div className="message-container">
        <div className="message-list">
          {messages.map((msg, i) => {
            if (msg.type === "system") {                              // 시스템 메시지(누가 나갔는지 채팅방에 알릴 때 쓰임) - J 
              return (
                <div key={i} className="system-message">
                  <span className="system-text">{msg.text}</span>
                </div>
              );
            }

            const isMine = (msg.senderId ?? msg.sender?.id) === currentUser.id;
            const profile = isMine
              ? getAvatarSrc(currentUser.avatar)
              : getAvatarSrc(user?.avatar);
            return (
              <div key={i} className={`message-row ${isMine ? "my-message" : "other-message"}`}>
                <img className="message-avatar" src={profile} alt="" />
                <div className="message-bubble-wrap">
                  {(msg.img_url || msg.img) && (
                    <div className="message-image" onClick={() => openImagePreview(msg.img_url || msg.img)}>
                      <img src={msg.img_url || msg.img} alt="" />
                    </div>
                  )}
                  <div className="message-bubble">{msg.text}</div>
                  <span className="message-time">{format(new Date(msg.createdAt || msg.created_at), "HH:mm")}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef}></div>
        </div>
      </div>
      <div className="input-area">
        <div className="message-composer">
          {media.url && (
            <div className="media-preview">
              <img src={media.url} alt="미리보기" />
              <span onClick={() => setMedia({ file: null, url: "" })}>×</span>
            </div>
          )}
          <div className="message-input-container">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessageHandler()}
            />
            <div className="message-actions">
              <button className="media-button" onClick={triggerMediaUpload} type="button">
                사진
              </button>
              <input
                type="file"
                style={{ display: "none" }}
                ref={mediaInputRef}
                onChange={handleMediaUpload}
                accept="image/*"
              />
              <button className="send-button" onClick={sendMessageHandler} type="button">
                전송
              </button>
            </div>
          </div>
        </div>
      </div>
      {enlargedImage && (
        <div className="image-modal" onClick={() => setEnlargedImage(null)}>
          <div className="modal-content">
            <img src={enlargedImage} alt="확대 보기" />
          </div>
        </div>
      )}
    </div>
  );
  };


export default ChatRoom;
