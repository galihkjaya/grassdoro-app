import time
import datetime
from lockscreen import LockScreen
from music_player import MusicPlayer
from prayer_times import PrayerSchedule

class PomodoroTimer:
    def __init__(self, focus_min, break_min, total_min,
                 music_enabled=True,
                 prayer_schedule=None):

        self.focus_seconds = focus_min * 60
        self.break_seconds = break_min * 60
        self.total_seconds = total_min * 60
        self.elapsed = 0
        self.running = False

        self.music_enabled = music_enabled
        self.prayer_schedule = prayer_schedule
        self.prayer_times = prayer_schedule.get_prayer_times() if prayer_schedule else []

        self.music = MusicPlayer("assets/lofi")
        self.alarm_path = "assets/alarm.wav"

        self.prayer_times = self.generate_prayer_times()
        self.triggered_prayers = set()

    # Simple placeholder (can replace with real calculation later)
    def generate_prayer_times(self):
        if not self.prayer_schedule:
            return []

        now = datetime.datetime.now()

        return [
            now.replace(hour=5, minute=0, second=0),
            now.replace(hour=12, minute=0, second=0),
            now.replace(hour=15, minute=0, second=0),
            now.replace(hour=18, minute=0, second=0),
            now.replace(hour=19, minute=30, second=0)
        ]

    def check_prayer_time(self):
        if not self.prayer_schedule:
            return

        now = datetime.datetime.now()

        for t in self.prayer_times:
            if t not in self.triggered_prayers:
                if abs((now - t).total_seconds()) < 1:
                    self.triggered_prayers.add(t)
                    LockScreen(600, message="It's prayer time 🕌").show()

    def run(self, callback):
        self.running = True
        self.elapsed = 0

        while self.elapsed < self.total_seconds and self.running:

            if self.music_enabled:
                self.music.play_random()

            focus_time = min(self.focus_seconds, self.total_seconds - self.elapsed)
            self.countdown(focus_time, "FOCUS", callback)
            self.elapsed += focus_time

            if self.music_enabled:
                self.music.stop()

            self.music.play_alarm(self.alarm_path)

            if self.elapsed >= self.total_seconds or not self.running:
                break

            LockScreen(self.break_seconds).show()
            self.elapsed += self.break_seconds

        self.music.play_alarm(self.alarm_path)
        LockScreen(5, message="Great job! 🎉 Stay consistent!").show()

    def countdown(self, seconds, label, callback):
        while seconds > 0 and self.running:
            self.check_prayer_time()
            callback(label, seconds)
            time.sleep(1)
            seconds -= 1

    def stop(self):
        self.running = False
