from django.db import models

class RouteQuery(models.Model):
    start_city = models.CharField(max_length=100)
    end_city = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    route_geometry_json = models.TextField(blank=True, null=True)  # <-- new field

    class Meta:
        unique_together = ('start_city', 'end_city')

    def __str__(self):
        return f"{self.start_city} → {self.end_city}"

class TouristAttraction(models.Model):
    route = models.ForeignKey(RouteQuery, on_delete=models.CASCADE, related_name='attractions', null=True, blank=True)
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    distance_from_route = models.FloatField(default=0.0)

    def __str__(self):
        return self.name


