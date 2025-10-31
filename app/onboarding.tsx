import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import * as WebBrowser from 'expo-web-browser';
import { API_CONFIG } from '@/constants/apiEndpoints';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Camera,
  ShieldCheck,
} from 'lucide-react-native';

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const auth = useAuth() as ReturnType<typeof useAuth> | undefined;
  const register = auth?.register ?? (async () => ({ success: false, error: 'Auth not ready' }));

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    idDocument: null as string | null,
    drivingLicense: null as string | null,
    addressProof: null as string | null,
    selfie: null as string | null,
    vehicleId: 'v123',
    acceptTerms: false,
  });

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email), [formData.email]);
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    const strong = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(p);
    const medium = /(?=.*[a-z])(?=.*\d).{6,}/.test(p);
    return strong ? 'forte' : medium ? 'média' : 'fraca';
  }, [formData.password]);

  const pickImage = async (field: 'idDocument' | 'drivingLicense' | 'addressProof') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFormData((prev) => ({ ...prev, [field]: result.assets[0].uri }));
    }
  };

  const takeSelfie = async () => {
    if (!cameraPermission?.granted) {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de acesso à câmara para tirar a selfie.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir definições', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
      aspect: [1, 1],
      cameraType: 'front' as any,
    });
    if (!result.canceled && result.assets[0]) {
      setFormData((prev) => ({ ...prev, selfie: result.assets[0].uri }));
    }
  };



  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
        return;
      }
      if (!emailValid) {
        Alert.alert('Erro', 'E-mail inválido.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Erro', 'As senhas não coincidem.');
        return;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}/.test(formData.password)) {
        Alert.alert('Senha fraca', 'A senha deve ter 8+ caracteres, com maiúscula, minúscula e número.');
        return;
      }
    }

    if (currentStep === 2) {
      if (!formData.idDocument || !formData.drivingLicense || !formData.addressProof) {
        Alert.alert('Erro', 'Carregue todos os documentos.');
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.selfie) {
        Alert.alert('Erro', 'Tire uma selfie para verificação.');
        return;
      }
    }

    if (currentStep === 5) {
      if (!formData.acceptTerms) {
        Alert.alert('Contrato', 'É necessário aceitar os termos para concluir.');
        return;
      }
      handleRegister();
      return;
    }

    setCurrentStep((prev) => (prev + 1) as Step);
    setTimeout(() => {
      // noop: smooth UX after step change
    }, 0);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as Step);
  };

  const handleRegister = async () => {
    setLoading(true);
    const payload: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      vehicleId: formData.vehicleId,
      accept_terms: formData.acceptTerms,
      documents: {
        id_document: formData.idDocument ?? undefined,
        driver_license: formData.drivingLicense ?? undefined,
        proof_of_address: formData.addressProof ?? undefined,
        selfie: formData.selfie ?? undefined,
      },
    };
    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      Alert.alert('Conta criada', 'Verifique seu e-mail para ativar a conta.');
      router.replace('/login');
    } else {
      Alert.alert('Erro', result.error || 'Erro ao registar');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator} testID="register-steps">
      {[1, 2, 3, 4, 5].map((step) => (
        <View
          key={step}
          style={[styles.stepDot, currentStep >= step ? styles.stepDotActive : styles.stepDotInactive]}
        />
      ))}
    </View>
  );

  const renderPersonalData = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Dados Pessoais</Text>
      <Text style={styles.stepSubtitle}>Preencha as suas informações</Text>

      <View style={styles.inputContainer}>
        <UserIcon size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          value={formData.name}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
          testID="name-input"
        />
      </View>

      <View style={styles.inputContainer}>
        <Mail size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="reg-email"
        />
      </View>
      {!!formData.email && !emailValid && (
        <Text style={styles.validationText}>E-mail inválido</Text>
      )}

      <View style={styles.inputContainer}>
        <Phone size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Telefone"
          value={formData.phone}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
          keyboardType="phone-pad"
          testID="reg-phone"
        />
      </View>

      <View style={styles.inputContainer}>
        <Lock size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={formData.password}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text }))}
          secureTextEntry
          testID="reg-password"
        />
      </View>
      <Text style={styles.passwordHint}>Força da senha: {passwordStrength}</Text>

      <View style={styles.inputContainer}>
        <Lock size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
          secureTextEntry
          testID="reg-password-confirm"
        />
      </View>
    </View>
  );

  const renderDocuments = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Documentos</Text>
      <Text style={styles.stepSubtitle}>Carregue os seus documentos</Text>

      <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('idDocument')} testID="doc-id">
        {formData.idDocument ? (
          <CheckCircle size={24} color={Colors.success} />
        ) : (
          <Upload size={24} color={Colors.primary} />
        )}
        <Text style={styles.uploadText}>
          {formData.idDocument ? 'CC/Título de Residência/Passaporte Carregado' : 'Carregar CC/Título de Residência/Passaporte'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('drivingLicense')} testID="doc-license">
        {formData.drivingLicense ? (
          <CheckCircle size={24} color={Colors.success} />
        ) : (
          <Upload size={24} color={Colors.primary} />
        )}
        <Text style={styles.uploadText}>
          {formData.drivingLicense ? 'Carta Carregada' : 'Carregar Carta de Condução'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.uploadCard} onPress={() => pickImage('addressProof')} testID="doc-address">
        {formData.addressProof ? (
          <CheckCircle size={24} color={Colors.success} />
        ) : (
          <Upload size={24} color={Colors.primary} />
        )}
        <Text style={styles.uploadText}>
          {formData.addressProof ? 'Comprovativo Carregado' : 'Comprovativo de Residência'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSelfie = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Verificação</Text>
      <Text style={styles.stepSubtitle}>Tire uma selfie para verificação de identidade</Text>

      {formData.selfie ? (
        <View style={styles.selfiePreview}>
          <Image source={{ uri: formData.selfie }} style={styles.selfieImage} />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => setFormData((prev) => ({ ...prev, selfie: null }))}
          >
            <Text style={styles.retakeButtonText}>Tirar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.selfieOptions}>
          <TouchableOpacity style={styles.selfieButton} onPress={takeSelfie} testID="selfie-camera">
            <Camera size={32} color={Colors.primary} />
            <Text style={styles.selfieButtonText}>Tirar Selfie</Text>
          </TouchableOpacity>

        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Dicas para uma boa selfie:</Text>
        <Text style={styles.infoItem}>• Boa iluminação no rosto</Text>
        <Text style={styles.infoItem}>• Olhar diretamente para a câmera</Text>
        <Text style={styles.infoItem}>• Remover óculos e acessórios</Text>
        <Text style={styles.infoItem}>• Expressão neutra</Text>
      </View>
    </View>
  );

  const renderVehicle = () => {
    const vehicles = [
      { id: 'v123', name: 'Honda CG 150', price: 120, desc: 'Económica e confiável' },
      { id: 'v200', name: 'Yamaha YBR 150', price: 135, desc: 'Confortável e eficiente' },
      { id: 'v300', name: 'Honda PCX 160', price: 165, desc: 'Mais potência e conforto' },
    ];
    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Veículo</Text>
        <Text style={styles.stepSubtitle}>Escolha o seu veículo</Text>

        <View style={{ gap: 12 }}>
          {vehicles.map((v) => {
            const selected = formData.vehicleId === v.id;
            return (
              <TouchableOpacity
                key={v.id}
                onPress={() => setFormData((p) => ({ ...p, vehicleId: v.id }))}
                activeOpacity={0.9}
                style={[
                  styles.vehicleCard,
                  { borderWidth: 2, borderColor: selected ? Colors.primary : Colors.border, transform: [{ scale: selected ? 1.01 : 1 }] },
                ]}
                testID={`vehicle-${v.id}`}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.vehicleName}>{v.name}</Text>
                  {selected && <CheckCircle size={20} color={Colors.primary} />}
                </View>
                <Text style={styles.vehiclePrice}>€{v.price}/mês</Text>
                <Text style={styles.vehicleDescription}>{v.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.infoText}>
          Pode alterar esta escolha depois. Mais opções estarão disponíveis após o registo.
        </Text>
      </View>
    );
  };

  const renderContract = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contrato</Text>
      <Text style={styles.stepSubtitle}>Revise e aceite os termos</Text>

      <TouchableOpacity
        style={styles.contractOpen}
        onPress={() => WebBrowser.openBrowserAsync(`${API_CONFIG.AUTH_API_URL}/contracts/latest`)}
        testID="open-contract"
      >
        <ShieldCheck size={20} color={Colors.primary} />
        <Text style={styles.contractOpenText}>Abrir contrato (PDF)</Text>
      </TouchableOpacity>

      <View style={styles.acceptContainer}>
        <TouchableOpacity
          onPress={() => setFormData((p) => ({ ...p, acceptTerms: !p.acceptTerms }))}
          style={[styles.checkbox, formData.acceptTerms && styles.checkboxChecked]}
          accessibilityRole="checkbox"
          testID="accept-terms"
        >
          {formData.acceptTerms && <CheckCircle size={18} color={Colors.surface} />}
        </TouchableOpacity>
        <Text style={styles.acceptText}>Li e concordo com os termos do contrato</Text>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalData();
      case 2:
        return renderDocuments();
      case 3:
        return renderSelfie();
      case 4:
        return renderVehicle();
      case 5:
        return renderContract();
      default:
        return null;
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
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Registo</Text>
            {renderStepIndicator()}
          </View>

          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack} testID="step-back">
              <ArrowLeft size={20} color={Colors.text} />
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
            onPress={handleNext}
            disabled={loading}
            testID="step-next"
          >
            {loading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === 5 ? 'Concluir Cadastro' : 'Próximo'}
                </Text>
                <ArrowRight size={20} color={Colors.surface} />
              </>
            )}
          </TouchableOpacity>
        </View>
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
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotInactive: {
    backgroundColor: Colors.border,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  stepSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    gap: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  vehicleCard: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  vehiclePrice: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 12,
  },
  vehicleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  contractOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  contractOpenText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  passwordHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    marginLeft: 4,
  },
  contractScroll: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
  },
  acceptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  acceptText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  selfiePreview: {
    alignItems: 'center',
    gap: 20,
  },
  selfieImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  retakeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  selfieOptions: {
    gap: 16,
  },
  selfieButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: Colors.primary + '15',
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  selfieButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  selfieButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selfieButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.surfaceAlt,
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
