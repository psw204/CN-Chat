from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics, viewsets
from rest_framework.decorators import action
from .models import User, Chat, Message
from .serializers import UserSerializer, ChatSerializer, MessageSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated           
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from rest_framework.generics import RetrieveAPIView

# 회원가입
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# 내 정보
class MeView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# 유저 검색
class UserSearchView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        username = request.query_params.get("username")
        if not username:
            return Response({"detail": "username required"}, status=400)
        try:
            user = User.objects.get(username=username)
            return Response(UserSerializer(user).data)
        except User.DoesNotExist:
            return Response({"detail": "not found"}, status=404)

# 유저 단일 정보
class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# 유저 온오프라인 상태 업데이트
from rest_framework import status
from rest_framework.response import Response
from django.utils import timezone
from .models import User
from rest_framework.decorators import api_view, permission_classes

# 함수형 뷰에 인증 적용
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_user_status(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    is_online = request.data.get('is_online')
    user.is_online = is_online
    user.last_activity = timezone.now()
    user.save()
    return Response(status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_online_users(request):
    online_users = User.objects.filter(is_online=True)
    serializer = UserSerializer(online_users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_status(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    serializer = UserSerializer(user)
    return Response(serializer.data)

# 클래스형 뷰는 하나로 통일하는 것이 좋음
class OnlineUserListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        online_users = User.objects.filter(is_online=True)
        serializer = UserSerializer(online_users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserStatusDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# 차단/차단해제
class BlockUserView(APIView):
    def post(self, request, pk):
        target_id = request.data.get("target_id")
        block = request.data.get("block")
        try:
            target = User.objects.get(pk=target_id)
        except User.DoesNotExist:
            return Response({"detail": "target not found"}, status=404)
        if block:
            request.user.blocked.add(target)
        else:
            request.user.blocked.remove(target)
        request.user.save()
        return Response({"blocked": [u.id for u in request.user.blocked.all()]})
    
# 단체 채팅방 나가기 - J   
class LeaveGroupChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, chat_id):
        user = request.user
        try:
            chat = Chat.objects.get(id=chat_id, is_group=True)
        except Chat.DoesNotExist:
            return Response({"detail": "채팅방이 존재하지 않습니다."}, status=status.HTTP_404_NOT_FOUND)
        chat.users.remove(user)
        
        # 시스템 메시지 DB에 저장
        Message.objects.create(
            chat=chat,
            sender=None,  # 시스템 메시지이므로 None 또는 시스템 유저
            text=f"{user.username}님이 채팅방을 나갔습니다.",
            type="system"
        )
        
        # 시스템 메시지 WebSocket 브로드캐스트
        channel_layer = get_channel_layer()
        print(f"채팅방 {chat_id}에서 {user.username}님이 나갔습니다.")  # 디버깅 - J
        async_to_sync(channel_layer.group_send)(
            f"chat_{chat_id}",
            {
                "type": "chat.message",
                "message": {
                    "type": "system",
                    "text": f"{user.username}님이 채팅방을 나갔습니다.",
                    "createdAt": timezone.now().isoformat(),
                }
            }
        )
        
        return Response({"detail": "채팅방에서 나갔습니다."}, status=status.HTTP_200_OK)

# 채팅방
class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSerializer
    queryset = Chat.objects.all()

    def get_queryset(self):                                             # 로그인된 user_id를 제공하는 함수 - J
        user_id = self.request.query_params.get("user_id")
        # print("user_id:", user_id) # 디버깅 - J
        if user_id:
            # for chat in Chat.objects.filter(users__id=user_id):
            #     print(f"id: {chat.id}, 이름: {chat.chat_room_name}, 단체방 여부: {chat.is_group}, 멤버: {[u.id for u in chat.users.all()]}") # 디버깅 - J
            return Chat.objects.filter(users__id=user_id)
        return Chat.objects.none()

    def create(self, request, *args, **kwargs):
        print("request.data:", request.data)
        
        user_ids = request.data.get("user_ids")
        chat_room_name = request.data.get("chat_room_name")
        
        # print("user_ids:", user_ids, type(user_ids)) # 디버깅 - J
        # print("chat_room_name:", chat_room_name)
        # print("len(user_ids):", len(user_ids))

        if not user_ids or not isinstance(user_ids, list):
            return Response({"detail": "user_ids(required: list) required"}, status=400)

        users = User.objects.filter(id__in=user_ids)
        if users.count() != len(user_ids):
            return Response({"detail": "일부 유저를 찾을 수 없습니다."}, status=404)

        #1:1 채팅방이면 chat_room_name을 자동으로 상대방 id로 지정 - J
        if len(user_ids) == 1:
            # print("1:1 채팅방 생성") # 디버깅 - J
            other_user = users.first()
            chat_room_name = str(other_user.id)
        #단체 채팅방일 때만 chat_room_name 필수 - J
        elif not chat_room_name:
            return Response({"detail": "chat_room_name(required) required"}, status=400)

        # 개인 챗방 중복 방지 - J
        if len(user_ids) == 1:
            chat = Chat.objects.filter(users=request.user).filter(users__id=user_ids[0]).distinct().first()
            if chat:
                # print("중복") # 디버깅 - J
                return Response(ChatSerializer(chat).data, status=200)
            chat = Chat.objects.create(chat_room_name=chat_room_name, is_group=False)
            chat.users.add(request.user, users.first())
        else:
            print("단체 채팅방 생성", chat_room_name) # 디버깅 - J
            chat = Chat.objects.create(chat_room_name=chat_room_name, is_group=True)
            if request.user.id not in user_ids:            # request.user가 user_ids에 없으면 추가 - J
                chat.users.add(request.user)
            chat.users.add(*users)

        chat.save()
        return Response(ChatSerializer(chat).data, status=201)

    @action(detail=True, methods=['post'])
    def seen(self, request, pk=None):
        return Response({"success": True})

# 메시지
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer

    def get_queryset(self):
        chat_id = self.kwargs.get("chat_id")
        # 메시지는 항상 오래된 순서대로 반환
        return Message.objects.filter(chat__id=chat_id).order_by("created_at")

    def create(self, request, *args, **kwargs):
        chat_id = self.kwargs.get("chat_id")
        chat = Chat.objects.get(pk=chat_id)
        msg = Message(
            chat=chat,
            sender=request.user,
            text=request.data.get("text", ""),
            img=request.data.get("img", None)
        )
        msg.save()
        return Response(MessageSerializer(msg).data, status=201)

# 이미지 업로드
class MediaUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "file required"}, status=400)
        from django.core.files.storage import default_storage
        path = default_storage.save('uploads/' + file.name, file)
        url = request.build_absolute_uri('/media/' + path)
        return Response({"url": url})

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
