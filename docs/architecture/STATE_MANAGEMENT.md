# State Management

**Zustand stores for client-side state**

**Last Updated**: 2025-01-05

---

## Overview

**Library**: Zustand v5.0.9
**Pattern**: Multiple focused stores (not single global store)
**Middleware**: Immer (immutability) + Persist (localStorage)

**Stores**:
1. `appStore` - UI navigation & modals
2. `jobStore` - Job library & active job (persisted)
3. `workspaceStore` - Workspace execution state
4. `toastStore` - Toast notifications

---

## appStore (UI State)

**File**: `src/stores/appStore.ts`

**Purpose**: Global UI state (navigation, modals, active views)

**State**:
```typescript
interface AppStoreState {
  currentView: View;
  activeModule: 'coverLetter' | 'linkedin' | 'interview';
  activeSidebarTab: 'input' | 'analysis' | 'research';
  isAuthModalOpen: boolean;
}
```

**Actions**:
```typescript
interface AppStoreActions {
  setCurrentView: (view: View) => void;
  setActiveModule: (module) => void;
  setActiveSidebarTab: (tab) => void;
  setIsAuthModalOpen: (open: boolean) => void;
}
```

**View Types**:
```typescript
type View =
  | 'landing'
  | 'app'
  | 'dashboard'
  | 'pricing'
  | 'terms'
  | 'privacy'
  | 'cookie'
  | 'about'
  | 'admin';
```

**Usage**:
```typescript
import { useAppStore } from '@/src/stores/appStore';

function MyComponent() {
  const { currentView, setCurrentView } = useAppStore();

  return (
    <button onClick={() => setCurrentView('app')}>
      Go to App
    </button>
  );
}
```

**Persistence**: No (session state only)

**Middleware**: Immer only

---

## jobStore (Job Management)

**File**: `src/stores/jobStore.ts`

**Purpose**: Job library, active job, CRUD operations

**State**:
```typescript
interface JobStoreState {
  jobs: JobInfo[];
  activeJobId: string | null;
  isLoading: boolean;
  hasLoaded: boolean;  // Cache flag
}
```

**Actions**:
```typescript
interface JobStoreActions {
  // Data fetching
  fetchJobs: (force?: boolean) => Promise<void>;

  // CRUD operations
  addJob: (job: JobInfo) => Promise<string>;
  deleteJob: (id: string) => Promise<void>;
  updateJobOutputs: (
    jobId: string,
    outputs: JobOutputs,
    options?: { bulk?: boolean }
  ) => Promise<void>;

  // Selection
  setActiveJobId: (id: string | null) => void;

  // Utilities
  setJobs: (jobs: JobInfo[]) => void;
}
```

### Key Features

#### 1. Persistence
```typescript
persist(
  (set, get) => ({
    // Store implementation
  }),
  {
    name: 'rtios_job_storage',
    storage: createJSONStorage(() => localStorage)
  }
)
```

**Persisted**: `jobs`, `activeJobId`
**Not Persisted**: `isLoading`, `hasLoaded`

#### 2. Optimistic Updates

**Add Job Pattern**:
```typescript
addJob: async (job: JobInfo) => {
  const tempId = crypto.randomUUID();
  const optimisticJob = { ...job, id: tempId };

  // 1. Optimistic update (instant UI)
  set(state => ({
    jobs: [...state.jobs, optimisticJob]
  }));

  try {
    // 2. Server persist
    const { data, error } = await supabase
      .from('jobs')
      .insert([job])
      .select()
      .single();

    if (error) throw error;

    // 3. Replace temp with real
    set(state => ({
      jobs: state.jobs.map(j =>
        j.id === tempId ? data : j
      )
    }));

    return data.id;
  } catch (error) {
    // 4. ROLLBACK on error
    set(state => ({
      jobs: state.jobs.filter(j => j.id !== tempId)
    }));
    throw error;
  }
}
```

#### 3. Caching Strategy

**hasLoaded Flag**:
```typescript
fetchJobs: async (force = false) => {
  const { hasLoaded } = get();

  // Skip if already loaded (unless forced)
  if (hasLoaded && !force) return;

  set({ isLoading: true });

  const { data } = await supabase
    .from('jobs')
    .select(`*, job_outputs(*)`)
    .eq('user_id', userId);

  set({
    jobs: data || [],
    isLoading: false,
    hasLoaded: true
  });
}
```

**Usage**:
```typescript
// Component mount - only fetches once
useEffect(() => {
  fetchJobs(); // hasLoaded check prevents re-fetch
}, []);

// Force refresh
const handleRefresh = () => {
  fetchJobs(true); // force = true
};
```

#### 4. Bulk Operations

