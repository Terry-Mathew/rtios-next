# Documentation Hub

**rtios-next** - Complete documentation index

**Last Updated**: 2025-01-05

---

## 📚 Documentation Structure

```
docs/
├── README.md (this file)                      # Documentation hub
├
├── architecture/                               # 🏗️ Codebase architecture reference
│   ├── 00_INDEX.md                            # Architecture docs index
│   ├── ARCHITECTURE_OVERVIEW.md               # Start here - tech stack, patterns
│   ├── DOMAINS.md                             # Business logic organization
│   ├── COMPONENTS.md                          # (To be created)
│   ├── DATABASE.md                            # (To be created)
│   ├── API_REFERENCE.md                       # (To be created)
│   ├── STATE_MANAGEMENT.md                    # (To be created)
│   ├── AUTHENTICATION.md                      # (To be created)
│   └── UTILITIES.md                           # (To be created)
│
├── fixes/                                     # 🔧 Production readiness fixes
│   ├── INCREMENTAL_FIX_PLAN.md               # Full 4-phase roadmap (6-8 weeks)
│   ├── QUICK_FIX_REFERENCE.md                # Critical 2-week fixes
│   ├── GETTING_STARTED_WITH_FIXES.md         # How to start fixing
│   └── ENVIRONMENT_VARIABLES_GUIDE.md        # Env var reference
│
├── security/                                  # 🛡️ Security documentation
│   ├── SECURITY_AUDIT_REPORT.md              # Comprehensive security analysis
│   ├── THREAT_MODEL.md                       # Data flow and STRIDE analysis
│   └── SECRETS_ROTATION.md                   # Operational procedures
│
├── operations/                                # 📋 Operational guides
│   ├── IMPLEMENTATION_PATTERNS.md            # Reusable patterns
│   └── codebase.md                           # Project context
│
└── skills/                                    # 🎓 Documentation tools
    ├── skills.md                             # Overview
    ├── doc-templates.md                      # Templates for new docs
    └── scripts/validate_docs.py              # Doc validation script
```

---

## 🎯 Quick Navigation

### I want to...

| Goal | Go To |
|------|-------|
| Understand the project architecture | [architecture/ARCHITECTURE_OVERVIEW.md](./architecture/ARCHITECTURE_OVERVIEW.md) |
| Learn about business logic | [architecture/DOMAINS.md](./architecture/DOMAINS.md) |
| Fix critical production issues | [fixes/GETTING_STARTED_WITH_FIXES.md](./fixes/GETTING_STARTED_WITH_FIXES.md) |
| See 2-week critical fixes | [fixes/QUICK_FIX_REFERENCE.md](./fixes/QUICK_FIX_REFERENCE.md) |
| Understand security posture | [security/SECURITY_AUDIT_REPORT.md](./security/SECURITY_AUDIT_REPORT.md) |
| Set up environment variables | [fixes/ENVIRONMENT_VARIABLES_GUIDE.md](./fixes/ENVIRONMENT_VARIABLES_GUIDE.md) |
| Create new documentation | [skills/doc-templates.md](./skills/doc-templates.md) |

---

## 📖 Documentation Categories

### 1. Architecture Reference (`architecture/`)

**Purpose**: Technical reference for developers

**When to use**:
- Starting on the project
- Adding new features
- Understanding existing code
- Debugging issues

**Key files**:
- `ARCHITECTURE_OVERVIEW.md` ⭐ **Start here**
- `DOMAINS.md` - Business logic
- `DATABASE.md` - Schema reference (to be created)
- `API_REFERENCE.md` - Server Actions (to be created)

---

### 2. Production Fixes (`fixes/`)

**Purpose**: Roadmap to production readiness

**When to use**:
- Preparing for launch
- Improving scalability
- Addressing technical debt

**Key files**:
- `GETTING_STARTED_WITH_FIXES.md` ⭐ **Start here**
- `QUICK_FIX_REFERENCE.md` - 2-week critical path
- `INCREMENTAL_FIX_PLAN.md` - Full 4-phase plan
- `ENVIRONMENT_VARIABLES_GUIDE.md` - Env var reference

**Current Status**: 65% production-ready
**After 2-week fixes**: 80% production-ready

---

### 3. Security (`security/`)

**Purpose**: Security analysis and procedures

**When to use**:
- Security reviews
- Incident response
- Compliance audits
- Key rotation

**Key files**:
- `SECURITY_AUDIT_REPORT.md` - Comprehensive analysis
- `THREAT_MODEL.md` - Data flows and threats
- `SECRETS_ROTATION.md` - Key rotation procedures

---

### 4. Operations (`operations/`)

**Purpose**: Operational knowledge and patterns

**When to use**:
- Implementing new features
- Following code patterns
- Understanding project history

**Key files**:
- `IMPLEMENTATION_PATTERNS.md` - Reusable patterns
- `codebase.md` - Project context and changelog

---

### 5. Documentation Tools (`skills/`)

**Purpose**: Tools for maintaining documentation

**When to use**:
- Creating new documentation
- Validating existing docs
- Following documentation standards

**Key files**:
- `doc-templates.md` - Templates (API, Feature, Runbook, etc.)
- `scripts/validate_docs.py` - Automated validation

---

## 🚀 Getting Started

### For New Developers

**Day 1** (2 hours):
1. Read `architecture/ARCHITECTURE_OVERVIEW.md` (30 min)
2. Skim `architecture/DOMAINS.md` (20 min)
3. Set up local environment (30 min)
   - Copy `.env.example` to `.env.local`
   - Fill in API keys
   - Run `npm install && npm run dev`
