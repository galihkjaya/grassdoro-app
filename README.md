<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">

# <code>❯ Grass Doro</code>

<em></em>

<!-- BADGES -->
<!-- local repository, no metadata badges. -->

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/Python-3776AB.svg?style=default&logo=Python&logoColor=white" alt="Python">

</div>
<br>

---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
  - [Project Index](#project-index)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

A customizable Pomodoro timer for Windows that enforces breaks with a lock screen, plays optional lofi focus music, and supports automatic prayer-time reminders based on user location.

---

## Features

- Fullscreen lock screen during breaks
- Optional lofi background music
- Automatic prayer-time pause (based on user location)

---

## Project Structure

```sh
└── /
    ├── app
    │   ├── __pycache__
    │   ├── assets
    │   ├── build
    │   ├── dist
    │   ├── lockscreen.py
    │   ├── main.py
    │   ├── main.spec
    │   ├── music_player.py
    │   ├── prayer_times.py
    │   ├── timer.py
    │   └── ui.py
    └── readme-ai.md
```

### Project Index

<details open>
	<summary><b><code>/</code></b></summary>
	<!-- __root__ Submodule -->
	<details>
		<summary><b>__root__</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ __root__</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
			<tbody>
			</tbody>
			</table>
		</blockquote>
	</details>
	<!-- app Submodule -->
	<details>
		<summary><b>app</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ app</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
			<tbody>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/app/lockscreen.py'>lockscreen.py</a></b></td>
					<td style='padding: 8px;'>Fullscreen lock screen with countdown timer and emergency exit functionality</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/app/main.py'>main.py</a></b></td>
					<td style='padding: 8px;'>Application entry point and timer initialization</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/app/music_player.py'>music_player.py</a></b></td>
					<td style='padding: 8px;'>Pygame-based music player for lofi background music during focus sessions</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/app/prayer_times.py'>prayer_times.py</a></b></td>
					<td style='padding: 8px;'>Prayer time calculation and location-based scheduling</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/app/timer.py'>timer.py</a></b></td>
					<td style='padding: 8px;'>Main Pomodoro timer logic with prayer time integration</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='/app/ui.py'>ui.py</a></b></td>
					<td style='padding: 8px;'>Tkinter-based GUI for timer configuration and display</td>
				</tr>
			</tbody>
			</table>
		</blockquote>
	</details>
</details>

---

## Getting Started

### Prerequisites

This project requires:

- **Python** 3.8+
- **Windows OS** (for fullscreen lock screen)

### Dependencies

Install the required Python packages:

- `tkinter` (built-in with Python)
- `pygame` (for music playback)
- `praytimes` (for prayer time calculations)
- `geopy` (for location geocoding)

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/galihkjaya/grassdoro-app.git
   cd grassdoro-app
   ```

2. **Create a virtual environment (optional but recommended):**

   ```sh
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install the dependencies:**

   ```sh
   pip install pygame praytimes geopy
   ```

### Usage

1. **Navigate to the app directory:**

   ```sh
   cd app
   ```

2. **Run the application:**

   ```sh
   python main.py
   ```

3. **Configure your session:**
   - Enter focus time (minutes)
   - Enter break time (minutes)
   - Enter total session time (minutes)
   - (Optional) Enable prayer reminders and enter your location
   - (Optional) Toggle lofi background music
   - Click "Start"

4. **During break:**
   - Emergency exit: Press **Ctrl + Shift + U** to exit fullscreen lock

---

## Roadmap

- [x] **`Task 1`**: <strike>Implement feature one.</strike>
- [ ] **`Task 2`**: Implement feature two.
- [ ] **`Task 3`**: Implement feature three.

---

## Contributing

- **💬 [Join the Discussions](https://LOCAL///discussions)**: Share your insights, provide feedback, or ask questions.
- **🐛 [Report Issues](https://LOCAL///issues)**: Submit bugs found or log feature requests for the `` project.
- **💡 [Submit Pull Requests](https://LOCAL///blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your LOCAL account.
2. **Clone Locally**: Clone the forked repository to your local machine using a git client.
   ```sh
   git clone .
   ```
3. **Create a New Branch**: Always work on a new branch, giving it a descriptive name.
   ```sh
   git checkout -b new-feature-x
   ```
4. **Make Your Changes**: Develop and test your changes locally.
5. **Commit Your Changes**: Commit with a clear message describing your updates.
   ```sh
   git commit -m 'Implemented new feature x.'
   ```
6. **Push to LOCAL**: Push the changes to your forked repository.
   ```sh
   git push origin new-feature-x
   ```
7. **Submit a Pull Request**: Create a PR against the original project repository. Clearly describe the changes and their motivations.
8. **Review**: Once your PR is reviewed and approved, it will be merged into the main branch. Congratulations on your contribution!
</details>

<details closed>
<summary>Contributor Graph</summary>
<br>
<p align="left">
   <a href="https://LOCAL{///}graphs/contributors">
      <img src="https://contrib.rocks/image?repo=/">
   </a>
</p>
</details>

---

## License

This project is protected under the [LICENSE](https://choosealicense.com/licenses) License. For more details, refer to the [LICENSE](https://choosealicense.com/licenses/) file.

---

<div align="right">

[![][back-to-top]](#top)

</div>

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-151515?style=flat-square

---
