import time

def format_time(secodngs):
    minutes = seconds // 60
    seconds = seconds % 60
    return f"{minutes:02d}:{seconds:02d}"

def countdown(duration, label):
    while duration > 0:
        print(f"{label} | {format_time(duration)}", end='\r')
        time.sleep(1)
        duration -= 1
    print()

def get_minutes(prompt):
    while True:
        try:
            value = int(input(prompt))
            if value <= 0:
                print("Enter a number greater than 0.")
                continue
            return value
        except ValueError:
            print("Please enter a valid number.")


def main():
    print("=== Custom Pomodoro Timer ===")

    focus_minutes = get_minutes("Focus time (minutes): ")
    break_minutes = get_minutes("Break time (minutes): ")
    total_minutes = get_minutes("Total duration (minutes): ")

    focus_seconds = focus_minutes * 60
    break_seconds = break_minutes * 60
    total_seconds = total_minutes * 60

    elapsed = 0
    session = 1

    print("\nStarting Pomodoro...\n")

    while elapsed < total_seconds:
        print(f"Session {session} — FOCUS")
        remaining = total_seconds - elapsed
        current_focus = min(focus_seconds, remaining)

        countdown(current_focus, "FOCUS")
        elapsed += current_focus

        if elapsed >= total_seconds:
            break

        print(f"Session {session} — BREAK")
        remaining = total_seconds - elapsed
        current_break = min(break_seconds, remaining)

        countdown(current_break, "BREAK")
        elapsed += current_break

        session += 1

    print("\n Done! Total focus time completed.")


if __name__ == "__main__":
    main()