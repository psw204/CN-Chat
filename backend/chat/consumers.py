from channels.generic.websocket import AsyncWebsocketConsumer
import json
from channels.db import database_sync_to_async


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
        self.user = self.scope['user']
        await self.channel_layer.group_add(f"status_{self.user.id}", self.channel_name)
        await self.update_user_status(self.user, True)
        await self.accept()

    async def disconnect(self, close_code):
        await self.update_user_status(self.user, False)
        await self.channel_layer.group_discard(f"status_{self.user.id}", self.channel_name)

    async def update_user_status(self, user, status):
        await self._update_user_status_db(user, status)
        await self.notify_status_change(user.id, status)

    @database_sync_to_async
    def _update_user_status_db(self, user, status):
        from .models import User
        User.objects.filter(id=user.id).update(is_online=status)

    @database_sync_to_async
    def get_blocked_users(self, user_id):
        from .models import User
        # user_id를 차단한 사용자 목록 반환
        return list(User.objects.filter(blocked=user_id).values_list('id', flat=True))

    async def notify_status_change(self, user_id, is_online):
        # 온오프라인 로그
        print(f"[StatusConsumer] User {user_id} status changed to {'online' if is_online else 'offline'}")
        # user_id를 차단한 사용자 목록 조회
        blocked_users = await self.get_blocked_users(user_id)
        # 차단한 사용자에게는 항상 오프라인으로 보냄
        for blocker_id in blocked_users:
            # 온오프라인 로그
            print(f"[StatusConsumer] User {user_id} is blocked by {blocker_id}, sending offline status")
            await self.channel_layer.group_send(
                f"status_{blocker_id}",
                {
                    "type": "user.status",
                    "user_id": user_id,
                    "is_online": False,  # 차단한 사용자에게는 항상 오프라인
                }
            )
        # 그 외 사용자에게는 실제 온라인 상태를 보냄
        await self.channel_layer.group_send(
            "status_group",
            {
                "type": "user.status",
                "user_id": user_id,
                "is_online": is_online,
            }
        )

    async def user_status(self, event):
        # 로그
        print(f"[StatusConsumer] Sending status to client: user_id={event['user_id']}, is_online={event['is_online']}")
        await self.send(text_data=json.dumps({
            "type": "user_status",
            "user_id": event["user_id"],
            "is_online": event["is_online"],
        }))