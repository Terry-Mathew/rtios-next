/**
 * App Store - Zustand Store for Application Navigation & UI State
 * 
 * Manages transient UI state:
 * - Navigation (currentView)
 * - Module selection (activeModule, activeSidebarTab)
 * - Modal state (isAuthModalOpen)
 * 
 * Uses Immer middleware for immutable state updates.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { View } from '@/src/types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * State properties for the app store
 */
interface AppStoreState {
  currentView: View;
  activeModule: 'coverLetter' | 'linkedin' | 'interview';
  activeSidebarTab: 'input' | 'analysis' | 'research';
  isAuthModalOpen: boolean;
}

/**
 * Action methods for the app store
 */
interface AppStoreActions {
  setCurrentView: (view: View) => void;
  setActiveModule: (module: 'coverLetter' | 'linkedin' | 'interview') => void;
  setActiveSidebarTab: (tab: 'input' | 'analysis' | 'research') => void;
  setIsAuthModalOpen: (open: boolean) => void;
}

/**
 * Combined store type
 */
type AppStore = AppStoreState & AppStoreActions;

// ============================================================================
// Store Implementation
// ============================================================================

export const useAppStore = create<AppStore>()(
  immer((set) => ({
    // Initial state
    currentView: 'landing',
    activeModule: 'coverLetter',
    activeSidebarTab: 'input',
    isAuthModalOpen: false,

    // Actions
    setCurrentView: (view) => set((state) => {
      state.currentView = view;
    }),

    setActiveModule: (module) => set((state) => {
      state.activeModule = module;
    }),

    setActiveSidebarTab: (tab) => set((state) => {
      state.activeSidebarTab = tab;
    }),

    setIsAuthModalOpen: (open) => set((state) => {
      state.isAuthModalOpen = open;
    }),
  }))
);

