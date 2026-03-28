import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { User, Mail, Phone, MapPin, Calendar, FileText, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { useThemedDialog } from '@/components/ThemedDialog';
import { usePermissionManager } from '@/utils/permissions';

export default function ProfileDetailsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dialog = useThemedDialog();
  const { requestMediaLibrary, requestCamera } = usePermissionManager();
  const { user, refreshUserData } = useAuth();
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    birthDate: '',
    licenseNumber: '',
  });

  const pickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await requestMediaLibrary();
        if (!perm.granted) {
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker.MediaTypeOptions as unknown as { Images: string }).Images as unknown as ImagePicker.MediaTypeOptions,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Image picked:', result.assets[0].uri);
        dialog.alert('Sucesso', 'Foto selecionada! Upload será implementado na API.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      dialog.alert('Erro', 'Erro ao selecionar imagem');
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const perm = await requestCamera();
        if (!perm.granted) {
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('Photo taken:', result.assets[0].uri);
        dialog.alert('Sucesso', 'Foto tirada! Upload será implementado na API.');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      dialog.alert('Erro', 'Erro ao tirar foto');
    }
  };

  const showImageOptions = () => {
    dialog.alert('Alterar Foto', 'Escolha uma opção', [
      { text: 'Tirar Foto', onPress: takePhoto },
      { text: 'Escolher da Galeria', onPress: pickImage },
      { text: 'Cancelar', role: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('Saving profile:', formData);

      await new Promise(resolve => setTimeout(resolve, 1000));

      await refreshUserData();

      dialog.alert('Sucesso', 'Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error saving profile:', error);
      dialog.alert('Erro', 'Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const renderInputField = (
    icon: React.ReactNode,
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'numeric' = 'default',
    editable: boolean = true,
    placeholder: string = ''
  ) => (
    <View style={styles.inputContainer}>
      <View style={styles.inputLabel}>
        {icon}
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <User size={60} color={colors.surface} />
        </View>
        <TouchableOpacity
          style={styles.changePhotoButton}
          onPress={showImageOptions}
          activeOpacity={0.7}
        >
          <Camera size={18} color={colors.primary} />
          <Text style={styles.changePhotoText}>Alterar Foto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Informações Básicas</Text>

        {renderInputField(
          <User size={20} color={colors.primary} />,
          'Nome Completo',
          formData.name,
          (text) => setFormData({ ...formData, name: text }),
          'default',
          true,
          'Digite seu nome'
        )}

        {renderInputField(
          <Mail size={20} color={colors.textSecondary} />,
          'E-mail',
          user?.email || '',
          () => {},
          'email-address',
          false,
          ''
        )}

        {renderInputField(
          <Phone size={20} color={colors.primary} />,
          'Telefone',
          formData.phone,
          (text) => setFormData({ ...formData, phone: text }),
          'phone-pad',
          true,
          '+351 912 345 678'
        )}

        {renderInputField(
          <MapPin size={20} color={colors.primary} />,
          'Endereço',
          formData.address,
          (text) => setFormData({ ...formData, address: text }),
          'default',
          true,
          'Rua, Cidade, País'
        )}

        {renderInputField(
          <Calendar size={20} color={colors.primary} />,
          'Data de Nascimento',
          formData.birthDate,
          (text) => setFormData({ ...formData, birthDate: text }),
          'default',
          true,
          'DD/MM/AAAA'
        )}

        {renderInputField(
          <FileText size={20} color={colors.primary} />,
          'Número da Carta de Condução',
          formData.licenseNumber,
          (text) => setFormData({ ...formData, licenseNumber: text }),
          'default',
          true,
          'Número da carta'
        )}
      </View>

      <View style={styles.kycSection}>
        <Text style={styles.sectionTitle}>Status KYC</Text>
        <View style={[
          styles.kycStatusCard,
          user?.kyc_status === 'approved' && styles.kycApproved,
          user?.kyc_status === 'rejected' && styles.kycRejected,
        ]}>
          <Text style={styles.kycStatusText}>
            {user?.kyc_status === 'pending' && '⏳ Documentos em análise'}
            {user?.kyc_status === 'approved' && '✅ Verificado'}
            {user?.kyc_status === 'rejected' && '❌ Rejeitado'}
          </Text>
          <Text style={styles.kycDescription}>
            {user?.kyc_status === 'pending' && 'Seus documentos estão sendo analisados pela nossa equipe.'}
            {user?.kyc_status === 'approved' && 'Sua conta foi verificada com sucesso!'}
            {user?.kyc_status === 'rejected' && 'Entre em contato com o suporte para mais informações.'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  avatarSection: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    padding: 32,
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  formSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceAlt,
    color: colors.textSecondary,
  },
  kycSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  kycStatusCard: {
    backgroundColor: colors.info + '15',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  kycApproved: {
    backgroundColor: colors.success + '15',
    borderLeftColor: colors.success,
  },
  kycRejected: {
    backgroundColor: colors.error + '15',
    borderLeftColor: colors.error,
  },
  kycStatusText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  kycDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.surface,
  },
  bottomPadding: {
    height: 32,
  },
});
