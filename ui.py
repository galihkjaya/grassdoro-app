import tkinter as tk

MIN_FONT_SIZE = 28
MIN_WIDTH = 220
MIN_HEIGHT = 150

class TimerUI:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Focus Timer")
        self.root.geometry("360x300")

        # prevent shrinking too small
        self.root.minsize(MIN_WIDTH, MIN_HEIGHT)

        self.timer = None

        self.setup_frame = tk.Frame(self.root)
        self.timer_frame = tk.Frame(self.root)

        self.setup_frame.pack(fill="both", expand=True)

        # -------- Setup Page --------

        tk.Label(self.setup_frame, text="Focus (min)").pack()
        self.focus_entry = tk.Entry(self.setup_frame)
        self.focus_entry.pack()
        self.focus_entry.focus()

        tk.Label(self.setup_frame, text="Break (min)").pack()
        self.break_entry = tk.Entry(self.setup_frame)
        self.break_entry.pack()

        tk.Label(self.setup_frame, text="Total (min)").pack()
        self.total_entry = tk.Entry(self.setup_frame)
        self.total_entry.pack()

        self.apply_button = tk.Button(self.setup_frame, text="Add / Apply")
        self.apply_button.pack(pady=6)

        self.start_button = tk.Button(
            self.setup_frame, text="Start", state="disabled", command=self.show_timer
        )
        self.start_button.pack(pady=6)

        self.status_label = tk.Label(self.setup_frame, text="")
        self.status_label.pack()

        # -------- Timer Page --------

        self.state_label = tk.Label(self.timer_frame, text="FOCUS")
        self.state_label.pack(pady=5)

        self.time_label = tk.Label(
            self.timer_frame, text="00:00", font=("Arial", 40, "bold")
        )
        self.time_label.pack(expand=True)

        self.minimize_btn = tk.Button(
            self.timer_frame, text="Minimize", command=self.root.iconify
        )
        self.minimize_btn.pack(pady=5)

        # Keyboard flow
        self.focus_entry.bind("<Return>", lambda e: self.break_entry.focus())
        self.break_entry.bind("<Return>", lambda e: self.total_entry.focus())
        self.total_entry.bind("<Return>", lambda e: self.apply_button.invoke())

        # Resize behavior
        self.root.bind("<Configure>", self.resize_text)

    def resize_text(self, event):
        if self.timer_frame.winfo_ismapped():
            new_size = int(event.width / 6)

            if new_size < MIN_FONT_SIZE:
                new_size = MIN_FONT_SIZE

            self.time_label.config(font=("Arial", new_size, "bold"))

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
