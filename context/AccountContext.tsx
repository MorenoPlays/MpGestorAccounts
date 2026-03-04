import { deleteConta as deleteContaFromDB, deleteMovimentacao as deleteMovimentacaoFromDB, getAllContas, initializeDatabase, insertConta, insertMovimentacao } from '@/services/database';
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import { Conta, Movimentacao } from '../types';

interface AccountContextType {
  contas: Conta[];
  addConta: (pessoa: string, saldoInicial: number) => void;
  deleteConta: (id: string) => void;
  addMovimentacao: (contaId: string, motivo: string, valor: number, tipo: 'adicionar' | 'descontar') => void;
  deleteMovimentacao: (contaId: string, movId: string) => void;
  calcularSaldo: (conta: Conta) => number;
  getTotalPositivo: () => number;
  getTotalNegativo: () => number;
  getSaldoGeral: () => number;
}

export const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const AccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [contas, setContas] = useState<Conta[]>([]);
  const [dbReady, setDbReady] = useState(false);

  // Inicializar banco de dados e carregar contas ao montar
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      const savedContas = await getAllContas();
      setContas(savedContas);
      setDbReady(true);
    };
    init();
  }, []);

  const addConta = (pessoa: string, saldoInicial: number) => {
    if (!pessoa.trim()) return;

    const novaConta: Conta = {
      id: Date.now().toString(),
      pessoa,
      saldoInicial,
      movimentacoes: [],
      data: new Date().toISOString()
    };

    setContas([novaConta, ...contas]);
    // Persistir no banco de dados
    if (dbReady) {
      insertConta(novaConta);
    }
  };

  const deleteConta = (id: string) => {
    setContas(contas.filter(c => c.id !== id));
    // Persistir no banco de dados
    if (dbReady) {
      deleteContaFromDB(id);
    }
  };

  const addMovimentacao = (contaId: string, motivo: string, valor: number, tipo: 'adicionar' | 'descontar') => {
    if (!motivo.trim() || valor <= 0) return;

    const novaMovimentacao: Movimentacao = {
      id: Date.now().toString(),
      motivo,
      valor,
      tipo,
      data: new Date().toISOString()
    };

    setContas(contas.map(c => {
      if (c.id === contaId) {
        return {
          ...c,
          movimentacoes: [novaMovimentacao, ...c.movimentacoes]
        };
      }
      return c;
    }));
    
    // Persistir no banco de dados
    if (dbReady) {
      insertMovimentacao(contaId, novaMovimentacao);
    }
  };

  const deleteMovimentacao = (contaId: string, movId: string) => {
    setContas(contas.map(c => {
      if (c.id === contaId) {
        return {
          ...c,
          movimentacoes: c.movimentacoes.filter(m => m.id !== movId)
        };
      }
      return c;
    }));
    
    // Persistir no banco de dados
    if (dbReady) {
      deleteMovimentacaoFromDB(movId);
    }
  };

  const calcularSaldo = (conta: Conta): number => {
    return conta.movimentacoes.reduce((acc, m) => {
      return m.tipo === 'adicionar' ? acc + m.valor : acc - m.valor;
    }, conta.saldoInicial);
  };

  const getTotalPositivo = (): number => {
    return contas.reduce((acc, c) => {
      const saldo = calcularSaldo(c);
      return saldo > 0 ? acc + saldo : acc;
    }, 0);
  };

  const getTotalNegativo = (): number => {
    return contas.reduce((acc, c) => {
      const saldo = calcularSaldo(c);
      return saldo < 0 ? acc + Math.abs(saldo) : acc;
    }, 0);
  };

  const getSaldoGeral = (): number => {
    return getTotalPositivo() - getTotalNegativo();
  };

  const value: AccountContextType = {
    contas,
    addConta,
    deleteConta,
    addMovimentacao,
    deleteMovimentacao,
    calcularSaldo,
    getTotalPositivo,
    getTotalNegativo,
    getSaldoGeral
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccounts = (): AccountContextType => {
  const context = React.useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within AccountProvider');
  }
  return context;
};
