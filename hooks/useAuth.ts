'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/types';

/**
 * Hook lấy user hiện tại từ localStorage.
 * Trả về null nếu chưa đăng nhập.
 */
export function useCurrentUser(): UserProfile | null {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('itour_user') || localStorage.getItem('user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        setUser(null);
      }
    }
  }, []);

  return user;
}
