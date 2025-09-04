import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTheme } from '../../hooks/useThemeContext';

type TabBarProps = {
  activeTab: string;
  onTabPress: (tab: string) => void;
};

const TabBar = ({ activeTab, onTabPress }: TabBarProps) => {
  const { colorScheme } = useTheme(); // 'light' or 'dark'

  return (
    <View style={styles.wrapper}>
      {/* Dark theme inner shadow background */}
      {colorScheme === 'dark' && (
        <>
          <View style={[styles.shadowTopLeft]} />
          <View style={[styles.shadowBottomRight]} />
        </>
      )}

      {/* Main container */}
              <View
          style={[
            styles.container,
            { 
              backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
              borderWidth: colorScheme === 'dark' ? 0 : 1,
              borderColor: colorScheme === 'dark' ? 'transparent' : '#F2F2F2',
            },
            colorScheme === 'dark' ? styles.darkThemeShadows : styles.lightThemeShadows
          ]}
        >
          {/* Starry texture effect for dark theme */}
          {colorScheme === 'dark' && (
            <View style={styles.starryOverlay}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.star,
                    {
                      top: Math.random() * 50 + 6,
                      left: Math.random() * 200 + 20,
                      opacity: Math.random() * 0.4 + 0.1,
                    }
                  ]}
                />
              ))}
            </View>
          )}
        {/* Explore Tab */}
        <TouchableOpacity onPress={() => onTabPress('Explore')}>
          <Image
            source={
              activeTab === 'Explore'
                ? require('../../assets/icons/mainpageicon.png')
                : require('../../assets/icons/mainpageicon-active.png')
            }
            style={[
              styles.icon,
              { 
                tintColor: activeTab === 'Explore' 
                  ? undefined  // Active: Use original color
                  : colorScheme === 'dark' ? '#FFFFFF' : '#666666'  // Inactive: White in dark, gray in light
              }
            ]}
          />
        </TouchableOpacity>

        {/* Application Tab */}
        <TouchableOpacity onPress={() => onTabPress('Application')}>
          <Image
            source={
              activeTab === 'Application'
                ? require('../../assets/icons/file-list-fill.png')
                : require('../../assets/icons/file-list-line.png')
            }
            style={[
              styles.icon,
              { 
                tintColor: activeTab === 'Application' 
                  ? undefined  // Active: Use original color
                  : colorScheme === 'dark' ? '#FFFFFF' : '#666666'  // Inactive: White in dark, gray in light
              }
            ]}
          />
        </TouchableOpacity>

        {/* Saved Opportunities Tab */}
        <TouchableOpacity onPress={() => onTabPress('Saved')}>
          <Image
            source={
              activeTab === 'Saved'
                ? require('../../assets/icons/heart-3-fill.png')
                : require('../../assets/icons/heart-3-line.png')
            }
            style={[
              styles.icon,
              { 
                tintColor: activeTab === 'Saved' 
                  ? undefined  // Active: Use original color
                  : colorScheme === 'dark' ? '#FFFFFF' : '#666666'  // Inactive: White in dark, gray in light
              }
            ]}
          />
        </TouchableOpacity>

        {/* Analytics Tab */}
        <TouchableOpacity onPress={() => onTabPress('Analytics')}>
          <Image
            source={
              activeTab === 'Analytics'
                ? require('../../assets/icons/bar-chart-box-ai-fill.png')
                : require('../../assets/icons/bar-chart-box-ai-line.png')
            }
            style={[
              styles.icon,
              { 
                tintColor: activeTab === 'Analytics' 
                  ? undefined  // Active: Use original color
                  : colorScheme === 'dark' ? '#FFFFFF' : '#666666'  // Inactive: White in dark, gray in light
              }
            ]}
          />
        </TouchableOpacity>

        {/* Profile Tab */}
        <TouchableOpacity onPress={() => onTabPress('Profile')}>
          <Image
            source={
              activeTab === 'Profile'
                ? require('../../assets/icons/user-fill.png')
                : require('../../assets/icons/user-line (1).png')
            }
            style={[
              styles.icon,
              { 
                tintColor: activeTab === 'Profile' 
                  ? undefined  // Active: Use original color
                  : colorScheme === 'dark' ? '#FFFFFF' : '#666666'  // Inactive: White in dark, gray in light
              }
            ]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TabBar;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
  },
  container: {
    width: 240,
    height: 62,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  lightThemeShadows: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  darkThemeShadows: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 12,
  },
  shadowTopLeft: {
    position: 'absolute',
    width: 240,
    height: 62,
    borderRadius: 24,
    backgroundColor: 'transparent',
    shadowColor: '#666666',
    shadowOffset: { width: -2, height: -2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  shadowBottomRight: {
    position: 'absolute',
    width: 240,
    height: 62,
    borderRadius: 24,
    backgroundColor: 'transparent',
    shadowColor: '#666666',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  icon: {
    width: 28,
    height: 28,
  },
  starryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  star: {
    position: 'absolute',
    width: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 0.5,
  },
});