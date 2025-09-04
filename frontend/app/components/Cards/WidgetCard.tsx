import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../hooks/useThemeContext';

interface WidgetCardProps {
  style?: ViewStyle;
}

const WidgetCard = ({ style }: WidgetCardProps) => {
  const { colorScheme } = useTheme(); // ✅ Use colorScheme instead
  const isDark = colorScheme === 'dark';

  // Use consistent theme colors
  const colors = isDark ? {
    cardBg: '#23272F',
    bar1: '#3E1C96',
    bar2: '#6F1877',
    bar3: '#194185',
    bar4: '#134E48',
    barText: '#fff',
    valueText: '#858699',
    hatch: '#3E1C96',
  } : {
    cardBg: '#F6F5F4',
    bar1: '#7A5AF8',
    bar2: '#D444F1',
    bar3: '#2E90FA',
    bar4: '#15B79E',
    barText: '#fff',
    valueText: '#858699',
    hatch: '#7A5AF8',
  };

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.cardBg },
      style
    ]}>
      <View style={styles.content}>
        {/* First Row */}
        <View style={styles.row}>
          <View
            style={[
              styles.bar,
              {
                backgroundColor: colors.bar1,
                width: 95.18,
                height: 20.92,
                paddingTop: 1.57,
                paddingBottom: 1.57,
                paddingLeft: 4.18,
                paddingRight: 4.18,
                borderTopLeftRadius: 2.09,
                borderBottomLeftRadius: 2.09,
                opacity: 1,
              },
            ]}
          >
            <Text style={[styles.barText, { color: colors.barText }]}>Weekly Goal</Text>
          </View>
          {/* Hatched area */}
          <View
            style={{
              width: 23.01,
              height: 21.96,
              borderLeftWidth: 0.78,
              borderRightWidth: 0.78,
              borderColor: colors.hatch,
              borderStyle: 'solid',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 1,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  width: 33.54,
                  height: 0.78,
                  backgroundColor: colors.hatch,
                  top: -10.93 + i * 4.5,
                  transform: [{ rotate: '26.58deg' }],
                  opacity: 1,
                }}
              />
            ))}
          </View>
          <Text style={[styles.valueText, { color: colors.valueText }]}>8/10 hrs</Text>
        </View>
        {/* Second Row */}
        <View style={styles.row}>
          <View
            style={[
              styles.bar,
              {
                backgroundColor: colors.bar2,
                width: 65.37,
                height: 20.92,
                paddingTop: 1.57,
                paddingBottom: 1.57,
                paddingLeft: 4.18,
                paddingRight: 4.18,
                borderRadius: 2.09,
                opacity: 1,
              },
            ]}
          >
            <Text style={[styles.barText, { color: colors.barText }]}>Skills Developed</Text>
          </View>
          <Text style={[styles.valueText, { color: colors.valueText }]}>3/5</Text>
        </View>
        {/* Third Row */}
        <View style={styles.row}>
          <View
            style={[
              styles.bar,
              {
                backgroundColor: colors.bar3,
                width: 84.72,
                height: 20.92,
                paddingTop: 1.57,
                paddingBottom: 1.57,
                paddingLeft: 4.18,
                paddingRight: 4.18,
                borderRadius: 2.09,
                opacity: 1,
              },
            ]}
          >
            <Text style={[styles.barText, { color: colors.barText }]}>Impact Score</Text>
          </View>
          <Text style={[styles.valueText, { color: colors.valueText }]}>450/500</Text>
        </View>
        {/* Fourth Row (last, no marginBottom) */}
        <View style={styles.lastRow}>
          <View
            style={[
              styles.bar,
              {
                backgroundColor: colors.bar4,
                width: 21.96,
                height: 20.92,
                paddingTop: 1.57,
                paddingBottom: 1.57,
                paddingLeft: 4.18,
                paddingRight: 4.18,
                borderRadius: 2.09,
                opacity: 1,
              },
            ]}
          >
            <Text style={[styles.barText, { color: colors.barText }]}>1%</Text>
          </View>
          <Text style={[styles.valueText, { color: colors.valueText }]}>5min</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 179.38,
    height: 114.01,
    borderRadius: 14,
    paddingTop: 8.89,
    paddingBottom: 8.89,
    paddingLeft: 0,
    paddingRight: 0,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    opacity: 1,
    transform: [{ rotate: '-10.93deg' }],
  },
  content: {
    width: 179.38,
    height: 96.23,
    paddingLeft: 8.37,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    width: 160.55,
    height: 20.92,
    marginBottom: 4.18,
  },
  lastRow: {
    flexDirection: 'row',
    width: 160.55,
    height: 20.92,
    marginBottom: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Ensures children start at the left
    width: 160.55,
    height: 20.92,
    backgroundColor: '#858699',
    paddingHorizontal: 8,
  },
  barText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 7.32,
    lineHeight: 10.46,
    letterSpacing: -0.05,
    color: '#fff',
    textAlign: 'left',
  },
  valueText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 7.32,
    lineHeight: 10.46,
    letterSpacing: -0.05,
    color: '#858699',
    height: 11,
    marginLeft: 4.18,
    alignSelf: 'center',
    textAlignVertical: 'center', // for Android
    textAlign: 'left',
  },
});

export default WidgetCard;
