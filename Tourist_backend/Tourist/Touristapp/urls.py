from django.urls import path
from .views import TouristRecommendationAPI

urlpatterns = [
    path('recommendations/', TouristRecommendationAPI.as_view(), name='tourist_recommendations'),
]
