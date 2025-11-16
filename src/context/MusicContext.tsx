import { createContext, useContext, useState, useEffect } from "react";
import { AudioManager } from "../../utils/AudioManager";

type MusicMode = "home" | "quiz";

type MusicContextType = {
    shouldPlay: boolean;
    setShouldPlay: (v: boolean) => void;

    mode: MusicMode;
    setMode: (m: MusicMode) => void;

    stopAllMusic: () => void;
};

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
    const [shouldPlay, setShouldPlay] = useState(false);
    const [mode, setMode] = useState<MusicMode>("home");

    const stopAllMusic = () => {
        setShouldPlay(false);
        AudioManager.stopAll();
    };

    useEffect(() => {
        if (!shouldPlay) {
            AudioManager.stopAll();
            return;
        }

        if (mode === "home") {
            AudioManager.playHomeMusic();
        } else if (mode === "quiz") {
            AudioManager.playQuizMusic();
        }
    }, [shouldPlay, mode]);

    return (
        <MusicContext.Provider
            value={{
                shouldPlay,
                setShouldPlay,
                mode,
                setMode,
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
