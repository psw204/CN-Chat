import { useEffect, useRef, useState } from "react";
import "../../assets/styles/chat.css";
import { useChatStore } from "../../shared/store/chatStore";
import { useUserStore } from "../../shared/store/userStore";
import profileImg from "../../assets/images/profile.jpg";
import * as api from "../../shared/api";
import { format } from "timeago.js";
import { connectChatSocket, sendChatMessage, closeChatSocket } from "../../shared/socket";

const DJANGO_SERVER = "http://localhost:8000";

function getAvatarSrc(avatar) {
  if (!avatar || avatar === "null" || avatar === "") return profileImg;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  if (avatar.startsWith("/media/")) return `${DJANGO_SERVER}${avatar}`;
  return `${DJANGO_SERVER}/media/${avatar}`;
}

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [media, setMedia] = useState({ file: null, url: "" });
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [isUpdatingBlock, setIsUpdatingBlock] = useState(false);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeChat } = useChatStore();

  const messagesEndRef = useRef(null);
  const mediaInputRef = useRef(null);

  // 메시지 내역 불러오기 + WebSocket 연결
  useEffect(() => {
    if (!chatId) return;
    setMessages([]); // 채팅방 전환 시 초기화

    api.fetchMessages({ chatId })
      .then(setMessages)
      .catch(() => setMessages([]));

    const socket = connectChatSocket(chatId, (data) => {
      if (data.type === "message" || !data.type) {
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
        await changeChat(chatId, user);
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
      await changeChat(chatId, user); // 서버에서 최신 blocked 상태 반영
    } catch (err) {
      // 에러 처리
    } finally {
      setIsUpdatingBlock(false);
    }
  };

  if (!user) return null;

  if (isCurrentUserBlocked || isReceiverBlocked) {
    return (
      <div className="chatroom">
        <div className="chatroom-header">
          <div className="user-info">
            <img src={getAvatarSrc(user?.avatar)} alt="" />
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

  return (
    <div className="chatroom">
      <div className="chatroom-header">
        <div className="user-info">
          <img src={getAvatarSrc(user?.avatar)} alt="" />
          <div className="user-details">
            <h4>{user?.username}</h4>
            <p>{user?.username}</p>
          </div>
        </div>
        <button
          className={`block-btn${isReceiverBlocked ? " unblocked" : ""}`}
          onClick={handleBlock}
          disabled={isUpdatingBlock}
        >
          {isUpdatingBlock ? "처리중..." : isReceiverBlocked ? "차단 해제" : "차단"}
        </button>
      </div>
      <div className="message-container">
        <div className="message-list">
          {messages.map((msg, i) => {
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
                  <span className="message-time">{format(msg.createdAt || msg.created_at)}</span>
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
