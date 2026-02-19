from praytimes import PrayTimes
from geopy.geocoders import Nominatim
import datetime

class PrayerSchedule:
    def __init__(self, location_name):
        self.location_name = location_name
        self.latitude = None
        self.longitude = None
        self.prayer_times = []

        self.get_coordinates()
        self.calculate_prayer_times()

    def get_coordinates(self):
        geolocator = Nominatim(user_agent="pomodoro_prayer_app")
        location = geolocator.geocode(self.location_name)

        if not location:
            raise ValueError("Location not found.")

        self.latitude = location.latitude
        self.longitude = location.longitude

    def calculate_prayer_times(self):
        pt = PrayTimes()
        today = datetime.date.today()

        times = pt.getTimes(
            today,
            (self.latitude, self.longitude),
            datetime.datetime.now().astimezone().utcoffset().total_seconds() / 3600
        )

        self.prayer_times = []

        for name in ["fajr", "dhuhr", "asr", "maghrib", "isha"]:
            hour, minute = map(int, times[name].split(":"))
            dt = datetime.datetime.combine(today, datetime.time(hour, minute))
            self.prayer_times.append(dt)

    def get_prayer_times(self):
        return self.prayer_times
