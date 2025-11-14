import { Audio } from "expo-av";
import bgMusicFile from "../assets/sounds/bg_music.mp3";

export class AudioManager {
    static bgSound: Audio.Sound | null = null;

    static async playBackgroundMusic() {
        if (this.bgSound) return;

        this.bgSound = new Audio.Sound();

        try {
        await this.bgSound.loadAsync(bgMusicFile);
        await this.bgSound.setIsLoopingAsync(true);
        await this.bgSound.setVolumeAsync(0.4);
        await this.bgSound.playAsync();
        } catch (e) {
        console.log("ERROR loading bg music", e);
        }
    }

    static async stopBackgroundMusic() {
        if (!this.bgSound) return;
        try {
        await this.bgSound.stopAsync();
        await this.bgSound.unloadAsync();
        this.bgSound = null;
        } catch (e) {
        console.log("ERROR stopping bg music", e);
        }
    }
}
