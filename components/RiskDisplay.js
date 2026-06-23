import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function getSeverityStyle(severity) {
  switch (severity) {
    case 'critical': return { bg: '#ffebee', text: '#c62828' };
    case 'high': return { bg: '#fff3e0', text: '#ef6c00' };
    case 'medium': return { bg: '#fffbf2', text: '#fbc02d' };
    default: return { bg: '#e8f5e9', text: '#2e7d32' };
  }
}

function RiskCard({ item, index, isExpanded, onToggle }) {
  const sev = getSeverityStyle(item.severity);
  const displayName = item.eNumber ? `${item.eNumber} - ${item.name}` : item.name;

  return (
    <View style={styles.riskCard}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => onToggle(index)} activeOpacity={0.7}>
        <Text style={styles.riskKeyword} numberOfLines={1}>{displayName}</Text>
        <View style={styles.headerRight}>
          <View style={[styles.severityPill, { backgroundColor: sev.bg }]}>
            <Text style={[styles.severityText, { color: sev.text }]}>
              {String(item.severity || 'N/A').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.expandArrow}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.riskText}>{String(item.risk || 'No description available.')}</Text>

      {isExpanded && (
        <View style={styles.moreSection}>
          {item.category ? (
            <View style={styles.moreRow}>
              <Text style={styles.moreLabel}>Category:</Text>
              <Text style={styles.moreValue}>{item.category}</Text>
            </View>
          ) : null}
          {item.safetyScore ? (
            <View style={styles.moreRow}>
              <Text style={styles.moreLabel}>Safety:</Text>
              <Text style={styles.moreValue}>{item.safetyScore}/10 ({item.safetyScale})</Text>
            </View>
          ) : null}
          {item.iarcGroup ? (
            <View style={styles.moreRow}>
              <Text style={styles.moreLabel}>Cancer classif.:</Text>
              <Text style={styles.moreValue}>{item.iarcGroup}</Text>
            </View>
          ) : null}
          {item.pregnancySafe ? (
            <View style={styles.moreRow}>
              <Text style={styles.moreLabel}>Pregnancy:</Text>
              <Text style={styles.moreValue}>{item.pregnancySafe}</Text>
            </View>
          ) : null}
          {item.childrenSafe ? (
            <View style={styles.moreRow}>
              <Text style={styles.moreLabel}>Children:</Text>
              <Text style={styles.moreValue}>{item.childrenSafe}</Text>
            </View>
          ) : null}
          {item.commonFoods ? (
            <View style={styles.moreRow}>
              <Text style={styles.moreLabel}>Common foods:</Text>
              <Text style={styles.moreValue}>{item.commonFoods}</Text>
            </View>
          ) : null}
          {item.source ? (
            <View style={styles.moreRow}>
              <Text style={styles.moreLabel}>Source:</Text>
              <Text style={[styles.moreValue, styles.moreSource]}>{item.source}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export default function RiskDisplay({ risks, title, onPin, onClear }) {
  const [expanded, setExpanded] = useState(new Set());
  const [showLow, setShowLow] = useState(false);

  const toggleCard = useCallback((index) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  if (!risks || risks.length === 0) return null;

  const sorted = [...risks].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99));
  const withIdx = sorted.map((item, idx) => ({ item, idx }));
  const highRisks = withIdx.filter(({ item }) => item.severity !== 'low');
  const lowRisks = withIdx.filter(({ item }) => item.severity === 'low');

  return (
    <View style={styles.container}>
      <Text style={styles.healthTitle}>{title}</Text>
      <View style={styles.cardContainer}>
        {highRisks.map(({ item, idx }) => (
          <RiskCard
            key={idx}
            item={item}
            index={idx}
            isExpanded={expanded.has(idx)}
            onToggle={toggleCard}
          />
        ))}

        {lowRisks.length > 0 && (
          <TouchableOpacity style={styles.lowToggle} onPress={() => setShowLow(prev => !prev)} activeOpacity={0.7}>
            <Text style={styles.lowToggleText}>
              {showLow ? '▲ Hide' : '▼ Show'} {lowRisks.length} low severity {lowRisks.length === 1 ? 'item' : 'items'}
            </Text>
          </TouchableOpacity>
        )}

        {showLow && lowRisks.map(({ item, idx }) => (
          <RiskCard
            key={idx}
            item={item}
            index={idx}
            isExpanded={expanded.has(idx)}
            onToggle={toggleCard}
          />
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.pinButton} onPress={onPin} activeOpacity={0.8}>
          <Text style={styles.pinButtonText}>📌 Pin Result</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={onClear} activeOpacity={0.6}>
          <Text style={styles.clearButtonText}>✕ Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 25, alignItems: 'center' },
  healthTitle: { fontSize: 20, fontWeight: '900', color: '#1b5e20', marginBottom: 15, letterSpacing: 0.5 },
  cardContainer: { marginBottom: 15 },
  riskCard: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskKeyword: { fontSize: 18, fontWeight: '800', color: '#333', flex: 1, marginRight: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  severityPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  severityText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  expandArrow: { fontSize: 14, color: '#999', marginLeft: 10, fontWeight: '700' },
  riskText: { fontSize: 15, color: '#555', lineHeight: 22, fontWeight: '500' },
  moreSection: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  moreRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  moreLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    width: 110,
  },
  moreValue: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  moreSource: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  pinButton: {
    flex: 1,
    marginRight: 15,
    backgroundColor: '#208623',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lowToggle: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#f0faf0',
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dcedc8',
  },
  lowToggleText: { fontSize: 14, fontWeight: '700', color: '#558b2f' },
  pinButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.8 },
  clearButton: { padding: 15, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 16 },
  clearButtonText: { color: '#757575', fontWeight: 'bold', fontSize: 15 },
});
