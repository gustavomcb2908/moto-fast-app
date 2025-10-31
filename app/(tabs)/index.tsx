import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { mockSummary } from '@/constants/mockData';
import Colors from '@/constants/colors';
import { DollarSign, Package, TrendingUp, AlertCircle, Bell, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();

  const renderStatCard = (
    icon: React.ReactNode,
    label: string,
    value: string | number,
    color: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[styles.statCard, onPress && styles.statCardClickable]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderAlert = (type: 'warning' | 'info', message: string, onPress?: () => void) => {
    const bgColor = type === 'warning' ? Colors.warning + '15' : Colors.info + '15';
    const iconColor = type === 'warning' ? Colors.warning : Colors.info;

    return (
      <TouchableOpacity
        key={message}
        style={[styles.alertCard, { backgroundColor: bgColor }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <AlertCircle size={20} color={iconColor} />
        <Text style={[styles.alertText, { color: iconColor }]}>{message}</Text>
        <ArrowRight size={16} color={iconColor} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Estafeta'}!</Text>
            <Text style={styles.subtitle}>Bem-vindo ao Moto Fast</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color={Colors.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {mockSummary.alerts.length > 0 && (
          <View style={styles.alertsSection}>
            {mockSummary.alerts.map((alert) =>
              renderAlert(
                alert.type,
                alert.message,
                alert.type === 'warning' ? () => router.push('/rental') : undefined
              )
            )}
          </View>
        )}

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo Atual</Text>
            <TrendingUp size={20} color={Colors.success} />
          </View>
          <Text style={styles.balanceAmount}>€{mockSummary.balance.toFixed(2)}</Text>
          <Text style={styles.balanceSubtext}>Ganhos hoje: €{mockSummary.earningsToday.toFixed(2)}</Text>
        </View>

        <View style={styles.statsGrid}>
          {renderStatCard(
            <Package size={24} color={Colors.primary} />,
            'Entregas Hoje',
            mockSummary.deliveriesToday,
            Colors.primary,
            () => router.push('/orders')
          )}
          {renderStatCard(
            <Package size={24} color={Colors.warning} />,
            'Em Curso',
            mockSummary.inProgress,
            Colors.warning
          )}
          {renderStatCard(
            <Package size={24} color={Colors.info} />,
            'Pendentes',
            mockSummary.pending,
            Colors.info,
            () => router.push('/orders')
          )}
          {renderStatCard(
            <Package size={24} color={Colors.success} />,
            'Concluídas',
            mockSummary.completed,
            Colors.success
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/orders')}
          >
            <View style={styles.actionIconContainer}>
              <Package size={24} color={Colors.surface} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ver Pedidos</Text>
              <Text style={styles.actionSubtitle}>Gerir entregas pendentes</Text>
            </View>
            <ArrowRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/rental')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: Colors.success }]}>
              <DollarSign size={24} color={Colors.surface} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ver Faturas</Text>
              <Text style={styles.actionSubtitle}>Pagamentos e documentos</Text>
            </View>
            <ArrowRight size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  alertsSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  balanceCard: {
    marginHorizontal: 20,
    padding: 24,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.surface,
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.surface,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: Colors.surface,
    opacity: 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardClickable: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
