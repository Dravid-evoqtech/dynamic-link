import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Project base dimensions (update if your Figma/project uses different ones)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

type Value = number;
export const wp = (val: Value) => {
  return (val * width) / BASE_WIDTH;
};

export const hp = (val: Value) => {
  return (val * height) / BASE_HEIGHT;
};

export const windowDimensions = {
  height: BASE_HEIGHT,
  width: BASE_WIDTH,
};

export const screenInsets = {
  bottom: 0,
  top: 0,
  left: 0,
  right: 0,
};

// Default export for Expo Router
export default {
  wp,
  hp,
  windowDimensions,
  screenInsets
}; 