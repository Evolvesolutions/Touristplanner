# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from geopy.geocoders import Nominatim
import requests
import math
import json
from django.utils.timezone import now
from datetime import timedelta
from .models import RouteQuery, TouristAttraction
from .serializers import TouristAttractionSerializer

class TouristRecommendationAPI(APIView):

    def post(self, request):
        start_city = request.data.get('start_city', '').strip()
        end_city = request.data.get('end_city', '').strip()

        if not start_city or not end_city:
            return Response({"error": "Both start and end cities are required."}, status=400)

        # Check cache
        try:
            route = RouteQuery.objects.get(start_city=start_city, end_city=end_city)
            if now() - route.created_at < timedelta(days=7):
                attractions = route.attractions.all()
                serialized = TouristAttractionSerializer(attractions, many=True).data
                return Response({
                    "from": start_city,
                    "to": end_city,
                    "tourist_places": serialized,
                    "cached": True,
                    "highlighted": [a.name for a in attractions[:5]],  # optional: top 5
                    "route_geometry": json.loads(route.route_geometry_json or "[]")  # 🔥 loaded from cache
                })
            else:
                route.delete()
        except RouteQuery.DoesNotExist:
            pass

        try:
            geolocator = Nominatim(user_agent="TouristApp/1.0")
            start_location = geolocator.geocode(start_city)
            end_location = geolocator.geocode(end_city)

            if not start_location or not end_location:
                return Response({"error": "Could not geocode one or both cities."}, status=400)

            start_coords = (start_location.latitude, start_location.longitude)
            end_coords = (end_location.latitude, end_location.longitude)

            # Fetch route from OSRM
            osrm_url = f"http://router.project-osrm.org/route/v1/driving/{start_coords[1]},{start_coords[0]};{end_coords[1]},{end_coords[0]}?overview=full&geometries=geojson"
            osrm_response = requests.get(osrm_url)
            route_data = osrm_response.json()
            route_coords = route_data['routes'][0]['geometry']['coordinates']  # list of [lon, lat]

            # Overpass query
            overpass_query = f"""
            [out:json][timeout:25];
            (
            // Cultural & man-made
            node["tourism"~"museum|attraction|viewpoint|theme_park|zoo|artwork|gallery"](around:30000,{start_coords[0]},{start_coords[1]});
            node["historic"~"monument|memorial|castle|fort|ruins"](around:30000,{end_coords[0]},{end_coords[1]});
            node["amenity"~"fountain|theatre"](around:30000,{(start_coords[0] + end_coords[0]) / 2},{(start_coords[1] + end_coords[1]) / 2});

            // Natural and leisure
            node["leisure"~"park|garden|nature_reserve"](around:30000,{(start_coords[0] + end_coords[0]) / 2},{(start_coords[1] + end_coords[1]) / 2});
            node["natural"~"waterfall|beach|cliff|spring|cave_entrance|volcano"](around:30000,{(start_coords[0] + end_coords[0]) / 2},{(start_coords[1] + end_coords[1]) / 2});
            node["water"~"lake|river"](around:30000,{(start_coords[0] + end_coords[0]) / 2},{(start_coords[1] + end_coords[1]) / 2});
            node["place"="island"](around:30000,{(start_coords[0] + end_coords[0]) / 2},{(start_coords[1] + end_coords[1]) / 2});
            );
            out body;
            """

            overpass_response = requests.post("http://overpass-api.de/api/interpreter", data=overpass_query)
            elements = overpass_response.json().get('elements', [])

            def haversine(lat1, lon1, lat2, lon2):
                R = 6371
                dlat = math.radians(lat2 - lat1)
                dlon = math.radians(lon2 - lon1)
                a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                return R * c

            def closest_distance_to_route(lat, lon, route):
                return min(haversine(lat, lon, pt[1], pt[0]) for pt in route)

            # Filter tourist places
            places = []
            for el in elements:
                name = el.get('tags', {}).get('name')
                if name and 'lat' in el and 'lon' in el:
                    distance = closest_distance_to_route(el['lat'], el['lon'], route_coords)
                    if distance <= 5.0:
                        places.append({
                            "name": name,
                            "latitude": el['lat'],
                            "longitude": el['lon'],
                            "type": el.get('tags', {}).get('tourism') or el.get('tags', {}).get('historic') or 'other',
                            "distance_km": round(distance, 2)
                        })

            if not places:
                return Response({"message": "No tourist places found within 1km of route."}, status=200)

            # Top 5 using LLM
            top_places = places[:5]

            # DeepInfra API for descriptions
            deepinfra_api_key = "Lfvt18aAcrC2h6arBb6J5daTBTnFdFp5"
            deepinfra_url = "https://api.deepinfra.com/v1/openai/chat/completions"
            headers = {
                "Authorization": f"Bearer {deepinfra_api_key}",
                "Content-Type": "application/json"
            }

            for place in top_places:
                prompt = f"Describe the tourist attraction {place['name']} in India in 2-3 lines for travelers."
                payload = {
                    "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 100
                }
                response = requests.post(deepinfra_url, headers=headers, json=payload)
                data = response.json()
                place['description'] = data['choices'][0]['message']['content'].strip()

            for place in places:
                if 'description' not in place:
                    place['description'] = ""

            # Save route and attractions
            route = RouteQuery.objects.create(
                start_city=start_city,
                end_city=end_city,
                route_geometry_json=json.dumps(route_coords)  # 🔥 save polyline to DB
            )
            for place in places:
                TouristAttraction.objects.create(
                    route=route,
                    name=place['name'],
                    latitude=place['latitude'],
                    longitude=place['longitude'],
                    category=place['type'],
                    description=place['description'],
                    distance_from_route=place['distance_km']
                )

            serialized = TouristAttractionSerializer(route.attractions.all(), many=True).data
            return Response({
                "from": start_city,
                "to": end_city,
                "tourist_places": serialized,
                "highlighted": [p['name'] for p in top_places],
                "route_geometry": route_coords,  # 🔥 send polyline to frontend
                "cached": False
            })

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
