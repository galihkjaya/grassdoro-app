from timer import PomodoroTimer

def display(label, seconds):
    minutes = seconds // 60
    seconds = seconds % 60
    print(f"{label} | {minutes:02d}:{seconds:02d}", end="\r")

def main():
    print("=== Focus Timer ===")

    focus = int(input("Focus time (minutes): "))
    rest = int(input("Break time (minutes): "))
    total = int(input("Total duration (minutes): "))

    timer = PomodoroTimer(focus, rest, total)
    timer.run(display)

    print("\nDone! Great job 🎉")

if __name__ == "__main__":
    main()
