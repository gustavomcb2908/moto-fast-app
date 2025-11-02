import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useOrders } from '@/contexts/OrdersContext';
import { MapPin, Clock, DollarSign, CheckCircle, Circle, PlayCircle, Power } from 'lucide-react-native';
import type { Order } from '@/services/backgroundTasks';

export default function OrdersScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    availableOrders,
    activeOrder,
    completedOrders,
    isLoading,
    isOnline,
    acceptOrder,
    rejectOrder,
    markAsPickedUp,
    markAsDelivered,
    toggleOnlineStatus,
    refreshOrders,
  } = useOrders();

  const allOrders: Order[] = useMemo(() => {
    const orders: Order[] = [];
    if (activeOrder) orders.push(activeOrder);
    orders.push(...availableOrders);
    orders.push(...completedOrders.slice(0, 10));
    return orders;
  }, [activeOrder, availableOrders, completedOrders]);

  const getStatusConfig = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'Disponível', color: colors.warning, icon: Circle };
      case 'accepted':
        return { label: 'Aceite', color: colors.info, icon: PlayCircle };
      case 'picked_up':
        return { label: 'Recolhido', color: colors.primary, icon: PlayCircle };
      case 'delivered':
        return { label: 'Entregue', color: colors.success, icon: CheckCircle };
      default:
        return { label: 'Cancelado', color: colors.error, icon: Circle };
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const statusConfig = getStatusConfig(item.status);
    const StatusIcon = statusConfig.icon;

    return (
      <View
        style={styles.orderCard}
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

        <View style={styles.addressRow}>
          <MapPin size={16} color={colors.primary} />
          <Text style={styles.addressLabel}>Recolha:</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.pickup.address}
          </Text>
        </View>

        <View style={styles.addressRow}>
          <MapPin size={16} color={colors.success} />
          <Text style={styles.addressLabel}>Entrega:</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.delivery.address}
          </Text>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.infoItem}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>~{item.estimatedTime}min</Text>
          </View>
          <View style={styles.infoItem}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.distance.toFixed(1)} km</Text>
          </View>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => rejectOrder(item.id)}
            >
              <Text style={styles.rejectButtonText}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => acceptOrder(item.id)}
            >
              <Text style={styles.acceptButtonText}>Aceitar</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'accepted' && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => markAsPickedUp()}
          >
            <PlayCircle size={20} color={colors.surface} />
            <Text style={styles.startButtonText}>Marcar como Recolhido</Text>
          </TouchableOpacity>
        )}

        {item.status === 'picked_up' && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => markAsDelivered()}
          >
            <CheckCircle size={20} color={colors.surface} />
            <Text style={styles.completeButtonText}>Marcar como Entregue</Text>
          </TouchableOpacity>
        )}
      </View>
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
          headerRight: () => (
            <TouchableOpacity
              onPress={toggleOnlineStatus}
              style={{ marginRight: 16 }}
            >
              <Power
                size={24}
                color={isOnline ? colors.success : colors.textSecondary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {isOnline && (
          <View style={styles.onlineBanner}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online - Recebendo pedidos</Text>
          </View>
        )}
        
        {isLoading && allOrders.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando pedidos...</Text>
          </View>
        ) : (
          <FlatList
            data={allOrders}
            renderItem={renderOrder}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refreshOrders}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isOnline
                    ? 'Nenhum pedido disponível no momento'
                    : 'Você está offline. Ative para receber pedidos.'}
                </Text>
                {!isOnline && (
                  <TouchableOpacity
                    style={styles.goOnlineButton}
                    onPress={toggleOnlineStatus}
                  >
                    <Power size={20} color={colors.surface} />
                    <Text style={styles.goOnlineText}>Ficar Online</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  onlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '15',
    paddingVertical: 12,
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  onlineText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.success,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  goOnlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  goOnlineText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.surface,
  },
});
