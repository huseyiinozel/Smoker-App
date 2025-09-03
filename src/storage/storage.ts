import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import i18n from '../locales/i18n';

const DAILY_DATA_KEY = 'dailyData';
const HISTORY_DATA_KEY = 'historyData';
const LIMIT_DATA_KEY = 'dailyLimit';

interface HistoryEntry {
    id: string;
    date: string;
    smokedCount: number;
    limit: number;
    overLimit: number;
    smokeTimes: { time: string }[];
}

export const getDailyData = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(DAILY_DATA_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        Alert.alert(
            i18n.t("defaultError.title"),
            i18n.t("defaultError.error"),
            [
                {
                    text: i18n.t("common.ok")
                }
            ]
        );
        return null;
    }
};

export const saveDailyData = async (data: any) => {
    try {
        const jsonValue = JSON.stringify(data);
        await AsyncStorage.setItem(DAILY_DATA_KEY, jsonValue);
    } catch (e) {
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

export const getHistoryData = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(HISTORY_DATA_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        Alert.alert(
            i18n.t("defaultError.title"),
            i18n.t("defaultError.error"),
            [
                {
                    text: i18n.t("common.ok")
                }
            ]
        );
        return [];
    }
};

export const saveHistoryData = async (data: HistoryEntry[]) => {
    try {
        const jsonValue = JSON.stringify(data);
        await AsyncStorage.setItem(HISTORY_DATA_KEY, jsonValue);
    } catch (e) {
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

export const saveDailyLimit = async (limit: number) => {
    try {
        await AsyncStorage.setItem(LIMIT_DATA_KEY, String(limit));
    } catch (e) {
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

export const getDailyLimit = async () => {
    try {
        const value = await AsyncStorage.getItem(LIMIT_DATA_KEY);
        return value != null ? parseInt(value) : 10;
    } catch (e) {
        Alert.alert(
            i18n.t("defaultError.title"),
            i18n.t("defaultError.error"),
            [
                {
                    text: i18n.t("common.ok")
                }
            ]
        );
        return 10;
    }
};

export const resetAllData = async (currentDailyData: any, currentLimit: number) => {
    try {
        const historyData = await getHistoryData();
        const currentDate = new Date();
        const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        const uniqueId = currentDate.getTime().toString();

        const historyEntry = {
            id: uniqueId,
            date: `${currentDate.toLocaleDateString('tr-TR')} - ${dayOfWeek}`,
            smokedCount: currentDailyData.smokedCount,
            limit: currentLimit,
            overLimit: Math.max(0, currentDailyData.smokedCount - currentLimit),
            smokeTimes: currentDailyData.smokeTimes,
        };

        const newHistoryData = [historyEntry, ...historyData];
        await saveHistoryData(newHistoryData);
        await AsyncStorage.removeItem(DAILY_DATA_KEY);
        return true;
    } catch (e) {
        Alert.alert(
            i18n.t("defaultError.title"),
            i18n.t("defaultError.error"),
            [
                {
                    text: i18n.t("common.ok")
                }
            ]
        );
        return false;
    }
};


export const deleteHistoryEntry = async (entryId: string) => {
    try {
        const historyData = await getHistoryData();
        const updatedHistory = historyData.filter((entry: HistoryEntry) => entry.id !== entryId);
        await saveHistoryData(updatedHistory);
        return true;
    } catch (e) {
        Alert.alert(
            i18n.t("defaultError.title"),
            i18n.t("defaultError.error"),
            [
                {
                    text: i18n.t("common.ok")
                }
            ]
        );
        return false;
    }
};