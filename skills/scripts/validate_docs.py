#!/usr/bin/env python3
"""
Documentation Validation Script

Validates markdown documentation for:
- Broken internal links
- Missing required sections
- Outdated timestamps
- Code examples referencing non-existent files

Usage:
    python skills/scripts/validate_docs.py                 # Validate all docs
    python skills/scripts/validate_docs.py path/to/doc.md  # Validate specific file
    python skills/scripts/validate_docs.py --fix           # Auto-fix issues where possible
"""

import os
import re
import sys
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Tuple, Set

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

class DocValidator:
    def __init__(self, project_root: Path, fix_mode: bool = False):
        self.project_root = project_root
        self.fix_mode = fix_mode
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.fixes_applied: List[str] = []

    def validate_file(self, doc_path: Path) -> Tuple[bool, List[str], List[str]]:
        """Validate a single documentation file"""
        print(f"\n{Colors.BLUE}Validating: {doc_path.relative_to(self.project_root)}{Colors.ENDC}")

        self.errors = []
        self.warnings = []
        self.fixes_applied = []

        if not doc_path.exists():
            self.errors.append(f"File does not exist: {doc_path}")
            return False, self.errors, self.warnings

        content = doc_path.read_text(encoding='utf-8')

        # Run all validation checks
        self._check_broken_links(doc_path, content)
        self._check_code_file_references(doc_path, content)
        self._check_last_updated(doc_path, content)
        self._check_required_sections(doc_path, content)
        self._check_todo_markers(content)

        # Print results
        if self.errors:
            print(f"  {Colors.RED}✗ {len(self.errors)} error(s){Colors.ENDC}")
            for error in self.errors:
                print(f"    {Colors.RED}• {error}{Colors.ENDC}")

        if self.warnings:
            print(f"  {Colors.YELLOW}⚠ {len(self.warnings)} warning(s){Colors.ENDC}")
            for warning in self.warnings:
                print(f"    {Colors.YELLOW}• {warning}{Colors.ENDC}")

        if self.fixes_applied:
            print(f"  {Colors.GREEN}✓ {len(self.fixes_applied)} fix(es) applied{Colors.ENDC}")
            for fix in self.fixes_applied:
                print(f"    {Colors.GREEN}• {fix}{Colors.ENDC}")

        if not self.errors and not self.warnings:
            print(f"  {Colors.GREEN}✓ All checks passed{Colors.ENDC}")

        return len(self.errors) == 0, self.errors, self.warnings

    def _check_broken_links(self, doc_path: Path, content: str):
        """Check for broken internal markdown links"""
        # Find all markdown links: [text](link)
        link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
        links = re.findall(link_pattern, content)

        for link_text, link_url in links:
            # Skip external URLs
            if link_url.startswith(('http://', 'https://', 'mailto:', '#')):
                continue

            # Resolve relative paths
            if link_url.startswith('/'):
                target_path = self.project_root / link_url.lstrip('/')
            else:
                target_path = (doc_path.parent / link_url).resolve()

            # Check if file exists
            if not target_path.exists():
                self.errors.append(
                    f"Broken link: [{link_text}]({link_url}) -> {target_path.relative_to(self.project_root)} not found"
                )

    def _check_code_file_references(self, doc_path: Path, content: str):
        """Check that referenced code files exist"""
        # Pattern: `file_path:line_number` or just `path/to/file.ts`
        file_patterns = [
            r'`([^`]+\.(ts|tsx|js|jsx|py|sql|md)):(\d+)`',  # With line numbers
            r'`(src/[^`]+\.(ts|tsx|js|jsx))`',  # Source files
            r'`(app/[^`]+\.(ts|tsx|js|jsx))`',  # App files
        ]

        for pattern in file_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                file_ref = match[0] if isinstance(match, tuple) else match

                # Handle Windows paths
                file_ref = file_ref.replace('\\', '/')

                # Skip if it's an example placeholder
                if any(placeholder in file_ref.lower() for placeholder in ['example', 'your-', 'xxx', '...']):
                    continue

                target_path = self.project_root / file_ref
                if not target_path.exists():
                    self.warnings.append(
                        f"Referenced file may not exist: {file_ref}"
                    )

    def _check_last_updated(self, doc_path: Path, content: str):
        """Check if Last Updated timestamp is recent"""
        # Find Last Updated patterns
        patterns = [
            r'\*\*Last Updated\*\*:\s*(\d{4}-\d{2}-\d{2})',
            r'Last Updated:\s*(\d{4}-\d{2}-\d{2})',
            r'Updated:\s*(\d{4}-\d{2}-\d{2})'
        ]

        last_updated = None
        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                last_updated = datetime.strptime(match.group(1), '%Y-%m-%d')
                break

        if last_updated:
            days_old = (datetime.now() - last_updated).days
            if days_old > 180:  # 6 months
                self.warnings.append(
                    f"Document hasn't been updated in {days_old} days (since {last_updated.strftime('%Y-%m-%d')})"
                )
        else:
            # Check if it's a template or example file
            if 'template' not in doc_path.name.lower():
                self.warnings.append("No 'Last Updated' timestamp found")

    def _check_required_sections(self, doc_path: Path, content: str):
        """Check for required sections based on document type"""
        # Skip templates
        if 'template' in doc_path.name.lower():
            return

        # Determine document type and required sections
        required_sections = []

        if 'runbook' in doc_path.name.lower() or 'RUNBOOK' in doc_path.name:
            required_sections = ['Overview', 'Common Issues', 'Monitoring']
        elif 'adr' in doc_path.name.lower() or doc_path.name.startswith('ADR'):
            required_sections = ['Context', 'Decision', 'Consequences']
        elif 'api' in doc_path.name.lower() or 'API' in doc_path.name:
            required_sections = ['Overview', 'Endpoints', 'Error Handling']

        # Check for each required section
        for section in required_sections:
            # Look for markdown headings with this section name
            pattern = rf'^#+\s+{section}'
            if not re.search(pattern, content, re.MULTILINE | re.IGNORECASE):
                self.errors.append(f"Missing required section: {section}")

    def _check_todo_markers(self, content: str):
        """Check for TODO/FIXME markers in documentation"""
        todo_pattern = r'(TODO|FIXME|XXX|HACK):\s*(.+)'
        todos = re.findall(todo_pattern, content)

        if todos:
            for marker, description in todos:
                self.warnings.append(
                    f"Found {marker}: {description[:50]}..."
                )

