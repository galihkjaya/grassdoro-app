import tkinter as tk
from prayer_times import PrayerSchedule

MIN_FONT_SIZE = 28

class TimerUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Focus Timer")
        self.root.geometry("380x420")
        self.root.minsize(260, 200)

        self.timer = None
        self.prayer_schedule = None

        self.setup_frame = tk.Frame(self.root)
        self.timer_frame = tk.Frame(self.root)
        self.setup_frame.pack(fill="both", expand=True)

        self.focus_entry = self._add_field("Focus (min)")
        self.break_entry = self._add_field("Break (min)")
        self.total_entry = self._add_field("Total (min)")

        self.music_enabled = tk.BooleanVar(value=True)
        tk.Checkbutton(self.setup_frame, text="Play music", variable=self.music_enabled).pack()

        self.prayer_enabled = tk.BooleanVar(value=False)
        tk.Checkbutton(
            self.setup_frame,
            text="Enable Prayer Reminder",
            variable=self.prayer_enabled,
            command=self.toggle_location
        ).pack(pady=4)

        self.location_frame = tk.Frame(self.setup_frame)

        tk.Label(self.location_frame, text="City").pack()
        self.location_entry = tk.Entry(self.location_frame)
        self.location_entry.pack()

        self.add_location_btn = tk.Button(
            self.location_frame,
            text="Add Location",
            command=self.load_prayer_times
        )
        self.add_location_btn.pack(pady=3)

        self.prayer_preview = tk.Label(
            self.location_frame,
            text="",
            fg="gray",
            justify="left"
        )
        self.prayer_preview.pack()

        self.location_status = tk.Label(self.location_frame, fg="red")
        self.location_status.pack()

        self.apply_button = tk.Button(self.setup_frame, text="Add / Apply")
        self.apply_button.pack(pady=6)

        self.start_button = tk.Button(
            self.setup_frame, text="Start", state="disabled", command=self.show_timer
        )
        self.start_button.pack()

        self.status_label = tk.Label(self.setup_frame, text="")
        self.status_label.pack()

        self.state_label = tk.Label(self.timer_frame, text="FOCUS")
        self.state_label.pack()

        self.time_label = tk.Label(
            self.timer_frame, text="00:00", font=("Arial", 40, "bold")
        )
        self.time_label.pack(expand=True)

        tk.Button(self.timer_frame, text="Minimize", command=self.root.iconify).pack(pady=5)

        self.root.bind("<Configure>", self.resize_text)

    def _add_field(self, label):
        tk.Label(self.setup_frame, text=label).pack()
        entry = tk.Entry(self.setup_frame)
        entry.pack()
        return entry

    def toggle_location(self):
        if self.prayer_enabled.get():
            self.location_frame.pack(pady=6)
        else:
            self.location_frame.pack_forget()
            self.prayer_schedule = None
            self.prayer_preview.config(text="")

    def load_prayer_times(self):
        city = self.location_entry.get().strip()

        if not city:
            self.location_status.config(text="Enter a city name")
            return

        try:
            self.prayer_schedule = PrayerSchedule(city)
            times = self.prayer_schedule.get_prayer_times()

            preview = "Today's Prayer Times:\n"
            names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]

            for name, t in zip(names, times):
                preview += f"{name}: {t.strftime('%H:%M')}\n"

            self.prayer_preview.config(text=preview)
            self.location_status.config(text="Location added ✔", fg="green")

        except Exception:
            self.location_status.config(text="Location not found", fg="red")
            self.prayer_preview.config(text="")
            self.prayer_schedule = None

    def resize_text(self, event):
        if self.timer_frame.winfo_ismapped():
            size = max(MIN_FONT_SIZE, int(event.width / 6))
            self.time_label.config(font=("Arial", size, "bold"))

    def show_timer(self):
        self.setup_frame.pack_forget()
        self.timer_frame.pack(fill="both", expand=True)

        if self.timer:
            self.root.after(100, lambda: self.timer.run(self.update))

    def attach_timer(self, timer):
        self.timer = timer
        self.start_button.config(state="normal")
        self.status_label.config(text="Time applied ✔")

    def update(self, label, seconds):
        minutes = seconds // 60
        seconds = seconds % 60
        self.state_label.config(text=label)
        self.time_label.config(text=f"{minutes:02d}:{seconds:02d}")
        self.root.update()

    def start(self):
        self.root.mainloop()