**updateJobOutputs with Bulk**:
```typescript
updateJobOutputs: async (jobId, outputs, options = {}) => {
  if (options.bulk) {
    // Batch multiple outputs
    const upserts = Object.entries(outputs).map(([type, data]) => ({
      job_id: jobId,
      type,
      content: data
    }));

    await supabase.from('job_outputs').upsert(upserts);
  } else {
    // Single output
    // ...
  }

  // Update local state
  set(state => ({
    jobs: state.jobs.map(job =>
      job.id === jobId
        ? { ...job, outputs: { ...job.outputs, ...outputs } }
        : job
    )
  }));
}
```

**Usage**:
```typescript
// Save all outputs at once (efficient)
await updateJobOutputs(jobId, {
  research: researchResult,
  analysis: analysisResult
}, { bulk: true });
```

**Middleware**: Immer + Persist

---

## workspaceStore (Workspace State)

**File**: `src/stores/workspaceStore.ts`

**Purpose**: Transient execution state (NOT persisted)

**State**:
```typescript
interface WorkspaceStoreState {
  status: AppStatus;
  error: string | undefined;
  resumeText: string;
  research: ResearchResult | null;
  analysis: AnalysisResult | null;
  coverLetter: CoverLetterState;
  linkedIn: LinkedInState;
  interviewPrep: InterviewPrepState;
}
```

**AppStatus Enum**:
```typescript
enum AppStatus {
  IDLE = 'idle',
  PARSING_RESUME = 'parsing_resume',
  RESEARCHING = 'researching',
  ANALYZING = 'analyzing',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  ERROR = 'error'
}
```

**Actions**:
```typescript
interface WorkspaceStoreActions {
  setStatus: (status: AppStatus) => void;
  setError: (error: string | undefined) => void;
  setResumeText: (text: string) => void;
  setResearch: (research: ResearchResult | null) => void;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  updateCoverLetter: (updates: Partial<CoverLetterState>) => void;
  updateLinkedIn: (updates: Partial<LinkedInState>) => void;
  updateInterviewPrep: (updates: Partial<InterviewPrepState>) => void;
  clearWorkspace: (linkedInInput: LinkedInState['input']) => void;
}
```

### Workspace States

**CoverLetterState**:
```typescript
interface CoverLetterState {
  content: string;
  isGenerating: boolean;
  tone: ToneType;
}
```

**LinkedInState**:
```typescript
interface LinkedInState {
  input: LinkedInMessageInput;  // Form data
  generatedMessage: string;
  isGenerating: boolean;
}
```

**InterviewPrepState**:
```typescript
interface InterviewPrepState {
  questions: InterviewQuestion[];
  isGenerating: boolean;
}
```

### Usage Pattern

**AI Generation Flow**:
```typescript
const { status, setStatus, updateCoverLetter } = useWorkspaceStore();

const handleGenerate = async () => {
  // 1. Set generating state
  setStatus(AppStatus.GENERATING);
  updateCoverLetter({ isGenerating: true });

  try {
    // 2. Call AI
    const result = await generateCoverLetter(...);

    // 3. Update with result
    updateCoverLetter({
      content: result,
      isGenerating: false
    });
    setStatus(AppStatus.COMPLETED);
  } catch (error) {
    setError(error.message);
    setStatus(AppStatus.ERROR);
    updateCoverLetter({ isGenerating: false });
  }
};
```

**Persistence**: No (session only)

**Middleware**: Immer only

---

## toastStore (Notifications)

**File**: `src/stores/toastStore.ts`

**Purpose**: Toast notification management

**State**:
```typescript
interface ToastStore {
  toasts: ToastData[];
}
```

**ToastData**:
```typescript
interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;  // 0 = persistent
}
```

**Actions**:
```typescript
interface ToastStoreActions {
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}
```

### Features

**Auto-Dismiss**:
```typescript
addToast: (toast) => {
  const id = crypto.randomUUID();
  const newToast = { ...toast, id };

  set(state => ({
    toasts: [...state.toasts, newToast]
  }));

  // Auto-remove after duration
  if (toast.duration > 0) {
    setTimeout(() => {
      get().removeToast(id);
    }, toast.duration);
  }
}
```

**Max Toasts**: 5 visible at once

**Usage**:
```typescript
import { useToastStore } from '@/src/stores/toastStore';

function MyComponent() {
  const { addToast } = useToastStore();

  const handleSuccess = () => {
    addToast({
      type: 'success',
      message: 'Operation completed!',
      duration: 3000  // 3 seconds
    });
  };

  const handleError = () => {
    addToast({
      type: 'error',
      message: 'Something went wrong',
      duration: 0  // Persistent (manual dismiss)
    });
  };

  return <button onClick={handleSuccess}>Do Something</button>;
}
```

