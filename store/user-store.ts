"use client";

import { useSyncExternalStore } from "react";

export type UserInfo = {
  id?: string;
  userName?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

const STORAGE_KEY = "itour_user";
let currentUser: UserInfo | null = null;
const listeners = new Set<() => void>();

const readStorage = (): UserInfo | null => {
  if (typeof window === "undefined") {
    return null;
  }

  if (currentUser) {
    return currentUser;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    currentUser = JSON.parse(raw) as UserInfo;
    return currentUser;
  } catch {
    return null;
  }
};

const writeStorage = (user: UserInfo | null) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures
  }
};

export const setUser = (user: UserInfo | null) => {
  currentUser = user;
  writeStorage(user);
  listeners.forEach((listener) => listener());
};

export const clearUser = () => {
  setUser(null);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => readStorage();

export const useUserStore = () => useSyncExternalStore(subscribe, getSnapshot, () => null);
