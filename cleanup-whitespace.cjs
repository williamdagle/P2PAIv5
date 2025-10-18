#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

console.log('Cleaning up whitespace...\n');

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Remove multiple blank lines after return (
  content = content.replace(/return \(\s*\n\s*\n\s*\n\s*<div>/g, 'return (\n    <div>');

  // Remove multiple blank lines before closing );
  content = content.replace(/<\/div>\s*\n\s*\n\s*\n\s*\);/g, '</div>\n  );');

  // Ensure files end with newline
  if (!content.endsWith('\n')) {
    content += '\n';
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Cleaned ${file}`);
  }
});

console.log('\n✅ Whitespace cleanup complete!\n');
