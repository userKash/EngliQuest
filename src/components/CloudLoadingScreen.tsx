import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Image } from "react-native";
import { useMusic } from "../context/MusicContext";

const { width, height } = Dimensions.get("window");

const cloud1 = require("../../assets/clouds/Cloud-1.png");
const cloud2 = require("../../assets/clouds/Cloud-3.png");

const cloudConfigs = [
  { img: cloud1, top: height * 0.18, left: 20, size: 210 },
  { img: cloud2, top: height * 0.55, left: 40, size: 180 },
  { img: cloud1, top: height * 0.25, right: 20, size: 200 },
  { img: cloud2, top: height * 0.60, right: 50, size: 190 },
];

export default function CloudLoadingScreen({ navigation }: any) {
  const { setShouldPlay } = useMusic();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const leftSlide = useRef(new Animated.Value(0)).current;
  const rightSlide = useRef(new Animated.Value(0)).current;
  const textPulse = useRef(new Animated.Value(1)).current;

  const wiggles = useRef(
    cloudConfigs.map(() => ({
      move: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    wiggles.forEach((w, i) => {
      const speed = 2400 + i * 300;

      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(w.move, {
              toValue: 1,
              duration: speed,
              useNativeDriver: true,
            }),
            Animated.timing(w.rotate, {
              toValue: 1,
              duration: speed,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(w.move, {
              toValue: -1,
              duration: speed,
              useNativeDriver: true,
            }),
            Animated.timing(w.rotate, {
              toValue: -1,
              duration: speed,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  }, []);
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(textPulse, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(textPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(leftSlide, {
          toValue: -width,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(rightSlide, {
          toValue: width,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldPlay(true);
        navigation.replace("Home");
      });
    }, 3600);

    return () => clearTimeout(timer);
  }, [navigation, setShouldPlay]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.loadingText,
          {
            opacity: fadeIn,
            transform: [{ scale: textPulse }],
          },
        ]}
      >
        Preparing your quest.
      </Animated.Text>
      {cloudConfigs.map((cloud, index) => {
        const w = wiggles[index];

        return (
          <Animated.Image
            key={index}
            source={cloud.img}
            style={[
              styles.cloud,
              {
                width: cloud.size,
                height: cloud.size,
                top: cloud.top,
                left: cloud.left,
                right: cloud.right,
                transform: [
                  {
                    translateY: w.move.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-12, 12],
                    }),
                  },
                  {
                    rotate: w.rotate.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ["-2deg", "2deg"],
                    }),
                  },
                  index < 2
                    ? { translateX: leftSlide }
                    : { translateX: rightSlide },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#87CEEB",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    position: "absolute",
    top: height * 0.43,
    textAlign: "center",

    fontSize: 24,
    fontFamily: "PixelFont",
    letterSpacing: 1.5,
    color: "#ffffff",

    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 4,
  },

  cloud: {
    position: "absolute",
    resizeMode: "contain",
  },
});
