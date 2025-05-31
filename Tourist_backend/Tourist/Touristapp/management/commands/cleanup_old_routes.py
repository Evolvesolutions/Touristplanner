# Touristapp/management/commands/cleanup_old_routes.py

from django.core.management.base import BaseCommand
from Touristapp.models import RouteQuery
from django.utils.timezone import now
from datetime import timedelta

class Command(BaseCommand):
    help = 'Deletes RouteQueries older than 7 days'

    def handle(self, *args, **kwargs):
        cutoff = now() - timedelta(days=7)
        old_routes = RouteQuery.objects.filter(created_at__lt=cutoff)
        count = old_routes.count()
        old_routes.delete()
        self.stdout.write(f"Deleted {count} old routes")
