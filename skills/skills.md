# Skills - Documentation & Validation Scripts

This directory contains tools for maintaining code quality and documentation standards.

---

## 📁 Structure

```
skills/
├── skills.md              # This file - overview
├── doc-templates.md       # Templates for new documentation
└── scripts/
    └── validate_docs.py   # Documentation validation script
```

---

## 🎯 Purpose

The skills directory provides:
1. **Documentation templates** for consistency
2. **Validation scripts** to ensure docs stay up-to-date
3. **Best practices** for technical writing

---

## 📝 Documentation Templates

See `doc-templates.md` for templates including:
- API documentation
- Feature specifications
- Runbooks
- Architecture decision records (ADRs)

---

## 🔍 Validation Scripts

### `scripts/validate_docs.py`

Validates documentation files for:
- Broken internal links
- Missing required sections
- Outdated timestamps
- Code examples that reference non-existent files

**Usage**:
```bash
# Validate all docs
python skills/scripts/validate_docs.py

# Validate specific file
python skills/scripts/validate_docs.py docs/INCREMENTAL_FIX_PLAN.md

# Fix issues automatically (where possible)
python skills/scripts/validate_docs.py --fix
```

---

## 🚀 Quick Start

### Create New Documentation

1. Copy template from `doc-templates.md`
2. Fill in sections
3. Run validation:
   ```bash
   python skills/scripts/validate_docs.py docs/YOUR_NEW_DOC.md
   ```
4. Commit to Git

### Update Existing Documentation

1. Make changes
2. Update "Last Updated" timestamp
3. Run validation
4. Commit changes

---

## 📚 Current Documentation

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| `INCREMENTAL_FIX_PLAN.md` | Production readiness roadmap | 2025-01-05 |
| `QUICK_FIX_REFERENCE.md` | 2-week critical fix guide | 2025-01-05 |
| `ENVIRONMENT_VARIABLES_GUIDE.md` | Env var reference | 2025-01-05 |
| `SECURITY_AUDIT_REPORT.md` | Security analysis | Existing |
| `THREAT_MODEL.md` | Security architecture | Existing |
| `SECRETS_ROTATION.md` | Operational runbook | Existing |
| `IMPLEMENTATION_PATTERNS.md` | Code patterns | Existing |
| `codebase.md` | Project overview | Existing |

---

## 🛠️ Maintenance

### Weekly
- Run validation script
- Update outdated timestamps
- Check for broken links

### Monthly
- Review all documentation
- Archive outdated guides
- Update code examples

### Quarterly
- Full documentation audit
- Update templates based on learnings
- Consolidate redundant docs

---

## 📊 Documentation Standards

### File Naming
- Use `SCREAMING_SNAKE_CASE.md` for important docs
- Use `lowercase-with-dashes.md` for feature docs
- Include descriptive names (not `doc1.md`)

### Structure
- Start with executive summary
- Use clear headings hierarchy
- Include table of contents for long docs
- End with metadata (last updated, owner, etc.)

### Content
- Write for future developers unfamiliar with the codebase
- Include code examples where relevant
- Link to related documentation
- Keep it concise but complete

### Maintenance
- Update "Last Updated" on every change
- Use semantic versioning for major doc rewrites
- Archive outdated docs in `docs/archive/`

---

## 🎓 Best Practices

### DO ✅
- Keep docs close to code (`docs/` directory)
- Use markdown for all documentation
- Include runnable code examples
- Link to source files with line numbers
- Update docs in the same PR as code changes

### DON'T ❌
- Create docs in external tools (Notion, Google Docs)
- Write docs without examples
- Let docs get stale (>6 months without review)
- Duplicate information across multiple docs
- Use screenshots instead of code snippets

---

## 📞 Questions?

- **How to**: See `doc-templates.md`
- **Why this structure**: See `IMPLEMENTATION_PATTERNS.md`
- **Validation issues**: Run script with `--help` flag

---

**Maintained By**: Development Team
**Review Cycle**: Monthly
