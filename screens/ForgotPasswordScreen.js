import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../utils/supabaseClient';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'YOUR_RESET_PASSWORD_URL/reset-password.html',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a password reset link to{'\n'}
          <Text style={{ fontWeight: 'bold', color: '#333' }}>{email}</Text>
        </Text>
        <Text style={styles.hint}>
          Didn't receive the email? Check your spam folder or try again.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => navigation.replace('Login')}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSent(false)}>
          <Text style={styles.link}>Try a different email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.link}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 18,
  },
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
  button: {
    backgroundColor: '#2e7d32',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#8cbf8f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#2e7d32',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 15,
  },
});
