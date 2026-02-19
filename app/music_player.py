import os
import random
import pygame

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class MusicPlayer:
    def __init__(self, folder_name):
        pygame.mixer.init()

        self.folder = os.path.join(BASE_DIR, folder_name)

        self.tracks = [
            os.path.join(self.folder, f)
            for f in os.listdir(self.folder)
            if f.endswith(".mp3")
        ]

    def play_random(self):
        if not self.tracks:
            return

        track = random.choice(self.tracks)
        pygame.mixer.music.load(track)
        pygame.mixer.music.play(-1)

    def stop(self):
        pygame.mixer.music.stop()

    def play_alarm(self, alarm_path):
        alarm = pygame.mixer.Sound(os.path.join(BASE_DIR, alarm_path))
        alarm.play()