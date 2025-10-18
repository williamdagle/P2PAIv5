#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

// Files to exclude (Login and UserMigration use different layout)
const excludeFiles = ['Login.tsx', 'UserMigration.tsx'];

const files = fs.readdirSync(pagesDir)
  .filter(f => f.endsWith('.tsx') && !f.includes('.backup') && !f.includes(' copy') && !excludeFiles.includes(f));

console.log(`\nProcessing ${files.length} page components...\n`);

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Step 1: Remove Sidebar and Layout imports
  content = content.replace(/import Sidebar from '\.\.\/components\/Sidebar';\n?/g, '');
  content = content.replace(/import Layout from '\.\.\/components\/Layout';\n?/g, '');

  // Step 2: Ensure useNavigate is imported
  if (!content.includes('useNavigate')) {
    // Check if react-router-dom import exists
    if (content.includes("from 'react-router-dom'")) {
      // Add useNavigate to existing import
      content = content.replace(
        /import \{([^}]+)\} from 'react-router-dom';/,
        (match, imports) => `import { ${imports.trim()}, useNavigate } from 'react-router-dom';`
      );
    } else {
      // Add new import after React imports
      content = content.replace(
        /(import .*from 'react';)/,
        "$1\nimport { useNavigate } from 'react-router-dom';"
      );
    }
  }

  // Step 3: Remove Props interface with onNavigate
  content = content.replace(
    /interface \w+Props\s*\{[\s\S]*?onNavigate:\s*\(page:\s*string\)\s*=>\s*void;[\s\S]*?\}\s*\n*/g,
    ''
  );

  // Step 4: Update component declaration - remove props
  content = content.replace(
    /const (\w+):\s*React\.FC<\w+Props>\s*=\s*\(\{\s*onNavigate\s*\}\)\s*=>\s*\{/g,
    'const $1: React.FC = () => {'
  );

  // Step 5: Add useNavigate hook after component declaration
  if (content.includes('onNavigate(') && !content.includes('const navigate = useNavigate();')) {
    content = content.replace(
      /(const \w+: React\.FC = \(\) => \{)(\n\s*const)/,
      '$1\n  const navigate = useNavigate();$2'
    );
    // If no other hooks, add it as first line
    if (!content.match(/(const \w+: React\.FC = \(\) => \{)(\n\s*const)/)) {
      content = content.replace(
        /(const \w+: React\.FC = \(\) => \{)/,
        '$1\n  const navigate = useNavigate();'
      );
    }
  }

  // Step 6: Remove Layout wrapper tags
  content = content.replace(/<Layout[^>]*>/g, '');
  content = content.replace(/<\/Layout>/g, '');

  // Step 7: Remove Sidebar component
  content = content.replace(/<Sidebar[^\/]*\/>/g, '');

  // Step 8: Replace onNavigate calls with navigate
  content = content.replace(/onNavigate\('Patients'\)/g, "navigate('/patients')");
  content = content.replace(/onNavigate\('PatientChart'\)/g, "navigate(`/patients/${row.id}/chart`)");
  content = content.replace(/onNavigate\('CreatePatient'\)/g, "navigate('/patients/create')");
  content = content.replace(/onNavigate\('Dashboard'\)/g, "navigate('/dashboard')");
  content = content.replace(/onNavigate\('Admin'\)/g, "navigate('/admin')");
  content = content.replace(/onNavigate\('CreateProviderNote'\)/g, "navigate('/notes/provider')");
  content = content.replace(/onNavigate\('CreateQuickNote'\)/g, "navigate('/notes/quick')");
  content = content.replace(/onNavigate\('Appointments'\)/g, "navigate('/appointments')");
  content = content.replace(/onNavigate\('TreatmentPlans'\)/g, "navigate('/treatment-plans')");

  // Step 9: Clean up malformed content from previous attempts
  // Remove any </div> at the start of file
  content = content.replace(/^\s*<\/div>\n/, '');

  // Remove duplicate closing divs before export
  const lines = content.split('\n');
  const exportIndex = lines.findIndex(l => l.includes('export default'));
  if (exportIndex > 0) {
    // Check for duplicate closing divs near the end
    let cleanedLines = [];
    let skipNext = false;
    for (let i = 0; i < lines.length; i++) {
      if (i === exportIndex - 1 && lines[i].trim() === '' &&
          i > 0 && lines[i-1].trim() === '</div>' &&
          i > 1 && lines[i-2].trim() === '};') {
        // Skip empty line between }; and </div>
        continue;
      }
      if (i === exportIndex - 2 && lines[i].trim() === '</div>' && lines[i+1].trim() === '};') {
        // This is extra closing div after };
        continue;
      }
      cleanedLines.push(lines[i]);
    }
    content = cleanedLines.join('\n');
  }

  // Step 10: Ensure proper return statement structure
  // Find return statement and make sure it has proper wrapper
  const returnMatch = content.match(/(\s+)return \(/);
  if (returnMatch) {
    const indent = returnMatch[1];
    // Check if return is followed by proper div structure
    const afterReturn = content.substring(content.indexOf('return ('));

    // If it starts with <div className="mb-6 without a wrapper, add one
    if (afterReturn.match(/return \(\s*<div className="mb-6/)) {
      content = content.replace(
        /return \(\s*<div className="mb-6/,
        'return (\n    <div>\n      <div className="mb-6'
      );

      // Now need to add closing div before );
      const lines = content.split('\n');
      const returnIdx = lines.findIndex(l => l.includes('return ('));
      const closingIdx = lines.findIndex((l, i) => i > returnIdx && l.trim() === ');');

      if (closingIdx > 0 && !lines[closingIdx - 1].includes('</div>')) {
        lines.splice(closingIdx, 0, '    </div>');
        content = lines.join('\n');
      }
    }
  }

  // Write file if modified
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed ${file}`);
  } else {
    console.log(`  ${file} (no changes)`);
  }
});

console.log('\n✅ Layout fix complete!\n');
