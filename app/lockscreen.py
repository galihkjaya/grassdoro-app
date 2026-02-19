import tkinter as tk

class LockScreen:
    def __init__(self, seconds, message="Touch some grass, bud 🌱"):
        self.seconds = seconds
        self.message = message

        self.root = tk.Tk()
        self.root.attributes("-fullscreen", True)
        self.root.attributes("-topmost", True)
        self.root.configure(bg="black")

        self.timer_label = tk.Label(
            self.root,
            text="",
            fg="white",
            bg="black",
            font=("Arial", 48, "bold")
        )
        self.timer_label.pack(expand=True)

        self.msg_label = tk.Label(
            self.root,
            text=self.message,
            fg="gray",
            bg="black",
            font=("Arial", 22)
        )
        self.msg_label.pack(pady=20)

        self.exit_label = tk.Label(
        self.root,
        text="Emergency exit: CTRL + SHIFT + U",
        fg="darkgray",
        bg="black",
        font=("Arial", 12)
        )
        self.exit_label.pack(pady=5)

        # emergency exit
        self.root.bind("<Control-Shift-u>", lambda e: self.root.destroy())
        self.root.bind("<Control-Shift-U>", lambda e: self.root.destroy())

        self.update_timer()

    def update_timer(self):
        minutes = self.seconds // 60
        seconds = self.seconds % 60
        self.timer_label.config(text=f"{minutes:02d}:{seconds:02d}")

        if self.seconds > 0:
            self.seconds -= 1
            self.root.after(1000, self.update_timer)
        else:
            self.root.destroy()

    def show(self):
        self.root.mainloop()