import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, Pressable, Modal, SafeAreaView } from 'react-native';
import * as SQLite from 'expo-sqlite';

const dados = [
  ["Onde fica o Brasil?", "Europa", "América do Sul", 2],
  ["Capital da França?", "Paris", "Roma", 1],
  ["2 + 2 =", "3", "4", 2],
  ["O Sol é...", "Planeta", "Estrela", 2],
  ["Maior oceano?", "Pacífico", "Atlântico", 1],
  ["Linguagem do React?", "JavaScript", "Python", 1],
  ["Animal que mia?", "Cachorro", "Gato", 2],
  ["Planeta vermelho?", "Marte", "Vênus", 1],
  ["5 x 2 =", "10", "8", 1],
  ["Cor do céu limpo?", "Azul", "Verde", 1],
  ["Capital do Brasil?", "Brasília", "Rio de Janeiro", 1],
  ["3 x 3 =", "6", "9", 2],
  ["Mamífero?", "Baleia", "Tubarão", 1],
  ["CSS serve para...", "Estilo de página", "Banco de dados", 1],
  ["Maior planeta?", "Júpiter", "Marte", 1],
  ["Rio famoso do Egito?", "Nilo", "Amazonas", 1],
  ["7 - 4 =", "3", "5", 1],
  ["Sistema operacional?", "Linux", "Google", 1],
  ["Água ferve a...", "100°C", "50°C", 1],
  ["Animal que voa?", "Galinha", "Águia", 2],
  ["Linguagem de programação?", "Java", "HTML", 1],
  ["Continente do Japão?", "Ásia", "África", 1],
  ["10 / 2 =", "3", "5", 2],
  ["Maior floresta?", "Amazônica", "Saara", 1],
  ["Navegador web?", "Chrome", "Windows", 1],
  ["Planeta mais próximo do Sol?", "Mercúrio", "Terra", 1],
  ["4 x 5 =", "20", "25", 1],
  ["Banco de dados?", "SQLite", "React", 1],
  ["Cor do sangue?", "Vermelho", "Azul", 1],
  ["Lua é um...", "Satélite", "Planeta", 1]
];

