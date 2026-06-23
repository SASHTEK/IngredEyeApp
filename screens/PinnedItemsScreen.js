import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  SafeAreaView, 
  TextInput, 
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { supabase } from '../utils/supabaseClient';
import { sharePost } from '../utils/communityUtils';

export default function PinnedItemsScreen() {
  const [groupedItems, setGroupedItems] = useState({});
  const [filterSeverity, setFilterSeverity] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareModalVisible, setShareModalVisible] = useState(false);
const [shareBatch, setShareBatch] = useState(null);
const [shareAnonymous, setShareAnonymous] = useState(false);
const [shareCaption, setShareCaption] = useState('');
const [showLowItems, setShowLowItems] = useState(false);

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error) setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) fetchPinnedItems(user.id);
  }, [user, sortOrder]);

  // Initial load and pull to refresh
  const fetchPinnedItems = async (userId, isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from('pinned_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: sortOrder === "asc" });

    if (error) {
      console.error("Fetch error:", error.message);
      Alert.alert("Error", "Failed to sync pinned items.");
    } else {
      const grouped = {};
      data.forEach(item => {
        if (!grouped[item.batch_id]) {
          grouped[item.batch_id] = {
            product_name: item.product_name,
            brand: item.brand,
            source: item.source,
            created_at: item.created_at,
            items: []
          };
        }
        grouped[item.batch_id].items.push(item);
      });
      setGroupedItems(grouped);
    }

    setLoading(false);
    setRefreshing(false);
  };

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    if (user) {
      fetchPinnedItems(user.id, true);
    }
  }, [user, sortOrder]);

  // Un pin items
  const unpinBatch = (batchId) => {
    Alert.alert(
      "Remove Pinned Item",
      "Are you sure you want to remove this from your pinned items?", 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          onPress: async () => {
            const { error } = await supabase.from('pinned_items').delete().eq('batch_id', batchId);
            if (!error) {
              const updated = { ...groupedItems };
              delete updated[batchId];
              setGroupedItems(updated);
            } else {
              Alert.alert("Error", "Could not remove item.");
            }
          },
          style: "destructive" 
        }
      ]
    );
  };

  const openShareModal = (batchId, group) => {
    setShareBatch({ batchId, ...group });
    setShareAnonymous(false);
    setShareCaption('');
    setShareModalVisible(true);
  };

  const handleShareSubmit = async () => {
    if (!shareBatch || !user) return;
    const result = await sharePost(user, {
      product_name: shareBatch.product_name || 'Unknown Product',
      brand: shareBatch.brand || 'N/A',
      batch_id: shareBatch.batchId,
      items: shareBatch.items.map(i => ({ keyword: i.keyword, risk: i.risk, severity: i.severity })),
      caption: shareCaption,
      is_anonymous: shareAnonymous,
    });
    setShareModalVisible(false);
    Alert.alert(result.success ? "Shared!" : "Error", result.success ? "Posted to community feed." : result.error);
  };

  // Sort data function
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Filter data function
  const getFilteredData = () => {
    return Object.entries(groupedItems).filter(([batchId, group]) => {
      const matchesSearch = 
        group.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.items.some(item => item.keyword.toLowerCase().includes(searchQuery.toLowerCase()));

      const hasMatchingSeverity = group.items.some(item => !filterSeverity || item.severity === filterSeverity);

      return matchesSearch && hasMatchingSeverity;
    });
  };

  // Get sevrerity colors
  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'critical': return { bg: '#ffebee', text: '#c62828' };
      case 'high': return { bg: '#fff3e0', text: '#ef6c00' };
      case 'medium': return { bg: '#fffbf2', text: '#fbc02d' };
      case 'low': return { bg: '#e8f5e9', text: '#2e7d32' };
      default: return { bg: '#f5f5f5', text: '#333' };
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <Text style={styles.title}>📌 Pinned Products</Text>
        </View>

        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products or ingredients..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.controls}>
          <Text style={styles.controlLabel}>Severity Filter:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {["critical", "high", "medium", "low", null].map(sev => (
              <TouchableOpacity
                key={sev || "all"}
                style={[styles.controlButton, filterSeverity === sev && styles.activeButton]}
                onPress={() => setFilterSeverity(sev)}
              >
                <Text style={[styles.controlText, filterSeverity === sev && styles.activeText]}>
                  {sev ? sev.charAt(0).toUpperCase() + sev.slice(1) : "All"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sortRow}>
            <Text style={styles.controlLabel}>Sort:</Text>
            {["desc", "asc"].map(order => (
              <TouchableOpacity
                key={order}
                style={[styles.controlButton, sortOrder === order && styles.activeButton]}
                onPress={() => setSortOrder(order)}
              >
                <Text style={[styles.controlText, sortOrder === order && styles.activeText]}>
                  {order === "desc" ? "Newest" : "Oldest"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {loading && !refreshing && <ActivityIndicator color="#2e7d32" style={{ marginVertical: 10 }} />}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2e7d32"   // iOS Spinner Color
            colors={['#2e7d32']} // Android Spinner Color
          />
        }
      >
        {getFilteredData().length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No matching items found.</Text>
            <Text style={styles.emptySub}>Pull down to refresh list</Text>
          </View>
        ) : (
          getFilteredData().map(([batchId, group]) => {
            let visibleItems = group.items.filter(item => !filterSeverity || item.severity === filterSeverity);

            visibleItems = [...visibleItems].sort((a, b) => {
              const sa = SEVERITY_ORDER[a.severity] ?? 99;
              const sb = SEVERITY_ORDER[b.severity] ?? 99;
              return sa - sb;
            });

            const highItems = visibleItems.filter(i => i.severity !== 'low');
            const lowItems = visibleItems.filter(i => i.severity === 'low');

            return (
              <View key={batchId} style={styles.card}>
                <Text style={styles.productName}>{group.product_name || "Unknown Product"}</Text>
                {group.brand && <Text style={styles.brand}>{group.brand}</Text>}
                <Text style={styles.timestamp}>Pinned on {formatDate(group.created_at)}</Text>

                {highItems.map(item => {
                  const sevStyle = getSeverityStyle(item.severity);
                  return (
                    <View key={item.id} style={styles.riskCard}>
                      <Text style={styles.keyword}>{item.keyword}</Text>
                      <View style={styles.severityWrapper}>
                        <Text style={styles.severityLabel}>Severity:</Text>
                        <View style={[styles.severityPill, { backgroundColor: sevStyle.bg }]}>
                          <Text style={[styles.severityText, { color: sevStyle.text }]}>
                            {item.severity.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.risk}>{item.risk}</Text>
                    </View>
                  );
                })}

                {lowItems.length > 0 && (
                  <>
                    <TouchableOpacity style={styles.lowToggle} onPress={() => setShowLowItems(prev => !prev)}>
                      <Text style={styles.lowToggleText}>
                        {showLowItems ? '▲' : '▼'} {lowItems.length} Low Severity
                      </Text>
                    </TouchableOpacity>
                    {showLowItems && lowItems.map(item => {
                      const sevStyle = getSeverityStyle(item.severity);
                      return (
                        <View key={item.id} style={styles.riskCard}>
                          <Text style={styles.keyword}>{item.keyword}</Text>
                          <View style={styles.severityWrapper}>
                            <Text style={styles.severityLabel}>Severity:</Text>
                            <View style={[styles.severityPill, { backgroundColor: sevStyle.bg }]}>
                              <Text style={[styles.severityText, { color: sevStyle.text }]}>
                                {item.severity.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.risk}>{item.risk}</Text>
                        </View>
                      );
                    })}
                  </>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.shareButton} onPress={() => openShareModal(batchId, group)}>
                    <Text style={styles.shareText}>🌐 Share to Community</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.unpinButton} onPress={() => unpinBatch(batchId)}>
                    <Text style={styles.unpinText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 50 }} />
      </ScrollView>

      <Modal visible={shareModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share to Community</Text>

            {shareBatch && (
              <Text style={styles.modalProduct}>{shareBatch.product_name}</Text>
            )}

            <View style={styles.shareOptions}>
              <TouchableOpacity
                style={[styles.shareOption, !shareAnonymous && styles.shareOptionActive]}
                onPress={() => setShareAnonymous(false)}
              >
                <Text style={styles.shareOptionIcon}>👤</Text>
                <Text style={[styles.shareOptionText, !shareAnonymous && styles.shareOptionTextActive]}>With Username</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareOption, shareAnonymous && styles.shareOptionActive]}
                onPress={() => setShareAnonymous(true)}
              >
                <Text style={styles.shareOptionIcon}>👻</Text>
                <Text style={[styles.shareOptionText, shareAnonymous && styles.shareOptionTextActive]}>Anonymous</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption (optional)..."
              placeholderTextColor="#999"
              value={shareCaption}
              onChangeText={setShareCaption}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShareModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleShareSubmit}>
                <Text style={styles.saveText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8faf8' },
  fixedHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 10
  },
  header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 25, fontWeight: 'bold', color: '#2e7d32' },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f0',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  searchInput: {flex: 1, paddingVertical: 12, paddingHorizontal: 5, fontSize: 16, color: '#333' },
  clearButton: {padding: 5, backgroundColor: '#ccc', borderRadius: 15, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', arginLeft: 5 },
  clearButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  controls: { marginBottom: 5 },
  filterScroll: { marginBottom: 10 },
  sortRow: { flexDirection: 'row', alignItems: 'center' },
  controlLabel: { fontSize: 11, fontWeight: '800', color: '#999', marginRight: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  controlButton: {backgroundColor: '#f0f2f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginRight: 8 },
  activeButton: { backgroundColor: '#2e7d32' },
  controlText: { fontSize: 13, color: '#555', fontWeight: '600' },
  activeText: { color: '#fff' },
  scrollContent: { padding: 20 },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20' },
  brand: { fontSize: 14, color: '#666', marginBottom: 4 },
  timestamp: { fontSize: 11, color: '#999', marginBottom: 15 },
  riskCard: { borderLeftWidth: 4, borderLeftColor: '#e0e0e0', paddingLeft: 12, marginBottom: 15 },
  keyword: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  severityWrapper: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  severityLabel: { color: '#000', fontWeight: 'bold', fontSize: 13, marginRight: 6 },
  severityPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  severityText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  risk: { fontSize: 14, color: '#444', lineHeight: 20 },
  lowToggle: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f5f5f5', borderRadius: 10, marginTop: 8, alignSelf: 'flex-start' },
  lowToggleText: { color: '#666', fontWeight: '600', fontSize: 13 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  shareButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#e8f5e9', borderRadius: 10 },
  shareText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 13 },
  unpinButton: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#ffebee', borderRadius: 10 },
  unpinText: { color: '#c62828', fontWeight: 'bold', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 24, padding: 25, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1b5e20', marginBottom: 8, alignSelf: 'center' },
  modalProduct: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  shareOptions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  shareOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderColor: '#ddd', flex: 1, justifyContent: 'center' },
  shareOptionActive: { borderColor: '#2e7d32', backgroundColor: '#e8f5e9' },
  shareOptionIcon: { fontSize: 16, marginRight: 6 },
  shareOptionText: { fontWeight: '600', color: '#666' },
  shareOptionTextActive: { color: '#2e7d32' },
  captionInput: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, fontSize: 14, color: '#333', minHeight: 60, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12 },
  saveBtn: { flex: 1, backgroundColor: '#2e7d32', padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#888', fontWeight: '600', fontSize: 15 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  empty: { color: '#999', fontSize: 16, fontWeight: '600' },
  emptySub: { color: '#bbb', fontSize: 13, marginTop: 5 }
});