import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserTier } from '@/types';

const DEFAULT_USER: UserProfile = {
  id: '1',
  name: 'Doctor',
  email: '',
  tier: 'free',
  hasSeenWelcome: false,
  createdAt: new Date().toISOString(),
};

const STORAGE_KEY = '@roadmap_germany_user';

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (updatedUser: UserProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.log('Error saving user:', error);
    }
  };

  const markWelcomeSeen = useCallback(() => {
    saveUser({ ...user, hasSeenWelcome: true });
  }, [user]);

  const upgradeTier = useCallback((newTier: UserTier) => {
    saveUser({ ...user, tier: newTier });
  }, [user]);

  const canAccess = useCallback((requiredTier: UserTier): boolean => {
    const tierOrder: UserTier[] = ['free', 'pro', 'vip'];
    return tierOrder.indexOf(user.tier) >= tierOrder.indexOf(requiredTier);
  }, [user.tier]);

  return {
    user,
    isLoading,
    markWelcomeSeen,
    upgradeTier,
    canAccess,
  };
});
