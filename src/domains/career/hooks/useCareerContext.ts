/**
 * useCareerContext Hook
 * 
 * Re-exports the hook from careerHooks for backward compatibility.
 * All components can continue using this import path.
 */

export { useCareerContext } from '@/src/domains/career/careerHooks';
export type { CareerContextValue as UseCareerContextReturn } from '@/src/domains/career/CareerContextProvider';
