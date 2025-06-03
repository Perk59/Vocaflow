import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tts from 'react-native-tts';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    speechRate: 0.5,
    outputChannel: 'both',
    loopInterval: 10,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      // TTS設定を更新
      Tts.setDefaultRate(newSettings.speechRate);
      
      Alert.alert('設定完了', '設定が保存されました');
    } catch (error) {
      console.error('設定保存エラー:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const updateSpeechRate = (rate) => {
    const newSettings = { ...settings, speechRate: rate };
    saveSettings(newSettings);
  };

  const updateOutputChannel = (channel) => {
    const newSettings = { ...settings, outputChannel: channel };
    saveSettings(newSettings);
  };

  const updateLoopInterval = (interval) => {
    const newSettings = { ...settings, loopInterval: interval };
    saveSettings(newSettings);
  };

  const testSpeech = () => {
    Tts.speak('This is a test. これはテストです。');
  };

  const resetSettings = () => {
    Alert.alert(
      '設定をリセット',
      '設定を初期値に戻しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'リセット', onPress: () => {
          const defaultSettings = {
            speechRate: 0.5,
            outputChannel: 'both',
            loopInterval: 10,
          };
          saveSettings(defaultSettings);
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>音声設定</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>音声速度</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>遅い</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={1.0}
              value={settings.speechRate}
              onValueChange={updateSpeechRate}
              step={0.1}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#e0e0e0"
              thumbStyle={{ backgroundColor: '#2196F3' }}
            />
            <Text style={styles.sliderValue}>速い</Text>
          </View>
          <Text style={styles.currentValue}>現在: {settings.speechRate.toFixed(1)}</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>出力チャンネル</Text>
          <View style={styles.channelContainer}>
            <TouchableOpacity
              style={[
                styles.channelButton,
                settings.outputChannel === 'left' && styles.activeChannel
              ]}
              onPress={() => updateOutputChannel('left')}
            >
              <Text style={[
                styles.channelText,
                settings.outputChannel === 'left' && styles.activeChannelText
              ]}>左耳のみ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.channelButton,
                settings.outputChannel === 'both' && styles.activeChannel
              ]}
              onPress={() => updateOutputChannel('both')}
            >
              <Text style={[
                styles.channelText,
                settings.outputChannel === 'both' && styles.activeChannelText
              ]}>両耳</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.channelButton,
                settings.outputChannel === 'right' && styles.activeChannel
              ]}
              onPress={() => updateOutputChannel('right')}
            >
              <Text style={[
                styles.channelText,
                settings.outputChannel === 'right' && styles.activeChannelText
              ]}>右耳のみ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>ループ間隔</Text>
          <Picker
            selectedValue={settings.loopInterval}
            style={styles.picker}
            onValueChange={updateLoopInterval}
          >
            <Picker.Item label="5秒" value={5} />
            <Picker.Item label="10秒" value={10} />
            <Picker.Item label="15秒" value={15} />
            <Picker.Item label="20秒" value={20} />
            <Picker.Item label="30秒" value={30} />
            <Picker.Item label="1分" value={60} />
          </Picker>
        </View>

        <TouchableOpacity style={styles.testButton} onPress={testSpeech}>
          <Text style={styles.testButtonText}>音声テスト</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>その他</Text>
        
        <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
          <Text style={styles.resetButtonText}>設定をリセット</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          設定は自動的に保存されます
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  settingItem: {
    marginBottom: 25,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  sliderValue: {
    fontSize: 12,
    color: '#666',
  },
  currentValue: {
    fontSize: 14,
    color: '#2196F3',
    textAlign: 'center',
    marginTop: 5,
  },
  channelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  channelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeChannel: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  channelText: {
    fontSize: 14,
    color: '#666',
  },
  activeChannelText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  picker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  resetButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen;
