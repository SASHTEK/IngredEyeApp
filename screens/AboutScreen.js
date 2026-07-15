import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.appCard}>
          <Text style={styles.appIcon}>📷</Text>
          <Text style={styles.appName}>IngredEye Scanner</Text>
          <Text style={styles.tagline}>Safety at your fingertips</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>

        <View style={styles.creditCard}>
          <Text style={styles.creditLabel}>Designed and Created by</Text>
          <Text style={styles.creditName}>Shashika Kulasekara</Text>
          <Text style={styles.creditDept}>BIT, Faculty of IT</Text>
          <Text style={styles.creditUni}>University of Moratuwa</Text>
        </View>

        <View style={styles.sourcesCard}>
          <Text style={styles.sourcesTitle}>Data Sources</Text>

          <View style={styles.sourceItem}>
            <Text style={styles.sourceBullet}>•</Text>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>Roots by Benda</Text>
              <Text style={styles.sourceDesc}>Food additive safety database</Text>
            </View>
          </View>

          <View style={styles.sourceItem}>
            <Text style={styles.sourceBullet}>•</Text>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>JECFA</Text>
              <Text style={styles.sourceDesc}>Joint FAO/WHO Expert Committee on Food Additives</Text>
            </View>
          </View>

          <View style={styles.sourceItem}>
            <Text style={styles.sourceBullet}>•</Text>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>EFSA</Text>
              <Text style={styles.sourceDesc}>European Food Safety Authority</Text>
            </View>
          </View>

          <View style={styles.sourceItem}>
            <Text style={styles.sourceBullet}>•</Text>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>FDA</Text>
              <Text style={styles.sourceDesc}>U.S. Food and Drug Administration</Text>
            </View>
          </View>

          <View style={styles.sourceItem}>
            <Text style={styles.sourceBullet}>•</Text>
            <View style={styles.sourceInfo}>
              <Text style={styles.sourceName}>Open Food Facts</Text>
              <Text style={styles.sourceDesc}>Open product database for barcode data</Text>
            </View>
          </View>

        </View>

        <Text style={styles.footer}>
          Built with React Native & Expo
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8faf8' },
  header: {
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  content: { padding: 20, paddingBottom: 40 },
  appCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 16,
  },
  appIcon: { fontSize: 48, marginBottom: 10 },
  appName: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32', marginBottom: 4 },
  tagline: { fontSize: 14, color: '#888', marginBottom: 8 },
  version: { fontSize: 13, color: '#bbb', fontWeight: '600' },
  creditCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center',
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  creditLabel: { fontSize: 13, color: '#888', marginBottom: 8 },
  creditName: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  creditDept: { fontSize: 14, color: '#555', marginBottom: 2 },
  creditUni: { fontSize: 14, color: '#555', fontWeight: '600' },
  sourcesCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 16,
  },
  sourcesTitle: { fontSize: 17, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  sourceItem: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },
  sourceBullet: { fontSize: 14, color: '#2e7d32', marginRight: 10, marginTop: 2 },
  sourceInfo: { flex: 1 },
  sourceName: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 2 },
  sourceDesc: { fontSize: 13, color: '#777', lineHeight: 18 },
  footer: { textAlign: 'center', fontSize: 12, color: '#ccc', marginTop: 8 },
});
