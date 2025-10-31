import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { mockVehicle, mockInvoices, mockInspection } from '@/constants/mockData';
import Colors from '@/constants/colors';
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

export default function RentalScreen() {
  const nextInvoice = mockInvoices.find((inv) => inv.status === 'pending');
  const hasInspectionPending = mockInspection.status === 'pending';

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
      <ChevronRight size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Locadora',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <Car size={32} color={Colors.primary} />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehiclePlate}>{mockVehicle.plate}</Text>
              <Text style={styles.vehicleModel}>{mockVehicle.model}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    mockVehicle.rentalStatus === 'active'
                      ? Colors.success + '15'
                      : Colors.warning + '15',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      mockVehicle.rentalStatus === 'active' ? Colors.success : Colors.warning,
                  },
                ]}
              >
                {mockVehicle.rentalStatus === 'active' ? 'Ativo' : 'Pendente'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.vehicleDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Valor Mensal</Text>
              <Text style={styles.detailValue}>€{mockVehicle.monthlyFee.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Próximo Pagamento</Text>
              <Text style={styles.detailValue}>
                {new Date(mockVehicle.nextPayment).toLocaleDateString('pt-PT')}
              </Text>
            </View>
          </View>
        </View>

        {(nextInvoice || hasInspectionPending) && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>Atenção</Text>
            {nextInvoice && (
              <TouchableOpacity
                style={[styles.alertCard, { backgroundColor: Colors.warning + '10' }]}
                activeOpacity={0.7}
              >
                <AlertTriangle size={20} color={Colors.warning} />
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
                <ChevronRight size={20} color={Colors.warning} />
              </TouchableOpacity>
            )}
            {hasInspectionPending && (
              <TouchableOpacity
                style={[styles.alertCard, { backgroundColor: Colors.info + '10' }]}
                activeOpacity={0.7}
              >
                <Camera size={20} color={Colors.info} />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>Vistoria Pendente</Text>
                  <Text style={styles.alertText}>Submeter fotos do veículo</Text>
                </View>
                <ChevronRight size={20} color={Colors.info} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Financeiro</Text>
          {renderMenuCard(
            <FileText size={24} color={Colors.primary} />,
            'Faturas',
            'Ver e pagar faturas',
            () => console.log('Navigate to invoices'),
            nextInvoice
              ? { text: `€${nextInvoice.amount.toFixed(2)}`, color: Colors.warning }
              : undefined
          )}
          {renderMenuCard(
            <CreditCard size={24} color={Colors.success} />,
            'Métodos de Pagamento',
            'Gerir formas de pagamento',
            () => console.log('Navigate to payment methods')
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Veículo</Text>
          {renderMenuCard(
            <Camera size={24} color={Colors.info} />,
            'Vistorias',
            'Submeter e ver vistorias',
            () => console.log('Navigate to inspections'),
            hasInspectionPending
              ? { text: 'Pendente', color: Colors.warning }
              : undefined
          )}
          {renderMenuCard(
            <FileText size={24} color={Colors.text} />,
            'Documentos',
            'Contratos e documentação',
            () => console.log('Navigate to documents')
          )}
          {renderMenuCard(
            <Calendar size={24} color={Colors.primary} />,
            'Gestão de Veículo',
            'Histórico e troca de veículo',
            () => console.log('Navigate to vehicle management')
          )}
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Suporte</Text>
          {renderMenuCard(
            <MessageSquare size={24} color={Colors.primary} />,
            'Chat com Locadora',
            'Mensagens e suporte',
            () => console.log('Navigate to chat'),
            { text: '1', color: Colors.error }
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  vehicleCard: {
    margin: 16,
    backgroundColor: Colors.surface,
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
    color: Colors.text,
  },
  vehicleModel: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.border,
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
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  alertsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
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
    color: Colors.text,
    marginBottom: 2,
  },
  alertText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  menuCard: {
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
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
