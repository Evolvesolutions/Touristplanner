# Touristapp/serializers.py

from rest_framework import serializers
from .models import TouristAttraction

class TouristAttractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TouristAttraction
        fields = ['name', 'latitude', 'longitude', 'category', 'description', 'distance_from_route']
