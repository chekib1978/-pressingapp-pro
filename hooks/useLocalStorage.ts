
import { useState, useEffect } from 'react';

// ATTENTION: Ce hook n'est plus utilisé pour stocker les données principales de l'application
// (articles, clients, commandes, operationLogs) car elles sont maintenant gérées via Supabase.
// Il peut être conservé pour des préférences utilisateur mineures et non critiques qui
// ne nécessitent pas de synchronisation avec la base de données.

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const getStoredValue = (): T => {
    // Vérifier si window est défini (pour éviter les erreurs SSR si jamais utilisé dans un tel contexte)
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}