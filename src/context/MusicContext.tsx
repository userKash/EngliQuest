    import { createContext, useContext, useState, useEffect } from "react";
    import { AudioManager } from "../../utils/AudioManager";

    type MusicContextType = {
    bgMusic: boolean;
    setBgMusic: (v: boolean) => void;

    shouldPlay: boolean;
    setShouldPlay: (v: boolean) => void;

    stopAllMusic: () => void;
    };

    const MusicContext = createContext<MusicContextType | null>(null);

    export function MusicProvider({ children }: { children: React.ReactNode }) {
    const [bgMusic, setBgMusic] = useState(true);
    const [shouldPlay, setShouldPlay] = useState(false);

    // 🔥 Centralized stop function
    const stopAllMusic = () => {
        setShouldPlay(false);
        setBgMusic(false);
        AudioManager.stopBackgroundMusic();
    };

    useEffect(() => {
        if (shouldPlay && bgMusic) {
        AudioManager.playBackgroundMusic();
        } else {
        AudioManager.stopBackgroundMusic();
        }
    }, [shouldPlay, bgMusic]);

    return (
        <MusicContext.Provider
        value={{
            bgMusic,
            setBgMusic,
            shouldPlay,
            setShouldPlay,
            stopAllMusic,
        }}
        >
        {children}
        </MusicContext.Provider>
    );
    }

    export function useMusic() {
    const ctx = useContext(MusicContext);
    if (!ctx) throw new Error("useMusic must be used inside <MusicProvider>");
    return ctx;
}