4. Explore the codebase (40 min)

**Week 1**:
- Build a small feature
- Reference `architecture/` docs
- Ask questions about unclear areas
- Update docs if you find issues

---

### For Feature Development

**Before coding**:
1. Check relevant domain in `architecture/DOMAINS.md`
2. Review database schema in `architecture/DATABASE.md` (when created)
3. Check existing patterns in `operations/IMPLEMENTATION_PATTERNS.md`

**During development**:
- Follow architecture patterns
- Use Server Actions for AI operations
- Implement optimistic updates
- Add error handling

**After completion**:
- Update relevant documentation
- Add tests
- Create PR with doc updates

---

### For Fixing Issues

**Bug fixes**:
1. Reproduce issue
2. Check component in `architecture/COMPONENTS.md` (when created)
3. Trace to domain logic in `architecture/DOMAINS.md`
4. Check database schema if data-related
5. Fix and test
6. Update docs if architecture changed

**Production issues**:
1. Check `fixes/GETTING_STARTED_WITH_FIXES.md`
2. Prioritize based on severity
3. Follow fix guides
4. Deploy incrementally
5. Monitor

---

## 📝 Documentation Standards

### When to Update Docs

**Always update** when:
- Adding/removing features
- Changing architecture
- Modifying database schema
- Adding new domains
- Changing API contracts

**Consider updating** when:
- Fixing bugs that reveal unclear docs
- Adding helpful examples
- Finding outdated information

### How to Update

1. Edit the relevant markdown file
2. Update "Last Updated" date
3. Test code examples
4. Run validation:
   ```bash
   python skills/scripts/validate_docs.py
   ```
5. Commit with doc changes in same PR as code

### Creating New Docs

1. Choose template from `skills/doc-templates.md`
2. Copy template
3. Fill in content
4. Validate:
   ```bash
   python skills/scripts/validate_docs.py path/to/new/doc.md
   ```
5. Add to relevant index
6. Update this README if needed

---

## 🔍 Finding Information

### Search Tips

**By File Type**:
```bash
# Find all TypeScript files in a domain
ls src/domains/intelligence/**/*.ts

# Find all components
ls src/components/**/*.tsx
```

**By Content**:
```bash
# Find server actions
grep -r "use server" src/

# Find database queries
grep -r "from('jobs')" src/

# Find environment variables
grep -r "process.env" src/
```

**By Documentation**:
- Use `Ctrl+F` in browser when viewing docs on GitHub
- Search doc titles in VS Code
- Use the index files (`00_INDEX.md`, this `README.md`)

---

## ⚙️ Documentation Tools

### Validation Script

**Run**:
```bash
# Validate all docs
python skills/scripts/validate_docs.py

# Validate specific file
python skills/scripts/validate_docs.py docs/architecture/DOMAINS.md

# Validate specific folder
python skills/scripts/validate_docs.py docs/architecture/
```

**Checks for**:
- Broken internal links
- Missing required sections
- Outdated timestamps (>6 months)
- Referenced code files that don't exist
- TODO markers

---

## 📊 Documentation Status

| Category | Files Created | Files Planned | Status |
|----------|---------------|---------------|--------|
| Architecture | 3 of 9 | 6 remaining | 🟡 In Progress |
| Fixes | 4 of 4 | Complete | ✅ Done |
| Security | 3 of 3 | Complete | ✅ Done |
| Operations | 2 of 2 | Complete | ✅ Done |
| Skills | 3 of 3 | Complete | ✅ Done |

**Next Steps**:
- Create remaining architecture docs (COMPONENTS, DATABASE, API_REFERENCE, etc.)
- Add diagrams for complex flows
- Create video walkthroughs (optional)

---

## 🤝 Contributing to Docs

### Reporting Issues

If you find:
- Incorrect information
- Broken links
- Unclear explanations
- Missing documentation

**Create an issue** or **submit a PR** with fixes.

### Suggesting Improvements

We welcome:
- Better examples
- Clearer explanations
- Additional diagrams
- FAQ sections

---

## 📞 Support

### Documentation Questions
- Check this README first
- Search existing docs
- Check `architecture/00_INDEX.md` for quick reference

### Code Questions
- Read relevant architecture docs
- Check `operations/IMPLEMENTATION_PATTERNS.md`
- Review similar existing code

### Production Issues
- See `fixes/GETTING_STARTED_WITH_FIXES.md`
- Check `security/SECURITY_AUDIT_REPORT.md` for known issues

---

## 🎓 Learning Path

### Week 1: Fundamentals
- [ ] Read ARCHITECTURE_OVERVIEW.md
- [ ] Read DOMAINS.md
- [ ] Set up local environment
- [ ] Run the application locally

### Week 2: Deep Dive
- [ ] Read DATABASE.md (when created)
- [ ] Read API_REFERENCE.md (when created)
- [ ] Build a small feature
- [ ] Write tests for your feature

### Week 3: Production Knowledge
- [ ] Read SECURITY_AUDIT_REPORT.md
- [ ] Review INCREMENTAL_FIX_PLAN.md
- [ ] Understand deployment process
- [ ] Practice fixing a production issue

### Week 4: Mastery
- [ ] Contribute to documentation
- [ ] Implement a medium-sized feature
- [ ] Review others' code
- [ ] Help onboard new developers

---

## 📚 External Resources

### Technologies
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Best Practices
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Server Actions in Next.js](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated**: 2025-01-05
**Maintained By**: Development Team
**Review Cycle**: After major changes or quarterly
**Next Review**: 2025-04-05
