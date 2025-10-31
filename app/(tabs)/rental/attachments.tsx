import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { Paperclip, UploadCloud } from 'lucide-react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { trpc } from '@/lib/trpc';

export default function AttachmentsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [file, setFile] = useState<{ uri: string } | null>(null);
  const params = useLocalSearchParams<{ invoiceId?: string; paymentId?: string }>();
  const uploadMutation = trpc.rental.attachments.upload.useMutation();

  const pickFile = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 });
      if (res.canceled) return;
      const asset = res.assets?.[0];
      if (asset?.uri) setFile({ uri: asset.uri });
      console.log('Picked image:', asset?.uri);
    } catch (e) {
      console.log('File pick error', e);
    }
  };

  const upload = async () => {
    try {
      if (!file?.uri) return;
      await uploadMutation.mutateAsync({ invoiceId: params.invoiceId ? String(params.invoiceId) : undefined, paymentId: params.paymentId ? String(params.paymentId) : undefined, fileUri: file.uri });
      Alert.alert('Anexo', 'Comprovativo enviado com sucesso!');
      setFile(null);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Falha ao enviar comprovativo');
    }
  };

  return (
    <View style={styles.container} testID="attachments-screen">
      <Stack.Screen options={{ title: 'Anexos' }} />
      <View style={styles.card}>
        <View style={styles.header}>
          <Paperclip size={20} color={colors.primary} />
          <Text style={styles.title}>Comprovativo de Pagamento</Text>
        </View>
        <Text style={styles.caption}>Envie PDF ou imagem do comprovativo.</Text>

        {file?.uri ? (
          <View style={styles.preview}>
            <Image source={{ uri: file.uri }} style={{ width: '100%', height: 160, borderRadius: 12 }} />
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={pickFile} activeOpacity={0.8} testID="pick-proof">
          <UploadCloud size={18} color="#fff" />
          <Text style={styles.buttonText}>Selecionar arquivo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.success, opacity: uploadMutation.isPending ? 0.7 : 1 }]} onPress={upload} activeOpacity={0.8} disabled={!file?.uri || uploadMutation.isPending} testID="upload-proof">
          {uploadMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Enviar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 16, fontWeight: '700' as const, color: colors.text },
  caption: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  button: { marginTop: 16, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  buttonText: { color: '#fff', fontWeight: '700' as const },
  preview: { marginTop: 12 },
  pdfBox: { height: 80, borderRadius: 12, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  pdfText: { color: colors.textSecondary },
});
