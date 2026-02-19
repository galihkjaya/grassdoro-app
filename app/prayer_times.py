import requests
import json
import os
import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, ".prayer_cache")
CACHE_FILE = os.path.join(CACHE_DIR, "prayer_times.json")

class PrayerSchedule:
    def __init__(self, location_name):
        self.location_name = location_name
        self.city_id = None
        self.prayer_times = []
        
        # Create cache directory if not exists
        os.makedirs(CACHE_DIR, exist_ok=True)
        
        # Hybrid approach: try API first, fallback to cache
        try:
            self.fetch_from_api()
        except Exception as e:
            print(f"API Error ({str(e)}). Trying cache...")
            self.load_from_cache()
    
    def fetch_from_api(self):
        """Fetch prayer times from adzan-api"""
        api_base = "https://adzan-indonesia-api.vercel.app"
        
        # Step 1: Get all cities and find matching city
        print(f"Searching for city: {self.location_name}")
        cities_response = requests.get(f"{api_base}/city", timeout=10)
        cities_response.raise_for_status()
        cities_data = cities_response.json()
        
        # API returns {statusCode, data}
        if "data" not in cities_data:
            raise ValueError("Invalid API response format for /city endpoint")
        
        cities = cities_data["data"]
        
        # Find city by name (case-insensitive)
        # Note: API uses "city" field, not "name"
        city_match = None
        for city in cities:
            if city.get("city", "").lower() == self.location_name.lower():
                city_match = city
                break
        
        if not city_match:
            # Generate helpful error message with similar cities
            similar = [c for c in cities if self.location_name.lower() in c['city'].lower() or c['city'].lower() in self.location_name.lower()]
            if similar:
                suggestion = ", ".join([c['city'] for c in similar[:5]])
                raise ValueError(f"City '{self.location_name}' not found. Did you mean: {suggestion}?")
            else:
                # Show a few available cities as example
                examples = ", ".join([c['city'] for c in cities[::50]])  # Every 50th
                raise ValueError(f"City '{self.location_name}' not found in database. Available cities include: {examples}")
        
        self.city_id = city_match["id"]
        
        # Step 2: Get prayer times for today
        today = datetime.date.today()
        print(f"Fetching prayer times for {self.location_name} on {today}")
        
        adzan_response = requests.get(
            f"{api_base}/adzan",
            params={
                "cityId": self.city_id,
                "month": today.month,
                "year": today.year,
                "date": today.day
            },
            timeout=10
        )
        adzan_response.raise_for_status()
        adzan_data = adzan_response.json()
        
        # Parse prayer times
        self.prayer_times = self._parse_prayer_times(adzan_data, today)
        
        # Cache the result
        self.save_to_cache()
    
    def _parse_prayer_times(self, data, date):
        """Parse API response and convert to datetime objects"""
        prayer_times = []
        
        # API uses different prayer names
        prayer_mapping = {
            "shubuh": "Fajr",
            "dzuhur": "Dhuhr", 
            "ashr": "Asr",
            "maghrib": "Maghrib",
            "isya": "Isha"
        }
        
        # Navigate nested response: data["data"]["data"]["adzan"]
        try:
            if not isinstance(data, dict):
                raise ValueError("Response is not a dictionary")
            
            if "data" not in data:
                raise ValueError("Missing 'data' key in response")
            
            outer_data = data["data"]
            if not isinstance(outer_data, dict):
                raise ValueError("data['data'] is not a dictionary")
            
            if "data" not in outer_data:
                raise ValueError("Missing nested 'data' in response")
            
            inner_data = outer_data["data"]
            if not isinstance(inner_data, dict):
                raise ValueError("data['data']['data'] is not a dictionary")
            
            if "adzan" not in inner_data:
                raise ValueError("Missing 'adzan' in response")
            
            adzan = inner_data["adzan"]
            
            # Extract prayer times in order
            for api_name, display_name in prayer_mapping.items():
                if api_name not in adzan:
                    raise ValueError(f"Missing prayer time: {api_name}")
                
                time_str = adzan[api_name]
                # Parse time format "HH:MM"
                hour, minute = map(int, time_str.split(":"))
                dt = datetime.datetime.combine(date, datetime.time(hour, minute))
                prayer_times.append(dt)
            
            if len(prayer_times) != 5:
                raise ValueError(f"Expected 5 prayer times, got {len(prayer_times)}")
            
            return prayer_times
            
        except (KeyError, ValueError, TypeError, AttributeError) as e:
            raise ValueError(f"Failed to parse prayer times: {str(e)}")
    
    def save_to_cache(self):
        """Save prayer times to local cache file"""
        cache_data = {
            "location": self.location_name,
            "city_id": self.city_id,
            "date": datetime.date.today().isoformat(),
            "prayer_times": [t.isoformat() for t in self.prayer_times]
        }
        
        with open(CACHE_FILE, "w") as f:
            json.dump(cache_data, f)
        print(f"Cached prayer times for {self.location_name}")
    
    def load_from_cache(self):
        """Load prayer times from cache file"""
        if not os.path.exists(CACHE_FILE):
            raise ValueError(f"No cache found and API unavailable for {self.location_name}")
        
        try:
            with open(CACHE_FILE, "r") as f:
                cache_data = json.load(f)
            
            # Check if cache is for today
            cache_date = datetime.date.fromisoformat(cache_data["date"])
            today = datetime.date.today()
            
            if cache_data["location"].lower() != self.location_name.lower():
                raise ValueError(f"Cache is for {cache_data['location']}, not {self.location_name}")
            
            if cache_date != today:
                raise ValueError(f"Cache is from {cache_date}, not today ({today})")
            
            # Parse cached prayer times
            self.prayer_times = [
                datetime.datetime.fromisoformat(t) 
                for t in cache_data["prayer_times"]
            ]
            self.city_id = cache_data["city_id"]
            print(f"Loaded prayer times for {self.location_name} from cache")
            
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            raise ValueError(f"Invalid cache: {str(e)}")
    
    def get_prayer_times(self):
        return self.prayer_times
