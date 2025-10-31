import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { useThemedDialog } from '@/components/ThemedDialog';
import i18n, { LANGUAGE_KEY } from '@/i18n';

const PROMPT_KEY = '@motofast-language-prompt-shown';

export default function LanguageDetector() {
  const { t } = useTranslation();
  const dialog = useThemedDialog();
  const [checked, setChecked] = useState<boolean>(false);

  const deviceLang = useMemo(() => {
    try {
      const locales = (Localization as any).getLocales?.() ?? [];
      const tag: string = locales[0]?.languageTag ?? (Localization as any).locale ?? 'en';
      const base = tag.split('-')[0];
      // Prefer full tag if available in resources
      if ((i18n.options.resources as any)?.[tag]) return tag;
      return base;
    } catch (e) {
      console.log('LanguageDetector: detect error', e);
      return 'en';
    }
  }, []);

  const maybePrompt = useCallback(async () => {
    try {
      const already = await AsyncStorage.getItem(PROMPT_KEY);
      if (already) {
        setChecked(true);
        return;
      }
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      const current = saved ?? i18n.language ?? 'en';

      if (!deviceLang || deviceLang === current) {
        setChecked(true);
        await AsyncStorage.setItem(PROMPT_KEY, 'true');
        return;
      }

      const langLabel = labelFor(deviceLang);

      dialog.alert(
        t('settings.language_detected_title', 'Idioma detectado'),
        t(
          'settings.language_detected_message',
          `Detectamos que seu idioma é ${langLabel}. Deseja mudar o idioma do app?`
        ),
        [
          {
            text: t('common.no', 'Não'),
            role: 'cancel',
            onPress: async () => {
              await AsyncStorage.setItem(PROMPT_KEY, 'true');
              setChecked(true);
            },
          },
          {
            text: t('common.yes', 'Sim'),
            onPress: async () => {
              try {
                await AsyncStorage.setItem(PROMPT_KEY, 'true');
                await AsyncStorage.setItem(LANGUAGE_KEY, deviceLang);
                await i18n.changeLanguage(deviceLang);
                if (Platform.OS === 'web') {
                  console.log('Language changed to', deviceLang);
                }
              } catch (e) {
                console.log('Language change error', e);
              } finally {
                setChecked(true);
              }
            },
          },
        ]
      );
    } catch (e) {
      console.log('LanguageDetector: prompt error', e);
      setChecked(true);
    }
  }, [deviceLang, dialog, t]);

  useEffect(() => {
    // Only run once when mounted
    void maybePrompt();
  }, [maybePrompt]);

  return null;
}

function labelFor(code: string): string {
  switch (code) {
    case 'en':
      return 'Inglês';
    case 'es':
      return 'Espanhol';
    case 'fr':
      return 'Francês';
    case 'pt':
      return 'Português';
    case 'pt-BR':
      return 'Português (Brasil)';
    default:
      return code;
  }
}
