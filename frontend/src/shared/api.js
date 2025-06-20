import { API_BASE } from './config';

// 회원가입
export async function register({ username, email, password, avatar }) {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("email", email);
  formData.append("password", password);
  if (avatar) formData.append("avatar", avatar);

  const res = await fetch(`${API_BASE}/users/`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("회원가입 실패");
  return await res.json();
}

// 로그인
export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("로그인 실패");
  return await res.json();
}

// 내 정보 조회
export async function fetchUserInfo(token) {
  const res = await fetch(`${API_BASE}/users/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("유저 정보 조회 실패");
  return await res.json();
}

// 유저 검색
export async function searchUser({ username }) {
  const res = await fetch(`${API_BASE}/users/search/?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error("유저 검색 실패");
  return await res.json();
}

// 채팅방 생성
export async function createChat({user_ids, chat_room_name}) { // userids로 수정되었습니다 - J
  const token = localStorage.getItem("token");
  const body = { user_ids };
  if (chat_room_name) body.chat_room_name = chat_room_name; // 단체 채팅방일 때만 추가

  const res = await fetch(`${API_BASE}/chats/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (res.status !== 200 && res.status !== 201) throw new Error();
  return await res.json();
}


// 유저의 채팅방 목록 조회
export async function fetchUserChats({ userId }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/chats/?user_id=${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("채팅 목록 조회 실패");
  if (res.status !== 200 && res.status !== 201) {
    const errMsg = await res.text();
    throw new Error('채팅방 생성 중 오류: ' + errMsg);
  }
  
  const data = await res.json();
  
  return data.map(chat => {
    return {
      chatId: chat.id,
      displayName: chat.chat_room_name, // ← 항상 이름만 출력
      isGroup: chat.is_group,
      user: chat.users.find(u => u.id !== userId) || chat.users[0],
      users: chat.users,                //유저 리스트도 같이 넘김 - J
      lastMessage: chat.last_message,
      isSeen: true,
      updatedAt: chat.updated_at,
    };
  });
}



// 메시지 목록 조회
export async function fetchMessages({ chatId }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("메시지 조회 실패");
  return await res.json();
}

// 메시지 전송
export async function sendMessage({ chatId, text, img }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text, img }),
  });
  if (!res.ok) throw new Error("메시지 전송 실패");
  return await res.json();
}

// 파일 업로드 (이미지 등)
// api.uploadMedia
export async function uploadMedia(file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/media/upload/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("파일 업로드 실패");
  const data = await res.json();
  // "uploads/xxx.jpg"만 반환
  let imgPath = data.url;
  if (imgPath.startsWith("http")) {
    imgPath = imgPath.split("/media/")[1];
  } else if (imgPath.startsWith("/media/")) {
    imgPath = imgPath.substring(7);
  }
  console.log("imgPath to save:", imgPath); // 반드시 uploads/xxx.jpg만!
  return imgPath;
}


// 차단/차단해제
export async function toggleBlock({ userId, targetId, block }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/users/${userId}/block/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ target_id: targetId, block }),
  });
  if (!res.ok) throw new Error("차단/차단해제 실패");
  return await res.json();
}

// 단체 채팅방 나가기 - J
export async function leaveGroupChat({ chatId }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/chats/leave/${chatId}/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("채팅방 나가기 실패");
}


// 유저 단일 정보 조회
export async function fetchUser({ userId }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/users/${userId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("유저 정보 조회 실패");
  return await res.json();
}

// 채팅 읽음 처리
export async function markChatAsSeen({ userId, chatId }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/chats/${chatId}/seen/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error("채팅 읽음 처리 실패");
  return await res.json();
}

// 날씨 정보 가져오기
export async function getWeather(city = 'Seoul') {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/weather/?city=${encodeURIComponent(city)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("날씨 정보 조회 실패");
  return await res.json();
}

// 네트워크 상태 확인
export const checkNetworkStatus = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_BASE}/network/check/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('네트워크 상태 확인 실패');
  }
  
  return response.json();
};
