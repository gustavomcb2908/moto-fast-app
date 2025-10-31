import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  FileText,
  User,
  AlertCircle,
} from 'lucide-react-native';

export default function KYCStatusScreen() {
  const auth = useAuth() as ReturnType<typeof useAuth> | undefined;
  const user = auth?.user ?? null as any;
  const kycStatus = (auth as any)?.kycStatus ?? null;

  const getStatusIcon = () => {
    switch (kycStatus?.status) {
      case 'approved':
        return <CheckCircle size={64} color={Colors.success} />;
      case 'pending':
        return <Clock size={64} color={Colors.warning} />;
      case 'rejected':
        return <XCircle size={64} color={Colors.error} />;
      default:
        return <AlertCircle size={64} color={Colors.textSecondary} />;
    }
  };

  const getStatusTitle = () => {
    switch (kycStatus?.status) {
      case 'approved':
        return 'Verificação Aprovada';
      case 'pending':
        return 'Verificação Pendente';
      case 'rejected':
        return 'Verificação Rejeitada';
      default:
        return 'Verificação Necessária';
    }
  };

  const getStatusMessage = () => {
    switch (kycStatus?.status) {
      case 'approved':
        return 'Sua identidade foi verificada com sucesso. Você tem acesso completo ao app.';
      case 'pending':
        return 'Seus documentos estão sendo analisados. Este processo pode levar até 48 horas.';
      case 'rejected':
        return kycStatus.reason || 'Seus documentos foram rejeitados. Por favor, envie novos documentos.';
      default:
        return 'Complete a verificação de identidade para acessar todos os recursos.';
    }
  };

  const getStatusColor = () => {
    switch (kycStatus?.status) {
      case 'approved':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'rejected':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  if (!auth) {
    return (
      <View style={styles.container}>
        <Text style={{ color: Colors.text }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Status KYC',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[getStatusColor() + '20', Colors.background]}
          style={styles.header}
        >
          <View style={styles.iconContainer}>{getStatusIcon()}</View>
          <Text style={styles.statusTitle}>{getStatusTitle()}</Text>
          <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações do Perfil</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <User size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nome</Text>
                  <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <FileText size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <FileText size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Telefone</Text>
                  <Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documentos Enviados</Text>
            
            <View style={styles.documentCard}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.documentText}>RG/BI</Text>
            </View>

            <View style={styles.documentCard}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.documentText}>Carta de Condução</Text>
            </View>

            <View style={styles.documentCard}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.documentText}>Comprovativo de Residência</Text>
            </View>

            <View style={styles.documentCard}>
              <CheckCircle size={20} color={Colors.success} />
              <Text style={styles.documentText}>Selfie de Verificação</Text>
            </View>
          </View>

          {kycStatus?.status === 'rejected' && (
            <TouchableOpacity
              style={styles.resubmitButton}
              onPress={() => router.push('/onboarding')}
            >
              <Upload size={20} color={Colors.surface} />
              <Text style={styles.resubmitButtonText}>Reenviar Documentos</Text>
            </TouchableOpacity>
          )}

          {kycStatus?.status === 'approved' && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.continueButtonText}>Continuar para o App</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  documentText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  resubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  resubmitButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
});
