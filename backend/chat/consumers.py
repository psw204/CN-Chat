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