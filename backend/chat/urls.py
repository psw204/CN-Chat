from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, MeView, UserSearchView, UserDetailView, BlockUserView,
    ChatViewSet, MessageViewSet, MediaUploadView, CustomTokenObtainPairView, LeaveGroupChatView
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('chats', ChatViewSet, basename='chat')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/', RegisterView.as_view(), name='register'),
    path('users/me/', MeView.as_view(), name='me'),
    path('users/search/', UserSearchView.as_view(), name='user_search'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('users/<int:pk>/block/', BlockUserView.as_view(), name='block_user'),
    path('media/upload/', MediaUploadView.as_view(), name='media_upload'),
    path('chats/<int:chat_id>/messages/', MessageViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('chats/<int:pk>/seen/', ChatViewSet.as_view({'post': 'seen'})),
    path('chats/leave/<int:chat_id>/', LeaveGroupChatView.as_view(), name='leave_group_chat')                   # 단체 채팅방 나가기
]

urlpatterns += router.urls
