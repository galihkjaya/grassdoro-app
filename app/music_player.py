import os
import time
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

        # Load all tracks - with debugging
        self.tracks = []
        if os.path.exists(self.folder):
            self.tracks = [
                os.path.join(self.folder, f)
                for f in os.listdir(self.folder)
                if f.lower().endswith(".mp3")
            ]
        
        print(f"DEBUG: Found {len(self.tracks)} tracks in {self.folder}")

    def _playlist_loop(self):
        """Background thread that continuously plays random tracks"""
        while self.is_playing and self.tracks:
            track = random.choice(self.tracks)
            print(f"DEBUG: Playing {os.path.basename(track)}")
            
            try:
                pygame.mixer.music.load(track)
                pygame.mixer.music.play(0)  # Play once, not looped
                
                # Wait for track to finish
                while pygame.mixer.music.get_busy() and self.is_playing:
                    time.sleep(0.1)
            except Exception as e:
                print(f"DEBUG: Error playing track: {e}")

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