**Persistence**: No

**Middleware**: None

---

## State Synchronization

### Two-Tier Cache

```
localStorage (instant load)
    ↓
Zustand Store (in-memory)
    ↓
Supabase (source of truth)
```

**Flow**:
1. App loads → Read from localStorage (instant)
2. `useEffect` → Fetch from Supabase (background)
3. Update store → Persist to localStorage (automatic)

**Implementation**:
```typescript
// 1. Store auto-loads from localStorage (Zustand persist)
const { jobs } = useJobStore(); // Instant

// 2. Fetch fresh data on mount
useEffect(() => {
  fetchJobs(); // Only if !hasLoaded
}, []);

// 3. Updates persist automatically
await addJob(newJob);
// → Store updates
// → localStorage updates (persist middleware)
// → Supabase updates (explicit)
```

---

## Store Patterns

### Creating a New Store

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';

interface MyStoreState {
  data: any[];
  isLoading: boolean;
}

interface MyStoreActions {
  fetchData: () => Promise<void>;
  addData: (item: any) => Promise<void>;
}

type MyStore = MyStoreState & MyStoreActions;

export const useMyStore = create<MyStore>()(
  persist(
    immer((set, get) => ({
      // State
      data: [],
      isLoading: false,

      // Actions
      fetchData: async () => {
        set({ isLoading: true });
        const data = await fetchFromAPI();
        set({ data, isLoading: false });
      },

      addData: async (item) => {
        // Optimistic update
        set(state => {
          state.data.push(item);
        });

        try {
          await saveToAPI(item);
        } catch (error) {
          // Rollback
          set(state => {
            state.data = state.data.filter(i => i.id !== item.id);
          });
          throw error;
        }
      }
    })),
    {
      name: 'my-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist specific fields
        data: state.data
        // isLoading NOT persisted
      })
    }
  )
);
```

---

### Immer Middleware

**Purpose**: Write immutable updates with mutable syntax

**Example**:
```typescript
// Without Immer
set(state => ({
  jobs: state.jobs.map(job =>
    job.id === jobId
      ? { ...job, title: newTitle }
      : job
  )
}));

// With Immer
set(state => {
  const job = state.jobs.find(j => j.id === jobId);
  if (job) {
    job.title = newTitle;  // Looks mutable, but isn't!
  }
});
```

---

### Persist Middleware

**Purpose**: Auto-sync store with localStorage

**Options**:
```typescript
{
  name: 'storage-key',  // localStorage key
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    // Choose what to persist
    persistedField: state.persistedField
  }),
  version: 1,  // Schema version
  migrate: (persistedState, version) => {
    // Handle schema changes
    if (version === 0) {
      // Upgrade old state
    }
    return persistedState;
  }
}
```

---

## Testing Stores

**Vitest Example**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useJobStore } from './jobStore';

describe('jobStore', () => {
  beforeEach(() => {
    // Reset store
    useJobStore.setState({
      jobs: [],
      activeJobId: null,
      isLoading: false,
      hasLoaded: false
    });
  });

  it('adds job optimistically', async () => {
    const store = useJobStore.getState();
    const jobId = await store.addJob({
      title: 'Test Job',
      company: 'Test Co'
    });

    expect(useJobStore.getState().jobs).toHaveLength(1);
    expect(useJobStore.getState().jobs[0].title).toBe('Test Job');
  });

  it('rolls back on error', async () => {
    // Mock supabase to throw error
    vi.mock('@/src/services/supabase', () => ({
      supabaseBrowser: {
        from: () => ({
          insert: () => Promise.reject(new Error('DB error'))
        })
      }
    }));

    const store = useJobStore.getState();

    await expect(
      store.addJob({ title: 'Test', company: 'Test' })
    ).rejects.toThrow();

    expect(useJobStore.getState().jobs).toHaveLength(0); // Rolled back
  });
});
```

---

## Best Practices

### DO ✅

- Keep stores focused (single responsibility)
- Use Immer for complex updates
- Implement optimistic updates with rollback
- Persist only what's necessary
- Use `hasLoaded` flags to prevent redundant fetches
- Type all state and actions

### DON'T ❌

- Create one giant global store
- Store derived data (compute from state instead)
- Persist sensitive data to localStorage
- Mutate state directly (use `set`)
- Forget to handle rollback on errors
- Store what's already in database (use as cache only)

---

**See Also**:
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - Application layer
- [COMPONENTS.md](./COMPONENTS.md) - How components use stores
- [API_REFERENCE.md](./API_REFERENCE.md) - Server Actions called by stores

**Last Updated**: 2025-01-05
