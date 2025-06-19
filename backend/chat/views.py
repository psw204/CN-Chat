from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics, viewsets
from rest_framework.decorators import action
from .models import User, Chat, Message
from .serializers import UserSerializer, ChatSerializer, MessageSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

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

# 채팅방
class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSerializer
    queryset = Chat.objects.all()

    def get_queryset(self):
        user_id = self.request.query_params.get("user_id")
        if user_id:
            return Chat.objects.filter(users__id=user_id)
        return Chat.objects.none()

    def create(self, request, *args, **kwargs):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"detail": "user_id required"}, status=400)
        user1 = request.user
        try:
            user2 = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "user not found"}, status=404)
        # 중복 채팅방 방지
        chat = Chat.objects.filter(users=user1).filter(users=user2).first()
        if chat:
            return Response(ChatSerializer(chat).data, status=200)
        chat = Chat.objects.create()
        chat.users.add(user1, user2)
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
            img=request.data.get("img", None),
            file=request.data.get("file", None),
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

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
