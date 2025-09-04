import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp } from '../utils/dimensions';
const { width } = Dimensions.get('window');
import { useTheme } from '../../hooks/useThemeContext';

// Generate stars once globally
const GLOBAL_STARS = Array.from({ length: 36 }).map((_, i) => ({
  key: i,
  top: Math.random() * (90 - 16) + 4,
  left: Math.random() * (width - 1) + 8,
  opacity: Math.random() * 0.7 + 0.3,
}));

const Stars = () => {
  return (
    <View style={styles.starsContainer} pointerEvents="none">
      {GLOBAL_STARS.map((star) => (
        <View
          key={star.key}
          style={[
            styles.star,
            {
              top: star.top,
              left: star.left,
              width: 2,
              height: 2,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Top light effect for dark mode - torch effect from top-right corner
const TopLight = () => {
  const { colorScheme } = useTheme();
  
  if (colorScheme !== 'dark') return null;
  
  return (
    <View style={styles.topLightContainer} pointerEvents="none">
      <LinearGradient
        colors={[
          'rgba(59, 130, 246, 0.4)',   // Brightest at source (top-right)
          'rgba(59, 130, 246, 0.35)',   // Brightest at source (top-right)
          'rgba(59, 130, 246, 0.3)',   // Still bright, slightly dimmed
          'rgba(59, 130, 246, 0.25)',   // Brightest at source (top-right)
          'rgba(59, 130, 246, 0.2)',   // Still bright, slightly dimmed
          'rgba(59, 130, 246, 0.16)',  // Medium brightness
          'rgba(59, 130, 246, 0.13)',   // Lower brightness
          'rgba(59, 130, 246, 0.10)',   // Lower brightness
          'rgba(59, 130, 246, 0.09)',  // Very low brightness
          'rgba(59, 130, 246, 0.07)',  // Almost invisible
          'rgba(59, 130, 246, 0.05)',  // Almost invisible
          'rgba(59, 130, 246, 0.03)',  // Almost invisible
          'rgba(59, 130, 246, 0.01)',  // Barely visible
          'rgba(59, 130, 246, 0.0004)',  // Barely visible
          'rgba(59, 130, 246, 0.0003)',  // Barely visible
          'rgba(59, 130, 246, 0.0002)',  // Barely visible
          'rgba(59, 130, 246, 0.0001)',  // Barely visible
          'rgba(59, 130, 246, 0.0)',  // Barely visible
          'transparent'                  // Completely fades out
        ]}
        start={{ x: 1, y: 0 }}        // Start from top-right
        end={{ x: 0.9, y: 1 }}          // Flow to bottom-left for full coverage
        style={styles.topLight}
      />
    </View>
  );
};

export default function Background({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useTheme();

  const lightColors = ["#0F80FA", "#A5CFFD"] as const;
  const darkColors = ["#0a0e1a", "#0d1117"] as const; // Smoother dark gradient

  return (
    <LinearGradient
      colors={colorScheme === 'dark' ? darkColors : lightColors}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
      >
      <Stars />
      <TopLight />
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    borderRadius: wp(0), 
    opacity: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', 
  },
  starsContainer: {
    position: 'absolute',
    top:0,
    left: 0,
    width: width,
    height: 96,
    zIndex: 2,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  topLightContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 1, // Wider coverage for torch effect
    height: hp(150), // Large height for downward illumination
    zIndex: 1,
  },
  topLight: {
    flex: 1,
  },
}); 
