import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Keyboard, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import i18n, { loadLanguage, saveLanguage } from '../../src/locales/i18n';
import { getDailyData, getDailyLimit, resetAllData, saveDailyData, saveDailyLimit } from '../../src/storage/storage';

const { width } = Dimensions.get('window');

const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface SmokeTime {
    key: string;
    time: string;
}

export default function HomeScreen() {
    const [dailyLimit, setDailyLimit] = useState<number>(10);
    const [smokedCount, setSmokedCount] = useState<number>(0);
    const [smokeTimes, setSmokeTimes] = useState<SmokeTime[]>([]);
    const [timeSinceLastSmoke, setTimeSinceLastSmoke] = useState<number>(0);
    const [lastSmokeTimestamp, setLastSmokeTimestamp] = useState<number | null>(null);
    const [isLimitModalVisible, setIsLimitModalVisible] = useState<boolean>(false);
    const [limitInput, setLimitInput] = useState<string>('');
    const [currentLanguage, setCurrentLanguage] = useState(i18n.locale);
    const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

    useFocusEffect(
        React.useCallback(() => {
            const handleLoad = async () => {
                await loadLanguage();
                setCurrentLanguage(i18n.locale);
            };
            handleLoad();
            const loadData = async () => {
                const loadedData = await getDailyData();
                const loadedLimit = await getDailyLimit();

                if (loadedData) {
                    setSmokedCount(loadedData.smokedCount);
                    setSmokeTimes(loadedData.smokeTimes);
                    setLastSmokeTimestamp(loadedData.lastSmokeTimestamp);
                }
                if (loadedLimit) {
                    setDailyLimit(loadedLimit);
                    setLimitInput(String(loadedLimit));
                }
                setIsDataLoaded(true);
            };
            loadData();
        }, [])
    );

    useEffect(() => {
        let interval: number | null = null;
        if (lastSmokeTimestamp !== null) {
            interval = setInterval(() => {
                const timeDiff = Math.floor((Date.now() - lastSmokeTimestamp) / 1000);
                setTimeSinceLastSmoke(timeDiff);
            }, 1000);
        } else {
            setTimeSinceLastSmoke(0);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [lastSmokeTimestamp]);

    useEffect(() => {
        if (!isDataLoaded) return;
        const saveData = async () => {
            const dataToSave = {
                smokedCount,
                smokeTimes,
                lastSmokeTimestamp,
            };
            await saveDailyData(dataToSave);
        };
        saveData();
    }, [smokedCount, smokeTimes, lastSmokeTimestamp]);

    const handleSmoke = () => {
        const now = new Date();
        const newSmokeTime = {
            key: now.toISOString(),
            time: now.toLocaleTimeString(i18n.locale, { hour: '2-digit', minute: '2-digit' }),
        };

        const newSmokedCount = smokedCount + 1;
        const newSmokeTimes = [newSmokeTime, ...smokeTimes];
        const newTimestamp = Date.now();

        setSmokedCount(newSmokedCount);
        setSmokeTimes(newSmokeTimes);
        setLastSmokeTimestamp(newTimestamp);
    };

    const handleReset = async () => {
        Alert.alert(
            i18n.t('home.alertResetTitle'),
            i18n.t('home.alertResetMessage'),
            [
                {
                    text: i18n.t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: i18n.t('common.save'),
                    onPress: async () => {
                        const success = await resetAllData({ smokedCount, smokeTimes, lastSmokeTimestamp }, dailyLimit);
                        if (success) {
                            setSmokedCount(0);
                            setSmokeTimes([]);
                            setLastSmokeTimestamp(null);
                        }
                    },
                },
            ]
        );
    };

    const handleSetLimit = async () => {
        const newLimit = parseInt(limitInput);
        if (isNaN(newLimit) || newLimit <= 0) {
            Alert.alert(i18n.t('home.alertInvalidLimitTitle'), i18n.t('home.alertInvalidLimitMessage'));
            return;
        }
        await saveDailyLimit(newLimit);
        setDailyLimit(newLimit);
        setIsLimitModalVisible(false);
    };

    const handleCancelLimit = () => {
        setIsLimitModalVisible(false);
        Keyboard.dismiss();
    };

    const handleRemoveSmokeEntry = (keyToRemove: string) => {
        Alert.alert(
            i18n.t('home.alertRemoveTitle'),
            i18n.t('home.alertRemoveMessage'),
            [
                {
                    text: i18n.t('common.cancel'),
                    style: 'cancel',
                },
                {
                    text: i18n.t('common.delete'),
                    onPress: () => {
                        const updatedSmokeTimes = smokeTimes.filter(item => item.key !== keyToRemove);
                        const newSmokedCount = updatedSmokeTimes.length;

                        const newLastSmokeTimestamp = updatedSmokeTimes.length > 0
                            ? new Date(updatedSmokeTimes[0].key).getTime()
                            : null;

                        setSmokedCount(newSmokedCount);
                        setSmokeTimes(updatedSmokeTimes);
                        setLastSmokeTimestamp(newLastSmokeTimestamp);
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const toggleLanguage = async () => {
        const newLanguage = currentLanguage === 'tr' ? 'en' : 'tr';
        await saveLanguage(newLanguage);
        setCurrentLanguage(newLanguage);
    };

    const formatDateWithWeekday = (date: Date) => {
        const weekdays = i18n.t('common.weekdays', { returnObjects: true });
        const months = i18n.t('common.months', { returnObjects: true });
        const day = date.getDate();
        const month = months[date.getMonth()];
        const weekday = weekdays[date.getDay()];
        return `${day} ${month} ${weekday}`;
    };

    const today = new Date();
    const formattedDate = formatDateWithWeekday(today);
    const remainingSmokes = dailyLimit - smokedCount;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
                    <Text style={styles.languageButtonText}>{i18n.locale.toUpperCase()}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsLimitModalVisible(true)} style={styles.limitButton}>
                    <Text style={styles.limitButtonText}>{i18n.t('home.limitButtonText')} {dailyLimit}</Text>
                    <Ionicons name="settings" size={20} color="#fff" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.date}>
                    {i18n.t('home.date').replace('{date}', formattedDate)}
                </Text>

                <Text style={styles.timerText}>{formatTime(timeSinceLastSmoke)}</Text>
                <Text style={styles.timerLabel}>{i18n.t('home.timeSinceLastSmoke')}</Text>

                <TouchableOpacity onPress={handleSmoke} style={styles.smokeButton}>
                    <Text style={styles.smokeButtonText}>{i18n.t('home.smokeButtonText')}</Text>
                    <MaterialCommunityIcons name="smoking" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                    <Text style={styles.resetButtonText}>{i18n.t('home.resetButtonText')}</Text>
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>{i18n.t('home.smokedCount')} {smokedCount}</Text>
                    {remainingSmokes >= 0 ? (
                        <Text style={styles.infoText}>{i18n.t('home.remainingSmokes')} {remainingSmokes}</Text>
                    ) : (
                        <Text style={[styles.infoText, styles.overLimitText]}>
                            {i18n.t('home.overLimit').replace('{count}', String(-remainingSmokes))}
                        </Text>
                    )}
                </View>

                <Text style={styles.listHeader}>{i18n.t('home.listHeader')}</Text>
                <FlatList
                    data={smokeTimes}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <Text style={styles.listText}>{item.time}</Text>
                            <TouchableOpacity onPress={() => handleRemoveSmokeEntry(item.key)} style={styles.removeButton}>
                                <Ionicons name="close-circle-outline" size={24} color="#e74c3c" />
                            </TouchableOpacity>
                        </View>
                    )}
                    keyExtractor={(item) => item.key}
                    style={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyListText}>{i18n.t('home.emptyListText')}</Text>}
                />
            </View>

            {isLimitModalVisible && (
                <Pressable onPress={handleCancelLimit} style={styles.modalOverlay}>
                    <Pressable onPress={() => Keyboard.dismiss()} style={styles.limitModal}>
                        <Text style={styles.modalTitle}>{i18n.t('home.modalTitle')}</Text>
                        <TextInput
                            style={styles.limitInput}
                            placeholder={i18n.t('home.modalPlaceholder')}
                            keyboardType="numeric"
                            onChangeText={setLimitInput}
                            value={limitInput}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={handleCancelLimit} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSetLimit} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>{i18n.t('common.save')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        width: '100%',
        zIndex: 1,
        marginTop: 40,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 0,
        marginTop: 30,
    },
    timerText: {
        fontSize: 52,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    timerLabel: {
        fontSize: 16,
        color: '#7f8c8d',
        marginBottom: 30,
    },
    smokeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e74c3c',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        minWidth: 200,
        marginBottom: 10,
    },
    smokeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
    resetButton: {
        backgroundColor: '#95a5a6',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 50,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    infoContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 18,
        color: '#34495e',
        marginBottom: 5,
    },
    overLimitText: {
        color: '#e74c3c',
        fontWeight: 'bold',
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginTop: 20,
        marginBottom: 10,
    },
    list: {
        width: '100%',
        marginTop: 10,
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ecf0f1',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#3498db',
    },
    listText: {
        fontSize: 16,
        color: '#34495e',
    },
    emptyListText: {
        textAlign: 'center',
        color: '#7f8c8d',
        marginTop: 20,
    },
    limitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3498db',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        elevation: 3,
    },
    limitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    limitModal: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 15,
        width: width * 0.8,
        alignItems: 'center',
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#34495e',
    },
    limitInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
        textAlign: 'center',
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    removeButton: {
        padding: 5,
    },
    cancelButton: {
        backgroundColor: '#95a5a6',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: '#3498db',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    date: {
        color: "black",
        fontSize: 14,
    },
    languageButton: {
        backgroundColor: '#7f8c8d',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        elevation: 3,
    },
    languageButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});