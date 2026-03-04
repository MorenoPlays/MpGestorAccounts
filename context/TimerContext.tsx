import { deleteTimerFromDB, getAllTimers, initializeDatabase, insertTimer, updateTimer } from '@/services/database';
import React, { createContext, ReactNode, useEffect, useState } from 'react';

interface Timer {
  id: string;
  name: string;
  initialTime: number; // em segundos
  remainingTime: number;
  isRunning: boolean;
  createdAt: string;
  startedAt?: string | null; // Quando o timer foi iniciado
  lastUpdateTime?: number; // Timestamp do último update em ms
}

interface TimerContextType {
  timers: Timer[];
  createTimer: (name: string, initialTime: number) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  deleteTimer: (id: string) => void;
  updateTimerName: (id: string, name: string) => void;
}

export const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Função para calcular tempo restante preciso
const calculateRemainingTime = (timer: Timer): number => {
  if (!timer.isRunning || !timer.startedAt) {
    return timer.remainingTime;
  }

  // Se não temos lastUpdateTime, significa que é a primeira vez que estamos calculando
  // desde que o timer foi iniciado/recuperado
  if (timer.lastUpdateTime === undefined || timer.lastUpdateTime === 0) {
    // Calcular quanto tempo passou desde que foi iniciado
    const startTime = new Date(timer.startedAt).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    return Math.max(0, timer.remainingTime - elapsedSeconds);
  }

  // Se temos lastUpdateTime, apenas subtrair 1 segundo do remainingTime
  return Math.max(0, timer.remainingTime - 1);
};

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timers, setTimers] = useState<Timer[]>([]);
  const [dbReady, setDbReady] = useState(false);
  const timerIntervals = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Inicializar banco de dados e carregar timers ao montar
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      const savedTimers = await getAllTimers();
      // Recalcular tempo restante para timers que estavam rodando
      const recalculatedTimers = savedTimers.map(timer => {
        if (timer.isRunning) {
          const remaining = calculateRemainingTime(timer);
          return {
            ...timer,
            remainingTime: remaining,
            isRunning: remaining > 0,
            lastUpdateTime: Date.now() // Marcar o tempo de atualização
          };
        }
        return timer;
      });
      setTimers(recalculatedTimers);
      setDbReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    // Limpar todos os intervalos primeiro
    Object.keys(timerIntervals.current).forEach(id => {
      clearInterval(timerIntervals.current[id]);
      delete timerIntervals.current[id];
    });

    // Criar novos intervalos apenas para timers em execução
    timers.forEach(timer => {
      if (timer.isRunning && timer.remainingTime > 0) {
        timerIntervals.current[timer.id] = setInterval(() => {
          setTimers(prevTimers =>
            prevTimers.map(t => {
              if (t.id === timer.id && t.isRunning) {
                // Apenas decrementar 1 segundo, já que calculamos corretamente no início
                const newRemainingTime = Math.max(0, t.remainingTime - 1);
                
                const updated = {
                  ...t,
                  remainingTime: newRemainingTime,
                  isRunning: newRemainingTime > 0 ? t.isRunning : false,
                  lastUpdateTime: Date.now()
                };
                
                // Salvar no banco de dados apenas quando finaliza
                if (dbReady && newRemainingTime === 0) {
                  updateTimer(updated);
                }
                return updated;
              }
              return t;
            })
          );
        }, 1000);
      }
    });

    return () => {
      // Cleanup: limpar todos os intervalos
      Object.values(timerIntervals.current).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [timers, dbReady]);

  const createTimer = (name: string, initialTime: number) => {
    const newTimer: Timer = {
      id: Date.now().toString(),
      name,
      initialTime,
      remainingTime: initialTime,
      isRunning: false,
      createdAt: new Date().toISOString()
    };
    setTimers([newTimer, ...timers]);
    if (dbReady) {
      insertTimer(newTimer);
    }
  };

  const startTimer = (id: string) => {
    setTimers(prevTimers => {
      const updated = prevTimers.map(t => {
        if (t.id === id && t.remainingTime > 0) {
          return { 
            ...t, 
            isRunning: true,
            startedAt: t.startedAt || new Date().toISOString(), // Salvar quando foi iniciado
            lastUpdateTime: Date.now()
          };
        }
        return t;
      });
      // Persistir mudança
      if (dbReady) {
        const timer = updated.find(t => t.id === id);
        if (timer) updateTimer(timer);
      }
      return updated;
    });
  };

  const pauseTimer = (id: string) => {
    setTimers(prevTimers => {
      const updated = prevTimers.map(t =>
        t.id === id ? { ...t, isRunning: false } : t
      );
      // Persistir mudança
      if (dbReady) {
        const timer = updated.find(t => t.id === id);
        if (timer) updateTimer(timer);
      }
      return updated;
    });
  };

  const resetTimer = (id: string) => {
    setTimers(prevTimers => {
      const updated = prevTimers.map(t =>
        t.id === id ? { ...t, remainingTime: t.initialTime, isRunning: false, startedAt: null } : t
      );
      // Persistir mudança
      if (dbReady) {
        const timer = updated.find(t => t.id === id);
        if (timer) updateTimer(timer);
      }
      return updated;
    });
  };

  const deleteTimer = (id: string) => {
    if (timerIntervals.current[id]) {
      clearInterval(timerIntervals.current[id]);
      delete timerIntervals.current[id];
    }
    setTimers(timers.filter(t => t.id !== id));
    // Persistir mudança
    if (dbReady) {
      deleteTimerFromDB(id);
    }
  };

  const updateTimerName = (id: string, name: string) => {
    setTimers(prevTimers => {
      const updated = prevTimers.map(t =>
        t.id === id ? { ...t, name } : t
      );
      // Persistir mudança
      if (dbReady) {
        const timer = updated.find(t => t.id === id);
        if (timer) updateTimer(timer);
      }
      return updated;
    });
  };

  const value: TimerContextType = {
    timers,
    createTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    deleteTimer,
    updateTimerName
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimers = (): TimerContextType => {
  const context = React.useContext(TimerContext);
  if (!context) {
    throw new Error('useTimers must be used within TimerProvider');
  }
  return context;
};
