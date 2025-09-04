import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  colorScheme: 'light' | 'dark';
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@futurefind_theme_preference';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  
  // Determine the actual color scheme based on theme setting
  const colorScheme = theme === 'system' ? deviceColorScheme || 'light' : theme;

  // Load saved theme preference from AsyncStorage on initial render
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setThemeState(savedTheme as ThemeType);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadTheme();
  }, []);

  // Save theme preference to AsyncStorage whenever it changes
  const setTheme = async (newTheme: ThemeType) => {
    console.log('🌟 setTheme called with:', newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      console.log('🌟 Theme saved to AsyncStorage');
      setThemeState(newTheme);
      console.log('🌟 Theme state updated');
    } catch (error) {
      console.error('❌ Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
