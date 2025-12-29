# Architecture Documentation Index

**Purpose**: Comprehensive reference documentation for the rtios-next codebase
**Generated**: 2025-01-05
**Last Updated**: 2025-01-05

---

## 📚 Documentation Files

### Core Architecture
1. **[ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)** ⭐ Start here
   - Tech stack and versions
   - Folder structure
   - Architectural patterns
   - Layer interactions

### Deep Dives
2. **[COMPONENTS.md](./COMPONENTS.md)**
   - Component organization
   - UI primitives
   - Feature components
   - Layout components

3. **[DOMAINS.md](./DOMAINS.md)**
   - Domain-Driven Design structure
   - Intelligence domain (AI)
   - Jobs domain
   - Career domain
   - User domain

4. **[DATABASE.md](./DATABASE.md)**
   - Complete schema reference
   - Table relationships
   - RLS policies
   - Migration strategy

5. **[API_REFERENCE.md](./API_REFERENCE.md)**
   - Server Actions documentation
   - API routes
   - Authentication patterns
   - Rate limiting

6. **[STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)**
   - Zustand stores
   - State synchronization
   - Persistence strategy

7. **[AUTHENTICATION.md](./AUTHENTICATION.md)**
   - Auth flow
   - User roles
   - Permission checks
   - Admin access

8. **[UTILITIES.md](./UTILITIES.md)**
   - Logger
   - Validation
   - AI cache
   - File utilities

---

## 🎯 Quick Reference

### I need to understand...

| Topic | See File | Section |
|-------|----------|---------|
| Overall project structure | ARCHITECTURE_OVERVIEW.md | 1.2 |
| How AI generation works | DOMAINS.md | 3.1 Intelligence |
| Database schema | DATABASE.md | All sections |
| How to add a server action | API_REFERENCE.md | 5.1 |
| User authentication flow | AUTHENTICATION.md | 7.1 |
| State management patterns | STATE_MANAGEMENT.md | All sections |
| UI components | COMPONENTS.md | 2.1-2.3 |

### I need to add/modify...

| Task | Read These Docs |
|------|-----------------|
| New AI feature | DOMAINS.md (Intelligence) + API_REFERENCE.md |
| New UI component | COMPONENTS.md + ARCHITECTURE_OVERVIEW.md (patterns) |
| Database table | DATABASE.md (schema + RLS) |
| User role/permission | AUTHENTICATION.md |
| Admin feature | AUTHENTICATION.md + API_REFERENCE.md |
| State store | STATE_MANAGEMENT.md |

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                   │
│                    (app/ directory)                     │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬─────────────┐
        │            │            │             │
┌───────▼──────┐ ┌──▼────────┐ ┌─▼──────────┐ ┌▼────────┐
│  Components  │ │  Stores   │ │  Domains   │ │ Routes  │
│              │ │ (Zustand) │ │   (DDD)    │ │         │
└───────┬──────┘ └──┬────────┘ └─┬──────────┘ └┬────────┘
        │           │             │             │
        └───────────┴─────────────┴─────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
    ┌───────▼───────┐ ┌──▼──────┐ ┌────▼─────┐
    │   Supabase    │ │ Gemini  │ │ Services │
    │  (Database)   │ │   AI    │ │          │
    └───────────────┘ └─────────┘ └──────────┘
```

**Key Principles:**
- Domain-Driven Design (DDD)
- Server Actions for AI (security)
- Optimistic UI updates
- Row Level Security (RLS)

---

## 🔍 How to Use This Documentation

### For New Developers
1. Read `ARCHITECTURE_OVERVIEW.md` (30 min)
2. Skim `DOMAINS.md` to understand business logic (20 min)
3. Review `COMPONENTS.md` for UI patterns (15 min)
4. Keep `DATABASE.md` open for reference

### For Feature Development
1. Check relevant domain in `DOMAINS.md`
2. Review `API_REFERENCE.md` for server actions
3. Check `STATE_MANAGEMENT.md` for state patterns
4. Reference `COMPONENTS.md` for UI

### For Bug Fixes
1. Find component in `COMPONENTS.md`
2. Trace to domain logic in `DOMAINS.md`
3. Check database schema in `DATABASE.md`
4. Review auth flow in `AUTHENTICATION.md` if needed

### For Refactoring
1. Understand current architecture in all docs
2. Identify affected domains
3. Plan migration with architecture principles
4. Update documentation after changes

---

## 📝 Documentation Standards

### Accuracy
- All file paths verified
- Code examples tested
- Schema matches production
- Last updated dates maintained

### Format
- Markdown with tables
- Code blocks with syntax highlighting
- Clear section hierarchy
- Cross-references between docs

### Maintenance
- Update when code changes
- Review quarterly
- Version with major changes
- Keep examples current

---

## 🔄 Recent Updates

| Date | File | Change |
|------|------|--------|
| 2025-01-05 | All | Initial comprehensive documentation |

---

## 📞 Questions?

If documentation is unclear or outdated:
1. Check the file's "Last Updated" date
2. Verify against current codebase
3. Update documentation if needed
4. Add to "Recent Updates" above

---

**Maintained By**: Development Team
**Review Cycle**: Quarterly or after major changes
**Next Review**: 2025-04-05
