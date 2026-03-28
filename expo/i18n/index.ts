import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import pt from './pt.json';
import ptBR from './pt-BR.json';

const resources: Resource = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  pt: { translation: pt },
  'pt-BR': { translation: ptBR },
};

const LANGUAGE_KEY = '@motofast-language';

const resolveInitialLanguage = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved) return saved;
  } catch (e) {
    console.log('i18n load error', e);
  }
  try {
    const locales = Localization.getLocales?.() ?? [];
    const tag = locales[0]?.languageTag ?? 'en';
    const base = tag.split('-')[0];
    if (resources[tag as keyof typeof resources]) return tag;
    if (resources[base as keyof typeof resources]) return base;
  } catch (e) {
    console.log('i18n detect error', e);
  }
  return 'en';
};

export const changeLanguage = async (lang: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {}
  await i18n.changeLanguage(lang);
};

(async () => {
  const lng = await resolveInitialLanguage();
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      returnNull: false,
    })
    .catch((e) => console.log('i18n init error', e));
})();

export default i18n;
export { LANGUAGE_KEY };
