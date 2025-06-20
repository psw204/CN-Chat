let socket = null;

export function connectChatSocket(chatRoomId, onMessage) {
  // Django Channels 예시: ws://localhost:8000/ws/chat/{chatRoomId}/
  socket = new WebSocket(`ws://192.168.45.225:8000/ws/chat/${chatRoomId}/`);

  socket.onopen = () => {
    console.log("WebSocket 연결됨");
  };

  socket.onmessage = (event) => {
    console.log("메시지 수신:", event.data);
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
