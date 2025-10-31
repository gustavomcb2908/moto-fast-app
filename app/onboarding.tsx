import React, { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Mail,
  Phone,
  Lock,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';

type Step = 1 | 2 | 3 | 4;

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    idDocument: null as string | null,
    drivingLicense: null as string | null,
    addressProof: null as string | null,
    vehicleId: 'v123',
  });

  const pickImage = async (field: 'idDocument' | 'drivingLicense' | 'addressProof') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData((prev) => ({ ...prev, [field]: result.assets[0].uri }));
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        alert('Por favor, preencha todos os campos');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        alert('As senhas não coincidem');
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      alert(result.error || 'Erro ao registar');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            currentStep >= step ? styles.stepDotActive : styles.stepDotInactive,
          ]}
        />
      ))}
    </View>
  );

  const renderPersonalData = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Dados Pessoais</Text>
      <Text style={styles.stepSubtitle}>Preencha as suas informações</Text>

      <View style={styles.inputContainer}>
        <User size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Nome completo"
          value={formData.name}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
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
        />
      </View>

      <View style={styles.inputContainer}>
        <Phone size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Telefone"
          value={formData.phone}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
          keyboardType="phone-pad"
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
        />
      </View>

      <View style={styles.inputContainer}>
        <Lock size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          value={formData.confirmPassword}
          onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmPassword: text }))}
          secureTextEntry
        />
      </View>
    </View>
  );

  const renderDocuments = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Documentos</Text>
      <Text style={styles.stepSubtitle}>Carregue os seus documentos</Text>

      <TouchableOpacity
        style={styles.uploadCard}
        onPress={() => pickImage('idDocument')}
      >
        {formData.idDocument ? (
          <CheckCircle size={24} color={Colors.success} />
        ) : (
          <Upload size={24} color={Colors.primary} />
        )}
        <Text style={styles.uploadText}>
          {formData.idDocument ? 'RG/BI Carregado' : 'Carregar RG/BI'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uploadCard}
        onPress={() => pickImage('drivingLicense')}
      >
        {formData.drivingLicense ? (
          <CheckCircle size={24} color={Colors.success} />
        ) : (
          <Upload size={24} color={Colors.primary} />
        )}
        <Text style={styles.uploadText}>
          {formData.drivingLicense ? 'Carta Carregada' : 'Carregar Carta de Condução'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.uploadCard}
        onPress={() => pickImage('addressProof')}
      >
        {formData.addressProof ? (
          <CheckCircle size={24} color={Colors.success} />
        ) : (
          <Upload size={24} color={Colors.primary} />
        )}
        <Text style={styles.uploadText}>
          {formData.addressProof
            ? 'Comprovativo Carregado'
            : 'Carregar Comprovativo de Residência'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderVehicle = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Veículo</Text>
      <Text style={styles.stepSubtitle}>Escolha o seu veículo</Text>

      <View style={styles.vehicleCard}>
        <Text style={styles.vehicleName}>Honda CG 150</Text>
        <Text style={styles.vehiclePrice}>€120/mês</Text>
        <Text style={styles.vehicleDescription}>
          Moto ideal para entregas urbanas, económica e confiável
        </Text>
      </View>

      <Text style={styles.infoText}>
        Mais opções de veículos estarão disponíveis após o registo
      </Text>
    </View>
  );

  const renderContract = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contrato</Text>
      <Text style={styles.stepSubtitle}>Revise e aceite os termos</Text>

      <ScrollView style={styles.contractScroll}>
        <Text style={styles.contractText}>
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS{'\n\n'}
          1. Este contrato estabelece os termos e condições entre o estafeta e a Moto Fast.{'\n\n'}
          2. O estafeta se compromete a realizar entregas de forma responsável e segura.{'\n\n'}
          3. O pagamento será realizado semanalmente conforme as entregas realizadas.{'\n\n'}
          4. O aluguer do veículo tem custo mensal fixo de €120.{'\n\n'}
          5. O estafeta é responsável pela manutenção básica do veículo.
        </Text>
      </ScrollView>

      <View style={styles.acceptContainer}>
        <CheckCircle size={20} color={Colors.success} />
        <Text style={styles.acceptText}>
          Li e concordo com os termos do contrato
        </Text>
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
        return renderVehicle();
      case 4:
        return renderContract();
      default:
        return null;
    }
  };

  return (
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
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={20} color={Colors.text} />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {currentStep === 4 ? 'Finalizar' : 'Próximo'}
              </Text>
              <ArrowRight size={20} color={Colors.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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
  contractScroll: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
  },
  contractText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  acceptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
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
});
