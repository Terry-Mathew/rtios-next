# Component Structure

**Component organization and UI patterns**

**Last Updated**: 2025-01-05

---

## Component Organization

The component structure follows a **feature-first** approach with clear separation of concerns.

```
src/components/
├── errors/          # Error boundaries
├── features/        # Feature-specific components
│   ├── analysis/    # Resume analysis display
│   ├── cover-letter/
│   ├── interview/
│   ├── linkedin/
│   └── research/
├── layout/          # Layout components (navigation, sidebars)
├── modals/          # Modal dialogs
├── shared/          # Shared utilities
└── ui/              # Core UI primitives
    └── core/        # Button, Input, etc.
```

---

## Layout Components

**Location**: `src/components/layout/`

### AppShell.tsx
**Purpose**: Main application wrapper and layout orchestrator

```typescript
interface AppShellProps {
  children: React.ReactNode;
}
```

**Features**:
- Coordinates NavigationSidebar, RightSidebar, and main content
- Handles responsive layout
- Manages sidebar visibility

**File**: `src/components/layout/AppShell.tsx`

---

### NavigationSidebar.tsx
**Purpose**: Left navigation panel for feature module selection

**Features**:
- Active module highlighting
- Feature icons (Lucide React)
- Collapsible on mobile

**Modules**:
- Cover Letter Generator
- LinkedIn Message Generator
- Interview Prep

**File**: `src/components/layout/NavigationSidebar.tsx`

---

### RightSidebar.tsx
**Purpose**: Context panel showing job details and AI outputs

**Tabs**:
1. **Input** - Job details form
2. **Analysis** - Resume analysis results
3. **Research** - Company research display

**Features**:
- Tab-based navigation
- Scrollable content area
- Contextual to active job

**File**: `src/components/layout/RightSidebar.tsx`

---

### ContextSwitcher.tsx
**Purpose**: Job selection dropdown

```typescript
interface ContextSwitcherProps {
  jobs: JobInfo[];
  activeJobId: string | null;
  onSelectJob: (jobId: string) => void;
}
```

**Features**:
- Displays job title + company
- Shows active job with highlight
- Memoized for performance

**File**: `src/components/layout/ContextSwitcher.tsx`

---

### InputForm.tsx
**Purpose**: Manual job entry form

**Fields**:
- Job Title (required)
- Company Name (required)
- Job Description (required)
- Company URL (optional)
- Source URL (optional)
- Context Name (optional)

**Features**:
- Form validation
- Auto-save on blur
- URL extraction removed (manual entry only)

**File**: `src/components/layout/InputForm.tsx`

---

### Dashboard.tsx
**Purpose**: Dashboard layout with job pipeline visualization

**Sections**:
- Stats overview
- Job pipeline (Saved → Applied → Interviewing → Offer/Rejected)
- Recent activity

**File**: `src/components/layout/Dashboard.tsx`

---

### UsageCounter.tsx
**Purpose**: Display remaining AI generation credits

```typescript
interface UsageCounterProps {
  jobId: string;
  outputType: 'resume_scan' | 'company_research' | 'cover_letter' |
              'linkedin_message' | 'interview_prep';
}
```

**Display**:
- Shows "X of 3 generations used"
- Warning when limit approaching
- Admin users see "Unlimited"

**File**: `src/components/layout/UsageCounter.tsx`

---

### Footer.tsx
**Purpose**: Application footer with links

**Contents**:
- Copyright
- Links (Privacy, Terms, About)
- Social links (if applicable)

**File**: `src/components/layout/Footer.tsx`

---

## Feature Components

**Location**: `src/components/features/`

### Resume Analysis

**File**: `src/components/features/analysis/ResumeAnalysisDisplay.tsx`

```typescript
interface ResumeAnalysisDisplayProps {
  analysis: AnalysisResult | null;
  isGenerating: boolean;
  onRegenerate?: () => void;
}
```

**Displays**:
- ATS Compatibility Score (0-100) with color coding
- Missing Keywords (highlighted)
- Recommendations (bulleted list)
- Compatibility explanation

**Color Coding**:
- 80-100: Green (Excellent)
- 60-79: Yellow (Good)
- 0-59: Red (Needs Improvement)

---

### Cover Letter Generator

**File**: `src/components/features/cover-letter/CoverLetterDisplay.tsx`

```typescript
interface CoverLetterDisplayProps {
  coverLetter: CoverLetterState;
  onToneChange: (tone: ToneType) => void;
  onRegenerate: () => void;
}
```

