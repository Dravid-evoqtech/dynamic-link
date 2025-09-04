import React from 'react';

import { useEffect } from 'react';


import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';


const { width, height } = Dimensions.get('window');



useEffect(() => {
  const timeout = setTimeout(() => {
    router.replace('/onboarding');
  }, 2000);

  return () => clearTimeout(timeout);
}, []);

const SplashScreen = () => {
  return (
    <LinearGradient
      colors={['#3b82f6', '#60a5fa', '#bfdbfe']} // 💡 lighter blue gradient
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Stars */}
      <View style={styles.starsContainer}>
        {Array.from({ length: 40 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                top: Math.random() * 60 + 4,
                left: Math.random() * (width - 12) + 6,
                opacity: Math.random() * 0.6 + 0.3,
                width: Math.random() * 1.2 + 0.8,
                height: Math.random() * 1.2 + 0.8,
              },
            ]}
          />
        ))}
      </View>

      {/* Centered Image with Circle */}
      <View style={styles.iconCircle} />
      <Image
        source={require('../../assets/images/background_cap.png')}
        style={styles.icon}
        resizeMode="contain"
      />

      {/* App Title */}
      <Text style={styles.title}>FutureFind</Text>
    </LinearGradient>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
container: {
  width: 375,
  height: 812,
  backgroundColor: '#000',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 32,
  borderWidth: 10,
  borderColor: '#FFFFFF1A', // or any other color you want for the border
  alignSelf: 'center', // center it if used inside larger screen
},

  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height: 60,
    zIndex: 2,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  iconCircle: {
    position: 'absolute',
    top: 332,
    left: 112,
    width: 147.09,
    height: 147.09,
    borderRadius: 147.09 / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    zIndex: 1,
  },
  icon: {
    position: 'absolute',
    top: 332,
    left: 112,
    width: 147.09,
    height: 147.09,
    zIndex: 2,
  },
  title: {
    position: 'absolute',
    top: 690, // still placing it at exact top if needed
    left: 128.55,
    width: 122,
    height: 32,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});
