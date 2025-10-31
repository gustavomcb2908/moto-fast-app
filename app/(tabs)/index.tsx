import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { mockSummary } from '@/constants/mockData';
import { DollarSign, Package, TrendingUp, AlertCircle, Bell, ArrowRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}
        testID={`stat-icon-${label}`}
      >
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const renderAlert = (type: 'warning' | 'info', message: string, onPress?: () => void) => {
    const bgColor = type === 'warning' ? colors.warning + '15' : colors.info + '15';
    const iconColor = type === 'warning' ? colors.warning : colors.info;

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
          <TouchableOpacity style={styles.notificationButton} testID="btn-notifications">
            <Bell size={24} color={colors.text} />
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
            <TrendingUp size={20} color={colors.success} />
          </View>
          <Text style={styles.balanceAmount}>€{mockSummary.balance.toFixed(2)}</Text>
          <Text style={styles.balanceSubtext}>Ganhos hoje: €{mockSummary.earningsToday.toFixed(2)}</Text>
        </View>

        <View style={styles.statsGrid}>
          {renderStatCard(
            <Package size={24} color={colors.primary} />,
            'Entregas Hoje',
            mockSummary.deliveriesToday,
            colors.primary,
            () => router.push('/orders')
          )}
          {renderStatCard(
            <Package size={24} color={colors.warning} />,
            'Em Curso',
            mockSummary.inProgress,
            colors.warning
          )}
          {renderStatCard(
            <Package size={24} color={colors.info} />,
            'Pendentes',
            mockSummary.pending,
            colors.info,
            () => router.push('/orders')
          )}
          {renderStatCard(
            <Package size={24} color={colors.success} />,
            'Concluídas',
            mockSummary.completed,
            colors.success
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/orders')}
          >
            <View style={styles.actionIconContainer}>
              <Package size={24} color={colors.surface} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ver Pedidos</Text>
              <Text style={styles.actionSubtitle}>Gerir entregas pendentes</Text>
            </View>
            <ArrowRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/rental')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.success }]}>
              <DollarSign size={24} color={colors.surface} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ver Faturas</Text>
              <Text style={styles.actionSubtitle}>Pagamentos e documentos</Text>
            </View>
            <ArrowRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
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
    backgroundColor: '#EF4444',
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
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: colors.primary,
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
    color: colors.surface,
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: colors.surface,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: colors.surface,
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
    backgroundColor: colors.surface,
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
    borderColor: colors.border,
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
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
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
    backgroundColor: colors.primary,
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
    color: colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
