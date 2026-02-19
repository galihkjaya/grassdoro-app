import time

class PomodoroTimer:
    def __init__(self, focus_min, break_min, total_min):
        self.focus_seconds = focus_min * 60
        self.break_seconds = break_min * 60
        self.total_seconds = total_min * 60
        self.elapsed = 0
        self.session = 1

    def format_time(self, seconds):
        minutes = seconds // 60
        seconds = seconds % 60
        return f"{minutes:02d}:{seconds:02d}"

    def countdown(self, seconds, label, callback=None):
        while seconds > 0:
            if callback:
                callback(label, seconds)
            else:
                print(f"{label} | {self.format_time(seconds)}", end="\r")

            time.sleep(1)
            seconds -= 1

        print()

    def run(self, callback=None):
        while self.elapsed < self.total_seconds:

            remaining = self.total_seconds - self.elapsed
            focus_time = min(self.focus_seconds, remaining)

            self.countdown(focus_time, "FOCUS", callback)
            self.elapsed += focus_time

            if self.elapsed >= self.total_seconds:
                break

            remaining = self.total_seconds - self.elapsed
            break_time = min(self.break_seconds, remaining)

            self.countdown(break_time, "BREAK", callback)
            self.elapsed += break_time

            self.session += 1