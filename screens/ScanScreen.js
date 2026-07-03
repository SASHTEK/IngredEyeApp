import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  ActivityIndicator,
  Modal,
  Animated
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { supabase } from '../utils/supabaseClient';
import { generateBatchId, checkIngredientsDb, pinItemsToDb } from '../utils/ingredientUtils';
import { sharePost } from '../utils/communityUtils';
import RiskDisplay from '../components/RiskDisplay';

export default function ScanScreen() {
  const [manualInput, setManualInput] = useState('');
  const [ocrResults, setOcrResults] = useState([]);
  const [manualResults, setManualResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...'); // Status update
  const [user, setUser] = useState(null);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [lastAction, setLastAction] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [customProductName, setCustomProductName] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [tempRisks, setTempRisks] = useState([]);
  const [tempType, setTempType] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current; // Pulse animation value

  // Get user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Trigger pulse animation
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading]);

  // OCR scan operation
  const handleOcrScan = async () => {
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (result.canceled) return;
    
    const uri = result.assets[0].uri;
    setImageUri(uri);
    setLoading(true);
    setLoadingMessage('Reading label text...');

    try {
      const manip = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], { format: 'jpeg' });
      
      setLoadingMessage('Analyzing ingredients...');
      const result = await TextRecognition.recognize(manip.uri);
      const text = result.text;
      
      setLoadingMessage('Checking safety risks...'); // Status update
      const newId = generateBatchId();
      setCurrentBatchId(newId);
      
      const risks = await checkIngredientsDb(text);
      if (risks.length === 0) {
        Alert.alert("Clean!", "No harmful ingredients detected.");
        setImageUri(null);
      }
      
      setOcrResults(risks);
      setLastAction('ocr');
    } catch (err) {
      const msg = err?.message || String(err);
      Alert.alert("OCR Error", msg);
    } finally {
      setLoading(false);
    }
  };

  // Manual ingredient check operation
  const handleManualCheck = async () => {
    if (!manualInput.trim()) return;
    setLoading(true);
    setLoadingMessage('Searching database...');
    
    const newId = generateBatchId();
    setCurrentBatchId(newId);
    
    const risks = await checkIngredientsDb(manualInput);
    if (risks.length === 0) Alert.alert("Clean", "No matching risks found.");
    
    setManualResults(risks);
    setLastAction('manual');
    setManualInput('');
    setLoading(false);
  };

  const clearOcr = () => { setOcrResults([]); setImageUri(null); };
  const clearManual = () => { setManualResults([]); setManualInput(''); };

  // Pin action
  const pinAction = (risks, type) => {
    setTempRisks(risks);
    setTempType(type);
    setCustomProductName(type === 'ocr' ? "Camera Scan" : "Manual Entry");
    setCustomBrand("");
    setIsModalVisible(true);
  };

  const confirmPin = async () => {
    setIsModalVisible(false);
    setLoading(true);
    setLoadingMessage('Saving to profile...');

    const items = tempRisks.map(r => ({
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
      source: tempType,
      batch_id: currentBatchId,
      product_name: customProductName || (tempType === 'ocr' ? "Camera Scan" : "Manual Entry"),
      brand: customBrand || "N/A"
    }));

    const res = await pinItemsToDb(user, items);
    setLoading(false);
    if (res.success) {
      Alert.alert("Pinned!", "Share this with the community?", [
        { text: "👤 With My Username", onPress: () => handleShareFromScan(items, false) },
        { text: "👻 Anonymously", onPress: () => handleShareFromScan(items, true) },
        { text: "Not Now" }
      ]);
    } else {
      Alert.alert("Error", res.error || "Failed to pin.");
    }
  };

  const handleShareFromScan = async (items, anonymous) => {
    const result = await sharePost(user, {
      product_name: customProductName || (tempType === 'ocr' ? "Camera Scan" : "Manual Entry"),
      brand: customBrand || "N/A",
      batch_id: currentBatchId,
      items: items.map(i => ({ keyword: i.keyword, risk: i.risk, severity: i.severity, e_number: i.e_number, category: i.category, safety_score: i.safety_score, iarc_group: i.iarc_group, pregnancy_safe: i.pregnancy_safe, children_safe: i.children_safe, common_foods: i.common_foods })),
      caption: '',
      is_anonymous: anonymous,
    });
    Alert.alert(result.success ? "Shared!" : "Error", result.success ? "Posted to community." : result.error);
  };

  //Pulse animation
  const renderLoading = () => (
    <Animated.View style={[styles.loadingContainer, { opacity: pulseAnim }]}>
      <ActivityIndicator size="large" color="#2e7d32" />
      <Text style={styles.loadingText}>{loadingMessage}</Text>
    </Animated.View>
  );

