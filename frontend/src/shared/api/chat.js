import axios from 'axios';

const API_URL = "http://localhost:8000/api";

export const sendUdpNotification = async (message) => {
  try {
    const response = await axios.post(`${API_URL}/chat/send-udp-notification/`, {
      message
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('UDP 알림 전송 오류:', error);
    throw error;
  }
};