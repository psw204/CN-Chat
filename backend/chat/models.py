from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    blocked = models.ManyToManyField('self', symmetrical=False, blank=True)
    email = models.EmailField(unique=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    is_online = models.BooleanField(default=False) # 온/오프라인 필드 추가
    
class Chat(models.Model):
    users = models.ManyToManyField(User)
    updated_at = models.DateTimeField(auto_now=True)
    chat_room_name = models.CharField(max_length=100, blank=True, null=True)    # 채팅방 이름 - J
    is_group = models.BooleanField(default=False)                               # 단체 채팅 여부 - J

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # 시스템 메시지용
    text = models.TextField(blank=True)
    img = models.ImageField(upload_to='messages/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=20, default="message")  # type 필드 추가, 관리자 전용으로 쓰이고 일반 메세지에서는 별 신경 안써도 됨- J
