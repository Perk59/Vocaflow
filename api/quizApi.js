import axios from 'axios';

// サーバーのベースURL（実際のXserverドメインに変更してください）
const BASE_URL = 'https://your-domain.xsrv.jp/api';

/**
 * クイズデータを取得する
 * @param {Array} lastWords - 最近学習した単語IDの配列
 * @param {number} questionCount - 問題数（デフォルト: 5）
 * @returns {Promise<Array>} クイズデータ配列
 */
export const getQuiz = async (lastWords, questionCount = 5) => {
  try {
    // データバリデーション
    if (!Array.isArray(lastWords) || lastWords.length === 0) {
      throw new Error('学習した単語データがありません');
    }

    // 単語IDをカンマ区切り文字列に変換
    const wordIds = lastWords.join(',');
    
    const response = await axios.get(`${BASE_URL}/quiz.php`, {
      params: {
        lastWords: wordIds,
        count: questionCount
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10秒タイムアウト
    });

    if (response.status === 200 && response.data) {
      const quizData = response.data;
      
      // レスポンスデータの検証
      if (!Array.isArray(quizData)) {
        throw new Error('不正なクイズデータフォーマット');
      }

      // 各問題の構造を検証
      for (const question of quizData) {
        if (!question.questionId || !question.correctWord || !Array.isArray(question.choices)) {
          throw new Error('不完全なクイズ問題データ');
        }
        
        if (question.choices.length !== 4) {
          throw new Error('選択肢は4つである必要があります');
        }
      }

      return quizData;
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('クイズ取得エラー:', error);
    
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
 * カスタムクイズを生成する（ローカル用）
 * @param {Array} words - 全単語データ
 * @param {Array} lastWords - 最近学習した単語ID
 * @param {number} questionCount - 問題数
 * @returns {Array} クイズデータ配列
 */
export const generateLocalQuiz = (words, lastWords, questionCount = 5) => {
  try {
    if (!Array.isArray(words) || !Array.isArray(lastWords)) {
      throw new Error('Invalid input data');
    }

    // 学習した単語から問題を生成
    const studiedWords = words.filter(word => lastWords.includes(word.id));
    
    if (studiedWords.length === 0) {
      throw new Error('学習した単語がありません');
    }

    // 問題数を調整（学習した単語数より多い場合は減らす）
    const actualQuestionCount = Math.min(questionCount, studiedWords.length);
    
    // ランダムに問題を選択
    const shuffledWords = studiedWords.sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, actualQuestionCount);
    
    const quiz = selectedWords.map((word, index) => {
      // 誤答選択肢を生成
      const otherWords = words.filter(w => w.id !== word.id);
      const shuffledOthers = otherWords.sort(() => Math.random() - 0.5);
      const wrongChoices = shuffledOthers.slice(0, 3).map(w => w.meaning);
      
      // 選択肢をシャッフル
      const choices = [word.meaning, ...wrongChoices].sort(() => Math.random() - 0.5);
      
      return {
        questionId: word.id,
        correctWord: word.word,
        correctMeaning: word.meaning,
        choices: choices
      };
    });

    return quiz;
  } catch (error) {
    console.error('ローカルクイズ生成エラー:', error);
    throw error;
  }
};

/**
 * フォールバック付きクイズ取得
 * サーバーから取得を試行し、失敗した場合はローカル生成
 * @param {Array} lastWords - 最近学習した単語ID
 * @param {number} questionCount - 問題数
 * @returns {Promise<Array>} クイズデータ配列
 */
export const getQuizWithFallback = async (lastWords, questionCount = 5) => {
  try {
    // まずサーバーから取得を試行
    return await getQuiz(lastWords, questionCount);
  } catch (serverError) {
    console.warn('サーバーからのクイズ取得に失敗、ローカル生成を試行:', serverError);
    
    try {
      // ローカルの単語データを取得
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const cachedWords = await AsyncStorage.getItem('words');
      
      if (!cachedWords) {
        throw new Error('ローカルの単語データがありません');
      }
      
      const words = JSON.parse(cachedWords);
      return generateLocalQuiz(words, lastWords, questionCount);
    } catch (localError) {
      console.error('ローカルクイズ生成も失敗:', localError);
      throw new Error('クイズの生成に失敗しました。ネット接続を確認してください。');
    }
  }
};
