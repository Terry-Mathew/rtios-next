# Documentation Templates

Standardized templates for all project documentation.

---

## Template 1: Feature Specification

```markdown
# [Feature Name]

**Status**: [Draft | In Progress | Complete | Deprecated]
**Owner**: [Team/Person]
**Last Updated**: YYYY-MM-DD

---

## Overview

Brief description of the feature (2-3 sentences).

**Goal**: What problem does this solve?
**Non-goals**: What is explicitly out of scope?

---

## User Stories

- As a [user type], I want to [action], so that [benefit]
- As a [user type], I want to [action], so that [benefit]

---

## Technical Design

### Architecture

[Diagram or description of how it works]

### Data Model

```sql
-- Database schema changes if any
CREATE TABLE example (...);
```

### API Design

```typescript
// New functions/endpoints
export async function featureName(params: Params): Promise<Result> {
  // Implementation
}
```

---

## Implementation Plan

1. [ ] Task 1
2. [ ] Task 2
3. [ ] Task 3

**Estimated Timeline**: X weeks

---

## Testing Strategy

- **Unit tests**: What to test
- **Integration tests**: What to test
- **E2E tests**: What to test

---

## Rollout Plan

1. Deploy to staging
2. Internal testing (2 days)
3. Beta users (1 week)
4. Full rollout

---

## Monitoring & Success Metrics

- Metric 1: Target value
- Metric 2: Target value

---

## Rollback Plan

If the feature causes issues:
1. Step to disable feature
2. Step to rollback database
3. Communication plan

---

## Questions & Decisions

| Question | Decision | Rationale | Date |
|----------|----------|-----------|------|
| How to handle X? | Option A | Because... | 2025-01-05 |

---

**Document Version**: 1.0
**Review Date**: YYYY-MM-DD
```

---

## Template 2: API Documentation

```markdown
# [API Name] API Documentation

**Version**: v1
**Base URL**: `/api/v1/...`
**Authentication**: Required | Optional | None

---

## Overview

What this API does and who should use it.

---

## Authentication

```typescript
// How to authenticate
const headers = {
  'Authorization': 'Bearer YOUR_TOKEN'
};
```

---

## Endpoints

### GET /endpoint

**Description**: What this endpoint does

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| id | string | Yes | User ID |
| limit | number | No | Max results (default: 10) |

**Request Example**:
```bash
curl -X GET "https://api.example.com/endpoint?id=123&limit=20" \
  -H "Authorization: Bearer TOKEN"
```

**Response Example**:
```json
{
  "data": [...],
  "total": 42,
  "page": 1
}
```

**Error Responses**:
| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | INVALID_PARAM | Parameter validation failed |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 429 | RATE_LIMIT | Too many requests |

---

### POST /endpoint

[Same structure as above]

---

## Rate Limiting

- **Limit**: X requests per hour
- **Headers**:
  - `X-RateLimit-Limit`: Total allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## Error Handling

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {...}
  }
}
```

---

## Changelog

### v1.1.0 (2025-01-15)
- Added new endpoint `/new`
- Deprecated parameter `old_param`

### v1.0.0 (2025-01-01)
- Initial release

---

**Maintained By**: API Team
**Support**: api-support@example.com
```

---

## Template 3: Runbook

```markdown
# [Service/Feature] Runbook

**Service**: [Name]
**On-call Contact**: [Team/Person]
**Last Updated**: YYYY-MM-DD

---

## Overview

What this service does and its criticality level.

**Criticality**: [Critical | High | Medium | Low]
**Dependencies**: Service A, Database B, External API C

---

## Common Issues

### Issue: [Description]

**Symptoms**:
- Error message X
- Metric Y drops
- Users report Z

**Diagnosis**:
```bash
# Commands to run
kubectl logs pod-name
curl https://healthcheck
```

**Resolution**:
```bash
# Steps to fix
kubectl restart deployment/service
```

**Prevention**:
How to prevent this in the future.

---

### Issue: [Another Issue]

[Same structure]

---

## Monitoring & Alerts

**Dashboard**: [URL]

**Key Metrics**:
| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Response time | <200ms | <500ms | >500ms |
| Error rate | <1% | <5% | >5% |

**Alerts**:
- **High error rate**: Page on-call immediately
- **Slow response**: Investigate within 1 hour

---

## Emergency Procedures

### Full Outage

1. Acknowledge incident in PagerDuty
2. Post in #incidents Slack channel
3. Run diagnostic commands (see above)
4. Follow resolution steps
5. Post-mortem within 48 hours

### Data Loss

1. Stop all writes immediately
2. Check backup status
3. Notify stakeholders
4. Restore from backup (see below)

---

## Backup & Restore

### Create Backup
```bash
pg_dump database > backup.sql
```

### Restore from Backup
```bash
psql database < backup.sql
```

**Backup Schedule**: Daily at 2 AM UTC
**Retention**: 30 days
**Last Tested**: YYYY-MM-DD

---

## Deployment

**Normal Deployment**:
```bash
git checkout main
git pull
npm run build
vercel --prod
```

**Rollback**:
```bash
vercel rollback
```

**Smoke Tests** (after deployment):
1. Check /health endpoint
2. Login as test user
3. Run critical user journey

---

## Contact Information

- **On-call Engineer**: [Name/PagerDuty]
- **Team Slack**: #team-channel
- **Escalation**: [Manager name]

---

**Document Version**: 1.0
**Review Cycle**: Monthly
```

---

## Template 4: Architecture Decision Record (ADR)

```markdown
# ADR-NNN: [Short Title]

**Status**: [Proposed | Accepted | Deprecated | Superseded by ADR-XXX]
**Date**: YYYY-MM-DD
**Deciders**: [Names]

---

## Context

What is the issue we're facing that motivates this decision?

