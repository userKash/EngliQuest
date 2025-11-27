import { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Animated, {
  FadeIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
  title: string;
  body: string;
  tip?: string;
  titleIcon?: ImageSourcePropType;
  tipIcon?: ImageSourcePropType;
  onNext: () => void;
  nextLabel?: string;
};

export default function InstructionCard({
  title,
  body,
  tip,
  titleIcon,
  tipIcon,
  onNext,
  nextLabel = 'Next',
}: Props) {
  // Card pulse animation
  const cardPulse = useSharedValue(1);

  useEffect(() => {
    cardPulse.value = withRepeat(
      withSequence(
        withTiming(1.01, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardPulse.value }],
  }));

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Main card with animation */}
        <Animated.View
          entering={FadeIn.duration(500)}
          style={[styles.card, animatedCardStyle]}
        >
          <View style={styles.cardInner}>
            <View style={styles.rowCenter}>
              {titleIcon ? (
                <View style={styles.iconBadge}>
                  <Image source={titleIcon} style={styles.icon} />
                </View>
              ) : null}
              <Text style={styles.title}>{title}</Text>
            </View>

            <Text style={styles.body}>{body}</Text>

            {tip ? (
              <Animated.View
                entering={SlideInDown.delay(300).duration(400).springify()}
                style={styles.tipBox}
              >
                <View style={styles.tipHeader}>
                  {tipIcon ? (
                    <Image source={tipIcon} style={styles.iconSmall} />
                  ) : (
                    <Text style={styles.tipIcon}>💡</Text>
                  )}
                  <Text style={styles.tipLabel}>Tip</Text>
                </View>
                <Text style={styles.tip}>{tip}</Text>
              </Animated.View>
            ) : null}
          </View>
        </Animated.View>

        {/* Modern button outside card */}
        <Animated.View
          entering={SlideInDown.delay(500).duration(400).springify()}
          style={styles.bottomButton}
        >
          <TouchableOpacity
            style={styles.modernButton}
            onPress={onNext}
            activeOpacity={0.85}
          >
            <Text style={styles.modernButtonText}>{nextLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: SCREEN_WIDTH > 768 ? 32 : 20,
    paddingBottom: 100,
  },
  card: {
    borderWidth: 0,
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: SCREEN_WIDTH > 768 ? 40 : SCREEN_WIDTH > 375 ? 32 : 24,
    alignItems: 'center',
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: SCREEN_WIDTH > 768 ? 700 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  cardInner: {
    width: '100%',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    width: '100%',
  },
  iconBadge: {
    width: SCREEN_WIDTH > 768 ? 64 : SCREEN_WIDTH > 375 ? 56 : 48,
    height: SCREEN_WIDTH > 768 ? 64 : SCREEN_WIDTH > 375 ? 56 : 48,
    borderRadius: SCREEN_WIDTH > 768 ? 32 : SCREEN_WIDTH > 375 ? 28 : 24,
    backgroundColor: '#E8E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 3,
    borderColor: '#5E67CC',
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    width: SCREEN_WIDTH > 768 ? 36 : SCREEN_WIDTH > 375 ? 32 : 28,
    height: SCREEN_WIDTH > 768 ? 36 : SCREEN_WIDTH > 375 ? 32 : 28,
    resizeMode: 'contain',
  },
  iconSmall: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: 'contain',
  },
  title: {
    fontSize: SCREEN_WIDTH > 768 ? 32 : SCREEN_WIDTH > 375 ? 28 : 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#2D2D3A',
    letterSpacing: 0.3,
    flexShrink: 1,
    maxWidth: '100%',
  },
  body: {
    marginTop: 24,
    fontSize: SCREEN_WIDTH > 768 ? 18 : SCREEN_WIDTH > 375 ? 17 : 15,
    lineHeight: SCREEN_WIDTH > 768 ? 28 : SCREEN_WIDTH > 375 ? 26 : 23,
    marginBottom: 20,
    textAlign: 'center',
    color: '#4A5568',
    fontWeight: '500',
    width: '100%',
  },
  tipBox: {
    backgroundColor: "#F8F7FF",
    borderLeftWidth: 4,
    borderLeftColor: "#5E67CC",
    borderRadius: 16,
    marginTop: 24,
    padding: 20,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    width: '100%',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  tipLabel: {
    color: "#5E67CC",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tip: {
    color: '#2D2D3A',
    textAlign: 'left',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  bottomButton: {
    marginTop: 16,
    marginBottom: 20,
    width: '100%',
    maxWidth: SCREEN_WIDTH > 768 ? 700 : '100%',
    alignSelf: 'center',
  },
  modernButton: {
    backgroundColor: '#5E67CC',
    borderWidth: 0,
    borderRadius: 16,
    paddingVertical: SCREEN_WIDTH > 768 ? 20 : SCREEN_WIDTH > 375 ? 18 : 16,
    paddingHorizontal: 32,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    alignItems: 'center',
  },
  modernButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH > 768 ? 18 : SCREEN_WIDTH > 375 ? 17 : 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
