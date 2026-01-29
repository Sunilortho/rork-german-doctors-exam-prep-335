import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const DEMO_START_KEY = 'demo_start_timestamp';
const DEMO_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours

export const [DemoProvider, useDemo] = createContextHook(() => {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    initializeDemo();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const initializeDemo = async () => {
    try {
      const stored = await AsyncStorage.getItem(DEMO_START_KEY);
      
      if (stored) {
        setStartTime(parseInt(stored, 10));
      } else {
        const now = Date.now();
        await AsyncStorage.setItem(DEMO_START_KEY, now.toString());
        setStartTime(now);
      }
    } catch (error) {
      console.log('[Demo] Error initializing demo:', error);
      const now = Date.now();
      setStartTime(now);
    } finally {
      setIsLoading(false);
    }
  };

  const timeRemaining = useMemo(() => {
    if (!startTime) return DEMO_DURATION_MS;
    const elapsed = currentTime - startTime;
    return Math.max(0, DEMO_DURATION_MS - elapsed);
  }, [startTime, currentTime]);

  const isExpired = useMemo(() => {
    return timeRemaining <= 0;
  }, [timeRemaining]);

  const formattedTimeRemaining = useMemo(() => {
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [timeRemaining]);

  const resetDemo = useCallback(async () => {
    try {
      const now = Date.now();
      await AsyncStorage.setItem(DEMO_START_KEY, now.toString());
      setStartTime(now);
    } catch (error) {
      console.log('[Demo] Error resetting demo:', error);
    }
  }, []);

  return {
    isExpired,
    isLoading,
    timeRemaining,
    formattedTimeRemaining,
    resetDemo,
  };
});
