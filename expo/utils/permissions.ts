import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useThemedDialog } from '@/components/ThemedDialog';
import { toast } from '@/components/Toast';

export type PermissionResult = { granted: boolean; canAskAgain: boolean };

export function usePermissionManager() {
  const dialog = useThemedDialog();

  async function requestLocation(): Promise<PermissionResult> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        toast.success('📍 Localização ativada com sucesso!');
        return { granted: true, canAskAgain: true };
      }

      toast.warning(
        Platform.OS === 'web'
          ? 'Ative a localização no navegador para continuar'
          : 'Permissão de localização necessária'
      );

      if (Platform.OS !== 'web') {
        await dialog.confirm('Abrir Configurações', 'Deseja abrir as configurações agora?').then((ok) => {
          if (ok) Linking.openSettings();
        });
      }

      return { granted: false, canAskAgain: !!canAskAgain };
    } catch (e) {
      console.log('requestLocation error', e);
      toast.error('Erro ao solicitar permissão de localização');
      return { granted: false, canAskAgain: false };
    }
  }

  async function requestMediaLibrary(): Promise<PermissionResult> {
    if (Platform.OS === 'web') {
      return { granted: true, canAskAgain: true };
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status === 'granted') {
      toast.success('📸 Acesso à galeria permitido');
      return { granted: true, canAskAgain: perm.canAskAgain ?? true };
    }

    toast.warning('Acesso à galeria necessário');
    const ok = await dialog.confirm('Abrir Configurações', 'Deseja abrir as configurações para permitir o acesso?');
    if (ok) Linking.openSettings();
    return { granted: false, canAskAgain: perm.canAskAgain ?? false };
  }

  async function requestCamera(): Promise<PermissionResult> {
    if (Platform.OS === 'web') {
      return { granted: true, canAskAgain: true };
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status === 'granted') {
      toast.success('📷 Acesso à câmera permitido');
      return { granted: true, canAskAgain: perm.canAskAgain ?? true };
    }

    toast.warning('Acesso à câmera necessário');
    const ok = await dialog.confirm('Abrir Configurações', 'Deseja abrir as configurações para permitir o acesso?');
    if (ok) Linking.openSettings();
    return { granted: false, canAskAgain: perm.canAskAgain ?? false };
  }

  return { requestLocation, requestMediaLibrary, requestCamera };
}
