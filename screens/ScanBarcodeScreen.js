import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, SafeAreaView, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../utils/supabaseClient';
import { generateBatchId, checkIngredientsDb, pinItemsToDb } from '../utils/ingredientUtils';
import { sharePost } from '../utils/communityUtils';
import RiskDisplay from '../components/RiskDisplay';

export default function ScanBarcodeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [product, setProduct] = useState(null);
  const [healthRisks, setHealthRisks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [scanned, setScanned] = useState(false);

  // Get user ID
  useEffect(() => {
    if (!permission) requestPermission();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [permission]);

  // Scan barcode process
  const onBarcodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    const newId = generateBatchId();
    setBatchId(newId);

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      const json = await res.json();
      if (json.status === 1) {
        setProduct(json.product);
        const risks = await checkIngredientsDb(json.product.ingredients_text);
        setHealthRisks(risks);
      } else {
        // Alert.alert("Not Found", "Product not in Open Food Facts database.", [{ text: "OK", onPress: resetScanner }]);
      }
    } catch (e) { 
      Alert.alert("Error", "Network error. Please try again.", [{ text: "OK", onPress: resetScanner }]); 
    } finally {
      setLoading(false);
    }
  };

  // Reset for new scan
  const resetScanner = () => {
    setScanned(false);
    setHealthRisks([]);
    setProduct(null);
  };

  // Set results to Pin
  const handlePin = async () => {
    const items = healthRisks.map(r => ({
      user_id: user?.id,
      keyword: r.name,
      risk: r.risk,
      severity: r.severity,
      e_number: r.eNumber,
      category: r.category,
      safety_score: r.safetyScore,
      iarc_group: r.iarcGroup,
      pregnancy_safe: r.pregnancySafe,
      children_safe: r.childrenSafe,
      common_foods: r.commonFoods,
      source: 'barcode',
      batch_id: batchId,
      product_name: product?.product_name || "Unknown Product",
      brand: product?.brands || "Unknown Brand"
    }));
    const res = await pinItemsToDb(user, items);
    if (res.success) {
      Alert.alert("Pinned!", "Share this with the community?", [
        { text: "👤 With My Username", onPress: () => handleShareFromBarcode(items, false) },
        { text: "👻 Anonymously", onPress: () => handleShareFromBarcode(items, true) },
        { text: "Not Now" }
      ]);
    } else {
      Alert.alert("Error", res.error || "Failed to pin.");
    }
  };

  const handleShareFromBarcode = async (items, anonymous) => {
    const result = await sharePost(user, {
      product_name: product?.product_name || "Unknown Product",
      brand: product?.brands || "Unknown Brand",
      batch_id: batchId,
      items: items.map(i => ({ keyword: i.keyword, risk: i.risk, severity: i.severity, e_number: i.e_number, category: i.category, safety_score: i.safety_score, iarc_group: i.iarc_group, pregnancy_safe: i.pregnancy_safe, children_safe: i.children_safe, common_foods: i.common_foods })),
      caption: '',
      is_anonymous: anonymous,
    });
    Alert.alert(result.success ? "Shared!" : "Error", result.success ? "Posted to community." : result.error);
  };

  if (!permission?.granted) return <View style={styles.center}><Text>Camera access is required.</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      {!scanned ? (
        <View style={StyleSheet.absoluteFill}>
          <CameraView 
            style={StyleSheet.absoluteFill} 
            onBarcodeScanned={onBarcodeScanned} 
          />
          <View style={styles.overlayArea}>
            <View style={styles.scanTarget} />
            <View style={styles.brandingContainer}>
              <Text style={styles.brandingTitle}>IngredEye Barcode Scanner</Text>
              <Text style={styles.brandingSubtitle}>Scan to uncover product details</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultOverlay}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Fetching product details...</Text>
            </View>
          ) : (
            <View style={styles.cardWrapper}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.productTitle}>{product?.product_name || "Product Not Found"}</Text>
                {product?.brands && <Text style={styles.brandSubtitle}>{product.brands}</Text>}

                <View style={styles.divider} />

                {healthRisks && healthRisks.length > 0 ? (
                  <RiskDisplay
                    risks={healthRisks}
                    title="Ingredients Risk Analysis"
                    onPin={handlePin}
                    onClear={resetScanner}
                  />
                ) : (
                  <View style={styles.noRiskContainer}>
                    <Text style={styles.noRiskText}>No enough data with barcode to find about harmful ingredients in our database for this product.</Text>
                    
                    <TouchableOpacity 
                      style={styles.closeButton} 
                      onPress={resetScanner}
                    >
                      <Text style={styles.closeButtonText}>Scan Another Product</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  overlayArea: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  scanTarget: { width: 250, height: 250, borderWidth: 2, borderColor: '#fff', borderRadius: 20, backgroundColor: 'transparent' },
  brandingContainer: { position: 'absolute', bottom: 60, alignItems: 'center', width: '100%' },
  brandingTitle: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
  brandingSubtitle: { fontSize: 14, color: '#fff', marginTop: 5, fontWeight: '500' },

  resultOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  loadingContainer: { alignItems: 'center' },
  loadingText: { color: '#14ad3d', marginTop: 10, fontSize: 16 },
  cardWrapper: { backgroundColor: '#fff', borderRadius: 25, maxHeight: '85%', overflow: 'hidden', padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  scrollContent: { paddingBottom: 20 },
  productTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', color: '#1b5e20' },
  brandSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 4, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15, width: '80%', alignSelf: 'center' },

  noRiskContainer: {padding: 20, alignItems: 'center', justifyContent: 'center' },
  noRiskText: {fontSize: 16, color: '#2e7d32', textAlign: 'center', fontWeight: '600', marginBottom: 25, lineHeight: 22 },
  closeButton: {backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, elevation: 2},
  closeButtonText: {color: '#fff', fontWeight: 'bold', fontSize: 16, },

});