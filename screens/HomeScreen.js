import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWords } from '../api/wordsApi';

const HomeScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [totalWords, setTotalWords] = useState(0);

  useEffect(() => {
    loadWordsCount();
  }, []);

  const loadWordsCount = async () => {
    try {
      const words = await getWords();
      setTotalWords(words.length);
      await AsyncStorage.setItem('words', JSON.stringify(words));
    } catch (error) {
      console.error('単語の読み込みエラー:', error);
      Alert.alert('エラー', '単語データの読み込みに失敗しました');
    }
  };

  const startLearning = () => {
    setIsLoading(true);
    navigation.navigate('Listening');
    setIsLoading(false);
  };

  const openSettings = () => {
    navigation.navigate('Settings');
  };

  const viewProgress = () => {
    Alert.alert('学習履歴', '学習履歴機能は今後実装予定です');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ハンズフリー英単語学習アプリ</Text>
        <Text style={styles.subtitle}>家事をしながら英語学習</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoText}>登録単語数: {totalWords}語</Text>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={startLearning}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>学習開始</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={openSettings}
        >
          <Text style={styles.buttonText}>設定</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={viewProgress}
        >
          <Text style={styles.buttonText}>学習履歴</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>音声で学習、クイズで確認</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'center',
  },
  button: {
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default HomeScreen;
