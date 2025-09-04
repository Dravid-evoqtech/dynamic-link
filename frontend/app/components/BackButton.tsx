import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

type BackButtonProps = {
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
  size?: number;
};

export default function BackButton({ onPress, style, color = '#FFFFFF', size = 24 }: BackButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={style} accessibilityRole="button" accessibilityLabel="Go back">
      <MaterialIcons name="arrow-back" size={size} color={color} />
    </TouchableOpacity>
  );
}