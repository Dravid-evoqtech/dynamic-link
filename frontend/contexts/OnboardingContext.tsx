// contexts/OnboardingContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { userAPI } from '../app/services/api'; // Adjust path if necessary
import { Platform } from 'react-native';

// Define the structure of your onboarding data
// Ensure this matches the expected shape of your backend's user profile update endpoint
interface OnboardingData {
  _id?: string; // User's ID, typically set after login/signup
  opportunityType?: string; // ID of the selected opportunity type (single choice)
  dateOfBirth?: Date; // Or string if you prefer to send a formatted string
  programs?: string[]; // Array of IDs
  grade?: string; // ID of the grade
  location?: {
    title: string;
    lat?: number;
    lng?: number;
  };
  availability?: string[]; // Array of selected seasons/options
  interests?: string[]; // Array of IDs
  goals?: string[]; // Array of IDs
  // Add any other fields collected during onboarding
}

// Define the context value type
interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  submitOnboarding: (finalData?: Partial<OnboardingData>) => Promise<void>;
  clearData: () => void;
  isLoading: boolean;
  error: string | null;
}

// Create the context
const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to update a part of the onboarding data
  const updateData = useCallback((newData: Partial<OnboardingData>) => {
    setOnboardingData((prevData) => ({ ...prevData, ...newData }));
  }, []);

  // Function to clear all onboarding data (e.g., after successful submission or logout)
  const clearData = useCallback(() => {
    setOnboardingData({});
  }, []);

  // Function to submit all collected onboarding data to the backend
  const submitOnboarding = useCallback(async (finalData?: Partial<OnboardingData>) => {
    setIsLoading(true);
    setError(null);

    // Combine existing data with any final data passed in for a complete, up-to-date payload.
    const combinedData = { ...onboardingData, ...finalData };

    try {
      // Prepare data for the backend
      const profileDataToSend: any = {
        ...combinedData,
        // Backend might expect specific formats for dates or other complex types
        // Example: If dateOfBirth is a Date object, convert it to ISO string
        dateOfBirth: combinedData.dateOfBirth
          ? combinedData.dateOfBirth.toISOString()
          : undefined,
        // Ensure arrays are handled correctly for the backend (e.g., if null, send empty array)
        opportunityType: combinedData.opportunityType,
        programs: combinedData.programs || [],
        availability: combinedData.availability || [],
        interests: combinedData.interests || [],
        goals: combinedData.goals || [],
        // If location is an object like { address: string, lat: number, lng: number }
        // then it should match the backend's expected structure.
        // If it's just a string, no special handling needed here.
      };

      // Remove undefined/null values for a cleaner payload if backend prefers it
      Object.keys(profileDataToSend).forEach((key) => {
        if (profileDataToSend[key] === undefined || profileDataToSend[key] === null) {
          delete profileDataToSend[key];
        }
      });
      
      console.log('[OnboardingContext] Submitting profile data:', profileDataToSend);
      // Send the accumulated data to your user profile update endpoint
      await userAPI.updateProfile(profileDataToSend);

      // Optionally clear data after successful submission
      clearData();

      console.log('Onboarding data submitted successfully!');
    } catch (err: any) {
      console.error('Error submitting onboarding data:', err);
      // More specific error messages for user feedback
      let errorMessage = 'Failed to complete onboarding. Please try again.';
      if (err.status) {
        if (err.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
        } else if (err.status === 400 && err.data?.message) {
            errorMessage = err.data.message; // Use backend's specific validation message
        } else if (err.status === 404) {
            errorMessage = 'The server could not find the update endpoint. Please contact support.';
        }
      } else if (err.message && !err.status) {
          errorMessage = `Network error: ${err.message}`; // For network issues before server response
      }
      setError(errorMessage);
      throw err; // Re-throw to allow component to catch and handle further
    } finally {
      setIsLoading(false);
    }
  }, [onboardingData, clearData]);

  const contextValue = {
    data: onboardingData,
    updateData,
    submitOnboarding,
    clearData,
    isLoading,
    error,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Custom hook to use the onboarding context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};