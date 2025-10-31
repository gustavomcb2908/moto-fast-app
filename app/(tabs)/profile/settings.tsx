import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, ThemeChoice } from '@/contexts/ThemeContext';
import { Bell, Moon, Lock, Shield, ChevronRight, SunMedium, Cog } from 'lucide-react-native';

export default function SettingsScreen() {
  const { colors, choice, setChoice } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(choice);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePushToggle = async (value: boolean) => {
    setPushNotifications(value);
    await AsyncStorage.setItem('pushNotifications', JSON.stringify(value));
    console.log('Push notifications:', value);
  };

  const handleThemeChange = async (value: ThemeChoice) => {
    setThemeChoice(value);
    setChoice(value);
    await AsyncStorage.setItem('@motofast-theme', value);
    console.log('Theme changed:', value);
    Alert.alert('Tema', 'Tema atualizado com sucesso');
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 8 caracteres');
      return;
    }

    try {
      setIsChangingPassword(true);
      console.log('Changing password...');

      await new Promise(resolve => setTimeout(resolve, 1500));

      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      Alert.alert('Sucesso', 'Senha alterada com sucesso');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Erro', 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    value?: boolean,
    onToggle?: (value: boolean) => void,
    onPress?: () => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {onToggle && value !== undefined ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.surface}
        />
      ) : onPress ? (
        <TouchableOpacity onPress={onPress}>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} testID="settings-screen">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações</Text>
        {renderSettingItem(
          <Bell size={24} color={colors.text} />,
          'Notificações Push',
          'Receber notificações sobre entregas e atualizações',
          pushNotifications,
          handlePushToggle
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aparência</Text>
        <View style={styles.themeGroup}>
          <TouchableOpacity
            style={[styles.themeOption, themeChoice === 'light' && styles.themeOptionActive]}
            onPress={() => handleThemeChange('light')}
            activeOpacity={0.8}
            testID="theme-light"
          >
            <View style={styles.themeIcon}><SunMedium size={18} color={colors.text} /></View>
            <Text style={styles.themeLabel}>Claro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeOption, themeChoice === 'dark' && styles.themeOptionActive]}
            onPress={() => handleThemeChange('dark')}
            activeOpacity={0.8}
            testID="theme-dark"
          >
            <View style={styles.themeIcon}><Moon size={18} color={colors.text} /></View>
            <Text style={styles.themeLabel}>Escuro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeOption, themeChoice === 'system' && styles.themeOptionActive]}
            onPress={() => handleThemeChange('system')}
            activeOpacity={0.8}
            testID="theme-system"
          >
            <View style={styles.themeIcon}><Cog size={18} color={colors.text} /></View>
            <Text style={styles.themeLabel}>Automático</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.themePreview}>
          <View style={styles.previewCardLight} />
          <View style={styles.previewCardDark} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Segurança</Text>
        {renderSettingItem(
          <Lock size={24} color={colors.text} />,
          'Alterar Senha',
          'Modificar sua senha de acesso',
          undefined,
          undefined,
          () => setShowPasswordModal(true)
        )}
        {renderSettingItem(
          <Shield size={24} color={colors.text} />,
          'Autenticação em Dois Fatores',
          'Adicionar camada extra de segurança (Em breve)',
          false,
          () => Alert.alert('Em Breve', 'Funcionalidade em desenvolvimento')
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Dica de Segurança</Text>
        <Text style={styles.infoText}>
          Use uma senha forte com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.
        </Text>
      </View>

      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Senha</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Senha Atual</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
                secureTextEntry
                placeholder="Digite sua senha atual"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nova Senha</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
                secureTextEntry
                placeholder="Digite a nova senha"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Nova Senha</Text>
              <TextInput
                style={styles.input}
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
                secureTextEntry
                placeholder="Confirme a nova senha"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPasswordModal(false)}
                disabled={isChangingPassword}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, isChangingPassword && styles.confirmButtonDisabled]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoBox: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: colors.info + '15',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  bottomPadding: {
    height: 32,
  },
  themeGroup: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeOptionActive: {
    borderColor: colors.primary,
  },
  themeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  themeLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  themePreview: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  previewCardLight: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewCardDark: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
