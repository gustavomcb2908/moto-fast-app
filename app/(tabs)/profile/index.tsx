import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import {
  User,
  Phone,
  Mail,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit3,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Terminar Sessão',
      'Tem a certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const renderMenuItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onPress: () => void,
    showBadge?: boolean
  ) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`menu-item-${title.toLowerCase().replace(' ', '-')}`}
    >
      <View style={styles.menuIcon}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3</Text>
        </View>
      )}
      <ChevronRight size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
            <User size={40} color={Colors.surface} />
          </View>
          <TouchableOpacity
            style={styles.editAvatarButton}
            onPress={() => router.push('/profile/details')}
            activeOpacity={0.7}
          >
            <Edit3 size={16} color={Colors.surface} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user?.name || 'Estafeta'}</Text>
        <Text style={styles.userRole}>Courier</Text>
        
        <View style={styles.quickInfo}>
          <View style={styles.quickInfoItem}>
            <Mail size={16} color={Colors.textSecondary} />
            <Text style={styles.quickInfoText}>{user?.email || 'email@example.com'}</Text>
          </View>
          <View style={styles.quickInfoItem}>
            <Phone size={16} color={Colors.textSecondary} />
            <Text style={styles.quickInfoText}>{user?.phone || '+351 912 345 678'}</Text>
          </View>
        </View>

        {!user?.email_verified && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚠️ E-mail não verificado</Text>
          </View>
        )}

        {user?.kyc_status === 'pending' && (
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>📋 KYC em análise</Text>
          </View>
        )}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Conta</Text>
        {renderMenuItem(
          <User size={24} color={Colors.text} />,
          'Informações Pessoais',
          'Editar perfil e documentos',
          () => router.push('/profile/details')
        )}
        {renderMenuItem(
          <Settings size={24} color={Colors.text} />,
          'Definições',
          'Preferências e segurança',
          () => router.push('/profile/settings')
        )}
        {renderMenuItem(
          <Bell size={24} color={Colors.text} />,
          'Notificações',
          'Gerir notificações',
          () => router.push('/profile/notifications'),
          true
        )}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Suporte</Text>
        {renderMenuItem(
          <HelpCircle size={24} color={Colors.text} />,
          'Ajuda e Suporte',
          'Centro de ajuda e chat',
          () => router.push('/profile/support')
        )}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
        testID="logout-button"
      >
        <LogOut size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Terminar Sessão</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Versão 1.0.0 (Beta)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    padding: 32,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  quickInfo: {
    gap: 8,
    alignItems: 'center',
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickInfoText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  warningBanner: {
    marginTop: 16,
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600' as const,
  },
  infoBanner: {
    marginTop: 16,
    backgroundColor: Colors.info + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.info,
    fontWeight: '600' as const,
  },
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.error + '10',
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
});
