from rest_framework import serializers
from .models import User, Chat, Message
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    blocked = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'password','blocked']
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    img_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender', 'text', 'img', 'img_url', 'created_at']

    def get_img_url(self, obj):
        if not obj.img:
            return None
        request = self.context.get('request')
        img_url = obj.img.url
        if request:
            return request.build_absolute_uri(img_url)
        return img_url



class ChatSerializer(serializers.ModelSerializer):
    users = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    class Meta:
        model = Chat
        fields = ['id', 'chat_room_name', 'is_group', 'users', 'updated_at', 'last_message'] # 단체 챗방 이름이랑 그룹 여부 추가
    
    def get_last_message(self, obj):
        last_msg = obj.message_set.order_by('-created_at').first()
        if last_msg:
            return {
                "text": last_msg.text,
                "sender": last_msg.sender.username,
                "created_at": last_msg.created_at.isoformat(),
            }
        return None

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.EMAIL_FIELD  # 'email'

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        user = authenticate(request=self.context.get('request'), email=email, password=password)
        if user is None or not user.is_active:
            raise serializers.ValidationError("No active account found with the given credentials")
        attrs['user'] = user
        return super().validate(attrs)