**Features**:
- Tone selector (Professional, Conversational, Creative, Bold)
- Live preview of generated letter
- Copy to clipboard button
- Download as .txt
- Regenerate with different tone

**Tone Descriptions**:
- **Professional**: Formal, traditional corporate voice
- **Conversational**: Friendly yet professional
- **Creative**: Showcases personality and innovation
- **Bold**: Confident and direct

---

### Interview Prep

**File**: `src/components/features/interview/InterviewPrepDisplay.tsx`

```typescript
interface InterviewPrepDisplayProps {
  questions: InterviewQuestion[];
  isGenerating: boolean;
  onRegenerate?: () => void;
}
```

**Displays** (per question):
- Question text
- Question type badge (Behavioral/Technical/Situational)
- Evaluation criteria
- Answer structure (STAR format)
- Sample answer (collapsible)
- Follow-up questions

**Interactions**:
- Expand/collapse answers
- Print view
- Regenerate questions

---

### LinkedIn Message Generator

**File**: `src/components/features/linkedin/LinkedInMessageGenerator.tsx`

```typescript
interface LinkedInMessageGeneratorProps {
  linkedInState: LinkedInState;
  onGenerate: () => void;
  onInputChange: (input: Partial<LinkedInMessageInput>) => void;
}
```

**Input Form**:
- Connection Status (New / Existing)
- Recruiter Name
- Recruiter Title
- Connection Context
- Message Intent
- Recent Activity
- Mutual Connection
- Custom Addition
- Tone Selector (4 tones)

**Output**:
- Generated message preview
- Character count (150-200 words)
- Copy to clipboard
- Edit directly

---

### Company Research Display

**File**: `src/components/features/research/CompanyResearchDisplay.tsx`

```typescript
interface CompanyResearchDisplayProps {
  research: ResearchResult | null;
  isGenerating: boolean;
}
```

**Displays**:
- Company overview (markdown formatted)
- Key information sections
- Source links (clickable)
- Last updated timestamp

**Features**:
- Markdown rendering with `react-markdown`
- Sanitized HTML (XSS protection)
- Source citations with URLs

---

## UI Primitives

**Location**: `src/components/ui/core/`

### Button.tsx

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**Variants**:
- `primary`: Blue background, white text
- `secondary`: Gray background
- `outline`: Border only, transparent background
- `ghost`: No background, hover effect
- `danger`: Red background

**States**:
- Default
- Hover
- Active
- Disabled
- Loading (spinner)

**File**: `src/components/ui/core/Button.tsx`

---

### Input.tsx

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'url' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
}
```

**Features**:
- Label with required indicator
- Error message display
- Disabled state
- Accessible (aria-labels)

**File**: `src/components/ui/core/Input.tsx`

---

### EmptyState.tsx

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Usage**:
- Empty job list
- No resume uploaded
- No AI outputs yet

**File**: `src/components/ui/core/EmptyState.tsx`

---

### AuthModal.tsx

**File**: `src/components/ui/AuthModal.tsx`

**Tabs**:
1. Sign In
2. Sign Up

**Features**:
- Email/password authentication
- OAuth providers (GitHub, Google, Azure)
- Password strength indicator
- "Forgot password" link
- Terms acceptance checkbox

**Validation**:
- Email format
- Password minimum length
- Required fields

---

### UserMenu.tsx

**File**: `src/components/ui/UserMenu.tsx`

**Dropdown Items**:
- Profile
- Settings
- Dashboard
- Admin Panel (if admin)
- Sign Out

**Display**:
- User avatar or initials
- User name
- Email (truncated)

---

### Toast.tsx & ToastContainer.tsx

**Files**:
- `src/components/ui/Toast.tsx`
- `src/components/ui/ToastContainer.tsx`

```typescript
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;  // ms, 0 = persistent
}
```

**Features**:
- Auto-dismiss (default 5s)
- Color-coded by type
- Close button
- Stacking (max 5 visible)
- Slide-in animation

**Usage**:
```typescript
import { useToastStore } from '@/src/stores/toastStore';

const { addToast } = useToastStore();

