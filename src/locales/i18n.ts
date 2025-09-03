import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import { Alert } from 'react-native';
import locales from './locales.json';

const i18n = new I18n(locales);

export const saveLanguage = async (language: string) => {
    try {
        await AsyncStorage.setItem('user-language', language);
        i18n.locale = language;
    } catch (error) {
        Alert.alert(
            i18n.t("defaultError.title"),
            i18n.t("defaultError.error"),
            [
                {
                    text: i18n.t("common.ok")
                }
            ]
        );
    }
};
export const loadLanguage = async () => {
    try {
        const storedLanguage = await AsyncStorage.getItem('user-language');
        let finalLanguage: string;
        if (storedLanguage) {
            finalLanguage = storedLanguage;
        } else {
            const deviceLocales = Localization.getLocales();
            if (deviceLocales && deviceLocales.length > 0 && deviceLocales[0].languageCode) {
                finalLanguage = deviceLocales[0].languageCode;
            } else {
                finalLanguage = 'en';
            }
            await AsyncStorage.setItem('user-language', finalLanguage);
        }
        i18n.locale = finalLanguage;

    } catch (error) {
         Alert.alert(
            i18n.t("defaultError.title"),
            i18n.t("defaultError.error"),
            [
                {
                    text: i18n.t("common.ok")
                }
            ]
        );
        i18n.locale = 'en';
    }
};

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;