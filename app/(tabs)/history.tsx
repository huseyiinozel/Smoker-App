import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import i18n from '../../src/locales/i18n';
import { deleteHistoryEntry, getHistoryData } from '../../src/storage/storage';

interface HistoryEntry {
    id: string;
    date: string;
    smokedCount: number;
    limit: number;
    overLimit: number;
    smokeTimes: { time: string }[];
}

const formatDateWithWeekday = (dateString: string) => {
    const parts = dateString.split('.');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const weekdays = i18n.t('common.weekdays', { returnObjects: true }) as string[];
    const months = i18n.t('common.months', { returnObjects: true }) as string[];
    const formattedDay = date.getDate();
    const formattedMonth = months[date.getMonth()];
    const formattedWeekday = weekdays[date.getDay()];

    return `${formattedDay} ${formattedMonth} ${formattedWeekday}`;
};

export default function HistoryScreen() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.locale);

    const loadHistory = async () => {
        const loadedHistory = await getHistoryData();
        setHistory(loadedHistory);
    };

    useFocusEffect(
        React.useCallback(() => {
            loadHistory();
            setCurrentLanguage(i18n.locale);
        }, [currentLanguage])
    );

    const handleDelete = (item: HistoryEntry) => {
        Alert.alert(
            i18n.t('history.alertDeleteTitle'),
            i18n.t('history.alertDeleteMessage'),
            [
                {
                    text: i18n.t('common.cancel'),
                    style: "cancel"
                },
                {
                    text: i18n.t('common.delete'),
                    onPress: async () => {
                        const success = await deleteHistoryEntry(item.id);
                        if (success) {
                            loadHistory();
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: HistoryEntry }) => (
        <SafeAreaView style={styles.historyItem}>
            <View style={styles.historyItemHeader}>
                {/* Tarihi yeniden formatlıyoruz */}
                <Text style={styles.historyDate}>{formatDateWithWeekday(item.date)}</Text>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteButton}>
                    <Ionicons name="trash-bin-outline" size={24} color="#e74c3c" />
                </TouchableOpacity>
            </View>
            <Text style={styles.historyText}>{i18n.t('history.smokedCount')} {item.smokedCount} / {i18n.t('history.limit')} {item.limit}</Text>
            {item.overLimit > 0 && (
                <Text style={styles.overLimitText}>
                    {i18n.t('history.overLimit').replace('{count}', String(item.overLimit))}
                </Text>
            )}
            <Text style={styles.historySubHeader}>{i18n.t('history.historySubHeader')}</Text>
            <Text style={styles.historyTimes}>{item.smokeTimes.map(s => s.time).join(', ')}</Text>
        </SafeAreaView>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{i18n.t('history.title')}</Text>
            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>{i18n.t('history.emptyText')}</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'black',
        marginTop: Platform.OS === 'ios' ? 50 : 40,
        textAlign: "center"
    },
    historyItem: {
        backgroundColor: '#ecf0f1',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    historyItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    historyDate: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
    },
    historyText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 5,
    },
    overLimitText: {
        fontSize: 16,
        color: '#e74c3c',
        fontWeight: 'bold',
        marginTop: 5,
    },
    historySubHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 5,
        color: '#7f8c8d',
    },
    historyTimes: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#7f8c8d',
    },
    deleteButton: {
        padding: 5,
    },
});