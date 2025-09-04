import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface Props {
  title: string;
  description: string;
  icon: any;
  isSelected: boolean;
  onPress: () => void;
}

const OpportunityOption: React.FC<Props> = ({ title, description, icon, isSelected, onPress }) => {
  return (
    <TouchableOpacity style={[styles.container, isSelected && styles.selected]} onPress={onPress}>
      <View style={styles.iconWrapper}>
        <Image source={icon} style={styles.icon} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={[styles.radio, isSelected && styles.radioSelected]}>
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
};

export default OpportunityOption;

const styles = StyleSheet.create({
container: {
  // Properties from your image:
  flexDirection: 'row', // Flow: Horizontal (already present)
  width: 320,           // Width: Fill (320px) - Assuming "Fill" means a fixed width of 320px in this context
  // height: 'auto', // Height: Hug (72px) - 'Hug' typically means height adjusts to content.
                      // For a fixed 72px, set height: 72, but 'Hug' implies dynamic height.
                      // If the content consistently makes it 72px, then 'auto' works, otherwise fix it.
  height: 72,         // Setting to fixed 72px based on "Hug (72px)"
  borderRadius: 20,     // Radius: 20px

  // Padding
  paddingTop: 12,     // Top: 12px
  paddingRight: 18,   // Right: 18px
  paddingBottom: 12,  // Bottom: 12px
  paddingLeft: 12,    // Left: 12px

  // Gap (React Native 0.71+ for direct 'gap' property)
  // If your RN version is < 0.71, you'd apply margins to children or use a wrapper
  gap: 6,             // Gap: 6px

  // Remaining properties from your original code (adjust as needed if design dictates otherwise):
  backgroundColor: '#fff',
  alignItems: 'center', // Common for horizontal flow to vertically center items
  marginBottom: 12,
 // Android shadow
},
  selected: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  description: {
    fontSize: 12,
    color: '#475569',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#3b82f6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
});
