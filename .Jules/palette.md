## 2024-05-23 - Input Accessibility Enhancement
**Learning:** Adding `aria-describedby` and `aria-invalid` to form inputs significantly improves the screen reader experience by explicitly associating error messages and helper text.
**Action:** When creating form components, always ensure helper text and error messages are programmatically linked to the input via IDs and `aria-describedby`, not just visually placed nearby.
