    import { createContext, useContext, useState, useEffect } from "react";
    import { AudioManager } from "../../utils/AudioManager";

    type MusicContextType = {
    bgMusic: boolean;
    setBgMusic: (v: boolean) => void;
    };

    const MusicContext = createContext<MusicContextType | null>(null);

    export function MusicProvider({ children }: { children: React.ReactNode }) {
    const [bgMusic, setBgMusic] = useState(true);
    useEffect(() => {
        if (bgMusic) {
        AudioManager.playBackgroundMusic();
        } else {
        AudioManager.stopBackgroundMusic();
        }
    }, [bgMusic]);

    return (
        <MusicContext.Provider value={{ bgMusic, setBgMusic }}>
        {children}
        </MusicContext.Provider>
    );
    }

    export function useMusic() {
    const ctx = useContext(MusicContext);
    if (!ctx) throw new Error("useMusic must be used inside <MusicProvider>");
    return ctx;
}
