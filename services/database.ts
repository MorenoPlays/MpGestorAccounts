import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'controllersaccount.db';

interface Timer {
  id: string;
  name: string;
  initialTime: number;
  remainingTime: number;
  isRunning: boolean;
  createdAt: string;
  startedAt?: string | null; // Quando o timer foi iniciado
}

interface Movimentacao {
  id: string;
  motivo: string;
  valor: number;
  tipo: 'adicionar' | 'descontar';
  data: string;
}

interface Conta {
  id: string;
  pessoa: string;
  saldoInicial: number;
  movimentacoes: Movimentacao[];
  data: string;
}

let db: SQLite.SQLiteDatabase | null = null;

export const initializeDatabase = async () => {
  try {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    
    // Criar tabela de timers
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS timers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        initialTime INTEGER NOT NULL,
        remainingTime INTEGER NOT NULL,
        isRunning INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        startedAt TEXT
      );
    `);
    
    // Adicionar coluna startedAt se não existir (migração)
    try {
      await db.execAsync(`
        ALTER TABLE timers ADD COLUMN startedAt TEXT;
      `);
    } catch (e) {
      // Coluna já existe, ignora o erro
    }
    
    // Criar tabela de contas
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS contas (
        id TEXT PRIMARY KEY,
        pessoa TEXT NOT NULL,
        saldoInicial REAL NOT NULL,
        data TEXT NOT NULL
      );
    `);
    
    // Criar tabela de movimentações
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS movimentacoes (
        id TEXT PRIMARY KEY,
        contaId TEXT NOT NULL,
        motivo TEXT NOT NULL,
        valor REAL NOT NULL,
        tipo TEXT NOT NULL,
        data TEXT NOT NULL,
        FOREIGN KEY (contaId) REFERENCES contas(id) ON DELETE CASCADE
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export const getAllTimers = async (): Promise<Timer[]> => {
  if (!db) await initializeDatabase();
  
  try {
    const result = await db!.getAllAsync<Timer>(
      'SELECT * FROM timers ORDER BY createdAt DESC'
    );
    return result;
  } catch (error) {
    console.error('Error fetching timers:', error);
    return [];
  }
};

export const insertTimer = async (timer: Timer): Promise<boolean> => {
  if (!db) await initializeDatabase();
  
  try {
    await db!.runAsync(
      `INSERT INTO timers (id, name, initialTime, remainingTime, isRunning, createdAt, startedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        timer.id,
        timer.name,
        timer.initialTime,
        timer.remainingTime,
        timer.isRunning ? 1 : 0,
        timer.createdAt,
        timer.startedAt || null
      ]
    );
    return true;
  } catch (error) {
    console.error('Error inserting timer:', error);
    return false;
  }
};

export const updateTimer = async (timer: Timer): Promise<boolean> => {
  if (!db) await initializeDatabase();
  
  try {
    await db!.runAsync(
      `UPDATE timers SET name = ?, initialTime = ?, remainingTime = ?, isRunning = ?, createdAt = ?, startedAt = ?
       WHERE id = ?`,
      [
        timer.name,
        timer.initialTime,
        timer.remainingTime,
        timer.isRunning ? 1 : 0,
        timer.createdAt,
        timer.startedAt || null,
        timer.id
      ]
    );
    return true;
  } catch (error) {
    console.error('Error updating timer:', error);
    return false;
  }
};

export const deleteTimerFromDB = async (id: string): Promise<boolean> => {
  if (!db) await initializeDatabase();
  
  try {
    await db!.runAsync('DELETE FROM timers WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Error deleting timer:', error);
    return false;
  }
};

export const clearAllTimers = async (): Promise<boolean> => {
  if (!db) await initializeDatabase();
  
  try {
    await db!.runAsync('DELETE FROM timers');
    return true;
  } catch (error) {
    console.error('Error clearing timers:', error);
    return false;
  }
};

// ============ FUNÇÕES PARA CONTAS ============

export const getAllContas = async (): Promise<Conta[]> => {
  if (!db) await initializeDatabase();
  
  try {
    const contas = await db!.getAllAsync<Conta>(
      'SELECT * FROM contas ORDER BY data DESC'
    );
    
    // Carregar movimentações para cada conta
    const contasComMovimentacoes = await Promise.all(
      contas.map(async (conta) => {
        const movimentacoes = await db!.getAllAsync<Movimentacao>(
          'SELECT * FROM movimentacoes WHERE contaId = ? ORDER BY data DESC',
          [conta.id]
        );
        return { ...conta, movimentacoes };
      })
    );
    
    return contasComMovimentacoes;
  } catch (error) {
    console.error('Error fetching contas:', error);
    return [];
  }
};

export const insertConta = async (conta: Conta): Promise<boolean> => {
  if (!db) await initializeDatabase();
  
  try {
    await db!.runAsync(
      `INSERT INTO contas (id, pessoa, saldoInicial, data)
       VALUES (?, ?, ?, ?)`,
      [conta.id, conta.pessoa, conta.saldoInicial, conta.data]
    );
    return true;
  } catch (error) {
    console.error('Error inserting conta:', error);
    return false;
  }
};

export const deleteConta = async (id: string): Promise<boolean> => {
  if (!db) await initializeDatabase();
  
  try {
    // Deletar movimentações (cascade automático pelo FK)
    await db!.runAsync('DELETE FROM movimentacoes WHERE contaId = ?', [id]);
    // Deletar conta
    await db!.runAsync('DELETE FROM contas WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Error deleting conta:', error);
    return false;
  }
};

export const insertMovimentacao = async (contaId: string, mov: Movimentacao): Promise<boolean> => {
  if (!db) await initializeDatabase();
  
  try {
    await db!.runAsync(
      `INSERT INTO movimentacoes (id, contaId, motivo, valor, tipo, data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [mov.id, contaId, mov.motivo, mov.valor, mov.tipo, mov.data]
    );
    return true;
  } catch (error) {
    console.error('Error inserting movimentacao:', error);
    return false;
  }
};

export const deleteMovimentacao = async (movId: string): Promise<boolean> => {
  if (!db) await initializeDatabase();
  
  try {
    await db!.runAsync('DELETE FROM movimentacoes WHERE id = ?', [movId]);
    return true;
  } catch (error) {
    console.error('Error deleting movimentacao:', error);
    return false;
  }
};

export const clearAllContas = async (): Promise<boolean> => {
  if (!db) await initializeDatabase();
  
  try {
    await db!.runAsync('DELETE FROM movimentacoes');
    await db!.runAsync('DELETE FROM contas');
    return true;
  } catch (error) {
    console.error('Error clearing contas:', error);
    return false;
  }
};
