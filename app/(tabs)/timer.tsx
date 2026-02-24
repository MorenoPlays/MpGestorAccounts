import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { useTimers } from '@/context/TimerContext';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const colors = Colors.light;

export default function TimerScreen() {
  const { timers, createTimer, startTimer, pauseTimer, resetTimer, deleteTimer } = useTimers();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timerName, setTimerName] = useState('');
  const [timerHours, setTimerHours] = useState('0');
  const [timerMinutes, setTimerMinutes] = useState('5');
  const [timerSeconds, setTimerSeconds] = useState('0');

  const handleCreateTimer = () => {
    if (!timerName.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome do temporizador');
      return;
    }

    const hours = parseInt(timerHours) || 0;
    const minutes = parseInt(timerMinutes) || 0;
    const seconds = parseInt(timerSeconds) || 0;
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    if (totalSeconds <= 0) {
      Alert.alert('Erro', 'Por favor, insira um tempo válido (maior que 0)');
      return;
    }

    createTimer(timerName, totalSeconds);
    setTimerName('');
    setTimerHours('0');
    setTimerMinutes('5');
    setTimerSeconds('0');
    setShowCreateModal(false);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Sempre mostrar HH:MM:SS
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDeleteTimer = (id: string, name: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar o temporizador "${name}"?`,
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: 'Deletar',
          onPress: () => deleteTimer(id),
          style: 'destructive'
        }
      ]
    );
  };

  const renderTimerCard = ({ item: timer }: { item: any }) => {
    const progress = (timer.remainingTime / timer.initialTime) * 100;
    const isFinished = timer.remainingTime === 0 && !timer.isRunning;

    return (
      <View style={[styles.timerCard, { backgroundColor: '#fff' }]}>
        <View style={styles.timerHeader}>
          <Text style={[styles.timerName, { color: colors.text }]}>{timer.name}</Text>
          <TouchableOpacity
            onPress={() => handleDeleteTimer(timer.id, timer.name)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>

        {/* Tempo */}
        <View style={styles.timerDisplay}>
          <Text style={[styles.timerTime, { color: isFinished ? '#dc2626' : colors.text }]}>
            {formatTime(timer.remainingTime)}
          </Text>
        </View>

        {/* Barra de progresso */}
        <View style={[styles.progressBar, { backgroundColor: '#f3f4f6' }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: isFinished ? '#dc2626' : '#059669'
              }
            ]}
          />
        </View>

        {/* Botões de controle */}
        <View style={styles.timerControls}>
          {!isFinished && (
            <>
              {!timer.isRunning ? (
                <TouchableOpacity
                  onPress={() => startTimer(timer.id)}
                  style={[styles.controlButton, { backgroundColor: '#059669' }]}
                >
                  <Ionicons name="play" size={24} color="#fff" />
                  <Text style={styles.controlButtonText}>Iniciar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => pauseTimer(timer.id)}
                  style={[styles.controlButton, { backgroundColor: '#f59e0b' }]}
                >
                  <Ionicons name="pause" size={24} color="#fff" />
                  <Text style={styles.controlButtonText}>Pausar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => resetTimer(timer.id)}
                style={[styles.controlButton, { backgroundColor: '#6366f1' }]}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.controlButtonText}>Reiniciar</Text>
              </TouchableOpacity>
            </>
          )}
          {isFinished && (
            <View style={styles.finishedContainer}>
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
              <Text style={[styles.finishedText, { color: colors.text }]}>Tempo finalizado!</Text>
              <TouchableOpacity
                onPress={() => resetTimer(timer.id)}
                style={[styles.controlButton, { backgroundColor: '#6366f1', marginTop: 12 }]}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.controlButtonText}>Reiniciar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaViewContext style={[styles.container, { backgroundColor: '#f9fafb' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <Text style={styles.headerTitle}>Temporizador</Text>
        <Text style={styles.headerSubtitle}>
          {timers.length} temporizador{timers.length !== 1 ? 'es' : ''}
        </Text>
      </View>

      {/* Lista de Timers */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {timers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="timer" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhum temporizador
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
              Clique no botão abaixo para criar seu primeiro temporizador
            </Text>
          </View>
        ) : (
          <FlatList
            data={timers}
            keyExtractor={(item) => item.id}
            renderItem={renderTimerCard}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </ScrollView>

      {/* Botão Flutuante */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Modal para Criar Timer */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: '#f9fafb' }]}>
          <SafeAreaViewContext style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Novo Temporizador
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Nome do Temporizador *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: '#fff',
                      color: colors.text,
                      borderColor: '#e5e7eb'
                    }
                  ]}
                  placeholder="Ex: Exercício, Estudar, Descanso..."
                  placeholderTextColor={colors.tabIconDefault}
                  value={timerName}
                  onChangeText={setTimerName}
                />
              </View>

              <Text style={[styles.label, { color: colors.text, marginBottom: 12 }]}>
                Duração *
              </Text>

              <View style={styles.timeInputContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={[styles.timeLabel, { color: colors.tabIconDefault }]}>Horas</Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: '#fff',
                        color: colors.text,
                        borderColor: '#e5e7eb'
                      }
                    ]}
                    placeholder="0"
                    placeholderTextColor={colors.tabIconDefault}
                    value={timerHours}
                    onChangeText={setTimerHours}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <View style={styles.timeInputGroup}>
                  <Text style={[styles.timeLabel, { color: colors.tabIconDefault }]}>Minutos</Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: '#fff',
                        color: colors.text,
                        borderColor: '#e5e7eb'
                      }
                    ]}
                    placeholder="0"
                    placeholderTextColor={colors.tabIconDefault}
                    value={timerMinutes}
                    onChangeText={setTimerMinutes}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <View style={styles.timeInputGroup}>
                  <Text style={[styles.timeLabel, { color: colors.tabIconDefault }]}>Segundos</Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: '#fff',
                        color: colors.text,
                        borderColor: '#e5e7eb'
                      }
                    ]}
                    placeholder="0"
                    placeholderTextColor={colors.tabIconDefault}
                    value={timerSeconds}
                    onChangeText={setTimerSeconds}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.tint }]}
                onPress={handleCreateTimer}
              >
                <Text style={styles.submitButtonText}>Criar Temporizador</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaViewContext>
        </View>
      </Modal>
    </SafeAreaViewContext>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  timerCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  timerDisplay: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerTime: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  timerControls: {
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  finishedContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  finishedText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  timeInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