**Background**:
- Current situation
- Constraints
- Requirements

---

## Decision

We will [decision statement].

**Rationale**:
Why we chose this option over alternatives.

---

## Alternatives Considered

### Option 1: [Name]

**Pros**:
- Advantage 1
- Advantage 2

**Cons**:
- Disadvantage 1
- Disadvantage 2

**Why not chosen**: Reason

---

### Option 2: [Name]

[Same structure]

---

## Consequences

### Positive
- Benefit 1
- Benefit 2

### Negative
- Trade-off 1
- Trade-off 2

### Neutral
- Change 1
- Change 2

---

## Implementation

**Action Items**:
1. [ ] Task 1
2. [ ] Task 2

**Timeline**: X weeks

**Success Criteria**:
- Metric 1 improves by X%
- No increase in errors

---

## References

- [Link to related ADRs]
- [Link to design docs]
- [External resources]

---

**Supersedes**: ADR-XXX (if applicable)
**Superseded by**: ADR-YYY (if deprecated)
```

---

## Template 5: Incident Post-Mortem

```markdown
# Post-Mortem: [Incident Title]

**Date**: YYYY-MM-DD
**Duration**: X hours
**Severity**: [SEV-1 | SEV-2 | SEV-3]
**Incident Lead**: [Name]

---

## Summary

One-paragraph summary of what happened.

**Impact**:
- X users affected
- Y% error rate increase
- $Z revenue impact (if applicable)

---

## Timeline (UTC)

| Time | Event |
|------|-------|
| 10:00 | Issue detected by monitoring |
| 10:05 | On-call engineer paged |
| 10:15 | Root cause identified |
| 10:30 | Fix deployed |
| 10:45 | Service restored |
| 11:00 | All-clear declared |

---

## Root Cause

Detailed explanation of what went wrong and why.

**Technical Details**:
```
Error message or relevant code
```

**Contributing Factors**:
1. Factor 1
2. Factor 2

---

## Resolution

What we did to fix it.

**Immediate Fix**:
```bash
# Commands run
```

**Long-term Fix**:
What needs to be done to prevent recurrence.

---

## What Went Well

- Detection was fast (5 minutes)
- Team responded quickly
- Communication was clear

---

## What Went Wrong

- Monitoring didn't catch it earlier
- Deployment lacked proper testing
- Rollback took too long

---

## Action Items

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add integration test | @dev1 | 2025-01-15 | ✅ Done |
| Improve monitoring | @dev2 | 2025-01-20 | 🔄 In Progress |
| Update runbook | @dev3 | 2025-01-10 | ⏳ Pending |

---

## Lessons Learned

1. Lesson 1
2. Lesson 2
3. Lesson 3

---

**Reviewed By**: [Team]
**Review Date**: YYYY-MM-DD
```

---

## Template 6: Database Migration

```markdown
# Migration: [Description]

**Migration ID**: YYYYMMDD_description
**Created**: YYYY-MM-DD
**Applied**: [Date] | Not yet applied
**Rollback Available**: Yes | No

---

## Purpose

Why this migration is needed.

---

## Changes

### Tables Affected
- `users`: Add column `new_field`
- `jobs`: Add index on `user_id`

### Data Impact
- Rows affected: ~X rows
- Estimated duration: Y minutes
- Downtime required: Yes | No

---

## Migration SQL

```sql
-- Up migration
ALTER TABLE users ADD COLUMN new_field TEXT DEFAULT NULL;
CREATE INDEX idx_jobs_user_id ON jobs(user_id);

-- Update existing data if needed
UPDATE users SET new_field = 'default_value' WHERE new_field IS NULL;
```

---

## Rollback SQL

```sql
-- Down migration
DROP INDEX idx_jobs_user_id;
ALTER TABLE users DROP COLUMN new_field;
```

---

## Testing

**Pre-migration checks**:
```bash
# Verify backup exists
# Check table sizes
SELECT pg_size_pretty(pg_total_relation_size('users'));
```

**Post-migration validation**:
```sql
-- Verify changes applied
\d users
\di  -- List indexes
```

---

## Deployment Plan

1. **Backup database**
   ```bash
   pg_dump database > backup_before_migration.sql
   ```

2. **Apply in staging**
   ```bash
   supabase db push --environment staging
   ```

3. **Verify staging**
   - Run smoke tests
   - Check data integrity

4. **Apply in production**
   ```bash
   supabase db push --environment production
   ```

5. **Monitor**
   - Check error rates
   - Verify query performance

---

## Rollback Plan

If issues occur:
```bash
# Stop application writes
# Restore from backup
psql database < backup_before_migration.sql
# OR run rollback SQL above
```

---

## Dependencies

**Code Changes**:
- PR #123 must be merged first
- Update `.env` with new variable

**Other Migrations**:
- Depends on: YYYYMMDD_previous_migration
- Blocks: YYYYMMDD_future_migration

---

**Reviewed By**: [DBA/Lead Developer]
**Approved**: [Date]
```

---

## Usage Guidelines

### Choosing a Template

| Documentation Type | Use Template |
|--------------------|--------------|
| New feature | Feature Specification |
| API/Server Action | API Documentation |
| Operational guide | Runbook |
| Technical decision | ADR |
| Outage analysis | Post-Mortem |
| Database change | Database Migration |

### Customization

- Remove sections that don't apply
- Add sections specific to your context
- Keep the overall structure

### Storage

- Feature specs: `docs/features/`
- ADRs: `docs/adr/`
- Runbooks: `docs/runbooks/`
- Post-mortems: `docs/incidents/`
- Migrations: `supabase/migrations/` (SQL) + `docs/migrations/` (docs)

---

**Maintained By**: Documentation Team
**Last Updated**: 2025-01-05
