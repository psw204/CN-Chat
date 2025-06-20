from channels.generic.websocket import AsyncWebsocketConsumer
import json
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f'chat_{self.chat_id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': text_data,
            }
        )

    async def chat_message(self, event):
        message = event["message"]
        print(f"백 메세지: {message}") 
        if isinstance(message, dict):
            await self.send(text_data=json.dumps(message))
        else:
            await self.send(text_data=message)


class StatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        if user.is_anonymous:
            await self.close()
            return
        # 그룹 추가 (예: status_group)
        await self.channel_layer.group_add("status_group", user.id)
        # 연결 성공 메시지
        await self.send(text_data=json.dumps({
            "type": "welcome_message",
            "message": "웹소켓 연결 성공!"
        }))
        await self.accept()
        # 온라인 상태로 업데이트
        await self.update_user_status(user, True)

    async def disconnect(self, close_code):
        user = self.scope['user']
        if not hasattr(user, "id") or user.is_anonymous:
            return
        # 그룹에서 제거
        await self.channel_layer.group_discard("status_group", user.id)
        # 오프라인 상태로 업데이트
        await self.update_user_status(user, False)

    async def update_user_status(self, user, is_online):
        await self._update_user_status_db(user, is_online)
        # 상태 변경 메시지 전송
        await self.channel_layer.group_send(
            "status_group",
            {
                "type": "user.status",
                "user_id": user.id,
                "is_online": is_online,
            }
        )

    @database_sync_to_async
    def _update_user_status_db(self, user, is_online):
        from .models import User
        User.objects.filter(id=user.id).update(is_online=is_online)

    async def user_status(self, event):
        # 상태 변경 메시지 전송
        await self.send(text_data=json.dumps({
            "type": "user_status",
            "user_id": event["user_id"],
            "is_online": event["is_online"],
        }))

# class StatusConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         user = self.scope['user']
#         if user.is_anonymous:
#             print("[StatusConsumer] 익명 사용자 연결 거부")
#             await self.close()
#             return
#         print(f"[StatusConsumer] User {user.id}({user.username}) 온라인")
#         # 개인 그룹(차단/언차단 처리용)과 전체 그룹(상태 공유용)에 모두 추가
#         await self.channel_layer.group_add(f"status_{user.id}", self.channel_name)
#         await self.channel_layer.group_add("status_group", self.channel_name)
#         # 온라인 상태 업데이트
#         await self.update_user_status(user, True)
#         await self.accept()

#     async def disconnect(self, close_code):
#         user = self.scope['user']
#         if not hasattr(user, "id") or user.is_anonymous:
#             return
#         print(f"[StatusConsumer] User {user.id}({user.username}) 오프라인")
#         # 오프라인 상태 업데이트
#         await self.update_user_status(user, False)
#         # 그룹에서 제거
#         await self.channel_layer.group_discard(f"status_{user.id}", self.channel_name)
#         await self.channel_layer.group_discard("status_group", self.channel_name)

#     async def update_user_status(self, user, status):
#         await self._update_user_status_db(user, status)
#         await self.notify_status_change(user.id, status)

#     @database_sync_to_async
#     def _update_user_status_db(self, user, status):
#         from .models import User
#         User.objects.filter(id=user.id).update(is_online=status)
#         print(f"[StatusConsumer] DB에 User {user.id}({user.username}) 상태: {'온라인' if status else '오프라인'}")

#     @database_sync_to_async
#     def get_blocked_users(self, user_id):
#         from .models import User
#         # user_id를 차단한 사용자 목록 반환
#         return list(User.objects.filter(blocked=user_id).values_list('id', flat=True))

#     async def notify_status_change(self, user_id, is_online):
#         print(f"[StatusConsumer] User {user_id} 상태 변경: {'온라인' if is_online else '오프라인'}")
#         # user_id를 차단한 사용자 목록 조회
#         blocked_users = await self.get_blocked_users(user_id)
#         # 차단한 사용자에게는 항상 오프라인으로 보냄
#         for blocker_id in blocked_users:
#             print(f"[StatusConsumer] User {user_id}는 User {blocker_id}에게 차단됨(오프라인 전송)")
#             await self.channel_layer.group_send(
#                 f"status_{blocker_id}",
#                 {
#                     "type": "user.status",
#                     "user_id": user_id,
#                     "is_online": False,  # 차단한 사용자에게는 항상 오프라인
#                 }
#             )
#         # 그 외 사용자에게는 실제 온라인 상태를 보냄
#         await self.channel_layer.group_send(
#             "status_group",
#             {
#                 "type": "user.status",
#                 "user_id": user_id,
#                 "is_online": is_online,
#             }
#         )

#     async def user_status(self, event):
#         print(f"[StatusConsumer] User {event['user_id']}의 상태를 클라이언트에 전송: {'온라인' if event['is_online'] else '오프라인'}")
#         await self.send(text_data=json.dumps({
#             "type": "user_status",
#             "user_id": event["user_id"],
#             "is_online": event["is_online"],
#         }))




# class StatusConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         user = self.scope['user']
#         if user.is_anonymous:
#             await self.close()
#             return
#         # 그룹 추가 (예: status_group)
#         await self.channel_layer.group_add("status_group", self.channel_name)
#         print(f"[StatusConsumer] User {user.id} connected, sending welcome message")
#         await self.send(text_data=json.dumps({
#             "type": "welcome_message",
#             "message": "웹소켓 연결 성공!"
#         }))
#         # 온라인 상태 업데이트
#         await self.update_user_status(user, True)
#         await self.accept()

#     async def disconnect(self, close_code):
#         user = self.scope['user']
#         if not hasattr(user, "id") or user.is_anonymous:
#             return
#         # 오프라인 상태 업데이트
#         await self.update_user_status(user, False)
#         await self.channel_layer.group_discard("status_group", self.channel_name)
#         # 상태 변경 시 프론트엔드로 메시지 보내기
#         await self.send(text_data=json.dumps({
#             "type": "user_status",
#             "user_id": event["user_id"],
#             "is_online": event["is_online"],
#         }))

#     async def user_status(self, event):
#         # 상태 변경 로그 출력
#         print(f"[StatusConsumer] Sending status update: user_id={event['user_id']}, is_online={event['is_online']}")
#         await self.send(text_data=json.dumps({
#             "type": "user_status",
#             "user_id": event["user_id"],
#             "is_online": event["is_online"],
#         }))

#     @database_sync_to_async
#     def update_user_status(self, user, status):
#         from .models import User
#         User.objects.filter(id=user.id).update(is_online=status)
#         print(f"[StatusConsumer] DB에 User {user.id}({user.username}) 상태: {'온라인' if status else '오프라인'}")