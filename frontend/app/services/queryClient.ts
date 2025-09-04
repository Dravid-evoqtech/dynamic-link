import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// Create a singleton QueryClient with sensible defaults for React Native
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Create a persister backed by AsyncStorage
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'futurefind-react-query',
  throttleTime: 1000,
});

export const clearQueryCache = async () => {
  try {
    queryClient.clear();
    // Best-effort: also remove the persisted cache key
    await AsyncStorage.removeItem('futurefind-react-query');
  } catch (e) {
    // noop
  }
};


