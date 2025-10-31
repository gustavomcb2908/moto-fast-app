import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Car,
  FileText,
  Camera,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Calendar,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

export default function RentalScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, isLoading, error, refetch } = trpc.rental.getSummary.useQuery({});

  const vehicle = data?.data?.vehicle;
  const nextInvoice = data?.data?.nextInvoice as { id: string; amount: number; dueDate: string; status: string } | undefined;
  const hasInspectionPending = false;

  const renderMenuCard = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onPress: () => void,
    badge?: { text: string; color: string }
  ) => (
    <TouchableOpacity
      style={styles.menuCard}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`menu-${title}`}
    >
      <View style={styles.menuIconContainer}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: badge.color + '15' }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
        </View>
      )}
      <ChevronRight size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}> 
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !vehicle) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', padding: 16 }]}> 
        <Text style={{ color: colors.error, marginBottom: 12 }}>Falha ao carregar dados</Text>
        <TouchableOpacity onPress={() => refetch()} style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '700' as const }}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Locadora',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <Car size={32} color={colors.primary} />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehiclePlate}>{vehicle.plate}</Text>
              <Text style={styles.vehicleModel}>{vehicle.model}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    vehicle.rentalStatus === 'active'
                      ? colors.success + '15'
                      : colors.warning + '15',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      vehicle.rentalStatus === 'active' ? colors.success : colors.warning,
                  },
                ]}
              >
                {vehicle.rentalStatus === 'active' ? 'Ativo' : 'Pendente'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.vehicleDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Valor Mensal</Text>
              <Text style={styles.detailValue}>€{Number(vehicle.monthlyFee).toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Próximo Pagamento</Text>
              <Text style={styles.detailValue}>
                {new Date(vehicle.nextPayment).toLocaleDateString('pt-PT')}
              </Text>
            </View>
          </View>
        </View>

        {(nextInvoice || hasInspectionPending) && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Atenção</Text>
            {nextInvoice && (
              <TouchableOpacity
                style={[styles.alertCard, { backgroundColor: colors.warning + '10' }]}
                activeOpacity={0.7}
                onPress={() => router.push('invoices' as any)}
              >
                <AlertTriangle size={20} color={colors.warning} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Fatura Pendente</Text>
                  <Text style={styles.alertText}>
                    Vence em{' '}
                    {Math.ceil(
                      (new Date(nextInvoice.dueDate).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    dias
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.warning} />
              </TouchableOpacity>
            )}
            {hasInspectionPending && (
              <TouchableOpacity
                style={[styles.alertCard, { backgroundColor: colors.info + '10' }]}
                activeOpacity={0.7}
                onPress={() => console.log('navigate inspections')}
              >
                <Camera size={20} color={colors.info} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Vistoria Pendente</Text>
                  <Text style={styles.alertText}>Submeter fotos do veículo</Text>
                </View>
                <ChevronRight size={20} color={colors.info} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Financeiro</Text>
          {renderMenuCard(
            <FileText size={24} color={colors.primary} />,
            'Faturas',
            'Ver e pagar faturas',
            () => router.push('invoices' as any),
            nextInvoice
              ? { text: `€${Number(nextInvoice.amount).toFixed(2)}`, color: colors.warning }
              : undefined
          )}
          {renderMenuCard(
            <CreditCard size={24} color={colors.success} />,
            'Formas de Pagamento',
            'Pagar agora via Stripe',
            () => router.push('pay' as any)
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          {renderMenuCard(
            <FileText size={24} color={colors.text} />,
            'Anexos',
            'Comprovativos enviados',
            () => router.push('attachments' as any)
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          {renderMenuCard(
            <Calendar size={24} color={colors.primary} />,
            'Histórico Financeiro',
            'Pagamentos e faturas',
            () => router.push('history' as any)
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Suporte</Text>
          {renderMenuCard(
            <MessageSquare size={24} color={colors.primary} />,
            'Chat com Locadora',
            'Mensagens e suporte',
            () => console.log('Navigate to chat'),
            { text: '1', color: colors.error }
          )}
        </View>
      </ScrollView>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  vehicleCard: {
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  vehicleModel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  vehicleDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  alertsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 8,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  alertText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  menuCard: {
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
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
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
    color: colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
});
