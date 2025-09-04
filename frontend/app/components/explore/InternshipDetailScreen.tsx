import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const InternshipDetailScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Stoodive Summer Internship</Text>
      <View style={styles.card}>
        <Text style={styles.title}>Founding Engineer Internship</Text>
        <Text style={styles.subtitle}>Stoodive (YC Backed)</Text>

        <View style={styles.tags}>
          <Text style={styles.tag}>Internship</Text>
          <Text style={styles.tag}>Paid</Text>
          <Text style={styles.tag}>Remote</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Start Date</Text>
            <Text style={styles.infoValue}>July 10, 2025</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>6 weeks</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Eligibility</Text>
            <Text style={styles.infoValue}>Grade 9+</Text>
          </View>
        </View>

        <View style={styles.description}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            Join Stoodive’s engineering team and contribute to real projects in design, development, and team collaboration. Perfect for ambitious high school students looking for practical exposure.
          </Text>
        </View>

        <TouchableOpacity style={styles.applyBtn}>
          <Text style={styles.applyBtnText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F2F7FE',
  },
  header: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 16,
    color: '#0676EF',
    fontFamily: 'UberMoveText-Semibold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#101017',
    fontFamily: 'UberMoveText-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    fontFamily: 'UberMoveText-Regular',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#E6F0FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500',
    color: '#0676EF',
    fontFamily: 'UberMoveText-Medium',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontFamily: 'UberMoveText-Light',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#101017',
    fontFamily: 'UberMoveText-Medium',
  },
  description: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'UberMoveText-Medium',
    color: '#101017',
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#333',
    fontFamily: 'UberMoveText-Regular',
  },
  applyBtn: {
    backgroundColor: '#0676EF',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'UberMoveText-Medium',
  },
});

export default InternshipDetailScreen;
