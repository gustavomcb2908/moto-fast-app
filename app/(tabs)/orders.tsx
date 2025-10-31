import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { mockOrders, Order } from '@/constants/mockData';
import { useTheme } from '@/contexts/ThemeContext';
import { MapPin, Clock, DollarSign, CheckCircle, Circle, PlayCircle } from 'lucide-react-native';

export default function OrdersScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [orders] = useState<Order[]>(mockOrders);

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendente', color: colors.warning, icon: Circle };
      case 'accepted':
        return { label: 'Aceite', color: colors.info, icon: PlayCircle };
      case 'in_progress':
        return { label: 'Em Curso', color: colors.primary, icon: PlayCircle };
      case 'completed':
        return { label: 'Concluída', color: colors.success, icon: CheckCircle };
      default:
        return { label: 'Cancelada', color: colors.error, icon: Circle };
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const statusConfig = getStatusConfig(item.status);
    const StatusIcon = statusConfig.icon;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        testID={`order-${item.id}`}
      >
        <View style={styles.orderHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
            <StatusIcon size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <View style={styles.valueContainer}>
            <DollarSign size={16} color={colors.success} />
            <Text style={styles.valueText}>€{item.value.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.clientName}>{item.clientName}</Text>

        {item.pickupAddress && (
          <View style={styles.addressRow}>
            <MapPin size={16} color={colors.primary} />
            <Text style={styles.addressLabel}>Recolha:</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.pickupAddress}
            </Text>
          </View>
        )}

        <View style={styles.addressRow}>
          <MapPin size={16} color={colors.success} />
          <Text style={styles.addressLabel}>Entrega:</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.address}
          </Text>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.infoItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.timeWindow}</Text>
          </View>
          <View style={styles.infoItem}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.distance.toFixed(1)} km</Text>
          </View>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.rejectButton}>
              <Text style={styles.rejectButtonText}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton}>
              <Text style={styles.acceptButtonText}>Aceitar</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'accepted' && (
          <TouchableOpacity style={styles.startButton}>
            <PlayCircle size={20} color={colors.surface} />
            <Text style={styles.startButtonText}>Iniciar Entrega</Text>
          </TouchableOpacity>
        )}

        {item.status === 'in_progress' && (
          <TouchableOpacity style={styles.completeButton}>
            <CheckCircle size={20} color={colors.surface} />
            <Text style={styles.completeButtonText}>Concluir Entrega</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Pedidos',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.container}>
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum pedido disponível</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.success,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  orderFooter: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  rejectButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  acceptButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.info,
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.success,
  },
  completeButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.surface,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
