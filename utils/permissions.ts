import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useThemedDialog } from '@/components/ThemedDialog';

export type PermissionResult = { granted: boolean; canAskAgain: boolean };

export function usePermissionManager() {
  const dialog = useThemedDialog();

  async function requestLocation(): Promise<PermissionResult> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') return { granted: true, canAskAgain: true };

      await dialog.alert(
        'Permissão de Localização',
        Platform.OS === 'web'
          ? 'Ative a localização no navegador e recarregue a página para continuar.'
          : 'Precisamos da sua localização para mostrar o mapa e pedidos próximos. Você pode ativar nas configurações do app.'
      );

      if (Platform.OS !== 'web') {
        await dialog.confirm('Abrir Configurações', 'Deseja abrir as configurações agora?').then((ok) => {
          if (ok) Linking.openSettings();
        });
      }

      return { granted: false, canAskAgain: !!canAskAgain };
    } catch (e) {
      console.log('requestLocation error', e);
      return { granted: false, canAskAgain: false };
    }
  }

  async function requestMediaLibrary(): Promise<PermissionResult> {
    if (Platform.OS === 'web') {
      return { granted: true, canAskAgain: true };
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status === 'granted') return { granted: true, canAskAgain: perm.canAskAgain ?? true };

    await dialog.alert('Acesso à Galeria', 'Precisamos do acesso para selecionar sua foto de perfil.');
    const ok = await dialog.confirm('Abrir Configurações', 'Deseja abrir as configurações para permitir o acesso?');
    if (ok) Linking.openSettings();
    return { granted: false, canAskAgain: perm.canAskAgain ?? false };
  }

  async function requestCamera(): Promise<PermissionResult> {
    if (Platform.OS === 'web') {
      return { granted: true, canAskAgain: true };
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status === 'granted') return { granted: true, canAskAgain: perm.canAskAgain ?? true };

    await dialog.alert('Acesso à Câmera', 'Precisamos do acesso para tirar sua foto.');
    const ok = await dialog.confirm('Abrir Configurações', 'Deseja abrir as configurações para permitir o acesso?');
    if (ok) Linking.openSettings();
    return { granted: false, canAskAgain: perm.canAskAgain ?? false };
  }

  return { requestLocation, requestMediaLibrary, requestCamera };
}
