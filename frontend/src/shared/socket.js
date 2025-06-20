import { WS_BASE } from './config';

let socket = null;

export function connectChatSocket(chatRoomId, onMessage) {
  // Django Channels 예시: ws://localhost:8000/ws/chat/{chatRoomId}/
  socket = new WebSocket(`${WS_BASE}/ws/chat/${chatRoomId}/`);

  socket.onopen = () => {
    console.log("WebSocket 연결됨");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (onMessage) onMessage(data);
  };

  socket.onclose = () => {
    console.log("WebSocket 연결 종료");
  };

  socket.onerror = (err) => {
    console.error("WebSocket 오류:", err);
  };

  return socket;
}

export function sendChatMessage(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

export function closeChatSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}
