import React, { useState } from 'react';
import { toast } from 'react-toastify';
import * as api from '../../shared/api';

const NetworkStatus = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkNetworkStatus = async () => {
    setIsChecking(true);
    try {
      const response = await api.checkNetworkStatus();
      toast.success('네트워크 상태 확인 완료!');
      console.log('네트워크 상태:', response);
    } catch (error) {
      toast.error('네트워크 상태 확인 실패');
      console.error('네트워크 상태 확인 오류:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="network-status">
      <button 
        onClick={checkNetworkStatus}
        disabled={isChecking}
        className="network-check-btn"
      >
        {isChecking ? '확인 중...' : '네트워크 상태 확인'}
      </button>
    </div>
  );
};

export default NetworkStatus; 