addToast({
  type: 'success',
  message: 'Cover letter generated!',
  duration: 3000
});
```

---

## Error Boundaries

**Location**: `src/components/errors/`

### ErrorBoundary.tsx

**File**: `src/components/errors/ErrorBoundary.tsx`

**Purpose**: Global error catcher for React components

**Features**:
- Catches JavaScript errors in component tree
- Displays fallback UI
- Logs error to logger
- "Try Again" button
- "Go to Dashboard" button

**Wraps**: Entire application in `app/layout.tsx`

---

### FeatureErrorBoundary.tsx

**File**: `src/components/errors/FeatureErrorBoundary.tsx`

**Purpose**: Feature-specific error handling

**Features**:
- Isolates errors to feature module
- Doesn't crash entire app
- Custom fallback per feature
- Automatic error reporting

**Wraps**: Individual feature components

---

## Component Patterns

### Naming Conventions

**Components**:
- PascalCase: `ComponentName.tsx`
- Descriptive: `CoverLetterDisplay.tsx` not `CLDisplay.tsx`

**Props Interfaces**:
```typescript
interface ComponentNameProps {
  // Props here
}
```

**File Structure**:
```typescript
// 1. Imports
import { useState } from 'react';
import type { ComponentProps } from './types';

// 2. Type definitions
interface MyComponentProps {
  title: string;
}

// 3. Component
export function MyComponent({ title }: MyComponentProps) {
  // Hooks
  const [state, setState] = useState();

  // Handlers
  const handleClick = () => {
    // Logic
  };

  // Render
  return <div>...</div>;
}

// 4. Default export (optional)
export default MyComponent;
```

---

### Performance Patterns

**Memoization**:
```typescript
import { memo } from 'react';

export const JobCard = memo(({ job }: JobCardProps) => {
  // Expensive render
});
```

**Callback Memoization**:
```typescript
const handleClick = useCallback(() => {
  // Handler logic
}, [dependency]);
```

**Lazy Loading**:
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

---

### Accessibility Patterns

**Semantic HTML**:
```tsx
<button type="button" onClick={handleClick}>
  Click Me
</button>
// NOT: <div onClick={handleClick}>Click Me</div>
```

**ARIA Labels**:
```tsx
<input
  type="text"
  aria-label="Job title"
  aria-required="true"
  aria-invalid={hasError}
/>
```

**Keyboard Navigation**:
```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
```

---

### State Management in Components

**Local State** (useState):
```typescript
const [isOpen, setIsOpen] = useState(false);
```

**Form State**:
```typescript
const [formData, setFormData] = useState({
  title: '',
  company: ''
});

const handleChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

**Zustand Store**:
```typescript
import { useJobStore } from '@/src/stores/jobStore';

const { jobs, addJob } = useJobStore();
```

**Server Actions**:
```typescript
import { generateCoverLetter } from '@/src/domains/intelligence/actions';

const handleGenerate = async () => {
  setLoading(true);
  try {
    const result = await generateCoverLetter(...);
    setCoverLetter(result);
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

### Error Handling in Components

**Try-Catch Pattern**:
```typescript
const handleAction = async () => {
  try {
    await serverAction();
    toast.success('Success!');
  } catch (error) {
    toast.error(error.message || 'Something went wrong');
    logger.error('Action failed', error, { component: 'MyComponent' });
  }
};
```

**Error State**:
```typescript
const [error, setError] = useState<string | null>(null);

// Clear error on retry
const handleRetry = () => {
  setError(null);
  performAction();
};

// Display error
{error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
```

---

## Styling

### Tailwind CSS Classes

**Common Patterns**:
```tsx
// Container
<div className="container mx-auto px-4">

// Card
<div className="bg-white rounded-lg shadow-md p-6">

// Button
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Dark mode (if implemented)
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

---

## Component Testing

**Vitest + React Testing Library** (planned):

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
```

---

## Adding New Components

### Checklist

1. **Determine location**:
   - Layout component? → `src/components/layout/`
   - Feature-specific? → `src/components/features/{feature}/`
   - Reusable UI? → `src/components/ui/core/`

2. **Create file**: `ComponentName.tsx`

3. **Define props interface**:
   ```typescript
   interface ComponentNameProps {
     // Props
   }
   ```

4. **Implement component**:
   - Follow naming conventions
   - Use TypeScript
   - Add accessibility attributes
   - Handle errors

5. **Export**:
   ```typescript
   export function ComponentName({ ...props }: ComponentNameProps) {
     // ...
   }
   ```

6. **Add to index** (if in UI primitives):
   ```typescript
   // src/components/ui/core/index.ts
   export { ComponentName } from './ComponentName';
   ```

7. **Write tests** (when test infrastructure ready)

8. **Update this documentation** if it's a core component

---

**See Also**:
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - Component layer in architecture
- [DOMAINS.md](./DOMAINS.md) - Business logic called by components
- [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) - State patterns

**Last Updated**: 2025-01-05
