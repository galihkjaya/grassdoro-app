<div align="center">

<img src="assets/icons/icon.png" alt="Grassdoro" width="80"/>

# ❯ Grass Doro

**A cross-platform Pomodoro timer for Windows, macOS, and Ubuntu.**  
Built with discipline, lofi, and a little bit of grass.

[![Last Commit](https://img.shields.io/github/last-commit/galihkjaya/grassdoro-app?logo=github&label=Last%20Commit&color=4ade80)](https://github.com/galihkjaya/grassdoro-app/commits/main)
[![License](https://img.shields.io/github/license/galihkjaya/grassdoro-app?color=4ade80)](./LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Ubuntu-4ade80)](#)
[![Electron + React](https://img.shields.io/badge/Electron-React-47848F?logo=electron&logoColor=white)](#)

<br/>

[![Download Windows](https://img.shields.io/badge/Download-.exe-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/galihkjaya/grassdoro-app/releases/latest)
[![Download macOS](https://img.shields.io/badge/Download-.dmg-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/galihkjaya/grassdoro-app/releases/latest)
[![Download Ubuntu](https://img.shields.io/badge/Download-.deb-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)](https://github.com/galihkjaya/grassdoro-app/releases/latest)

</div>

---

## Overview

Grassdoro is a Pomodoro timer built for people who want to get serious about deep work. It lives in your system tray, stays out of your way, and enforces breaks so you actually rest. With scheduled sessions, prayer time integration, and lofi music — it fits both productivity and discipline.

---

## Features

- **Pomodoro Timer** — focus/break loop, long break every N sessions
- **System Tray** — live timer in tray (Windows, macOS, Ubuntu)
- **Floating Widget** — draggable always-on-top fallback
- **Scheduled Sessions** — set deep work time per weekday, auto-starts
- **Auto-launch** — starts with your OS (toggle on/off)
- **Lofi Music** — plays during focus, stops on break
- **Prayer Time** — auto lock screen at prayer times (Aladhan API)
- **Do Not Disturb** — mutes OS notifications during focus
- **Stats & History** — contribution graph, streak, total focus hours
- **Daily Goal** — set target hours, track progress

---

## Tech Stack

| Layer | Tech |
|---|---|
| Desktop Shell | Electron |
| UI | React + Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Audio | Howler.js |
| Scheduling | node-schedule |
| Storage | electron-store |
| Prayer Times | Aladhan API |

---

## Project Structure

````
grassdoro-app/
├── electron/
│   ├── main.js
│   ├── timer.js
│   ├── prayer.js
│   ├── autolaunch.js
│   ├── dnd.js
│   └── ipc.js
├── src/
│   ├── views/
│   │   ├── MainWindow.jsx
│   │   ├── FloatingWidget.jsx
│   │   └── Lockscreen.jsx
│   ├── components/
│   │   ├── TimerDisplay.jsx
│   │   ├── ScheduleConfig.jsx
│   │   ├── StatsGraph.jsx
│   │   └── Settings.jsx
│   └── store/
│       └── timerStore.js
└── assets/
    ├── lofi/
    └── alarm.wav
````

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm

### Install & Run

```bash
git clone https://github.com/galihkjaya/grassdoro-app.git
cd grassdoro-app
pnpm install
pnpm dev
```

### Build

```bash
# Windows
pnpm package:win

# macOS
pnpm package:mac

# Ubuntu
pnpm package:linux
```

---

## Roadmap

- [x] Core Pomodoro timer
- [x] Electron boilerplate + IPC skeleton
- [x] Main window UI
- [x] System tray with live timer
- [x] Lockscreen overlay
- [x] Prayer time integration
- [x] Lofi music player
- [x] Scheduled sessions
- [x] Auto-launch
- [x] Stats & history
- [x] DND integration
- [x] GitHub Actions CI/CD
- [ ] Landing page (gh-pages)

---

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request to `develop`

---

## License

This project is licensed under the MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">
Made with 🌿 and lofi beats
</div>
