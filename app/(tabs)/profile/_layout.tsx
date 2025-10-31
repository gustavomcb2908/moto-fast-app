import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.text,

      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Perfil',
        }}
      />
      <Stack.Screen
        name="details"
        options={{
          title: 'Informações Pessoais',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Definições',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notificações',
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          title: 'Suporte e Ajuda',
        }}
      />
    </Stack>
  );
}
