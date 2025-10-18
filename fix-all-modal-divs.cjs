#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx') && !f.includes(' copy') && !f.includes('.backup'));

console.log('Fixing modal wrapper divs...\n');

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Pattern: closing main content divs, blank line, then modal starting with {show
  // We need to remove the </div> that closes the wrapper div too early
  content = content.replace(
    /(\s+<\/div>\s+<\/div>\s*\n)      <\/div>\n\n      \{show/g,
    '$1\n      {show'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed ${file}`);
  }
});

console.log('\n✅ Done!\n');
