import fs from 'fs'
import path from 'path'

const root = path.resolve(process.cwd())
const migDir = path.join(root, 'supabase', 'migrations')
const outMd = path.join(root, 'supabase', 'schema-docs.md')

const readSqlFiles = () =>
  fs.readdirSync(migDir)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => ({ name: f, content: fs.readFileSync(path.join(migDir, f), 'utf-8') }))

const parseTables = (sql) => {
  const tables = []
  const tableRegex = /create\s+table\s+if\s+not\s+exists\s+([^\s(]+)\s*\(([\s\S]*?)\);/gi
  let m
  while ((m = tableRegex.exec(sql))) {
    const fullName = m[1]
    const [schema, table] = fullName.includes('.') ? fullName.split('.') : ['public', fullName]
    const body = m[2]
    const cols = []
    const fks = []
    body
      .split(/\n/)
      .map((l) => l.trim().replace(/,$/, ''))
      .forEach((line) => {
        const fk = line.match(/references\s+([^\s(]+)\s*\(([^)]+)\)/i)
        if (fk) {
          fks.push({ references: fk[1], column: fk[2] })
          return
        }
        const col = line.match(/^([a-zA-Z_][\w]*)\s+([a-zA-Z_][\w() ]*)(.*)$/)
        if (col) {
          cols.push({ name: col[1], type: col[2].trim(), constraints: col[3].trim() })
        }
      })
    tables.push({ schema, table, columns: cols, foreignKeys: fks })
  }
  return tables
}

const parseIndexes = (sql) => {
  const idx = []
  const regex = /create\s+index\s+if\s+not\s+exists\s+([^\s]+)\s+on\s+([^\s(]+)\s*\(([^)]+)\)(?:\s+include\s*\(([^)]+)\))?(?:\s+where\s+([^\n;]+))?/gi
  let m
  while ((m = regex.exec(sql))) {
    idx.push({ name: m[1], table: m[2], columns: m[3], include: m[4] || null, where: m[5] || null })
  }
  return idx
}

const parsePolicies = (sql) => {
  const policies = []
  const regex = /create\s+policy\s+([^\s]+)\s+on\s+([^\s]+)[\s\S]*?(for\s+[^\s]+)[\s\S]*?(?:using\s*\(([\s\S]*?)\))?(?:[\s\S]*?with\s+check\s*\(([\s\S]*?)\))?/gi
  let m
  while ((m = regex.exec(sql))) {
    policies.push({ name: m[1], table: m[2], mode: m[3], using: (m[4]||'').trim(), check: (m[5]||'').trim() })
  }
  return policies
}

const parseFunctions = (sql) => {
  const funcs = []
  const regex = /create\s+or\s+replace\s+function\s+([^\s(]+)\s*\([^)]*\)\s*returns\s+[^\s]+\s+language\s+[^\s]+\s+as\s+\$\$([\s\S]*?)\$\$/gi
  let m
  while ((m = regex.exec(sql))) {
    funcs.push({ name: m[1], body: m[2].trim() })
  }
  return funcs
}

const parseTriggers = (sql) => {
  const triggers = []
  const regex = /create\s+trigger\s+([^\s]+)\s+(before|after)\s+([^\s]+)\s+on\s+([^\s]+)[\s\S]*?execute\s+function\s+([^\s(]+)\s*\(/gi
  let m
  while ((m = regex.exec(sql))) {
    triggers.push({ name: m[1], timing: m[2], event: m[3], table: m[4], func: m[5] })
  }
  return triggers
}

const files = readSqlFiles()
const migrations = files.map((f) => f.name).sort()
const currentVersion = migrations.filter((f) => !f.endsWith('.down.sql')).slice(-1)[0] || 'none'

const allSql = files.map((f) => f.content).join('\n\n')
const tables = parseTables(allSql)
const indexes = parseIndexes(allSql)
const policies = parsePolicies(allSql)
const functions = parseFunctions(allSql)
const triggers = parseTriggers(allSql)

let md = ''
md += `# Database Schema Documentation\n`
md += `\n- Current Version: \`${currentVersion}\`\n`
md += `- Migration Files:\n`
for (const m of migrations) md += `  - \`${m}\`\n`
md += `\n## Tables\n`
for (const t of tables) {
  md += `\n### ${t.schema}.${t.table}\n`
  md += `- Columns:\n`
  for (const c of t.columns) md += `  - \`${c.name}\` \`${c.type}\` ${c.constraints ? c.constraints : ''}\n`
  if (t.foreignKeys.length) {
    md += `- Foreign Keys:\n`
    for (const fk of t.foreignKeys) md += `  - \`${fk.column}\` references \`${fk.references}\`\n`
  }
}
md += `\n## Indexes\n`
for (const i of indexes) {
  md += `- \`${i.name}\` on \`${i.table}\` (\`${i.columns}\`)`
  if (i.include) md += ` include (\`${i.include}\`)`
  if (i.where) md += ` where ${i.where}`
  md += `\n`
}
md += `\n## RLS Policies\n`
for (const p of policies) {
  md += `- \`${p.name}\` on \`${p.table}\` (${p.mode})\n`
  if (p.using) md += `  - using: ${p.using}\n`
  if (p.check) md += `  - with check: ${p.check}\n`
}
md += `\n## Triggers\n`
for (const t of triggers) {
  md += `- \`${t.name}\` ${t.timing.toUpperCase()} ${t.event.toUpperCase()} on \`${t.table}\` executes \`${t.func}\`\n`
}
md += `\n## Functions (Trigger Sources)\n`
for (const f of functions) {
  md += `\n### ${f.name}\n`
  md += `\n\`\`\`sql\n${f.body}\n\`\`\`\n`
}
md += `\n## Dependency Graph\n`
md += `- Triggers → Functions → Tables\n`
for (const t of triggers) {
  md += `  - Trigger \`${t.name}\` → Function \`${t.func}\` → Table \`${t.table}\`\n`
}
md += `\n## Execution Context\n`
for (const t of triggers) {
  md += `- \`${t.name}\`: executes ${t.timing.toUpperCase()} ${t.event.toUpperCase()} per row on \`${t.table}\`\n`
}
md += `\n## Sample Audit Trails\n`
md += `- Approvals/Denials recorded in \`public.audit_logs\` with action and metadata.\n`
md += `- Policy enforcement: owner-only RLS ensures \`user_id = auth.uid()\` on CRUD operations.\n`

fs.writeFileSync(outMd, md, 'utf-8')
console.log(`Schema docs written to ${outMd}`)
