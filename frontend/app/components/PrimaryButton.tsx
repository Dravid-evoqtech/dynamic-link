import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import dotBackground from '@/assets/images/icons/dotbackground.png'; // Adjust the path as needed

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, style, loading = false, disabled = false }) => (
  <LinearGradient
    colors={disabled || loading ? ["#A5CFFD", "#A5CFFD"] : ["#0676EF", "#2E90FA"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={[styles.button, style]}
  >
    <TouchableOpacity
      style={{ width: '100%', alignItems: 'center', height: '100%', justifyContent: 'center' }}
      onPress={onPress}
      activeOpacity={disabled || loading ? 1 : 0.85}
      disabled={disabled || loading}
    >
      <Image
        source={dotBackground}
        style={styles.dotBackground}
        resizeMode="cover"
      />
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  </LinearGradient>
);

const styles = StyleSheet.create({
  button: {
    width: 320,
    height: 54,
    borderRadius: 20,
    opacity: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 8,
  },
  text: {
    color: '#fff',
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontStyle: 'normal',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
    textAlign: 'center',
    textAlignVertical: 'center',
    zIndex: 1, // Ensure text is above the dot background
  },
  dotBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
    zIndex: 0,
    opacity: 0.4, // Lower value for more subtle effect (try 0.1–0.3)
  },
});

export default PrimaryButton;
 