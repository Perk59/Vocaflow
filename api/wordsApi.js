import axios from 'axios';

// サーバーのベースURL（実際のXserverドメインに変更してください）
const BASE_URL = 'https://your-domain.xsrv.jp/api';

/**
 * 単語リストを取得する
 * @returns {Promise<Array>} 単語配列
 */
export const getWords = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/words.php`, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10秒タイムアウト
    });

    if (response.status === 200 && response.data) {
      return response.data;
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('単語取得エラー:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('サーバー接続がタイムアウトしました');
    } else if (error.response) {
      // サーバーからエラーレスポンスが返ってきた場合
      throw new Error(`サーバーエラー: ${error.response.status}`);
    } else if (error.request) {
      // リクエストが送信されたが、レスポンスが返ってこなかった場合
      throw new Error('サーバーに接続できませんでした');
    } else {
      // その他のエラー
      throw new Error('予期しないエラーが発生しました');
    }
  }
};

/**
 * 単語リストをキャッシュから取得、なければサーバーから取得
 * @returns {Promise<Array>} 単語配列
 */
export const getWordsWithCache = async () => {
  try {
    // まずキャッシュから取得を試行
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const cachedWords = await AsyncStorage.getItem('words');
    
    if (cachedWords) {
      const words = JSON.parse(cachedWords);
      // キャッシュが1時間以内の場合はそれを使用
      const cacheTime = await AsyncStorage.getItem('words_cache_time');
      if (cacheTime && (Date.now() - parseInt(cacheTime)) < 3600000) {
        return words;
      }
    }
    
    // キャッシュがないか古い場合はサーバーから取得
    const words = await getWords();
    
    // キャッシュに保存
    await AsyncStorage.setItem('words', JSON.stringify(words));
    await AsyncStorage.setItem('words_cache_time', Date.now().toString());
    
    return words;
  } catch (error) {
    console.error('キャッシュ付き単語取得エラー:', error);
    throw error;
  }
};
