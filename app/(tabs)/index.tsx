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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccounts } from '@/context/AccountContext';
import { Conta } from '@/types';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const colors = Colors.light;

  const {
    contas,
    addConta,
    deleteConta,
    calcularSaldo,
    getTotalPositivo,
    getTotalNegativo,
    getSaldoGeral
  } = useAccounts();

  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [pessoa, setPessoa] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [expandedContaId, setExpandedContaId] = useState<string | null>(null);

  const handleAddConta = () => {
    if (!pessoa.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome da pessoa');
      return;
    }

    addConta(pessoa, saldoInicial ? parseFloat(saldoInicial) : 0);
    setPessoa('');
    setSaldoInicial('');
    setShowNewAccountModal(false);
  };

  const handleDeleteConta = (id: string, nomePessoa: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja deletar a conta de ${nomePessoa}?`,
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: 'Deletar',
          onPress: () => deleteConta(id),
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

  const renderAccountCard = ({ item: conta }: { item: Conta }) => {
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
                Saldo inicial: {formatCurrency(conta.saldoInicial)}
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
              onPress={() => handleDeleteConta(conta.id, conta.pessoa)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Movimentações (expandido) */}
        {isExpanded && (
          <View style={[styles.expandedContent, { borderTopColor: '#e5e7eb' }]}>
            {conta.movimentacoes.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                Nenhuma movimentação
              </Text>
            ) : (
              <FlatList
                data={conta.movimentacoes}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item: mov }) => (
                  <View
                    style={[
                      styles.movimentacaoItem,
                      { borderBottomColor: '#f3f4f6' }
                    ]}
                  >
                    <View style={styles.movimentacaoLeft}>
                      <Ionicons
                        name={mov.tipo === 'adicionar' ? 'arrow-up-circle' : 'arrow-down-circle'}
                        size={20}
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
                  </View>
                )}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  const totalPositivo = getTotalPositivo();
  const totalNegativo = getTotalNegativo();
  const saldoGeral = getSaldoGeral();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f9fafb' }]}>
      {/* Header com Resumo */}
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Positivo</Text>
            <Text style={[styles.summaryValue, { color: '#0f2c23ff' }]}>
              {formatCurrency(totalPositivo)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Negativo</Text>
            <Text style={[styles.summaryValue, { color: '#8b2929ff' }]}>
              {formatCurrency(totalNegativo)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Saldo Geral</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: saldoGeral > 0 ? '#059669' : saldoGeral < 0 ? '#dc2626' : '#999' }
              ]}
            >
              {formatCurrency(saldoGeral)}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de Contas */}
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
              Clique no botão abaixo para adicionar sua primeira conta
            </Text>
          </View>
        ) : (
          <FlatList
            data={contas}
            keyExtractor={(item) => item.id}
            renderItem={renderAccountCard}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        )}
      </ScrollView>

      {/* Botão Flutuante */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={() => setShowNewAccountModal(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Modal para Nova Conta */}
      <Modal
        visible={showNewAccountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewAccountModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: '#f9fafb' }]}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowNewAccountModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Adicionar Nova Conta
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Nome da Pessoa *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: '#fff',
                      color: colors.text,
                      borderColor: '#e5e7eb'
                    }
                  ]}
                  placeholder="Ex: Fulano"
                  placeholderTextColor={colors.tabIconDefault}
                  value={pessoa}
                  onChangeText={setPessoa}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Saldo Inicial (Opcional)</Text>
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
                  value={saldoInicial}
                  onChangeText={setSaldoInicial}
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.helperText, { color: colors.tabIconDefault }]}>
                  Deixe em branco se começar do zero
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.tint }]}
                onPress={handleAddConta}
              >
                <Text style={styles.submitButtonText}>Criar Conta</Text>
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
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  },
  saldoText: {
    fontSize: 18,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 8,
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
  movValor: {
    fontSize: 14,
    fontWeight: '600',
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
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
