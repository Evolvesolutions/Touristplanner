from django.urls import path
from .views import TouristRecommendationAPI
from .views import register_user, login_user
from . import views 


urlpatterns = [
    path('recommendations/', TouristRecommendationAPI.as_view(), name='tourist_recommendations'),
     
    path('register/', views.register_user,name='register_user'),
    path('login/', views.login_user,name='login_user'),

]
