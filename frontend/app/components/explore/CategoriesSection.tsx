import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import sharedStyles from '../../styles/sharedStyles';
import { useTheme } from '../../../hooks/useThemeContext';
import { opportunitiesAPI } from '../../services/api';
import { useCategoriesQuery } from '../../services/queries';
import { CategoriesSkeleton } from '../SkeletonLoader';

// Category icons mapping
const CATEGORY_ICONS: { [key: string]: any } = {
  'art': require('../../../assets/images/icons/Interests/Arts.png'),
  'business': require('../../../assets/images/icons/Interests/Business.png'),
  'computer science': require('../../../assets/images/icons/Interests/Computer_Science.png'),
'data science': require('../../../assets/images/icons/Interests/Computer_Science.png'),
  'engineering': require('../../../assets/images/icons/Interests/Engineering.png'),
  'medicine': require('../../../assets/images/icons/Interests/Medicine.png'),
  'science': require('../../../assets/images/icons/Interests/Science.png'),
  'psychology': require('../../../assets/images/icons/Interests/Psychology.png'),
  'environment': require('../../../assets/images/icons/Interests/Environment.png'),
  'law': require('../../../assets/images/icons/Interests/Law_Civics.png'),
  'travel': require('../../../assets/images/icons/Interests/Travel_Culture.png'),
  'hospitality': require('../../../assets/images/icons/Interests/Hospitality.png'),
  'media': require('../../../assets/images/icons/Interests/Media_Film.png'),
  'education': require('../../../assets/images/icons/Interests/Education_Teaching.png'),
};

const generateKeyFromTitle = (title: string): string => {
  if (!title) return 'default';
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('computer science') || lowerTitle.includes('data science')) return 'computer science';
  if (lowerTitle.includes('business')) return 'business';
  if (lowerTitle.includes('art')) return 'art';
  if (lowerTitle.includes('engineering')) return 'engineering';
  if (lowerTitle.includes('medicine')) return 'medicine';
  if (lowerTitle.includes('science')) return 'science';
  if (lowerTitle.includes('psychology')) return 'psychology';
  if (lowerTitle.includes('environment')) return 'environment';
  if (lowerTitle.includes('law')) return 'law';
  if (lowerTitle.includes('travel')) return 'travel';
  if (lowerTitle.includes('hospitality')) return 'hospitality';
  if (lowerTitle.includes('media')) return 'media';
  if (lowerTitle.includes('education')) return 'education';
  return 'default';
};

interface CategoriesSectionProps {
  onCategorySelect?: (categoryName: string) => void;
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ onCategorySelect }) => {
  // ALL HOOKS FIRST - NEVER CHANGE ORDER
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data, isLoading } = useCategoriesQuery();

  useEffect(() => {
    if (Array.isArray(data)) {
      setCategories(data);
    }
    setLoading(isLoading);
  }, [data, isLoading]);

  // DEFINE COLORS AFTER ALL HOOKS
  const colors = {
    cardBg: isDark ? '#23272F' : '#fff',
    textPrimary: isDark ? '#ffffff' : '#101017',
    textSecondary: isDark ? '#B0B0B0' : '#888',
    showAllColor: isDark ? '#FFFFFF' : '#FFFFFF',
  };

  // CONDITIONAL RENDERING AFTER ALL HOOKS
  if (loading) {
    return <CategoriesSkeleton />;
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={sharedStyles.sectionTitle}>Categories</Text>
        <TouchableOpacity>
          <Text style={[styles.showAll, { color: colors.showAllColor }]}>Show all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {categories.map((cat, i) => {
          const iconKey = generateKeyFromTitle(cat.title);
          const iconSource = CATEGORY_ICONS[iconKey];
          
          return (
            <TouchableOpacity
              key={cat._id || i}
              style={[styles.card, { backgroundColor: colors.cardBg }]}
              onPress={() => onCategorySelect?.(cat.title)}
            >
              {iconSource ? (
                <Image source={iconSource} style={styles.icon} />
              ) : (
                <MaterialIcons name="category" size={36} color={colors.textSecondary} />
              )}
              <Text 
                style={[styles.name, { color: colors.textPrimary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {cat.title}
              </Text>
              <Text style={[styles.count, { color: colors.textSecondary }]}>
                {`${cat.opportunityCount} opportunities`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18, // Changed from 16 to 18 to match FeaturedSection
    marginBottom: 14,
    marginTop: 10,
    opacity: 0.9,
  },
  showAll: {
    fontSize: 14,
    fontWeight: '400',
    height: 20,
    fontFamily: 'UberMoveText-Regular',
  },
  scrollContainer: {
    paddingHorizontal: 18, // Changed from 8 to 18 to match FeaturedSection
  },
  card: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: 126,
    height: 106,
    borderRadius: 20,
    padding: 12,
    marginRight: 5,
    elevation: 2,
  },
  icon: {
    width: 26,
    height: 26,
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    fontFamily: 'UberMoveText-Medium',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  count: {
    fontSize: 12,
    textAlign: 'left',
    fontFamily: 'UberMoveText-Regular',
    letterSpacing: -0.1,
  },
});

export default CategoriesSection;
