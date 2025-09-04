import React from 'react';
import { View, Image, StyleSheet, Text, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BottomFadeImageProps {
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  text?: string;
}

const BottomFadeImage: React.FC<BottomFadeImageProps> = ({ source, style, text }) => {
  return (
    <View style={[styles.container, style]}>
      <Image source={source} style={styles.image} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', '#ffffff']} // Adjust second color to match your view background
        style={styles.gradient}
      />
      {text && (
        <View style={styles.textOverlay}>
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    height: 80,
    width: '100%',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: '#111',
  },
});

export default BottomFadeImage; 