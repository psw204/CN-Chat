# CN-Chat — Technical Report (Docs)
본 문서는 CN-Chat 프로젝트의 **시스템 설계 및 네트워크 분석 보고서** 열람을 위한 docs 전용 README입니다.

- **Author:** 박상원  
- **Role:** Full-stack Developer  
- **Date:** 2025-06-20  

---

## Overview
실시간 채팅 웹 애플리케이션을 구현하며, 네트워크 핵심 개념(HTTP/REST, WebSocket, TCP/UDP, DNS/ICMP)을 **구현 + 패킷 캡처 분석**으로 정리했습니다.

- WebSocket 기반 실시간 양방향 통신
- DRF 기반 REST API
- JWT 인증/인가
- 이미지 업로드/전송
- 네트워크 진단(DNS query, ICMP ping)
- UDP 브로드캐스트 알림
- 외부 API(OpenWeatherMap) 연동

---

## Tech Stack (Summary)
- **Backend:** Django, DRF, Channels(WebSocket), JWT
- **Frontend:** React, Vite

---

## Technical Report Preview

<details>
  <summary><b>기술 보고서 전체 보기 (21 pages)</b></summary>

  ![기술 보고서 1페이지](images/technical-report_ParkSangwon_page-0001.jpg)
  ![기술 보고서 2페이지](images/technical-report_ParkSangwon_page-0002.jpg)
  ![기술 보고서 3페이지](images/technical-report_ParkSangwon_page-0003.jpg)
  ![기술 보고서 4페이지](images/technical-report_ParkSangwon_page-0004.jpg)
  ![기술 보고서 5페이지](images/technical-report_ParkSangwon_page-0005.jpg)
  ![기술 보고서 6페이지](images/technical-report_ParkSangwon_page-0006.jpg)
  ![기술 보고서 7페이지](images/technical-report_ParkSangwon_page-0007.jpg)
  ![기술 보고서 8페이지](images/technical-report_ParkSangwon_page-0008.jpg)
  ![기술 보고서 9페이지](images/technical-report_ParkSangwon_page-0009.jpg)
  ![기술 보고서 10페이지](images/technical-report_ParkSangwon_page-0010.jpg)
  ![기술 보고서 11페이지](images/technical-report_ParkSangwon_page-0011.jpg)
  ![기술 보고서 12페이지](images/technical-report_ParkSangwon_page-0012.jpg)
  ![기술 보고서 13페이지](images/technical-report_ParkSangwon_page-0013.jpg)
  ![기술 보고서 14페이지](images/technical-report_ParkSangwon_page-0014.jpg)
  ![기술 보고서 15페이지](images/technical-report_ParkSangwon_page-0015.jpg)
  ![기술 보고서 16페이지](images/technical-report_ParkSangwon_page-0016.jpg)
  ![기술 보고서 17페이지](images/technical-report_ParkSangwon_page-0017.jpg)
  ![기술 보고서 18페이지](images/technical-report_ParkSangwon_page-0018.jpg)
  ![기술 보고서 19페이지](images/technical-report_ParkSangwon_page-0019.jpg)
  ![기술 보고서 20페이지](images/technical-report_ParkSangwon_page-0020.jpg)
  ![기술 보고서 21페이지](images/technical-report_ParkSangwon_page-0021.jpg)

</details>

---

## Notes (Security)
- 데모 환경 기준이며 운영 환경에서는 **HTTPS/WSS 적용**, **환경변수(.env) 분리**, **시크릿/토큰 비노출** 등의 보안 강화가 필요합니다.

---

## License
This project is for educational and portfolio purposes.
