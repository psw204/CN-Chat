// 서버 IP 자동 감지
const getServerIP = () => {
  // 현재 접속 중인 URL에서 IP 추출
  const currentUrl = window.location.hostname;
  // localhost가 아닌 경우 (다른 기기에서 접속한 경우) 현재 IP 사용
  if (currentUrl !== 'localhost' && currentUrl !== '127.0.0.1') {
    return currentUrl;
  }
  // localhost인 경우 기본값 사용
  return 'localhost';
};

export const SERVER_IP = getServerIP();
export const API_BASE = "http://localhost:8000/api";
export const WS_BASE = "ws://localhost:8000"; 