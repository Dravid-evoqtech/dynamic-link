import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet, ImageSourcePropType, ActivityIndicator } from 'react-native';
import { wp } from '../utils/dimensions';

interface SocialButtonProps {
  icon: ImageSourcePropType;
  text: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const SocialButton: React.FC<SocialButtonProps> = ({ icon, text, onPress, loading = false, disabled = false }) => (
  <TouchableOpacity 
    style={[
      styles.socialButton, 
      (loading || disabled) && styles.disabledButton
    ]} 
    onPress={onPress}
    disabled={loading || disabled}
  >
    {loading ? (
      <ActivityIndicator size="small" color="#666" style={styles.loadingSpinner} />
    ) : (
      <Image source={icon} style={styles.icon} />
    )}
    <Text style={[
      styles.socialButtonText,
      (loading || disabled) && styles.disabledText
    ]}>
      {text}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  socialButton: {
    width: 320,
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 14,
    paddingRight: 40,
    paddingBottom: 14,
    paddingLeft: 40,
    marginVertical: 7,
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    opacity: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  loadingSpinner: {
    marginRight: 8,
  },
  socialButtonText: {
    color: '#222',
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontStyle: 'normal',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  disabledText: {
    color: '#666',
  },
});

export default SocialButton; 