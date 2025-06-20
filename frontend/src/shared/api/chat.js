import axios from 'axios';

<<<<<<< HEAD
const API_URL = `${window.location.protocol}//${window.location.hostname}:8000/api`;
=======
const API_URL = "http://localhost:8000/api";
>>>>>>> origin/Django

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
<<<<<<< HEAD
}; 
=======
};
>>>>>>> origin/Django
