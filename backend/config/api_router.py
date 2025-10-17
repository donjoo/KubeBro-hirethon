from django.conf import settings
from django.urls import path, include
from rest_framework.routers import DefaultRouter, SimpleRouter
from rest_framework_simplejwt.views import TokenRefreshView

from hirethon_template.users.api.views import UserViewSet, register_view, login_view, logout_view
from hirethon_template.tickets.api.views import TicketViewSet, TicketCommentViewSet

if settings.DEBUG:
    router = DefaultRouter()
else:
    router = SimpleRouter()

router.register("users", UserViewSet)
router.register("tickets", TicketViewSet, basename="tickets")

# Nested router for ticket comments
tickets_router = DefaultRouter()
tickets_router.register(r"comments", TicketCommentViewSet, basename="ticket-comments")

app_name = "api"
urlpatterns = [
    path("auth/register/", register_view, name="register"),
    path("auth/login/", login_view, name="login"),
    path("auth/logout/", logout_view, name="logout"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("tickets/<int:ticket_pk>/", include(tickets_router.urls)),
] + router.urls
