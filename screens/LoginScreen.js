import React, { useState, useEffect } from 'react';
import {View,Text,TextInput,TouchableOpacity,StyleSheet,KeyboardAvoidingView,Platform,Image,Alert} from 'react-native';
import { supabase } from '../utils/supabaseClient';

export default function LoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigation.replace('MainTabs'); 
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    try {
      let emailToUse = identifier;

      if (!identifier.includes('@')) {
        const { data, error } = await supabase
          .from('users')
          .select('email')
          .eq('username', identifier)
          .single();

        if (error || !data) {
          Alert.alert('Error', 'Username not found.');
          return;
        }
        emailToUse = data.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
      } else {
        navigation.replace('MainTabs');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong during login.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Image
          source={require('../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>IngredEye</Text>
        <Text style={styles.subtitle}>Log in to stay aware</Text>

        <TextInput
          style={styles.input}
          placeholder="Email or Username"
          placeholderTextColor="#aaa"
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotLink}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}>Don't have an account? <Text style={{ fontWeight: 'bold' }}>Sign up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#f9f9f9' },
  title: {fontSize: 25, fontWeight: 'bold', color: '#2e7d32', textAlign: 'center', marginBottom: 5 },
  subtitle: {fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#fff',
    paddingVertical: 18, 
    paddingHorizontal: 20, 
    borderRadius: 12, 
    fontSize: 18, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  button: {backgroundColor: '#2e7d32', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  buttonText: {color: '#fff', fontSize: 18, fontWeight: 'bold' },
  forgotLink: {color: '#2e7d32', textAlign: 'center', marginTop: 12, fontSize: 14 },
  link: {color: '#2e7d32', textAlign: 'center', marginTop: 20, fontSize: 15 },
  logo: {width: 200, height: 200, alignSelf: 'center', marginBottom: 5, }
});
