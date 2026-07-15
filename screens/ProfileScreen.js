import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { supabase } from '../utils/supabaseClient';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);

        const { data: userRow } = await supabase
          .from('users')
          .select('username')
          .eq('email', data.user.email)
          .single();

        if (userRow) {
          setUsername(userRow.username);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);
  
// Logout function
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (!error) {
              navigation.replace('Login');
            } else {
              Alert.alert('Error', 'Failed to logout.');
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Profile</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#2e7d32" />
        ) : user ? (
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(username || user.email).charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text style={styles.usernameText}>
              {username || "User"}
            </Text>
            <Text style={styles.emailText}>{user.email}</Text>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Status</Text>
                <Text style={styles.infoValue}>Active</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>Could not load profile info.</Text>
        )}

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('Help')} activeOpacity={0.7}>
            <Text style={styles.menuText}>ℹ️  Help</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('About')} activeOpacity={0.7}>
            <Text style={styles.menuText}>📖  About</Text>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout from IngredEye</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {flex: 1,backgroundColor: '#f8faf8' },
  header: {
    paddingTop: 50,
    paddingHorizontal: 25,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  headerTitle: {fontSize: 25, fontWeight: 'bold', color: '#2e7d32' },
  content: {flex: 1, padding: 25, alignItems: 'center' },
  profileCard: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 30,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  avatarText: {fontSize: 32, fontWeight: 'bold', color: '#2e7d32' },
  usernameText: {fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  emailText: {fontSize: 14, color: '#777', marginBottom: 25 },
  infoSection: {width: '100%', backgroundColor: '#f9fbf9', borderRadius: 16, padding: 15 },
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: {fontSize: 13, color: '#888', fontWeight: '600' },
  infoValue: {fontSize: 13, color: '#333',fontWeight: 'bold' },
  divider: {height: 1, backgroundColor: '#eee', marginVertical: 2 },
  logoutButton: {
    width: '100%',
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  logoutButtonText: {color: '#d32f2f', fontSize: 16, fontWeight: 'bold' },
  errorText: {color: '#999', fontSize: 16 },
  menuSection: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuText: { fontSize: 15, fontWeight: '600', color: '#333' },
  menuDivider: { height: 1, backgroundColor: '#f0f0f0' },
});
