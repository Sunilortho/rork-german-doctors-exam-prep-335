import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  requirement: number;
  current: number;
}

export interface DailyGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  completed: boolean;
}

interface GamificationState {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  lastActiveDate: string | null;
  totalSessionsCompleted: number;
  totalTermsLearned: number;
  totalArztbriefCorrected: number;
  dailyGoals: DailyGoal[];
  achievements: Achievement[];
}

const STORAGE_KEY = '@gamification_state';

const initialAchievements: Achievement[] = [
  { id: 'first_session', title: 'Erste Schritte', description: 'Complete your first FSP session', icon: '🎯', unlocked: false, requirement: 1, current: 0 },
  { id: 'streak_3', title: 'Konstant', description: 'Maintain a 3-day streak', icon: '🔥', unlocked: false, requirement: 3, current: 0 },
  { id: 'streak_7', title: 'Wochenmeister', description: 'Maintain a 7-day streak', icon: '⭐', unlocked: false, requirement: 7, current: 0 },
  { id: 'streak_30', title: 'Monatslegende', description: 'Maintain a 30-day streak', icon: '🏆', unlocked: false, requirement: 30, current: 0 },
  { id: 'terms_50', title: 'Wortschatz', description: 'Learn 50 medical terms', icon: '📚', unlocked: false, requirement: 50, current: 0 },
  { id: 'terms_150', title: 'Terminologie-Experte', description: 'Learn 150 medical terms', icon: '🎓', unlocked: false, requirement: 150, current: 0 },
  { id: 'sessions_10', title: 'Fleißig', description: 'Complete 10 FSP sessions', icon: '💪', unlocked: false, requirement: 10, current: 0 },
  { id: 'sessions_50', title: 'Prüfungsprofi', description: 'Complete 50 FSP sessions', icon: '🌟', unlocked: false, requirement: 50, current: 0 },
  { id: 'arztbrief_5', title: 'Schriftlich fit', description: 'Correct 5 Arztbriefe', icon: '✍️', unlocked: false, requirement: 5, current: 0 },
  { id: 'level_5', title: 'Aufsteiger', description: 'Reach level 5', icon: '📈', unlocked: false, requirement: 5, current: 0 },
];

const getDefaultDailyGoals = (): DailyGoal[] => [
  { id: 'practice', title: 'FSP Practice Session', target: 1, current: 0, completed: false },
  { id: 'terms', title: 'Learn Medical Terms', target: 10, current: 0, completed: false },
  { id: 'review', title: 'Review Documents', target: 1, current: 0, completed: false },
];

const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 100) + 1;
};

const getXPForNextLevel = (level: number): number => {
  return level * 100;
};

