import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useThemeContext';
import { OpportunityItem } from '../../../types/opportunities';

interface OpportunityCardProps {
  item: OpportunityItem;
  isSaved?: boolean; // New prop to indicate if this is a saved opportunity
  onToggleSave?: (isSaved: boolean) => void; // Callback for save/unsave
  onPress?: (item: OpportunityItem) => void; // Callback for when card is pressed
  isLocked?: boolean;
  onUnlock?: (opportunityId: string) => void; // Callback for unlock
}

export default function OpportunityCard({ item, isSaved, onToggleSave, onPress, isLocked, onUnlock }: OpportunityCardProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [isLiked, setIsLiked] = useState(isSaved || false);

  // Update local state when isSaved prop changes
  useEffect(() => {
    if (isSaved !== undefined) {
      setIsLiked(isSaved);
    }
  }, [isSaved]);

  const handleCardPress = () => {
    onPress?.(item);
  };

  const handleHeartPress = (e: any) => {
    e.stopPropagation(); // Prevent card press when heart is pressed
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    onToggleSave?.(newLikedState);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        { backgroundColor: isDark ? '#23272F' : '#fff' }
      ]}
      onPress={handleCardPress}
    >
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: isDark ? '#fff' : '#222' }
        ]} numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </Text>

        <Text style={[
          styles.description,
          { color: isDark ? '#B0B0B0' : '#667085' }
        ]} numberOfLines={1}>
          {item.description}
        </Text>

        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <View style={styles.metaLeftRow}>
              <Text style={[
                styles.organization,
                { color: '#2E90FA' }
              ]} numberOfLines={1} ellipsizeMode="tail">
                {item.organization || item.institution}
              </Text>
              <Text style={[
                styles.bullet,
                { color: isDark ? '#B0B0B0' : '#667085' }
              ]}>•</Text>
              <Text style={[
                styles.duration,
                { color: isDark ? '#B0B0B0' : '#667085' }
              ]} numberOfLines={1} ellipsizeMode="tail">{item.duration}</Text>
              <Text style={[
                styles.bullet,
                { color: isDark ? '#B0B0B0' : '#667085' }
              ]}>•</Text>
              <View style={[styles.badge, { backgroundColor: getBadgeBackgroundColor(item.states || item.workType) }]}>
                <Text 
                  style={[styles.badgeText, getBadgeTextStyle(item.states || item.workType)]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.states || item.workType}
                </Text>
              </View>
            </View>
            {isLocked && (
              <TouchableOpacity 
                style={styles.unlockButton}
                onPress={(e) => {
                  e.stopPropagation();
                  if (item._id && onUnlock) {
                    onUnlock(item._id);
                  }
                }}
              >
                <View style={styles.unlockButtonContent}>
                  <MaterialIcons name="lock" size={16} color="#fff" />
                  <Text style={styles.unlockButtonText}>Unlock</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.heartButton, isLiked && styles.heartButtonSelected]} 
          onPress={handleHeartPress}
        >
          <MaterialIcons 
            name={isLiked ? "favorite" : "favorite-border"} 
            size={20} 
            color={isLiked ? "rgba(46, 144, 250, 1)" : "#2E90FA"} 
          />
        </TouchableOpacity>

        {/* lock badge moved into meta row */}
      </View>
    </TouchableOpacity>
  );
}

const getBadgeTextStyle = (workType: string) => ({
  color: 
    workType?.toLowerCase() === 'remote' ? 'rgba(22, 179, 100, 1)' :
    workType?.toLowerCase() === 'in-person' ? 'rgba(46, 144, 250, 1)' : 
    workType?.toLowerCase() === 'hybrid' ? 'rgba(212, 68, 241, 1)' :
    'rgba(212, 68, 241, 1)', // Default color for other states
});

const getBadgeBackgroundColor = (workType: string) => 
  workType?.toLowerCase() === 'remote' ? 'rgba(22, 179, 100, 0.1)' :
  workType?.toLowerCase() === 'in-person' ? 'rgba(46, 144, 250, 0.1)' : 
  workType?.toLowerCase() === 'hybrid' ? 'rgba(212, 68, 241, 0.1)' :
  'rgba(212, 68, 241, 0.1)'; // Default background for other states

const styles = StyleSheet.create({
  card: {
    width: '100%', // Use 100% width instead of hardcoded 339
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    padding: 16,
    position: 'relative',
  },
  title: {
    fontFamily: 'UberMoveText-Medium',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: -0.1,
    color: '#101017',
    opacity: 1,
    marginBottom: 8,
    width: 261,
    height: 24,
  },
  description: {
    fontFamily: 'UberMoveText-Regular',
    fontSize: 13,
    width: 261,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.1,
    color: '#6D6D73',
    opacity: 1,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'column',
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap', // Changed from 'wrap' to prevent wrapping
    gap: 6,
    flex: 1,
  },
  organization: {
    fontSize: 13,
    fontFamily: 'UberMoveText-Medium',
    maxWidth: 120, // Reduced from 150 to ensure single line
    flexShrink: 1, // Allow text to shrink and not wrap
  },
  bullet: {
    color: '#6D6D73',
    fontSize: 13,
  },
  duration: {
    fontSize: 13,
    fontFamily: 'UberMoveText-Regular',
    color: '#6D6D73',
    flexShrink: 1, // Allow text to shrink if needed
    maxWidth: 80, // Limit maximum width to prevent overflow
  },
  badge: {
    paddingHorizontal: 6, // Reduced from 8
    paddingVertical: 2,
    borderRadius: 6, // Reduced from 8
    flexShrink: 1, // Allow badge to shrink if needed
    maxWidth: 100, // Limit maximum width to prevent overflow
    minWidth: 60, // Ensure minimum readable width
  },
  badgeText: {
    fontSize: 13,
    fontFamily: 'UberMoveText-Medium',
    maxWidth: 90, // Slightly less than badge maxWidth to account for padding
    flexShrink: 1, // Allow text to shrink if needed
  },
  heartButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F6F5F4',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 1,
    gap: 10,
  },
  heartButtonSelected: {
    borderColor: 'rgba(46, 144, 250, 0.1)',
  },
  lockBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F6F5F4',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  unlockButton: {
    minWidth: 80,
    height: 32,
    backgroundColor: '#2E90FA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  unlockButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'UberMoveText-Medium',
  },
});
