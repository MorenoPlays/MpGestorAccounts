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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccounts } from '@/context/AccountContext';
import { Conta, Movimentacao } from '@/types';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function MovimentacoesScreen() {
  const colors = Colors.light;

  const {
    contas,
    addMovimentacao,
    deleteMovimentacao,
    calcularSaldo,
  } = useAccounts();

  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false);
  const [selectedContaId, setSelectedContaId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState<'adicionar' | 'descontar'>('adicionar');
  const [expandedContaId, setExpandedContaId] = useState<string | null>(null);

  const handleAddMovimentacao = () => {
    if (!selectedContaId) {
      Alert.alert('Erro', 'Por favor, selecione uma conta');
      return;
    }
    if (!motivo.trim()) {
      Alert.alert('Erro', 'Por favor, insira o motivo');
      return;
    }
    if (!valor.trim() || parseFloat(valor) <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido');
      return;
    }

    addMovimentacao(selectedContaId, motivo, parseFloat(valor), tipo);
    setMotivo('');
    setValor('');
    setTipo('adicionar');
    setSelectedContaId(null);
    setShowMovimentacaoModal(false);

    Alert.alert('Sucesso', 'Movimentação adicionada com sucesso!');
  };

  const handleDeleteMovimentacao = (contaId: string, movId: string, motivo: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar a movimentação "${motivo}"?`,
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: 'Deletar',
          onPress: () => deleteMovimentacao(contaId, movId),
          style: 'destructive'
        }
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'AOA'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderMovimentacaoItem = ({ item: mov }: { item: Movimentacao }, contaId: string) => (
    <View
      style={[
        styles.movimentacaoItem,
        { borderBottomColor: '#f3f4f6' }
      ]}
    >
      <View style={styles.movimentacaoLeft}>
        <Ionicons
          name={mov.tipo === 'adicionar' ? 'arrow-up-circle' : 'arrow-down-circle'}
          size={24}
          color={mov.tipo === 'adicionar' ? '#059669' : '#dc2626'}
          style={styles.movIcon}
        />
        <View style={styles.movInfo}>
          <Text style={[styles.movMotivo, { color: colors.text }]}>
            {mov.motivo}
          </Text>
          <Text style={[styles.movData, { color: colors.tabIconDefault }]}>
            {formatDate(mov.data)}
          </Text>
        </View>
      </View>
      <View style={styles.movimentacaoRight}>
        <Text
          style={[
            styles.movValor,
            {
              color: mov.tipo === 'adicionar' ? '#059669' : '#dc2626'
            }
          ]}
        >
          {mov.tipo === 'adicionar' ? '+' : '-'} {formatCurrency(mov.valor)}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteMovimentacao(contaId, mov.id, mov.motivo)}
          style={styles.deleteMovButton}
        >
          <Ionicons name="trash" size={18} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAccountSection = ({ item: conta }: { item: Conta }) => {
    const saldo = calcularSaldo(conta);
    const isExpanded = expandedContaId === conta.id;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: '#fff' }
        ]}
      >
        {/* Header da Conta */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedContaId(isExpanded ? null : conta.id)}
        >
          <View style={styles.cardHeaderLeft}>
            <Ionicons
              name="person-circle"
              size={32}
              color={colors.tint}
              style={styles.icon}
            />
            <View style={styles.cardHeaderInfo}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {conta.pessoa}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.tabIconDefault }]}>
                {conta.movimentacoes.length} movimentações
              </Text>
            </View>
          </View>

          <View style={styles.cardHeaderRight}>
            <Text
              style={[
                styles.saldoText,
                {
                  color: saldo > 0 ? '#059669' : saldo < 0 ? '#dc2626' : colors.tabIconDefault
                }
              ]}
            >
              {formatCurrency(saldo)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedContaId(conta.id);
                setShowMovimentacaoModal(true);
              }}
              style={styles.addMovButton}
            >
              <Ionicons name="add-circle" size={24} color={colors.tint} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Movimentações (expandido) */}
        {isExpanded && (
          <View style={[styles.expandedContent, { borderTopColor: '#e5e7eb' }]}>
            {conta.movimentacoes.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                Nenhuma movimentação nesta conta
              </Text>
            ) : (
              <FlatList
                data={conta.movimentacoes}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => renderMovimentacaoItem({ item }, conta.id)}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  const allMovimentacoes = contas.flatMap(conta =>
    conta.movimentacoes.map(mov => ({
      ...mov,
      contaId: conta.id,
      contaPessoa: conta.pessoa
    }))
  ).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f9fafb' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <Text style={styles.headerTitle}>Movimentações</Text>
        <Text style={styles.headerSubtitle}>
          Total de movimentações: {allMovimentacoes.length}
        </Text>
      </View>

      {/* Lista de Contas com Movimentações */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {contas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.tabIconDefault} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhuma conta cadastrada
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
              Crie uma conta primeiro para adicionar movimentações
            </Text>
          </View>
        ) : (
          <FlatList
            data={contas}
            keyExtractor={(item) => item.id}
            renderItem={renderAccountSection}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </ScrollView>

      {/* Botão Flutuante */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={() => {
          if (contas.length === 0) {
            Alert.alert('Erro', 'Crie uma conta primeiro para adicionar movimentações');
            return;
          }
          setShowMovimentacaoModal(true);
        }}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Modal para Nova Movimentação */}
      <Modal
        visible={showMovimentacaoModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowMovimentacaoModal(false);
          setSelectedContaId(null);
        }}
      >
        <View style={[styles.modalContainer, { backgroundColor: '#f9fafb' }]}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowMovimentacaoModal(false);
                  setSelectedContaId(null);
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Adicionar Movimentação
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Selecione a Conta *</Text>
                <ScrollView
                  horizontal
                  style={[
                    styles.input,
                    {
                      backgroundColor: '#fff',
                      borderColor: '#e5e7eb',
                      marginBottom: 0,
                    }
                  ]}
                  showsHorizontalScrollIndicator={false}
                >
                  <View style={{ flexDirection: 'row', paddingHorizontal: 4 }}>
                    {contas.map((conta) => (
                      <TouchableOpacity
                        key={conta.id}
                        onPress={() => setSelectedContaId(conta.id)}
                        style={[
                          styles.contaSelectOption,
                          {
                            backgroundColor: selectedContaId === conta.id ? colors.tint : '#f3f4f6',
                          }
                        ]}
                      >
                        <Text
                          style={[
                            styles.contaSelectOptionText,
                            {
                              color: selectedContaId === conta.id ? '#fff' : colors.text,
                            }
                          ]}
                        >
                          {conta.pessoa}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {!selectedContaId && (
                  <Text style={[styles.helperText, { color: '#dc2626' }]}>
                    Selecione uma conta
                  </Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Motivo *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: '#fff',
                      color: colors.text,
                      borderColor: '#e5e7eb'
                    }
                  ]}
                  placeholder="Ex: Pagamento, Empréstimo, Compra..."
                  placeholderTextColor={colors.tabIconDefault}
                  value={motivo}
                  onChangeText={setMotivo}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Valor (AOA) *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: '#fff',
                      color: colors.text,
                      borderColor: '#e5e7eb'
                    }
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.tabIconDefault}
                  value={valor}
                  onChangeText={setValor}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Tipo de Movimentação *</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setTipo('adicionar')}
                    style={[
                      styles.tipoSelectOption,
                      {
                        backgroundColor: tipo === 'adicionar' ? '#059669' : '#f3f4f6',
                        borderColor: '#e5e7eb',
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.tipoSelectOptionText,
                        {
                          color: tipo === 'adicionar' ? '#fff' : colors.text,
                        }
                      ]}
                    >
                      Adicionar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTipo('descontar')}
                    style={[
                      styles.tipoSelectOption,
                      {
                        backgroundColor: tipo === 'descontar' ? '#dc2626' : '#f3f4f6',
                        borderColor: '#e5e7eb',
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.tipoSelectOptionText,
                        {
                          color: tipo === 'descontar' ? '#fff' : colors.text,
                        }
                      ]}
                    >
                      Descontar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.tint }]}
                onPress={handleAddMovimentacao}
              >
                <Text style={styles.submitButtonText}>Adicionar Movimentação</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
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
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    flexShrink: 0,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexDirection: 'row',
  },
  saldoText: {
    fontSize: 18,
    fontWeight: '700',
  },
  addMovButton: {
    padding: 4,
  },
  expandedContent: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 14,
  },
  movimentacaoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  movimentacaoLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  movIcon: {
    flexShrink: 0,
  },
  movInfo: {
    flex: 1,
  },
  movMotivo: {
    fontSize: 14,
    fontWeight: '500',
  },
  movData: {
    fontSize: 12,
    marginTop: 2,
  },
  movimentacaoRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexDirection: 'row',
  },
  movValor: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteMovButton: {
    padding: 6,
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
  contaSelectOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  contaSelectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tipoSelectOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  tipoSelectOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});
