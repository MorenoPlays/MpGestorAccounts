import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface Timer {
  id: string;
  name: string;
  initialTime: number; // em segundos
  remainingTime: number;
  isRunning: boolean;
  createdAt: string;
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

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [timers, setTimers] = useState<Timer[]>([]);
  const timerIntervals = React.useRef<Record<string, NodeJS.Timeout>>({});

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
                const newRemainingTime = Math.max(0, t.remainingTime - 1);
                return {
                  ...t,
                  remainingTime: newRemainingTime,
                  isRunning: newRemainingTime > 0 ? t.isRunning : false
                };
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
  }, []);

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
  };

  const startTimer = (id: string) => {
    setTimers(timers.map(t =>
      t.id === id && t.remainingTime > 0 ? { ...t, isRunning: true } : t
    ));
  };

  const pauseTimer = (id: string) => {
    setTimers(timers.map(t =>
      t.id === id ? { ...t, isRunning: false } : t
    ));
  };

  const resetTimer = (id: string) => {
    setTimers(timers.map(t =>
      t.id === id ? { ...t, remainingTime: t.initialTime, isRunning: false } : t
    ));
  };

  const deleteTimer = (id: string) => {
    if (timerIntervals.current[id]) {
      clearInterval(timerIntervals.current[id]);
      delete timerIntervals.current[id];
    }
    setTimers(timers.filter(t => t.id !== id));
  };

  const updateTimerName = (id: string, name: string) => {
    setTimers(timers.map(t =>
      t.id === id ? { ...t, name } : t
    ));
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
