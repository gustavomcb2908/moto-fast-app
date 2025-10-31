import { Stack } from 'expo-router';
import React from 'react';

export default function RentalStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Locadora' }} />
      <Stack.Screen name="invoices" options={{ title: 'Faturas' }} />
      <Stack.Screen name="attachments" options={{ title: 'Anexos' }} />
      <Stack.Screen name="history" options={{ title: 'Histórico Financeiro' }} />
      <Stack.Screen name="pay" options={{ title: 'Pagamento' }} />
    </Stack>
  );
}
