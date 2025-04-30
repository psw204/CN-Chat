import { useState } from "react";
import "../../assets/styles/login.css";
import { toast } from "react-toastify";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../../shared/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import upload from "../../shared/fileUploader";
import profileImg from "../../assets/images/profile.jpg";

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // 아바타 이미지 선택 핸들러
  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  // 회원가입 처리
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { username, email, password } = Object.fromEntries(formData);

    if (!username || !email || !password) {
      setLoading(false);
      return toast.warn("모든 입력란을 채워주세요!");
    }

    // 닉네임 중복 검사
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setLoading(false);
      return toast.warn("이미 사용 중인 닉네임입니다.");
    }

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      // 이미지 업로드 or 기본 이미지 지정
      let imgUrl = profileImg;
      if (avatar.file) {
        imgUrl = await upload(avatar.file);
      }

      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar: imgUrl, // 업로드한 이미지 또는 기본 이미지
        id: res.user.uid,
        blocked: [],
      });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success("회원가입이 완료되었습니다!");
      setIsSignUp(false);
      setAvatar({ file: null, url: "" });
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-modal">
        {/* 상단 탭 */}
        <div className="login-tabs">
          <button
            className={!isSignUp ? "active" : ""}
            onClick={() => setIsSignUp(false)}
            disabled={loading}
          >
            로그인
          </button>
          <button
            className={isSignUp ? "active" : ""}
            onClick={() => setIsSignUp(true)}
            disabled={loading}
          >
            회원가입
          </button>
        </div>

        {/* 로그인 폼 */}
        {!isSignUp && (
          <form className="login-form" onSubmit={handleLogin}>
            <h2>Welcome Back!</h2>
            <input type="text" placeholder="이메일" name="email" autoComplete="username" />
            <input type="password" placeholder="비밀번호" name="password" autoComplete="current-password" />
            <button disabled={loading}>{loading ? "로딩중..." : "로그인"}</button>
          </form>
        )}

        {/* 회원가입 폼 */}
        {isSignUp && (
          <form className="signup-form" onSubmit={handleRegister}>
            <h2>계정 만들기</h2>
            <div className="avatar-upload">
              <label htmlFor="file" className="avatar-label">
                <img src={avatar.url || profileImg} alt="아바타" />
                <span>아바타 업로드</span>
              </label>
              <input
                type="file"
                id="file"
                style={{ display: "none" }}
                onChange={handleAvatar}
                accept="image/*"
              />
            </div>
            <input type="text" placeholder="닉네임" name="username" autoComplete="nickname" />
            <input type="text" placeholder="이메일" name="email" autoComplete="username" />
            <input type="password" placeholder="비밀번호" name="password" autoComplete="new-password" />
            <button disabled={loading}>{loading ? "로딩중..." : "회원가입"}</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