def find_all_docs(project_root: Path) -> List[Path]:
    """Find all markdown files in the project"""
    docs_dir = project_root / 'docs'
    skills_dir = project_root / 'skills'

    doc_files = []

    # Search in docs/ directory
    if docs_dir.exists():
        doc_files.extend(docs_dir.glob('**/*.md'))

    # Search in skills/ directory
    if skills_dir.exists():
        doc_files.extend(skills_dir.glob('**/*.md'))

    # Include root-level markdown files
    doc_files.extend(project_root.glob('*.md'))

    # Exclude node_modules and .next
    doc_files = [
        f for f in doc_files
        if 'node_modules' not in str(f) and '.next' not in str(f)
    ]

    return sorted(doc_files)

def main():
    """Main entry point"""
    # Determine project root (2 levels up from this script)
    script_path = Path(__file__).resolve()
    project_root = script_path.parent.parent.parent

    print(f"{Colors.BOLD}Documentation Validator{Colors.ENDC}")
    print(f"Project root: {project_root}\n")

    # Parse arguments
    fix_mode = '--fix' in sys.argv
    specific_file = None

    for arg in sys.argv[1:]:
        if arg != '--fix' and not arg.startswith('-'):
            specific_file = Path(arg)
            if not specific_file.is_absolute():
                specific_file = project_root / specific_file

    # Get files to validate
    if specific_file:
        doc_files = [specific_file]
    else:
        doc_files = find_all_docs(project_root)

    print(f"Found {len(doc_files)} documentation file(s) to validate")
    if fix_mode:
        print(f"{Colors.YELLOW}Fix mode enabled - will attempt to auto-fix issues{Colors.ENDC}")

    # Validate each file
    validator = DocValidator(project_root, fix_mode)
    total_errors = 0
    total_warnings = 0
    failed_files = []

    for doc_file in doc_files:
        success, errors, warnings = validator.validate_file(doc_file)
        total_errors += len(errors)
        total_warnings += len(warnings)

        if not success:
            failed_files.append(doc_file)

    # Print summary
    print(f"\n{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}Summary:{Colors.ENDC}")
    print(f"  Files validated: {len(doc_files)}")

    if failed_files:
        print(f"  {Colors.RED}Files with errors: {len(failed_files)}{Colors.ENDC}")
        print(f"  {Colors.RED}Total errors: {total_errors}{Colors.ENDC}")
    else:
        print(f"  {Colors.GREEN}All files passed validation{Colors.ENDC}")

    if total_warnings > 0:
        print(f"  {Colors.YELLOW}Total warnings: {total_warnings}{Colors.ENDC}")

    # Exit with appropriate code
    sys.exit(1 if failed_files else 0)

if __name__ == '__main__':
    main()
