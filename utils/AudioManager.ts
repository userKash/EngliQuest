import { Audio } from "expo-av";
import homeMusicFile from "../assets/sounds/bg_music.mp3";
import quizMusicFile from "../assets/sounds/bg_quiz.mp3";

export class AudioManager {
    static homeSound: Audio.Sound | null = null;
    static quizSound: Audio.Sound | null = null;

    /** Stop everything */
    static async stopAll() {
        if (this.homeSound) {
            await this.homeSound.stopAsync();
            await this.homeSound.unloadAsync();
            this.homeSound = null;
        }
        if (this.quizSound) {
            await this.quizSound.stopAsync();
            await this.quizSound.unloadAsync();
            this.quizSound = null;
        }
    }

    static async playHomeMusic() {
        await this.stopAll();

        this.homeSound = new Audio.Sound();
        try {
            await this.homeSound.loadAsync(homeMusicFile);
            await this.homeSound.setIsLoopingAsync(true);
            await this.homeSound.setVolumeAsync(0.4);
            await this.homeSound.playAsync();
        } catch (e) {
            console.log("ERROR loading home bg music", e);
        }
    }

    static async playQuizMusic() {
        await this.stopAll();

        this.quizSound = new Audio.Sound();
        try {
            await this.quizSound.loadAsync(quizMusicFile);
            await this.quizSound.setIsLoopingAsync(true);
            await this.quizSound.setVolumeAsync(0.35);
            await this.quizSound.playAsync();
        } catch (e) {
            console.log("ERROR loading quiz bg music", e);
        }
    }
}
