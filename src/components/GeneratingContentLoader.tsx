    import React, { useEffect, useRef, useState } from "react";
    import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Easing,
    Platform,
    } from "react-native";
    import LottieView from "lottie-react-native";

    const { width, height } = Dimensions.get("window");
    const CLOUD = require("../../assets/clouds/Cloud-1.png");

    const MESSAGES = [
    "Content Generation in Progress...",
    "This process typically takes 5–10 minutes...",
    "Hang tight! We're preparing your personalized content...",
    ];

    type PeekSide = "top" | "bottom" | "left" | "right" | null;

    export default function GeneratingContentLoader() {
    const fadeScreen = useRef(new Animated.Value(0)).current;

    const cloudLeft = useRef(new Animated.Value(0)).current;
    const cloudRight = useRef(new Animated.Value(0)).current;

    const msgFade = useRef(new Animated.Value(1)).current;
    const [messageIndex, setMessageIndex] = useState(0);

    const lastPeekRef = useRef<PeekSide>(null);
    const [currentPeek, setCurrentPeek] = useState<PeekSide>(null);

    const topY = useRef(new Animated.Value(-180)).current; 
    const bottomY = useRef(new Animated.Value(220)).current; 
    const leftX = useRef(new Animated.Value(-220)).current;
    const rightX = useRef(new Animated.Value(width + 220)).current; 

    const peekTopRef = useRef<LottieView | null>(null);
    const peekBottomRef = useRef<LottieView | null>(null);
    const peekLeftRef = useRef<LottieView | null>(null);
    const peekRightRef = useRef<LottieView | null>(null);

    const LOTTIE_SIZE = Math.min(300, Math.round(width * 0.68));
    useEffect(() => {
        Animated.timing(fadeScreen, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        }).start();
    }, [fadeScreen]);
    useEffect(() => {
        const loopLeft = Animated.loop(
        Animated.sequence([
            Animated.timing(cloudLeft, {
            toValue: 1,
            duration: 20000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
            }),
            Animated.timing(cloudLeft, {
            toValue: 0,
            duration: 20000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
            }),
        ])
        );
        const loopRight = Animated.loop(
        Animated.sequence([
            Animated.timing(cloudRight, {
            toValue: 1,
            duration: 17000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
            }),
            Animated.timing(cloudRight, {
            toValue: 0,
            duration: 17000,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
            }),
        ])
        );
        loopLeft.start();
        loopRight.start();
        return () => {
        loopLeft.stop();
        loopRight.stop();
        };
    }, [cloudLeft, cloudRight]);
    useEffect(() => {
        const interval = setInterval(() => {
        Animated.timing(msgFade, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
        }).start(() => {
            setMessageIndex((i) => (i + 1) % MESSAGES.length);
            Animated.timing(msgFade, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
            }).start();
        });
        }, 3200);
        return () => clearInterval(interval);
    }, [msgFade]);
    const pickNextSide = (): PeekSide => {
        const sides: PeekSide[] = ["top", "bottom", "left", "right"];
        const choices = sides.filter((s) => s !== lastPeekRef.current);
        return choices[Math.floor(Math.random() * choices.length)];
    };
    const runAnimation = (anim: Animated.CompositeAnimation) =>
        new Promise<void>((res) => anim.start(() => res()));

    useEffect(() => {
        let cancelled = false;

        const loop = async () => {
        while (!cancelled) {
            const side = pickNextSide();
            lastPeekRef.current = side;
            setCurrentPeek(side);
            if (side === "top") {
            peekTopRef.current?.play?.();
            await runAnimation(
                Animated.timing(topY, {
                toValue: -12,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
                })
            );
            await new Promise((r) => setTimeout(r, 1500));
            await runAnimation(
                Animated.timing(topY, {
                toValue: -180,
                duration: 700,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
                })
            );
            try { peekTopRef.current?.pause?.(); } catch {}
            } else if (side === "bottom") {
            peekBottomRef.current?.play?.();
            await runAnimation(
                Animated.timing(bottomY, {
                toValue: 40,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
                })
            );
            await new Promise((r) => setTimeout(r, 1500));
            await runAnimation(
                Animated.timing(bottomY, {
                toValue: 220,
                duration: 700,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
                })
            );
            try { peekBottomRef.current?.pause?.(); } catch {}
            } else if (side === "left") {
            peekLeftRef.current?.play?.();
            await runAnimation(
                Animated.timing(leftX, {
                toValue: 6,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
                })
            );
            await new Promise((r) => setTimeout(r, 1500));
            await runAnimation(
                Animated.timing(leftX, {
                toValue: -220,
                duration: 700,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
                })
            );
            try { peekLeftRef.current?.pause?.(); } catch {}
            } else if (side === "right") {
            peekRightRef.current?.play?.();
            await runAnimation(
                Animated.timing(rightX, {
                toValue: width - 140,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
                })
            );
            await new Promise((r) => setTimeout(r, 1500));
            await runAnimation(
                Animated.timing(rightX, {
                toValue: width + 220,
                duration: 700,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
                })
            );
            try { peekRightRef.current?.pause?.(); } catch {}
            }
            setCurrentPeek(null);
            await new Promise((r) => setTimeout(r, 600 + Math.random() * 1200));
        }
        };

        loop();
        return () => {
        cancelled = true;
        };
    }, []);

    const cloudLeftX = cloudLeft.interpolate({
        inputRange: [0, 1],
        outputRange: [-22, 22],
    });
    const cloudRightX = cloudRight.interpolate({
        inputRange: [0, 1],
        outputRange: [22, -22],
    });

    return (
        <Animated.View style={[styles.screen, { opacity: fadeScreen }]}>
        <Animated.Image
            source={CLOUD}
            style={[
            styles.topCloud,
            {
                left: 18, 
                transform: [{ translateX: cloudLeftX }],
                opacity: 0.96,
                width: 170,
                height: 96,
            },
            ]}
            resizeMode="contain"
        />

        <Animated.Image
            source={CLOUD}
            style={[
            styles.topCloud,
            {
                left: width * 0.55,
                top: Platform.OS === "ios" ? 22 : 16,
                transform: [{ translateX: cloudRightX }],
                opacity: 0.86,
                width: 140,
                height: 82,
            },
            ]}
            resizeMode="contain"
        />
        <Animated.Image
            source={CLOUD}
            style={[
            styles.bottomCloud,
            {
                left: width * 0.14, 
                transform: [{ translateX: cloudRightX }],
                opacity: 0.92,
                width: 200,
                height: 96,
            },
            ]}
            resizeMode="contain"
        />

        <Animated.Image
            source={CLOUD}
            style={[
            styles.bottomCloud,
            {
                right: 22,
                bottom: Platform.OS === "ios" ? 68 : 78, 
                transform: [{ translateX: cloudLeftX }],
                opacity: 0.88,
                width: 160,
                height: 88,
            },
            ]}
            resizeMode="contain"
        />
        <LottieView
            source={require("../../assets/animations/Welcome.json")}
            autoPlay
            loop
            style={[styles.mainLottie, { width: LOTTIE_SIZE, height: LOTTIE_SIZE }]}
        />
        <Animated.View
            pointerEvents="none"
            style={[styles.mascotTop, { transform: [{ translateY: topY }, { rotate: "180deg" }] }]}
        >
            <LottieView
            ref={(r) => { peekTopRef.current = r; }}
            source={require("../../assets/animations/peek.json")}
            autoPlay={false}
            loop
            style={{ width: 160, height: 160 }}
            />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.mascotBottom, { transform: [{ translateY: bottomY }] }]}>
            <LottieView
            ref={(r) => { peekBottomRef.current = r; }}
            source={require("../../assets/animations/peek.json")}
            autoPlay={false}
            loop
            style={{ width: 160, height: 160 }}
            />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.mascotLeft, { transform: [{ translateX: leftX }, { rotate: "90deg" }] }]}>
            <LottieView
            ref={(r) => { peekLeftRef.current = r; }}
            source={require("../../assets/animations/peek.json")}
            autoPlay={false}
            loop
            style={{ width: 148, height: 148 }}
            />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.mascotRight, { transform: [{ translateX: rightX }, { rotate: "-90deg" }] }]}>
            <LottieView
            ref={(r) => { peekRightRef.current = r; }}
            source={require("../../assets/animations/peek.json")}
            autoPlay={false}
            loop
            style={{ width: 148, height: 148 }}
            />
        </Animated.View>
        <Animated.Text
            style={[
            styles.message,
            {
                opacity: msgFade,
                transform: [
                {
                    scale: msgFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.99, 1],
                    }),
                },
                ],
            },
            ]}
            numberOfLines={2}
        >
            {MESSAGES[messageIndex]}
        </Animated.Text>
        </Animated.View>
    );
    }

    const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#AEE1FF",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    topCloud: {
        position: "absolute",
        top: Platform.OS === "ios" ? 36 : 26,
    },

    bottomCloud: {
        position: "absolute",
        bottom: Platform.OS === "ios" ? 36 : 26,
    },

    rotatingCircle: {
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: 999,
        borderWidth: 0,
    },

    mainLottie: {
        zIndex: 2,
    },

    mascotTop: {
        position: "absolute",
        top: -18,
        zIndex: 6,
        alignItems: "center",
        justifyContent: "center",
        backfaceVisibility: "hidden",
    },

    mascotBottom: {
        position: "absolute",
        bottom: -18,
        zIndex: 6,
        alignItems: "center",
        justifyContent: "center",
        backfaceVisibility: "hidden",
    },

    mascotLeft: {
        position: "absolute",
        left: -220,
        top: height * 0.36,
        zIndex: 6,
        alignItems: "center",
        justifyContent: "center",
        backfaceVisibility: "hidden",
    },

    mascotRight: {
        position: "absolute",
        left: width + 220,
        top: height * 0.36,
        zIndex: 6,
        alignItems: "center",
        justifyContent: "center",
        backfaceVisibility: "hidden",
    },

    message: {
        marginTop: 26,
        fontSize: 22,
        fontWeight: "700",
        color: "#5E67CC",
        textAlign: "center",
        paddingHorizontal: 30,
        letterSpacing: 0.4,
        zIndex: 10,
        textShadowColor: "rgba(0,0,0,0.36)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
});
