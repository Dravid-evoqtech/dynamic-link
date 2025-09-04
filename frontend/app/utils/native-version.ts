import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

interface VersionInfo {
  version: string;
  buildNumber: string;
  fullVersion: string;
}

export const getNativeVersion = (): VersionInfo => {
  if (Platform.OS === 'ios') {
    try {
      // For iOS, prioritize reading from native bundle (Xcode settings)
      const { CFBundleShortVersionString, CFBundleVersion } = NativeModules.SettingsManager?.settings || {};
      
      // Use native values first, fallback to Expo config
      const version = CFBundleShortVersionString || Constants.expoConfig?.version || 'Unknown';
      const buildNumber = CFBundleVersion || Constants.expoConfig?.ios?.buildNumber || 'Unknown';
      
      console.log('iOS Version Info:', {
        nativeVersion: CFBundleShortVersionString,
        nativeBuild: CFBundleVersion,
        expoVersion: Constants.expoConfig?.version,
        expoBuild: Constants.expoConfig?.ios?.buildNumber,
        finalVersion: version,
        finalBuild: buildNumber
      });
      
      return {
        version,
        buildNumber,
        fullVersion: `Version ${version} (${buildNumber})`
      };
    } catch (error) {
      console.warn('Failed to get native version:', error);
      // Fallback to Expo config
      const expoVersion = Constants.expoConfig?.version || 'Unknown';
      const expoBuildNumber = Constants.expoConfig?.ios?.buildNumber || 'Unknown';
      
      return {
        version: expoVersion,
        buildNumber: expoBuildNumber,
        fullVersion: `Version ${expoVersion} (${expoBuildNumber})`
      };
    }
  } else if (Platform.OS === 'android') {
    try {
      // For Android, try to get from Expo Constants
      const expoVersion = Constants.expoConfig?.version;
      const expoBuildNumber = Constants.expoConfig?.android?.versionCode;
      
      if (expoVersion && expoBuildNumber) {
        return {
          version: expoVersion,
          buildNumber: expoBuildNumber.toString(),
          fullVersion: `Version ${expoVersion} (${expoBuildNumber})`
        };
      }
      
      return {
        version: expoVersion || 'Unknown',
        buildNumber: expoBuildNumber?.toString() || 'Unknown',
        fullVersion: `Version ${expoVersion || 'Unknown'} (${expoBuildNumber || 'Unknown'})`
      };
    } catch (error) {
      console.warn('Failed to get Android version:', error);
      return {
        version: 'Unknown',
        buildNumber: 'Unknown',
        fullVersion: 'Version Unknown'
      };
    }
  } else {
    // For web or other platforms
    try {
      const expoVersion = Constants.expoConfig?.version;
      return {
        version: expoVersion || 'Unknown',
        buildNumber: 'Web',
        fullVersion: `Version ${expoVersion || 'Unknown'} (Web)`
      };
    } catch (error) {
      return {
        version: 'Unknown',
        buildNumber: 'Unknown',
        fullVersion: 'Version Unknown'
      };
    }
  }
};

export const getVersionOnly = (): string => {
  const { version } = getNativeVersion();
  return version;
};

export const getBuildNumberOnly = (): string => {
  const { buildNumber } = getNativeVersion();
  return buildNumber;
};

export const getFullVersionString = (): string => {
  const { fullVersion } = getNativeVersion();
  return fullVersion;
};
