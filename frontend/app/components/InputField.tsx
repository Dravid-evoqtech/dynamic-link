import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useThemeContext';

interface InputFieldProps extends TextInputProps {
  icon?: React.ReactNode;
  iconName?: string;
  iconType?: 'material' | 'feather';
  iconColor?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  customStyle?: any;
  inputStyle?: any;
  showEyeIcon?: boolean;
  onEyePress?: () => void;
  rightIcon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({
  icon,
  iconName,
  iconType = 'material',
  iconColor = '#222',
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  customStyle,
  inputStyle,
  showEyeIcon = false,
  onEyePress,
  rightIcon,
  ...restProps
}) => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  // Dynamic icon color based on theme
  const dynamicIconColor = isDark ? '#FFFFFF' : iconColor;

  const renderIcon = () => {
    if (icon) {
      // If it's a custom icon, wrap it to apply dark mode styling if needed
      const iconElement = icon as React.ReactElement<any>;
      return React.cloneElement(iconElement, {
        style: [
          iconElement.props.style,
          isDark && { tintColor: '#FFFFFF' } // Apply white tint in dark mode
        ]
      });
    }
    
    if (iconName) {
      if (iconType === 'feather') {
        return <Feather name={iconName as any} size={22} color={dynamicIconColor} style={{ marginRight: 8 }} />;
      }
      return <MaterialIcons name={iconName as any} size={22} color={dynamicIconColor} style={{ marginRight: 8 }} />;
    }
    
    return null;
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDark ? 'rgba(20, 20, 28, 1)' : '#F5F5F5',
        borderColor: isDark ? 'rgba(40, 40, 48, 1)' : '#E0E0E0',
      },
      customStyle
    ]}>
      {renderIcon()}
      <TextInput
        style={[
          styles.input, 
          { color: isDark ? '#FFFFFF' : '#101017' }, // Text color also changes
          inputStyle
        ]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#888' : '#aaa'}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        {...restProps}
      />
      {rightIcon && (
        <View style={styles.rightIconContainer}>
          {React.isValidElement(rightIcon) 
            ? React.cloneElement(rightIcon as React.ReactElement<any>, {
                children: React.isValidElement((rightIcon as React.ReactElement<any>).props.children)
                  ? React.cloneElement((rightIcon as React.ReactElement<any>).props.children as React.ReactElement<any>, {
                      style: [
                        (rightIcon as React.ReactElement<any>).props.children.props.style,
                        isDark && { tintColor: '#FFFFFF' }
                      ]
                    })
                  : (rightIcon as React.ReactElement<any>).props.children
              })
            : rightIcon
          }
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 52,
    opacity: 1,
    fontSize: 15,
    color: '#101017',
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontStyle: 'normal',
    lineHeight: 22,
    textAlignVertical: 'center', // for vertical alignment
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  // If gap is not supported, add marginRight: 10 to icon style
  rightIconContainer: {
    marginLeft: 8,
  },
});

export default InputField; 
