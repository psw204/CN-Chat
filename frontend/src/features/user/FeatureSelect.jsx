import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../shared/store/userStore";
import { getWeather, checkNetworkStatus } from "../../shared/api";
import { sendUdpNotification } from "../../shared/api/chat";
import { toast } from "react-toastify";
import "../../assets/styles/featureSelect.css";
import profileImg from "../../assets/images/profile.jpg";

const cities = [
  { name: "서울", value: "Seoul" },
  { name: "부산", value: "Busan" },
  { name: "인천", value: "Incheon" },
  { name: "대구", value: "Daegu" },
  { name: "대전", value: "Daejeon" },
  { name: "광주", value: "Gwangju" },
  { name: "울산", value: "Ulsan" },
  { name: "세종", value: "Sejong" },
  { name: "제주", value: "Jeju" }
];

const FeatureSelect = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [selectedCity, setSelectedCity] = useState("Seoul");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);

  // UDP WebSocket 연결 설정
  useEffect(() => {
    const wsUrl = `ws://localhost:8000/ws/udp/`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket 연결됨');
      ws.send(JSON.stringify({
        type: 'join',
        group: 'udp_notifications'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('UDP 메시지 수신:', data);
        
        if (data.type === 'udp.message') {
          const newMessage = {
            content: data.message.content,
            timestamp: data.message.timestamp,
            sender: data.message.sender || '알 수 없음'
          };
          setCurrentMessage(newMessage);
          setIsModalVisible(true);
        }
      } catch (error) {
        console.error('메시지 처리 오류:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 오류:', error);
      toast.error('WebSocket 연결 오류가 발생했습니다.');
    };

    ws.onclose = () => {
      console.log('WebSocket 연결 종료');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChatStart = () => {
    navigate("/chat");
  };

  const handleUdpNotification = async () => {
    try {
      await sendUdpNotification('테스트 메시지');
      toast.success('UDP 알림이 전송되었습니다.');
    } catch (error) {
      console.error('UDP 알림 전송 오류:', error);
      toast.error('UDP 알림 전송에 실패했습니다.');
    }
  };

  const handleNetworkCheck = async () => {
    setNetworkLoading(true);
    try {
      const data = await checkNetworkStatus();
      toast.success('네트워크 상태 확인 완료!');
      console.log('네트워크 상태:', data);
    } catch (error) {
      toast.error('네트워크 상태 확인 실패');
      console.error('네트워크 상태 확인 오류:', error);
    } finally {
      setNetworkLoading(false);
    }
  };

  const handleWeather = async () => {
    setLoading(true);
    try {
      const data = await getWeather(selectedCity);
      setWeatherData(data);
      setShowWeather(true);
    } catch (error) {
      toast.error("날씨 정보 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
    if (showWeather) {
      handleWeather();
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setCurrentMessage(null);
  };

  const DJANGO_SERVER = "http://localhost:8000";

  const avatarSrc =
    currentUser.avatar &&
    currentUser.avatar !== "null" &&
    currentUser.avatar !== ""
      ? currentUser.avatar.startsWith("/media/")
        ? `${DJANGO_SERVER}${currentUser.avatar}`
        : currentUser.avatar
      : profileImg;

  return (
    <div className="feature-select">
      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <img
            className="profile-avatar"
            src={avatarSrc}
            alt="프로필"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = profileImg;
            }}
          />
        </div>
        <div className="profile-main">
          <h2 className="profile-name">{currentUser.username}</h2>
          <span className="profile-role">My Account</span>
        </div>
        
        <div className="features-grid">
          <button className="feature-btn udp" onClick={handleUdpNotification}>
            UDP 알림
          </button>
          <button 
            className="feature-btn network" 
            onClick={handleNetworkCheck}
            disabled={networkLoading}
          >
            {networkLoading ? "확인 중..." : "네트워크 상태"}
          </button>
          <button 
            className="feature-btn weather"
            onClick={handleWeather}
            disabled={loading}
          >
            {loading ? "로딩중..." : "날씨 보기"}
          </button>
          <button className="feature-btn chat" onClick={handleChatStart}>
            채팅 시작하기
          </button>
        </div>

        <div className="profile-actions">
          <button className="logout-text-btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>

      {/* 날씨 모달 */}
      {showWeather && weatherData && (
        <div className="weather-modal">
          <div className="weather-content">
            <h3>{weatherData.name}의 날씨</h3>
            <select 
              value={selectedCity} 
              onChange={handleCityChange}
              className="city-select"
              disabled={loading}
            >
              {cities.map(city => (
                <option key={city.value} value={city.value}>
                  {city.name}
                </option>
              ))}
            </select>
            <p>온도: {weatherData.main.temp}°C</p>
            <p>날씨: {weatherData.weather[0].description}</p>
            <p>습도: {weatherData.main.humidity}%</p>
            <button onClick={() => setShowWeather(false)}>닫기</button>
          </div>
        </div>
      )}

      {/* UDP 알림 모달 */}
      {isModalVisible && currentMessage && (
        <div className="weather-modal">
          <div className="weather-content">
            <h3>UDP 알림</h3>
            <p><strong>발신자:</strong> {currentMessage.sender}</p>
            <p><strong>내용:</strong> {currentMessage.content}</p>
            <p><strong>시간:</strong> {new Date(currentMessage.timestamp).toLocaleString()}</p>
            <button onClick={handleModalClose}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureSelect; 