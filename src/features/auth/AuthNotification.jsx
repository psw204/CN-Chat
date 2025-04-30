import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// 알림(Notification) 컴포넌트
const Notification = () => {
  return (
    <ToastContainer
      position="bottom-right"         // 알림 위치
      autoClose={3200}                // 자동 닫힘(ms)
      hideProgressBar={false}         // 진행바 표시
      newestOnTop={true}              // 최신 알림이 위로
      closeOnClick                    // 클릭 시 닫힘
      pauseOnHover                    // 마우스 올리면 멈춤
      draggable                       // 드래그로 닫기 가능
      style={{
        fontSize: "1rem",
        borderRadius: "12px",
        boxShadow: "0 4px 18px rgba(74,233,145,0.09)",
        background: "rgba(35,41,70,0.96)",
        color: "#fff",
      }}
      toastStyle={{
        borderRadius: "10px",
        background: "rgba(35,41,70,0.98)",
        color: "#fff",
        fontWeight: 500,
        letterSpacing: "0.02em"
      }}
      progressStyle={{
        background: "#4ae891"
      }}
    />
  );
};

export default Notification;
