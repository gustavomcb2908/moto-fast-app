import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Perfil' }} />
      <Stack.Screen name="details" options={{ title: 'Informações Pessoais' }} />
      <Stack.Screen name="settings" options={{ title: 'Definições' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notificações' }} />
      <Stack.Screen name="support" options={{ title: 'Suporte e Ajuda' }} />

    </Stack>
  );
}
