import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { getQuiz } from '../api/quizApi';
import { sendQuizResult } from '../api/quizResultApi';
import { generateUserId } from '../utils/userUtils';

const QuizScreen = ({ navigation, route }) => {
  const [quizData, setQuizData] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState(0);

  const { lastWords } = route.params || { lastWords: [] };

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      const quiz = await getQuiz(lastWords);
      setQuizData(quiz);
      setIsLoading(false);
    } catch (error) {
      console.error('クイズ取得エラー:', error);
      Alert.alert('エラー', 'クイズの取得に失敗しました');
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, selectedChoice) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: selectedChoice
    }));
  };

  const submitQuiz = async () => {
    try {
      const userId = await generateUserId();
      let correctCount = 0;
      
      // 各問題の結果を送信
      for (const question of quizData) {
        const userAnswer = selectedAnswers[question.questionId];
        const isCorrect = userAnswer === question.correctWord;
        
        if (isCorrect) correctCount++;
        
        await sendQuizResult({
          user_id: userId,
          question_id: question.questionId,
          is_correct: isCorrect ? 1 : 0
        });
      }
      
      setScore(correctCount);
      setShowResults(true);
    } catch (error) {
      console.error('クイズ結果送信エラー:', error);
      Alert.alert('エラー', 'クイズ結果の送信に失敗しました');
    }
  };

  const restartLearning = () => {
    navigation.navigate('Home');
  };

  const nextQuestion = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>クイズを読み込み中...</Text>
      </View>
    );
  }

  if (quizData.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>クイズデータがありません</Text>
        <TouchableOpacity style={styles.button} onPress={restartLearning}>
          <Text style={styles.buttonText}>ホームに戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showResults) {
    return (
      <View style={styles.container}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>クイズ結果</Text>
          <Text style={styles.scoreText}>
            {score} / {quizData.length} 問正解
          </Text>
          <Text style={styles.scorePercentage}>
            正答率: {Math.round((score / quizData.length) * 100)}%
          </Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={restartLearning}
          >
            <Text style={styles.buttonText}>もう一度学習する</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const question = quizData[currentQuestion];
  const userAnswer = selectedAnswers[question.questionId];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionCounter}>
          問題 {currentQuestion + 1} / {quizData.length}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>この単語の意味は？</Text>
        <Text style={styles.wordText}>{question.correctWord}</Text>
      </View>

      <View style={styles.choicesContainer}>
        {question.choices.map((choice, index) => {
          const isSelected = userAnswer === choice;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.choiceButton,
                isSelected && styles.selectedChoice
              ]}
              onPress={() => handleAnswerSelect(question.questionId, choice)}
            >
              <Text style={[
                styles.choiceText,
                isSelected && styles.selectedChoiceText
              ]}>
                {choice}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestion === 0 && styles.disabledButton]}
          onPress={prevQuestion}
          disabled={currentQuestion === 0}
        >
          <Text style={styles.navButtonText}>前の問題</Text>
        </TouchableOpacity>

        {currentQuestion < quizData.length - 1 ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={nextQuestion}
          >
            <Text style={styles.navButtonText}>次の問題</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.submitButton]}
            onPress={submitQuiz}
          >
            <Text style={styles.navButtonText}>結果を見る</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 15,
    alignItems: 'center',
  },
  questionCounter: {
    fontSize: 16,
    color: '#666',
  },
  questionContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
  },
  wordText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  choicesContainer: {
    margin: 20,
  },
  choiceButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedChoice: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  choiceText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedChoiceText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 20,
  },
  navButton: {
    backgroundColor: '#757575',
    padding: 15,
    borderRadius: 10,
    flex: 0.45,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  scorePercentage: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#757575',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 200,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default QuizScreen;
