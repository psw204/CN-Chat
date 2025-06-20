from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenRefreshView

from django.contrib import admin
from .views import (
    RegisterView, MeView, UserSearchView, UserDetailView, BlockUserView,
    ChatViewSet, MessageViewSet, MediaUploadView, CustomTokenObtainPairView, LeaveGroupChatView,
    OnlineUserListView,
    update_user_status,
    get_online_users,
    get_user_status,
    OnlineUserListView,
)
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from . import views



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
    path('chats/leave/<int:chat_id>/', LeaveGroupChatView.as_view(), name='leave_group_chat'),                 # 단체 채팅방 나가기
    path('users/online/', OnlineUserListView.as_view(), name='get-online-users'),
    path('users/<int:user_id>/status/', update_user_status, name='update-user-status'),
    path('users/online/', get_online_users, name='get-online-users'),
    path('users/<int:user_id>/status/detail/', get_user_status, name='get-user-status'),
]

# if settings.DEBUG:
#     urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

urlpatterns += router.urls
