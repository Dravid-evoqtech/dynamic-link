import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Background from './components/Background';
import BackButton from './components/BackButton';
import { useTheme } from '../hooks/useThemeContext';
import { useRouter } from 'expo-router';
import { useStandardizedAlert } from './hooks/useStandardizedAlert';

// Notification service removed; using local types and in-memory list
export interface Notification {
  id: string;
  type: 'opportunity' | 'application' | 'achievement' | 'reminder' | 'message' | 'digest';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const { width } = Dimensions.get('window');

const NotificationsScreen = () => {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { showError, showSuccess, showInfo, AlertComponent } = useStandardizedAlert();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Local mock notifications only
      const mockNotifications: Notification[] = [
        { id: '1', type: 'achievement', title: 'Achievement Unlocked!', message: 'Congrats on completing your profile.', timestamp: '2 hours ago', isRead: false },
        { id: '2', type: 'opportunity', title: 'New Matches', message: '3 opportunities match your interests.', timestamp: '4 hours ago', isRead: false },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = async (notificationId: string) => {
    showInfo(
      'Delete Notification',
      'Are you sure you want to delete this notification?'
    );
    // For now, just delete directly. In a full implementation, you'd create a custom confirmation modal
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getFilteredNotifications = () => {
    switch (selectedFilter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'read':
        return notifications.filter(n => n.isRead);
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return require('../assets/images/icons/trophyicon.png');
      case 'opportunity':
        return require('../assets/icons/myprofile/opportunitypreference.png');
      case 'application':
        return require('../assets/icons/applicationicon.png');
      case 'reminder':
        return require('../assets/icons/clockicon.png');
      case 'message':
        return require('../assets/icons/mail-line.png');
      case 'digest':
        return require('../assets/icons/analytics.png');
      default:
        return require('../assets/icons/bell(L).png');
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return '#F093FB';
      case 'opportunity':
        return '#0F80FA';
      case 'application':
        return '#22B364';
      case 'reminder':
        return '#FF9500';
      case 'message':
        return '#AF52DE';
      case 'digest':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { 
          backgroundColor: isDark ? '#23272F' : '#fff',
          borderLeftColor: getNotificationColor(item.type),
          opacity: item.isRead ? 0.7 : 1,
        }
      ]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Image
            source={getNotificationIcon(item.type)}
            style={[styles.notificationIcon, { tintColor: getNotificationColor(item.type) }]}
          />
          <View style={styles.notificationText}>
            <Text style={[styles.notificationTitle, { color: isDark ? '#fff' : '#101017' }]}>
              {item.title}
            </Text>
            <Text style={[styles.notificationMessage, { color: isDark ? '#B0B0B0' : '#6D6D73' }]}>
              {item.message}
            </Text>
            <Text style={[styles.notificationTime, { color: isDark ? '#8E8E93' : '#8E8E93' }]}>
              {item.timestamp}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => deleteNotification(item.id)}
          style={styles.deleteButton}
        >
          <Text style={[styles.deleteText, { color: '#FF3B30' }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: getNotificationColor(item.type) }]} />}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTextContainer}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>{notifications.length} Notifications</Text>
        </View>
      </View>
      <View style={styles.headerIconWrapper}>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllReadButton}>
          <Text style={styles.markAllReadText}>Mark All Read</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {(['all', 'unread', 'read'] as const).map((filter, index) => (
        <React.Fragment key={filter}>
          <TouchableOpacity
            style={[
              styles.filterItem,
              selectedFilter === filter && styles.filterItemSelected,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextSelected,
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
          {index < 2 && (
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <Background>
      <View style={styles.container}>
        {renderHeader()}
        {renderFilters()}
        
        <FlatList
          data={getFilteredNotifications()}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Image
                source={require('../assets/icons/bell(L).png')}
                style={[styles.emptyIcon, { tintColor: isDark ? '#8E8E93' : '#8E8E93' }]}
              />
              <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#101017' }]}>
                No notifications
              </Text>
              <Text style={[styles.emptyMessage, { color: isDark ? '#B0B0B0' : '#6D6D73' }]}>
                {selectedFilter === 'all' 
                  ? 'You\'re all caught up!' 
                  : `No ${selectedFilter} notifications`
                }
              </Text>
            </View>
          }
        />
      </View>
    <AlertComponent />
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  headerContainer: {
    flexDirection: 'row',
    marginTop: 53,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  titleContainer: {
    flex: 1,
  },
  headerIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: 'white',
    fontFamily: 'Uber Move Text',
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.02 * 24,
    verticalAlign: 'middle',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'white',
    fontFamily: 'Uber Move Text',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
    opacity: 0.7,
  },
  markAllReadButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'UberMoveText-Medium',
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 336,
    marginTop: 12,
    marginBottom: 18,
    alignSelf: 'center',
    padding: 3,
  },
  filterItem: {
    width: 111.33,
    height: 34,
    borderRadius: 7,
    opacity: 1,
    paddingRight: 10,
    paddingLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '0deg' }],
  },
  filterItemSelected: {
    backgroundColor: 'white',
    borderRadius: 10,
    flex: 1,
  },
  dividerContainer: {
    width: 1,
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 12,
    borderRadius: 100,
    opacity: 1,
    backgroundColor: 'rgba(219, 219, 221, 1)',
    transform: [{ rotate: '0deg' }],
  },
  filterText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'UberMoveText-Medium',
    letterSpacing: -0.08,
    lineHeight: 16,
  },
  filterTextSelected: {
    color: '#101017',
    fontWeight: '500',
    fontSize: 13,
    fontFamily: 'UberMoveText-Medium',
    lineHeight: 16,
  },
  notificationsList: {
    width: 339,
    paddingBottom: 110,
    alignSelf: 'center',
    gap: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
    marginBottom: 4,
    lineHeight: 22,
  },
  notificationMessage: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'UberMoveText-Regular',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'UberMoveText-Regular',
    opacity: 0.7,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'UberMoveText-Medium',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'UberMoveText-Medium',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'UberMoveText-Regular',
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default NotificationsScreen; 