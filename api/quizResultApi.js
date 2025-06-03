import axios from 'axios';

// サーバーのベースURL（実際のXserverドメインに変更してください）
const BASE_URL = 'https://your-domain.xsrv.jp/api';

/**
 * クイズ結果をサーバーに送信する
 * @param {Object} resultData - 結果データ
 * @param {string} resultData.user_id - ユーザーID
 * @param {number} resultData.question_id - 問題ID
 * @param {number} resultData.is_correct - 正誤フラグ (1: 正解, 0: 不正解)
 * @returns {Promise<Object>} サーバーレスポンス
 */
export const sendQuizResult = async (resultData) => {
  try {
    // データバリデーション
    if (!resultData.user_id || resultData.question_id === undefined || resultData.is_correct === undefined) {
      throw new Error('必要なデータが不足しています');
    }

    if (typeof resultData.question_id !== 'number') {
      throw new Error('question_idは数値である必要があります');
    }

    if (resultData.is_correct !== 0 && resultData.is_correct !== 1) {
      throw new Error('is_correctは0または1である必要があります');
    }

    const response = await axios.post(`${BASE_URL}/quiz_result.php`, resultData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10秒タイムアウト
    });

    if (response.status === 200) {
      return {
        success: true,
        data: response.data,
        message: 'クイズ結果が正常に送信されました'
      };
    } else {
      throw new Error(`サーバーエラー: ${response.status}`);
    }
  } catch (error) {
    console.error('クイズ結果送信エラー:', error);
    
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
 * 複数のクイズ結果を一括送信する
 * @param {Array} resultsArray - 結果データの配列
 * @returns {Promise<Object>} 送信結果
 */
export const sendMultipleQuizResults = async (resultsArray) => {
  try {
    if (!Array.isArray(resultsArray) || resultsArray.length === 0) {
      throw new Error('送信する結果データがありません');
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // 各結果を順次送信
    for (let i = 0; i < resultsArray.length; i++) {
      try {
        await sendQuizResult(resultsArray[i]);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          data: resultsArray[i],
          error: error.message
        });
      }
    }

    return {
      success: results.failed === 0,
      results: results,
      message: `${results.successful}件送信成功、${results.failed}件送信失敗`
    };
  } catch (error) {
    console.error('一括クイズ結果送信エラー:', error);
    throw error;
  }
};

/**
 * クイズ結果をローカルストレージにも保存する（オフライン対応）
 * @param {Object} resultData - 結果データ
 * @returns {Promise<Object>} レスポンス
 */
export const saveQuizResultWithBackup = async (resultData) => {
  try {
    // まずローカルに保存
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const timestamp = Date.now();
    const localResult = {
      ...resultData,
      timestamp,
      synced: false
    };

    const existingResults = await AsyncStorage.getItem('unsync_quiz_results');
    const resultsList = existingResults ? JSON.parse(existingResults) : [];
    resultsList.push(localResult);
    await AsyncStorage.setItem('unsync_quiz_results', JSON.stringify(resultsList));

    try {
      // サーバーに送信を試行
      const result = await sendQuizResult(resultData);
      
      // 成功した場合、ローカルの未同期フラグを更新
      const updatedList = resultsList.map(r => 
        r.timestamp === timestamp ? { ...r, synced: true } : r
      );
      await AsyncStorage.setItem('unsync_quiz_results', JSON.stringify(updatedList));
      
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
    console.error('クイズ結果保存エラー:', error);
    throw error;
  }
};

/**
 * 未同期のクイズ結果をサーバーに送信する
 * @returns {Promise<number>} 同期された項目数
 */
export const syncUnsyncedQuizResults = async () => {
  try {
    const Async
