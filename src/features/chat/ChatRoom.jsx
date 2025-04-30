import { useEffect, useRef, useState } from "react";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../shared/firebase";
import { useChatStore } from "../../shared/store/chatStore";
import { useUserStore } from "../../shared/store/userStore";
import uploadMedia from "../../shared/fileUploader";
import { format } from "timeago.js";
import "../../assets/styles/chat.css";
import profileImg from "../../assets/images/profile.jpg";

const ChatRoom = () => {
  const [conversation, setConversation] = useState({ messages: [] });
  const [messageText, setMessageText] = useState("");
  const [media, setMedia] = useState({
    file: null,
    url: "",
  });
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [isUpdatingBlock, setIsUpdatingBlock] = useState(false);

  const { currentUser } = useUserStore();
  const {
    chatId,
    user,
    isCurrentUserBlocked,
    isReceiverBlocked,
    toggleBlock,
    changeChat,
  } = useChatStore();

  const messagesEndRef = useRef(null);
  const mediaInputRef = useRef(null);

  useEffect(() => {
    if (user && chatId) {
      const refreshChatInfo = async () => {
        await changeChat(chatId, user);
      };
      refreshChatInfo();
    }
  }, [isReceiverBlocked]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = onSnapshot(doc(db, "chats", chatId), (snapshot) => {
      if (snapshot.exists()) {
        setConversation(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, [chatId]);

  const handleMediaUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setMedia({
        file: selectedFile,
        url: URL.createObjectURL(selectedFile),
      });
    }
  };

  const openImagePreview = (imageUrl) => {
    setEnlargedImage(imageUrl);
  };

  const triggerMediaUpload = () => {
    mediaInputRef.current.click();
  };

  const sendMessage = async () => {
    if (messageText.trim() === "" && !media.file) return;
    let mediaUrl = null;
    try {
      if (media.file) {
        try {
          mediaUrl = await uploadMedia(media.file);
        } catch (error) {
          alert(error);
          return;
        }
      }
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text: messageText,
          createdAt: new Date(),
          ...(mediaUrl && { img: mediaUrl }),
        }),
      });

      const participants = [currentUser.id, user.id];
      for (const userId of participants) {
        const userChatsRef = doc(db, "userchats", userId);
        const userChatsSnapshot = await getDoc(userChatsRef);
        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );
          if (chatIndex !== -1) {
            userChatsData.chats[chatIndex].lastMessage = media.file ? "이미지" : messageText;
            userChatsData.chats[chatIndex].isSeen = userId === currentUser.id;
            userChatsData.chats[chatIndex].updatedAt = Date.now();
            await updateDoc(userChatsRef, {
              chats: userChatsData.chats,
            });
          }
        }
      }
    } catch (err) {
      console.error("메시지 전송 오류:", err);
    } finally {
      setMedia({
        file: null,
        url: "",
      });
      setMessageText("");
    }
  };

  const handleBlock = async () => {
    if (!user || isUpdatingBlock) return;
    setIsUpdatingBlock(true);

    try {
      const userDocRef = doc(db, "users", currentUser.id);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const blockedArray = userData.blocked || [];

        if (isReceiverBlocked) {
          // 차단 해제
          await updateDoc(userDocRef, {
            blocked: blockedArray.filter(id => id !== user.id)
          });
        } else {
          // 차단
          if (!blockedArray.includes(user.id)) {
            await updateDoc(userDocRef, {
              blocked: [...blockedArray, user.id]
            });
          }
        }

        // 상태 업데이트
        toggleBlock();

        // 채팅방 정보 다시 로드
        await changeChat(chatId, user);
      }
    } catch (err) {
      console.error("차단 상태 변경 중 오류:", err);
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
            <img src={user?.avatar || profileImg} alt="" />
            <div className="user-details">
              <h4>{user?.username}</h4>
              <p>
                {isCurrentUserBlocked && "상대방이 당신을 차단했습니다."}
                {isReceiverBlocked && "차단한 사용자"}
              </p>
            </div>
          </div>
          <button
            className={`block-btn${isReceiverBlocked ? " unblocked" : ""}`}
            onClick={handleBlock}
            disabled={isUpdatingBlock}
          >
            {isUpdatingBlock ? "처리 중..." : (isReceiverBlocked ? "차단 해제" : "차단")}
          </button>
        </div>
        <div className="blocked-message">
          {isCurrentUserBlocked
            ? "상대방이 당신을 차단했습니다."
            : "차단한 사용자와는 대화할 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="chatroom">
      {/* 채팅방 헤더 */}
      <div className="chatroom-header">
        <div className="user-info">
          <img src={user?.avatar || profileImg} alt="" />
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
          {isUpdatingBlock ? "처리 중..." : (isReceiverBlocked ? "차단 해제" : "차단")}
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="message-container">
        <div className="message-list">
          {conversation.messages.map((msg, i) => {
            const isMine = msg.senderId === currentUser.id;
            const profile =
              isMine
                ? (currentUser.avatar || profileImg)
                : (user?.avatar || profileImg);
            return (
              <div
                key={i}
                className={`message-row ${isMine ? "my-message" : "other-message"}`}
              >
                <img
                  className="message-avatar"
                  src={profile}
                  alt={isMine ? "내 프로필" : "상대 프로필"}
                />
                <div className="message-bubble-wrap">
                  {msg.img && (
                    <div className="message-image" onClick={() => openImagePreview(msg.img)}>
                      <img src={msg.img} alt="" />
                    </div>
                  )}
                  {msg.text && <div className="message-bubble">{msg.text}</div>}
                  <span className="message-time">{format(msg.createdAt.toDate())}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="input-area">
        <div className="message-composer">
          {media.url && (
            <div className="media-preview">
              <img src={media.url} alt="" />
              <span onClick={() => setMedia({ file: null, url: "" })}>×</span>
            </div>
          )}
          <div className="message-input-container">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <div className="message-actions">
              <button className="media-button" onClick={triggerMediaUpload}>
                사진
              </button>
              <input
                type="file"
                style={{ display: "none" }}
                ref={mediaInputRef}
                onChange={handleMediaUpload}
                accept="image/*"
              />
              <button className="send-button" onClick={sendMessage}>
                전송
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* 이미지 모달 */}
      {enlargedImage && (
        <div className="image-modal" onClick={() => setEnlargedImage(null)}>
          <div className="modal-content">
            <img src={enlargedImage} alt="" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
