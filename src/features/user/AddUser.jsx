import "../../assets/styles/addUser.css";
import { db } from "../../shared/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";
import { useUserStore } from "../../shared/store/userStore";
import profileImg from "../../assets/images/profile.jpg";

const AddUser = ({ onClose }) => {
  const [user, setUser] = useState(null);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);
      if (!querySnapShot.empty) {
        setUser(querySnapShot.docs[0].data());
      } else {
        setUser(null);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");
    try {
      const myChatsDoc = await getDoc(doc(userChatsRef, currentUser.id));
      if (myChatsDoc.exists()) {
        const myChats = myChatsDoc.data().chats || [];
        const exists = myChats.some(
          (chat) => chat.receiverId === user.id
        );
        if (exists) {
          alert("이미 해당 유저와의 채팅방이 존재합니다.");
          return;
        }
      }
      const newChatRef = doc(chatRef);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });
      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });
      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="add-user-modal">
      {/* 닫기 버튼 */}
      <button className="close-btn" onClick={onClose} title="닫기">×</button>
      <form className="add-user-form" onSubmit={handleSearch}>
        <input type="text" placeholder="유저 이름으로 검색" name="username" />
        <button>검색</button>
      </form>
      {user && (
        <div className="searched-user">
          <div className="searched-user-detail">
            <img src={user.avatar || profileImg} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>채팅 추가</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
