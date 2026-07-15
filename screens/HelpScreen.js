import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SECTIONS = [
  {
    id: 'ocr',
    title: '📷 OCR Scan',
    content: [
      { heading: 'How to use', text: 'Tap the Scan tab and press the camera button to capture an ingredient label.' },
      { heading: 'What it does', text: 'The app reads the text from your photo using OCR (Optical Character Recognition), identifies each ingredient, and checks them against our safety database.' },
      { heading: 'Tips', text: 'Make sure the label is well-lit, in focus, and fills most of the camera frame for best results. You can also edit the recognized text before analyzing.' },
    ],
  },
  {
    id: 'barcode',
    title: '📊 Barcode Scan',
    content: [
      { heading: 'How to use', text: 'Tap the Barcode tab and point your camera at a product barcode.' },
      { heading: 'What it does', text: 'The app scans the barcode, retrieves product information from Open Food Facts, and analyzes the ingredient list for health risks.' },
      { heading: 'Tips', text: 'Hold the camera steady and ensure the barcode is clearly visible. Not all products may be in the database.' },
    ],
  },
  {
    id: 'manual',
    title: '✏️ Manual Search',
    content: [
      { heading: 'How to use', text: 'In the Scan tab, type ingredient names separated by commas in the text field, then tap "Check Ingredients".' },
      { heading: 'What it does', text: 'The app searches for each ingredient you typed and returns safety information including severity level, health concerns, and regulatory status.' },
      { heading: 'Tips', text: 'You can enter E-numbers (e.g., E171), ingredient names, or both. Separate multiple ingredients with commas.' },
    ],
  },
  {
    id: 'community',
    title: '🌐 Community',
    content: [
      { heading: 'How to share', text: 'After scanning results, tap the share button to post to the community feed. You can share with your username or anonymously.' },
      { heading: 'Interacting', text: 'Browse other users\u2019 posts, tap to expand ingredient details, and leave comments to discuss findings.' },
      { heading: 'Privacy', text: 'Choose "Anonymously" when sharing to hide your identity. Your username is never shared without your permission.' },
    ],
  },
  {
    id: 'pinned',
    title: '📌 Pinned Items',
    content: [
      { heading: 'How to pin', text: 'After scanning, tap the "Pin Result" button to save results to your profile for quick access later.' },
      { heading: 'Managing pins', text: 'Go to the Pinned tab to view all your saved scans. You can unpin items or share them to the community.' },
      { heading: 'Organizing', text: 'Items are grouped by product and sorted by scan date. Pin results you want to reference or compare later.' },
    ],
  },
  {
    id: 'severity',
    title: '⚠️ Severity Levels',
    content: [
      { heading: 'Critical', color: '#c62828', text: 'Serious health concerns backed by strong scientific evidence. May be banned or restricted in some countries.' },
      { heading: 'High', color: '#ef6c00', text: 'Significant health concerns with notable evidence. Consider avoiding, especially for children and pregnant women.' },
      { heading: 'Medium', color: '#fbc02d', text: 'Moderate concerns. Generally considered safe in small amounts but may affect sensitive individuals.' },
      { heading: 'Low', color: '#2e7d32', text: 'Minimal health concerns. Generally recognized as safe by major food safety authorities.' },
    ],
  },
  {
    id: 'sources',
    title: '📚 Data Sources',
    content: [
      { heading: 'Roots by Benda', text: 'Primary food additive safety database used for ingredient analysis.' },
      { heading: 'JECFA', text: 'Joint FAO/WHO Expert Committee on Food Additives \u2014 international body that evaluates food additive safety.' },
      { heading: 'EFSA', text: 'European Food Safety Authority \u2014 provides independent scientific assessments on food safety in the EU.' },
      { heading: 'FDA', text: 'U.S. Food and Drug Administration \u2014 regulates food additive safety in the United States.' },
      { heading: 'Open Food Facts', text: 'Open-source food product database used for barcode scanning and product information.' },

    ],
  },
];

export default function HelpScreen({ navigation }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Tap a topic to learn more</Text>

        {SECTIONS.map((section) => (
          <View key={section.id} style={styles.sectionCard}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle(section.id)} activeOpacity={0.7}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Ionicons name={expanded[section.id] ? 'chevron-up' : 'chevron-down'} size={20} color="#888" />
            </TouchableOpacity>

            {expanded[section.id] && (
              <View style={styles.sectionBody}>
                {section.content.map((item, idx) => (
                  <View key={idx} style={styles.helpItem}>
                    <View style={styles.helpHeadingRow}>
                      {item.color && <View style={[styles.severityDot, { backgroundColor: item.color }]} />}
                      <Text style={[styles.helpHeading, item.color && { color: item.color }]}>{item.heading}</Text>
                    </View>
                    <Text style={styles.helpText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
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
  subtitle: { fontSize: 14, color: '#888', marginBottom: 16, textAlign: 'center' },
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 18,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  sectionBody: { paddingHorizontal: 18, paddingBottom: 18 },
  helpItem: { marginBottom: 12 },
  helpHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  severityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  helpHeading: { fontSize: 13, fontWeight: '700', color: '#2e7d32', textTransform: 'uppercase', letterSpacing: 0.3 },
  helpText: { fontSize: 14, color: '#555', lineHeight: 20 },
});
