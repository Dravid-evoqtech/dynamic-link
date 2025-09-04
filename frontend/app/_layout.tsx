import { Stack } from "expo-router";
import { ThemeProvider } from "../hooks/useThemeContext";
import { OnboardingProvider } from "../contexts/OnboardingContext";
// Removed FCM and notification handlers
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncStoragePersister } from "./services/queryClient";

export default function RootLayout() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: asyncStoragePersister }}>
      <ThemeProvider>
        <OnboardingProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </OnboardingProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}