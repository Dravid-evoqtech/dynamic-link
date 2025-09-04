import React from 'react';
import { View, Text, StyleSheet, Platform, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const StreakHeader = () => (
  <View style={styles.streakTop}>
    <View style={styles.streakRow}>
      <Image
        source={require('@/assets/images/Fireicon.png')}
        style={styles.fireIcon}
      />
      <Text style={styles.streakCount}>12</Text>
    </View>
    <Text style={styles.streakSubtitle}>Daily challenge streak</Text>
  </View>
);

const WeeksRow = () => {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayImages = [
    require('@/assets/images/icons/Circle(M).png'),
    require('@/assets/images/icons/Circle.png'),
    require('@/assets/images/icons/Circle.png'),
    require('@/assets/images/icons/Circle.png'),
    require('@/assets/images/icons/Circle.png'),
    require('@/assets/images/icons/Circle(Sat).png'),
    require('@/assets/images/icons/Circle(sun).png'),
  ];
  return (
    <View style={styles.weeksRow}>
      <View style={styles.dayColumnRow}>
        {dayLabels.map((day, i) => (
          <View key={i} style={styles.dayColumn}>
            <Text style={styles.dayLabel}>{day}</Text>
            <Image
              source={dayImages[i]}
              style={{ width: 15.83, height: 15.83 }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const StreakMessage = () => (
  <Text style={styles.motivation}>
    <Text style={styles.motivationLight}>Keep it up, you're </Text>
    <Text style={styles.bold}>3 days</Text>
    <Text style={styles.motivationLight}> away from a </Text>
    <Text style={styles.bold}>7 day streak</Text>
    <Text style={styles.motivationLight}>!</Text>
  </Text>
);

const CardStars = () => {
  const cardWidth = 142.44;
  const cardHeight = 110.79;
  const starSize = 0.2;
  const numStars = 1000;
  const stars = Array.from({ length: numStars }).map((_, i) => {
    // Alternate between pure white and light white
    const isLight = Math.random() > 0.5;
    const color = isLight ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)';
    return (
      <View
        key={i}
        style={{
          position: 'absolute',
          top: Math.random() * (cardHeight - starSize),
          left: Math.random() * (cardWidth - starSize),
          width: starSize,
          height: starSize,
          backgroundColor: color,
          borderRadius: starSize,
          opacity: Math.random() * 0.7 + 0.3,
        }}
      />
    );
  });
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: cardWidth,
        height: cardHeight,
        zIndex: 0,
      }}
    >
      {stars}
    </View>
  );
};

const StreakCard = () => (
  <LinearGradient
    colors={['#F56E74', '#F2595E']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[styles.card, { transform: [{ rotate: '7.82deg' }] }]}
  >
    <CardStars />
    <StreakHeader />
    <WeeksRow />
    <StreakMessage />
  </LinearGradient>
);

const styles = StyleSheet.create({
  card: {
    width: 142.44,
    height: 110.79,
    borderRadius: 20,
    backgroundColor: 'transparent',
    overflow: 'hidden', // <-- This will clip the stars to the card's border radius
    ...Platform.select({
      ios: {
        shadowColor: '#F2595E',
        shadowOpacity: 0.7,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 16 },
      },
      android: {
        elevation: 24,
      },
    }),
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  streakTop: {
    width: 61,
    height: 27.19,
    position: 'absolute',
    top: 10.36,
    left: 50.45,
    opacity: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 1.19,
  },
  streakRow: {
    width: 31.44,
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
    gap: 3.17,
  },
  fireIcon: {
    width: 8.56,
    height: 11.12,
    opacity: 1,
  },
  streakCount: {
    width: 26,
    height: 18,
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: '600', // Semi Bold
    fontSize: 14.24,
    lineHeight: 17.41,
    letterSpacing: -0.28,
    opacity: 1,
  },
  streakSubtitle: {
    width: 61,
    height: 8,
    color: '#fff',
    fontFamily: 'Inter',
    fontWeight: '500', // Medium
    fontSize: 5.93,
    lineHeight: 7.91,
    letterSpacing: -0.1,
    opacity: 1,
    marginTop: 1.19,
  },
  weeksRow: {
    width: 135.71,
    height: 28.09,
    position: 'absolute',
    top: 53.83,
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: 1,
  },
  dayColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
  },
  dayColumn: {
    width: 18.99,
    height: 26.91,
    opacity: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 1.58,
    paddingRight: 1.58,
  },
  dayLabel: {
    color: '#fff',
    fontFamily: 'Inter',
    fontSize: 5.54,
    textAlign: 'center',
    marginBottom: 3.17, // fallback for gap
  },
  daysRow: {
    width: 135.71,
    height: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  motivation: {
    width: 75.18,
    height: 16,
    position: 'absolute',
    top: 87.18,
    left: 34.07,
    opacity: 1,
    fontFamily: 'Inter',
    fontWeight: '500', // Medium
    fontSize: 5.93,
    lineHeight: 7.91,
    letterSpacing: -0.1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#fff',
  },
  motivationLight: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 5.93,
    lineHeight: 7.91,
    letterSpacing: -0.1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: 'rgba(255,255,255,0.6)',
  },
  bold: {
    fontFamily: 'Inter',
    fontWeight: '600', // Semi Bold
    fontSize: 5.93,
    lineHeight: 7.91,
    letterSpacing: -0.1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#fff',
  },
});

export default StreakCard;
