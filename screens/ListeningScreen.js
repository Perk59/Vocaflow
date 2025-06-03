import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';
import Voice from '@react-native-voice/voice';
import { sendProgress } from '../api/progressApi';
import { generateUserId } from '../utils/userUtils';

const ListeningScreen = ({ navigation }) => {
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [listeningWords, setListeningWords] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [settings, setSettings] = useState({
    speechRate: 0.5,
    outputChannel: 'both',
    loopInterval: 10,
  });

  const intervalRef = useRef(null);
  const wordsRef = useRef([]);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    initializeScreen();
    setupTts();
    setupVoice();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeScreen = async () => {
    try {
      const savedWords = await AsyncStorage.getItem('words');
      const savedSettings = await AsyncStorage.getItem('settings');
      
      if (savedWords) {
        const wordsList = JSON.parse(savedWords);
        setWords(wordsList);
        wordsRef.current = wordsList;
      }
      
      if (savedSettings) {
        const settingsData = JSON.parse(savedSettings);
        setSettings(settingsData);
        Tts.setDefaultRate(settingsData.speechRate);
      }
      
      setStartTime(Date.now());
    } catch (error) {
      console.error('初期化エラー:', error);
    }
  };

  const setupTts = () => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(settings.speechRate);
    
    Tts.addEventListener('tts-start', () => {});
    Tts.addEventListener('tts-finish', () => {});
    Tts.addEventListener('tts-cancel', () => {});
  };

  const setupVoice = () => {
    Voice.onSpeechResults = (e) => {
      console.log('音声認識結果:', e.value);
    };
    
    Voice.onSpeechError = (e) => {
      console.log('音声認識エラー:', e.error);
    };
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    Tts.stop();
    Voice.destroy();
  };

  const startListening = () => {
    if (words.length === 0) {
      Alert.alert('エラー', '単語データがありません');
      return;
    }

    setIsPlaying(true);
    playCurrentWord();
    
    // ループ再生を設定
    intervalRef.current = setInterval(() => {
      playNextWord();
    }, settings.loopInterval * 1000);
  };

  const stopListening = async () => {
    setIsPlaying(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    Tts.stop();
    
    // 学習結果を送信
    await sendLearningProgress();
  };

  const playCurrentWord = () => {
    if (wordsRef.current.length > 0) {
      const currentWord = wordsRef.current[currentIndexRef.current];
      
      // 聴いた単語を記録
      setListeningWords(prev => {
        const newWords = [...prev];
        if (!newWords.includes(currentWord.id)) {
          newWords.push(currentWord.id);
        }
        return newWords;
      });
      
      // 音声合成で再生
      const textToSpeak = `${currentWord.word}. ${currentWord.meaning}`;
      Tts.speak(textToSpeak);
    }
  };

  const playNextWord = () => {
    currentIndexRef.current = (currentIndexRef.current + 1) % wordsRef.current.length;
    setCurrentWordIndex(currentIndexRef.current);
    playCurrentWord();
  };

  const sendLearningProgress = async () => {
    try {
      const userId = await generateUserId();
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      const response = await sendProgress({
        user_id: userId,
        word_ids: listeningWords,
        duration: duration,
      });
      
      if (response.success) {
        // クイズ画面に遷移
        navigation.navigate('Quiz', { lastWords: listeningWords });
      } else {
        Alert.alert('エラー', '学習記録の送信に失敗しました');
      }
    } catch (error) {
      console.error('進捗送信エラー:', error);
      Alert.alert('エラー', '学習記録の送信に失敗しました');
    }
  };

  const getCurrentWord = () => {
    if (words.length > 0 && currentWordIndex < words.length) {
      return words[currentWordIndex];
    }
    return { word: '', meaning: '' };
  };

  const currentWord = getCurrentWord();

  return (
    <View style={styles.container}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          学習中: {listeningWords.length}語 | 
          時間: {startTime ? Math.floor((Date.now() - startTime) / 60000) : 0}分
        </Text>
      </View>

      <View style={styles.wordDisplay}>
        <Text style={styles.englishWord}>{currentWord.word}</Text>
        <Text style={styles.japaneseWord}>{currentWord.meaning}</Text>
      </View>

      <View style={styles.controls}>
        {!isPlaying ? (
          <TouchableOpacity 
            style={[styles.button, styles.startButton]}
            onPress={startListening}
          >
            <Text style={styles.buttonText}>学習開始</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]}
            onPress={stopListening}
          >
            <Text style={styles.buttonText}>学習終了</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, styles.nextButton]}
          onPress={playNextWord}
          disabled={!isPlaying}
        >
          <Text style={styles.buttonText}>次の単語</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          {isPlaying ? '音声を聞きながら家事を続けてください' : '開始ボタンを押して学習を始めましょう'}
        </Text>
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
  statusBar: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#333',
  },
  wordDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 15,
    padding: 30,
  },
  englishWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 20,
    textAlign: 'center',
  },
  japaneseWord: {
    fontSize: 24,
    color: '#666',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  nextButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    alignItems: 'center',
    padding: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ListeningScreen;
