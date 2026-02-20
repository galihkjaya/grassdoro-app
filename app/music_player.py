import os
import random
import pygame
import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class MusicPlayer:
    def __init__(self, folder_name):
        pygame.mixer.init()

        self.folder = os.path.join(BASE_DIR, folder_name)
        self.alarm_sound = None
        self.is_playing = False
        self.playlist_thread = None

        self.tracks = [
            os.path.join(self.folder, f)
            for f in os.listdir(self.folder)
            if f.endswith(".mp3")
        ]

    def _playlist_loop(self):
        """Background thread that continuously plays random tracks"""
        while self.is_playing and self.tracks:
            track = random.choice(self.tracks)
            pygame.mixer.music.load(track)
            pygame.mixer.music.play(0)  # Play once, not looped
            
            # Get track duration and wait for it to finish
            while pygame.mixer.music.get_busy() and self.is_playing:
                threading.Event().wait(0.1)

    def play_random(self):
        """Start playing random tracks in continuous loop"""
        if not self.tracks:
            return

        # Stop any existing playlist thread
        self.is_playing = False
        if self.playlist_thread and self.playlist_thread.is_alive():
            self.playlist_thread.join(timeout=1)

        # Start new playlist thread
        self.is_playing = True
        self.playlist_thread = threading.Thread(target=self._playlist_loop, daemon=True)
        self.playlist_thread.start()

    def stop(self):
        """Stop all audio - both music and sound effects"""
        self.is_playing = False
        pygame.mixer.music.stop()
        pygame.mixer.stop()  # Stop all sound effects/alarms
        self.alarm_sound = None

    def play_alarm(self, alarm_path):
        self.alarm_sound = pygame.mixer.Sound(os.path.join(BASE_DIR, alarm_path))
        self.alarm_sound.play()