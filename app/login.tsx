import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const auth = useAuth() as ReturnType<typeof useAuth> | undefined;
  const login = auth?.login ?? (async () => ({ success: false, error: 'Auth not ready' }));

  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha email e senha.');
      return;
    }
    if (!isEmailValid) {
      Alert.alert('E-mail inválido', 'Insira um e-mail válido.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Não foi possível entrar', result.error || 'Credenciais incorretas.');
    }
  };

  if (!auth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        testID="login-screen"
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[Colors.gradient.start, Colors.gradient.end]}
          style={styles.header}
        >
          <Text style={styles.logo} testID="login-logo">MOTOFAST</Text>
          <Text style={styles.subtitle}>ALUGUER DE MOTOS</Text>
        </LinearGradient>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Mail size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="email-input"
            />
          </View>
          {!!email && !isEmailValid && (
            <Text style={styles.validationText} testID="email-error">E-mail inválido</Text>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Lock size={20} color={Colors.textSecondary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={Colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              testID="password-input"
            />
            <TouchableOpacity onPress={() => setShowPassword((s) => !s)} accessibilityRole="button" testID="toggle-password">
              {showPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => router.push('/forgot-password')}
            testID="forgot-password"
          >
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            testID="login-button"
          >
            {loading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Entrar</Text>
                <ArrowRight size={20} color={Colors.surface} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/onboarding')}
            testID="go-register"
          >
            <Text style={styles.registerText}>
              Não tem conta? <Text style={styles.registerTextBold}>Criar Conta</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 60,
    marginBottom: 40,
  },
  logo: {
    fontSize: 42,
    fontWeight: '700' as const,
    color: Colors.surface,
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '300' as const,
    color: Colors.surface,
    letterSpacing: 3,
    opacity: 0.9,
  },
  form: {
    gap: 16,
    paddingHorizontal: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: Colors.text,
  },
  validationText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerButton: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  registerTextBold: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
