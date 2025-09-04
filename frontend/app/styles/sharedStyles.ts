import { StyleSheet } from 'react-native';

const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF1A',
  },
   gradientBackground: {
    flex: 1,
    position: 'relative',
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 60,
    zIndex: 1,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 2,
    zIndex: 1,
  },
  navigationBar: {
    padding: 16,
    backgroundColor: '#fff',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  searchBar: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterIcon: {
    width: 24,
    height: 24,
  },
   sectionTitle: {
    fontSize: 18,
    color: "white",
    marginLeft: 5,
    fontFamily: 'UberMoveText-Medium',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  categoryCard: {
    marginRight: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
  },
  featuredContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: 250,
    marginRight: 12,
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 12,
  },
  allOpportunitiesContainer: {
    paddingHorizontal: 16,
  },
  opportunityCard: {
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  tabBar: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default sharedStyles;
