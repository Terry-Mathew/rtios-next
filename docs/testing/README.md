# Testing Documentation

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test src/utils/supabase/server.test.ts
```

## Documentation Files

### 1. [COMPREHENSIVE_TESTING_GUIDE.md](./COMPREHENSIVE_TESTING_GUIDE.md)
**Complete testing documentation including:**
- Automated testing setup and procedures
- Manual testing checklists for Week 1 fixes
- Pre-deployment and post-deployment verification
- Troubleshooting guide
- Test data setup instructions

**Use this when:**
- You need detailed testing procedures
- Setting up testing for the first time
- Training new team members
- Investigating test failures

### 2. [QUICK_TEST_CHECKLIST.md](./QUICK_TEST_CHECKLIST.md)
**Fast reference checklist for deployment testing**

**Use this when:**
- You're about to deploy to production
- You need a quick verification checklist
- You want to verify Week 1 fixes quickly

## Test Structure

```
rtios-next/
├── src/
│   ├── test/
│   │   └── setup.ts              # Test configuration and mocks
│   └── utils/
│       ├── fileUtils.test.ts     # Utility tests
│       ├── validation.test.ts    # Validation tests
│       └── supabase/
│           └── server.test.ts    # Admin auth security tests ⚠️ CRITICAL
├── app/
│   └── api/
│       └── admin/
│           ├── users/delete/
│           │   └── route.test.ts # Audit log tests ⚠️ CRITICAL
│           └── impersonate/
│               └── route.test.ts # Audit log tests ⚠️ CRITICAL
└── vitest.config.ts              # Vitest configuration
```

## Test Coverage

### Critical Security Tests ⚠️

These tests verify Week 1 security fixes:

1. **Admin Authentication** (`server.test.ts`)
   - Prevents privilege escalation
   - Ensures role verification uses service role client
   - **If these fail:** DO NOT DEPLOY

2. **Audit Log Error Handling** (`route.test.ts` files)
   - Ensures operations abort when audit fails
   - Guarantees compliance (GDPR, SOC2)
   - **If these fail:** DO NOT DEPLOY

### Current Test Count

```
✓ Admin Authentication: 6 tests
✓ Audit Log Handling: 10 tests (2 routes × 5 tests each)
✓ Utility Functions: 7 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 23 tests
```

## Running Tests Before Deployment

**Required steps:**

1. **Run all tests:**
   ```bash
   npm test
   ```
   ✅ All 23 tests must pass

2. **Build test:**
   ```bash
   npm run build
   ```
   ✅ Must succeed with no errors

3. **Manual testing:**
   - Follow [QUICK_TEST_CHECKLIST.md](./QUICK_TEST_CHECKLIST.md)
   - Complete all pre-deployment checks

## Continuous Integration

### GitHub Actions (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

This will automatically run tests on every push and PR.

## Writing New Tests

### Test File Naming

- Unit tests: `[filename].test.ts`
- Integration tests: `[filename].test.ts`
- Place tests next to the file they test

### Test Structure Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { functionToTest } from './module';

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do expected behavior', () => {
    const result = functionToTest();
    expect(result).toBe(expectedValue);
  });

  it('should handle error case', () => {
    expect(() => functionToTest(badInput)).toThrow();
  });
});
```

### Security Test Guidelines

When testing admin/security features:

1. **Always test unauthorized access:**
   ```typescript
   it('should reject non-admin users', async () => {
     // Mock non-admin
     await expect(adminFunction()).rejects.toThrow('Forbidden');
   });
   ```

2. **Test critical failure paths:**
   ```typescript
   it('should abort operation if audit fails', async () => {
     // Mock audit failure
     // Verify operation aborted
     expect(logger.error).toHaveBeenCalledWith('CRITICAL: ...');
   });
   ```

3. **Verify security mechanisms:**
   ```typescript
   it('should use service role client for verification', async () => {
     await getAuthenticatedAdmin();
     expect(adminClient.from).toHaveBeenCalledWith('users');
   });
   ```

## Debugging Failed Tests

### Common Issues

**1. "Module not found" errors:**
```bash
# Check import paths use correct alias
# Should be: @/src/utils/... not ../../../src/utils/...
```

**2. "Cannot find module '@testing-library/react'":**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

**3. Tests pass locally but fail in CI:**
- Check environment variables in CI config
- Verify Node version matches
- Clear npm cache: `npm ci` instead of `npm install`

### Verbose Output

For detailed error messages:
```bash
npm test -- --reporter=verbose
```

### Run Single Test

```bash
npm test -- -t "test name pattern"
```

Example:
```bash
npm test -- -t "should abort operation if audit fails"
```

## Test Environment

Tests use mocked environment variables (see `src/test/setup.ts`):

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
process.env.SUPABASE_SECRET_KEY = 'test-secret-key';
```

**Important:** Tests never touch real databases or production services.

## Coverage Reports

After running `npm test -- --coverage`:

```
File                          | % Stmts | % Branch | % Funcs | % Lines
------------------------------|---------|----------|---------|--------
All files                     |   85.2  |   78.4   |   82.1  |   85.7
 src/utils                    |   92.3  |   88.9   |   90.0  |   92.8
 src/utils/supabase           |   78.5  |   70.2   |   75.0  |   79.1
 app/api/admin                |   81.4  |   73.6   |   80.0  |   82.3
```

**Target coverage:** >80% for critical security code

## FAQ

### Q: Do I need to run tests before every commit?
**A:** Yes, or set up a pre-commit hook:
```bash
# .husky/pre-commit
npm test
```

### Q: How long do tests take?
**A:** Full suite runs in ~5 seconds locally

### Q: Can I skip tests for small changes?
**A:** No. Even small changes can have security implications.

### Q: What if a test is flaky?
**A:** Investigate and fix immediately. Flaky tests hide real bugs.

### Q: Should I write tests for bug fixes?
**A:** Always. Write a test that reproduces the bug, then fix it.

## Next Steps

1. **Read:** [COMPREHENSIVE_TESTING_GUIDE.md](./COMPREHENSIVE_TESTING_GUIDE.md)
2. **Before deployment:** Follow [QUICK_TEST_CHECKLIST.md](./QUICK_TEST_CHECKLIST.md)
3. **Add tests** for any new features
4. **Run tests** before every commit

## Support

If you encounter testing issues:

1. Check [Troubleshooting section](./COMPREHENSIVE_TESTING_GUIDE.md#troubleshooting) in comprehensive guide
2. Review test output for specific error messages
3. Verify environment variables are set correctly
4. Check that Supabase project is accessible

---

**Last Updated:** Week 1 Day 3
**Test Framework:** Vitest 4.0.16
**Testing Library:** React Testing Library 16.3.1
