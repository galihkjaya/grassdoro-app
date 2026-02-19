import time

class PomodoroTimer:
    def __init__(self, focus_min, break_min, total_min):
        self.focus_seconds = focus_min * 60
        self.break_seconds = break_min * 60
        self.total_seconds = total_min * 60
        self.elapsed = 0
        self.running = False

    def run(self, callback):
        self.running = True
        self.elapsed = 0

        while self.elapsed < self.total_seconds and self.running:

            focus_time = min(self.focus_seconds, self.total_seconds - self.elapsed)
            self.countdown(focus_time, "FOCUS", callback)
            self.elapsed += focus_time

            if self.elapsed >= self.total_seconds or not self.running:
                break

            break_time = min(self.break_seconds, self.total_seconds - self.elapsed)
            self.countdown(break_time, "BREAK", callback)
            self.elapsed += break_time

    def countdown(self, seconds, label, callback):
        while seconds > 0 and self.running:
            callback(label, seconds)
            time.sleep(1)
            seconds -= 1

    def stop(self):
        self.running = False