from timer import PomodoroTimer
from ui import TimerUI

def main():
    ui = TimerUI()
    current_timer = {"timer": None}

    def apply_time():
        try:
            focus = int(ui.focus_entry.get())
            rest = int(ui.break_entry.get())
            total = int(ui.total_entry.get())

            if current_timer["timer"]:
                current_timer["timer"].stop()

            timer = PomodoroTimer(
                focus,
                rest,
                total,
                music_enabled=ui.music_enabled.get(),
                prayer_schedule=ui.prayer_schedule,
            )

            current_timer["timer"] = timer
            ui.attach_timer(timer)

        except ValueError:
            ui.status_label.config(text="Enter valid numbers!")
        except Exception as e:
            ui.status_label.config(text=f"Error: {str(e)}")

    ui.apply_button.config(command=apply_time)
    ui.start()

if __name__ == "__main__":
    main()