return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.mainContainer}>
      
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save to Pinned</Text>
            <Text style={styles.inputLabel}>Product Name</Text>
            <TextInput style={styles.modalInput} value={customProductName} onChangeText={setCustomProductName} placeholder="e.g. Noodles" autoFocus />
            <Text style={styles.inputLabel}>Brand (Optional)</Text>
            <TextInput style={styles.modalInput} value={customBrand} onChangeText={setCustomBrand} placeholder="e.g. Brand Name" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={confirmPin}><Text style={styles.saveText}>Save Pin</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
          <Text style={styles.headerTitle}>📷 IngredEye Scanner</Text>
          <Text style={styles.headerSubtitle}>Safety at your fingertips</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        

        <View style={styles.spacer} />

        <View style={styles.actionCard}>
          <Text style={styles.sectionLabel}>Quick Scan</Text>
          <TouchableOpacity style={styles.mainButton} onPress={handleOcrScan}>
            <Text style={styles.buttonText}>📷 Scan Label</Text>
          </TouchableOpacity>
          <View style={styles.separatorContainer}><View style={styles.line} /><Text style={styles.separatorText}>OR SEARCH TEXT</Text><View style={styles.line} /></View>
          <TextInput style={styles.input} placeholder="Type ingredients..." placeholderTextColor="#999" onChangeText={setManualInput} value={manualInput} returnKeyType="search" onSubmitEditing={handleManualCheck} />
          <TouchableOpacity style={[styles.mainButton, styles.manualButton]} onPress={handleManualCheck}>
            <Text style={styles.buttonText}>🔍 Check Now</Text>
          </TouchableOpacity>
        </View>

        {loading ? renderLoading() : (
          <>
            {lastAction === 'manual' ? (
              <>
                <RiskDisplay risks={manualResults} title="Manual Analysis" onPin={() => pinAction(manualResults, 'manual')} onClear={clearManual} />
                <RiskDisplay risks={ocrResults} title="Scan Analysis" onPin={() => pinAction(ocrResults, 'ocr')} onClear={clearOcr} />
              </>
            ) : (
              <>
                <RiskDisplay risks={ocrResults} title="Scan Analysis" onPin={() => pinAction(ocrResults, 'ocr')} onClear={clearOcr} />
                <RiskDisplay risks={manualResults} title="Manual Analysis" onPin={() => pinAction(manualResults, 'manual')} onClear={clearManual} />
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F2F4F2' },
  scrollContainer: { paddingHorizontal: 25 },
  header: {paddingTop:50, alignItems: 'center', paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  headerTitle: { fontSize: 25, fontWeight: '800', color: '#2e7d32' },
  headerSubtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  spacer: { height: 60 },
  actionCard: {backgroundColor: '#fff', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5, marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#999', marginBottom: 10, textAlign: 'center', letterSpacing: 1 },
  mainButton: { backgroundColor: '#2e7d32', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginVertical: 8 },
  manualButton: { backgroundColor: '#37474F' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  input: { backgroundColor: '#F5F5F5', padding: 16, borderRadius: 14, fontSize: 16, marginBottom: 5, textAlign: 'center' },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  separatorText: { marginHorizontal: 10, color: '#BBB', fontWeight: 'bold', fontSize: 10 },
  imagePreviewContainer: { marginTop: 10 },
  previewImage: { width: '100%', height: 180, borderRadius: 16 },
  
  // Loading Styles
  loadingContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 30,padding: 20,backgroundColor: '#fff',borderRadius: 20,borderWidth: 1,borderColor: '#e0e0e0' },
  loadingText: { marginTop: 15, color: '#2e7d32', fontWeight: '700', fontSize: 16 },

  // Modal Styles (Pin)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 24, padding: 25, alignItems: 'flex-start', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1b5e20', marginBottom: 20, alignSelf: 'center' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 5, marginLeft: 5, textTransform: 'uppercase' },
  modalInput: { width: '100%', backgroundColor: '#f5f5f5', padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 15, color: '#333' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  cancelBtn: { flex: 1, padding: 15, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: '#2e7d32', padding: 15, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#888', fontWeight: '600' },
  saveText: { color: '#fff', fontWeight: 'bold' }
});






















// });
