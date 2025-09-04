/**

 * Centralized color definitions for the app.
 * Includes support for light/dark modes and general colors.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#ffffff';

export const Colors = {
 gradient: ['#3b82f6', '#60a5fa', '#bfdbfe'],
  white: '#ffffff',
  inputBg: '#f5f5f5',
  placeholder: '#999999',
  primary: '#387ef5',


  light: {
    text: '#11181C',
    background: '#ffffff',

    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },

  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};


// Extra gradient for splash or onboarding screens
export const gradientColors = ['#0F80FA', '#A5CFFD'];

