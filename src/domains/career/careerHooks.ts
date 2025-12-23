/**
 * Career Context Hooks
 * 
 * Extracted from CareerContextProvider.tsx to satisfy react-refresh/only-export-components.
 * Provider files should only export the provider component.
 */

import { useContext } from 'react';
import { CareerContext, type CareerContextValue } from '@/src/domains/career/CareerContextProvider';

/**
 * Hook to use the CareerContext
 * Must be used within CareerContextProvider
 */
export const useCareerContext = (): CareerContextValue => {
    const context = useContext(CareerContext);
    if (!context) {
        throw new Error('useCareerContext must be used within CareerContextProvider');
    }
    return context;
};

