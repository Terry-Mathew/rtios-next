# Bolt's Journal

## 2025-01-29 - React Memoization on Toast Component
**Learning:** Even simple components like `Toast` can benefit from memoization when rendered in a list that updates frequently (e.g., adding/removing toasts). `ToastContainer` re-renders on any toast change, causing all `Toast` components to re-render. Memoization prevents this cascade for unchanged toasts.
**Action:** Look for list renderings where the parent state updates frequently and the child components are relatively expensive or numerous. `React.memo` is a cheap insurance policy here.
