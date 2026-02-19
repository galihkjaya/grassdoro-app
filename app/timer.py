import time
from lockscreen import LockScreen
from music_player import MusicPlayer

class PomodoroTimer:
    def __init__(self, focus_min, break_min, total_min, music_enabled=True):
        self.focus_seconds = focus_min * 60
        self.break_seconds = break_min * 60
        self.total_seconds = total_min * 60
        self.elapsed = 0
        self.running = False
        self.music_enabled = music_enabled

        self.music = MusicPlayer("assets/lofi")
        self.alarm_path = "assets/alarm.wav"

    def run(self, callback):
        self.running = True
        self.elapsed = 0

        while self.elapsed < self.total_seconds and self.running:

            # 🎧 Start focus music (optional)
            if self.music_enabled:
                self.music.play_random()

            focus_time = min(self.focus_seconds, self.total_seconds - self.elapsed)
            self.countdown(focus_time, "FOCUS", callback)
            self.elapsed += focus_time

            # ⏹ Stop music + ⏰ alarm (optional music stop)
            if self.music_enabled:
                self.music.stop()

            self.music.play_alarm(self.alarm_path)

            if self.elapsed >= self.total_seconds or not self.running:
                break

            # 🔒 Break lock
            LockScreen(self.break_seconds).show()
            self.elapsed += self.break_seconds

        # 🎉 Final celebration alarm
        self.music.play_alarm(self.alarm_path)
        LockScreen(5, message="Great job! 🎉 Stay consistent!").show()

    def countdown(self, seconds, label, callback):
        while seconds > 0 and self.running:
            callback(label, seconds)
            time.sleep(1)
            seconds -= 1

    def stop(self):
        self.running = False