export default function App() {
  const [db, setDb] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [gameState, setGameState] = useState('home');
  const [isReady, setIsReady] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', isCorrect: false });

  useEffect(() => {
    async function setupDb() {
      try {
        const database = await SQLite.openDatabaseAsync('quizapp.db');
        setDb(database);
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT,
            option1 TEXT,
            option2 TEXT,
            correctOption INTEGER
          );
        `);

        const result = await database.getAllAsync('SELECT * FROM questions;');
        if (result.length === 0) {
          const statement = await database.prepareAsync(
            'INSERT INTO questions (question, option1, option2, correctOption) VALUES ($question, $o1, $o2, $correct)'
          );
          try {
            for (const item of dados) {
              await statement.executeAsync({
                $question: item[0],
                $o1: item[1],
                $o2: item[2],
                $correct: item[3]
              });
            }
          } finally {
            await statement.finalizeAsync();
          }
        }
        setIsReady(true);
      } catch (error) {
        console.error("DB Error", error);
      }
    }
    setupDb();
  }, []);

  const startGame = async () => {
    const allQs = await db.getAllAsync('SELECT * FROM questions ORDER BY RANDOM() LIMIT 10;');
    setQuestions(allQs);
    setPoints(0);
    setCurrentQuestionIndex(0);
    setGameState('playing');
  };

  const handleAnswer = (selectedOption) => {
    const q = questions[currentQuestionIndex];
    const isCorrect = selectedOption === q.correctOption;

    setAlertData({
      title: isCorrect ? "Correto!" : "Incorreto!",
      message: isCorrect
        ? "Você acertou!"
        : `Que pena, resposta errada. A certa era a opção ${q.correctOption}`,
      isCorrect
    });
    setAlertVisible(true);
  };

  const closeAlertAndProceed = () => {
    setAlertVisible(false);

    if (alertData.isCorrect) setPoints(prev => prev + 1);

    const nextIndex = currentQuestionIndex + 1;
    const isLastQuestion = nextIndex >= questions.length;

    if (isLastQuestion) {
      setGameState('end');
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  }

  if (!isReady) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Carregando Base de Dados...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {gameState === 'home' && (
        <View style={styles.homeView}>
          <Image source={require('./assets/quiz_main_image.png')} style={styles.coverImage} resizeMode="contain" />
          <Text style={styles.title}>Super Quiz!</Text>
          <Pressable
            style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }]}
            onPress={startGame}
          >
            <Text style={styles.buttonText}>Começar Jogo</Text>
          </Pressable>
        </View>
      )}

      {gameState === 'playing' && questions.length > 0 && (
        <View style={styles.playingView}>
          <Text style={styles.questionCounter}>Pergunta {currentQuestionIndex + 1} de {questions.length}</Text>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{questions[currentQuestionIndex].question}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.optionButton, { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            onPress={() => handleAnswer(1)}
          >
            <Text style={styles.optionText}>{questions[currentQuestionIndex].option1}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.optionButton, { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            onPress={() => handleAnswer(2)}
          >
            <Text style={styles.optionText}>{questions[currentQuestionIndex].option2}</Text>
          </Pressable>
        </View>
      )}

      {gameState === 'end' && (
        <View style={styles.endView}>
          <Image source={require('./assets/quiz_main_image.png')} style={styles.endImage} resizeMode="contain" />
          <Text style={styles.title}>Fim de Jogo!</Text>
          <Text style={styles.resultText}>Você acertou {points} de {questions.length} perguntas.</Text>
          <Pressable
            style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }]}
            onPress={startGame}
          >
            <Text style={styles.buttonText}>Jogar Novamente</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, { backgroundColor: '#FF6B6B', marginTop: 15, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setGameState('home')}
          >
            <Text style={styles.buttonText}>Voltar ao Menu Principal</Text>
          </Pressable>
        </View>
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={alertVisible}
        onRequestClose={closeAlertAndProceed}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={[styles.modalTitle, { color: alertData.isCorrect ? '#2ecc71' : '#e74c3c' }]}>
              {alertData.title}
            </Text>
            <Text style={styles.modalMessage}>{alertData.message}</Text>
            <Pressable
              style={({ pressed }) => [styles.button, { backgroundColor: alertData.isCorrect ? '#2ecc71' : '#e74c3c', opacity: pressed ? 0.7 : 1 }]}
              onPress={closeAlertAndProceed}
            >
              <Text style={styles.buttonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  loadingText: { fontSize: 18, fontWeight: 'bold', color: '#34495E' },
  homeView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  playingView: { flex: 1, justifyContent: 'center', padding: 20 },
  endView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  coverImage: { width: 300, height: 300, marginBottom: 20, borderRadius: 20 },
  endImage: { width: 200, height: 200, marginBottom: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2C3E50', marginBottom: 30 },
  button: {
    backgroundColor: '#3498DB', paddingVertical: 15, paddingHorizontal: 40,
    borderRadius: 30, elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25,
    shadowRadius: 3.84, width: '100%', alignItems: 'center'
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  questionCounter: { fontSize: 18, fontWeight: '600', color: '#7F8C8D', marginBottom: 10, textAlign: 'center' },
  questionCard: {
    backgroundColor: '#FFFFFF', padding: 25, borderRadius: 15,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 5, marginBottom: 30
  },
  questionText: { fontSize: 22, fontWeight: 'bold', color: '#34495E', textAlign: 'center' },
  optionButton: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, marginBottom: 15, borderWidth: 2, borderColor: '#3498DB' },
  optionText: { fontSize: 18, color: '#2980B9', textAlign: 'center', fontWeight: '600' },
  resultText: { fontSize: 22, color: '#2C3E50', marginBottom: 30, textAlign: 'center', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalMessage: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 18,
    color: '#34495E'
  }
});
