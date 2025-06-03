import axios from 'axios';

// サーバーのベースURL（実際のXserverドメインに変更してください）
const BASE_URL = 'https://your-domain.xsrv.jp/api';

/**
 * 学習進捗をサーバーに送信する
 * @param {Object} progressData - 進捗データ
 * @param {string} progressData.user_id - ユーザーID
 * @param {Array} progressData.word_ids - 学習した単語IDの配列
 * @param {number} progressData.duration - 学習時間（秒）
 * @returns {Promise<Object>} サーバーレスポンス
 */
export const sendProgress = async (progressData) => {
  try {
    // データバリデーション
    if (!progressData.user_id || !progressData.word_ids || !progressData.duration) {
      throw new Error('必要なデータが不足しています');
    }

    if (!Array.isArray(progressData.word_ids)) {
      throw new Error('word_idsは配列である必要があります');
    }

    if (typeof progressData.duration !== 'number' || progressData.duration <= 0) {
      throw new Error('durationは正の数値である必要があります');
    }

    const response = await axios.post(`${BASE_URL}/progress.php`, progressData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000, // 15秒タイムアウト
    });

    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        message: '学習進捗が正常に送信されました'
      };
    } else {
      throw new Error(`サーバーエラー: ${response.status}`);
    }
  } catch (error) {
    console.error('進捗送信エラー:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('サーバー接続がタイムアウトしました');
    } else if (error.response) {
      // サーバーからエラーレスポンスが返ってきた場合
      const errorMessage = error.response.data?.error || 'サーバーエラーが発生しました';
      throw new Error(`サーバーエラー: ${errorMessage}`);
    } else if (error.request) {
      // リクエストが送信されたが、レスポンスが返ってこなかった場合
      throw new Error('サーバーに接続できませんでした');
    } else {
      // その他のエラー
      throw new Error(error.message || '予期しないエラーが発生しました');
    }
  }
};

/**
 * 学習進捗をローカルストレージにも保存する（オフライン対応）
 * @param {Object} progressData - 進捗データ
 * @returns {Promise<Object>} レスポンス
 */
export const saveProgressWithBackup = async (progressData) => {
  try {
    // まずローカルに保存
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const timestamp = Date.now();
    const localProgress = {
      ...progressData,
      timestamp,
      synced: false
    };

    const existingProgress = await AsyncStorage.getItem('unsync_progress');
    const progressList = existingProgress ? JSON.parse(existingProgress) : [];
    progressList.push(localProgress);
    await AsyncStorage.setItem('unsync_progress', JSON.stringify(progressList));

    try {
      // サーバーに送信を試行
      const result = await sendProgress(progressData);
      
      // 成功した場合、ローカルの未同期フラグを更新
      const updatedList = progressList.map(p => 
        p.timestamp === timestamp ? { ...p, synced: true } : p
      );
      await AsyncStorage.setItem('unsync_progress', JSON.stringify(updatedList));
      
      return result;
    } catch (serverError) {
      console.warn('サーバー送信に失敗しましたが、ローカルに保存されました:', serverError);
      return {
        success: false,
        savedLocally: true,
        message: 'オフラインで保存されました。後で再送信されます。'
      };
    }
  } catch (error) {
    console.error('進捗保存エラー:', error);
    throw error;
  }
};

/**
 * 未同期の進捗データをサーバーに送信する
 * @returns {Promise<number>} 同期された項目数
 */
export const syncUnsyncedProgress = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const existingProgress = await AsyncStorage.getItem('unsync_progress');
    
    if (!existingProgress) {
      return 0;
    }

    const progressList = JSON.parse(existingProgress);
    const unsyncedItems = progressList.filter(p => !p.synced);
    
    if (unsyncedItems.length === 0) {
      return 0;
    }

    let syncedCount = 0;
    const updatedList = [...progressList];

    for (const item of unsyncedItems) {
      try {
        await sendProgress({
          user_id: item.user_id,
          word_ids: item.word_ids,
          duration: item.duration
        });
        
        // 同期成功
        const index = updatedList.findIndex(p => p.timestamp === item.timestamp);
        if (index !== -1) {
          updatedList[index].synced = true;
          syncedCount++;
        }
      } catch (error) {
        console.warn(`進捗同期失敗 (timestamp: ${item.timestamp}):`, error);
      }
    }

    // 更新されたリストを保存
    await AsyncStorage.setItem('unsync_progress', JSON.stringify(updatedList));
    
    return syncedCount;
  } catch (error) {
    console.error('未同期進捗の同期エラー:', error);
    return 0;
  }
};