export const [GamificationProvider, useGamification] = createContextHook(() => {
  const [state, setState] = useState<GamificationState>({
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    level: 1,
    lastActiveDate: null,
    totalSessionsCompleted: 0,
    totalTermsLearned: 0,
    totalArztbriefCorrected: 0,
    dailyGoals: getDefaultDailyGoals(),
    achievements: initialAchievements,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveState();
    }
  }, [state, isLoaded]);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const today = new Date().toDateString();
        
        if (parsed.lastActiveDate && parsed.lastActiveDate !== today) {
          const lastDate = new Date(parsed.lastActiveDate);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays > 1) {
            parsed.currentStreak = 0;
          }
          parsed.dailyGoals = getDefaultDailyGoals();
        }
        
        setState({
          ...parsed,
          achievements: parsed.achievements || initialAchievements,
          dailyGoals: parsed.dailyGoals || getDefaultDailyGoals(),
        });
      }
      setIsLoaded(true);
    } catch (error) {
      console.log('Error loading gamification state:', error);
      setIsLoaded(true);
    }
  };

  const saveState = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.log('Error saving gamification state:', error);
    }
  };

  const checkAndUpdateStreak = useCallback(() => {
    const today = new Date().toDateString();
    
    setState(prev => {
      if (prev.lastActiveDate === today) {
        return prev;
      }
      
      let newStreak = prev.currentStreak;
      if (prev.lastActiveDate) {
        const lastDate = new Date(prev.lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak = prev.currentStreak + 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      
      return {
        ...prev,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        lastActiveDate: today,
      };
    });
  }, []);

  const addXP = useCallback((amount: number) => {
    setState(prev => {
      const newXP = prev.totalXP + amount;
      const newLevel = calculateLevel(newXP);
      return {
        ...prev,
        totalXP: newXP,
        level: newLevel,
      };
    });
  }, []);

  const completeSession = useCallback(() => {
    checkAndUpdateStreak();
    addXP(25);
    
    setState(prev => {
      const newSessionsCompleted = prev.totalSessionsCompleted + 1;
      const updatedGoals = prev.dailyGoals.map(goal =>
        goal.id === 'practice'
          ? { ...goal, current: goal.current + 1, completed: goal.current + 1 >= goal.target }
          : goal
      );
      
      const updatedAchievements = prev.achievements.map(ach => {
        if (ach.id === 'first_session' || ach.id === 'sessions_10' || ach.id === 'sessions_50') {
          const newCurrent = newSessionsCompleted;
          return {
            ...ach,
            current: newCurrent,
            unlocked: newCurrent >= ach.requirement,
            unlockedAt: newCurrent >= ach.requirement && !ach.unlocked ? Date.now() : ach.unlockedAt,
          };
        }
        if (ach.id === 'streak_3' || ach.id === 'streak_7' || ach.id === 'streak_30') {
          const newCurrent = prev.currentStreak + 1;
          return {
            ...ach,
            current: newCurrent,
            unlocked: newCurrent >= ach.requirement,
            unlockedAt: newCurrent >= ach.requirement && !ach.unlocked ? Date.now() : ach.unlockedAt,
          };
        }
        if (ach.id === 'level_5') {
          const newLevel = calculateLevel(prev.totalXP + 25);
          return {
            ...ach,
            current: newLevel,
            unlocked: newLevel >= ach.requirement,
            unlockedAt: newLevel >= ach.requirement && !ach.unlocked ? Date.now() : ach.unlockedAt,
          };
        }
        return ach;
      });
      
      return {
        ...prev,
        totalSessionsCompleted: newSessionsCompleted,
        dailyGoals: updatedGoals,
        achievements: updatedAchievements,
      };
    });
  }, [checkAndUpdateStreak, addXP]);

  const learnTerms = useCallback((count: number) => {
    checkAndUpdateStreak();
    addXP(count * 2);
    
    setState(prev => {
      const newTermsLearned = prev.totalTermsLearned + count;
      const updatedGoals = prev.dailyGoals.map(goal =>
        goal.id === 'terms'
          ? { ...goal, current: goal.current + count, completed: goal.current + count >= goal.target }
          : goal
      );
      
      const updatedAchievements = prev.achievements.map(ach => {
        if (ach.id === 'terms_50' || ach.id === 'terms_150') {
          return {
            ...ach,
            current: newTermsLearned,
            unlocked: newTermsLearned >= ach.requirement,
            unlockedAt: newTermsLearned >= ach.requirement && !ach.unlocked ? Date.now() : ach.unlockedAt,
          };
        }
        return ach;
      });
      
      return {
        ...prev,
        totalTermsLearned: newTermsLearned,
        dailyGoals: updatedGoals,
        achievements: updatedAchievements,
      };
    });
  }, [checkAndUpdateStreak, addXP]);

  const correctArztbrief = useCallback(() => {
    checkAndUpdateStreak();
    addXP(15);
    
    setState(prev => {
      const newCount = prev.totalArztbriefCorrected + 1;
      const updatedAchievements = prev.achievements.map(ach => {
        if (ach.id === 'arztbrief_5') {
          return {
            ...ach,
            current: newCount,
            unlocked: newCount >= ach.requirement,
            unlockedAt: newCount >= ach.requirement && !ach.unlocked ? Date.now() : ach.unlockedAt,
          };
        }
        return ach;
      });
      
      return {
        ...prev,
        totalArztbriefCorrected: newCount,
        achievements: updatedAchievements,
      };
    });
  }, [checkAndUpdateStreak, addXP]);

  const reviewDocuments = useCallback(() => {
    checkAndUpdateStreak();
    addXP(5);
    
    setState(prev => {
      const updatedGoals = prev.dailyGoals.map(goal =>
        goal.id === 'review'
          ? { ...goal, current: goal.current + 1, completed: goal.current + 1 >= goal.target }
          : goal
      );
      
      return {
        ...prev,
        dailyGoals: updatedGoals,
      };
    });
  }, [checkAndUpdateStreak, addXP]);

  const dailyGoalsCompleted = useMemo(() => {
    return state.dailyGoals.filter(g => g.completed).length;
  }, [state.dailyGoals]);

  const xpForNextLevel = useMemo(() => {
    return getXPForNextLevel(state.level);
  }, [state.level]);

  const xpProgress = useMemo(() => {
    const xpInCurrentLevel = state.totalXP % 100;
    return xpInCurrentLevel / 100;
  }, [state.totalXP]);

  const unlockedAchievements = useMemo(() => {
    return state.achievements.filter(a => a.unlocked);
  }, [state.achievements]);

  return {
    ...state,
    isLoaded,
    dailyGoalsCompleted,
    totalDailyGoals: state.dailyGoals.length,
    xpForNextLevel,
    xpProgress,
    unlockedAchievements,
    completeSession,
    learnTerms,
    correctArztbrief,
    reviewDocuments,
    checkAndUpdateStreak,
  };
});
