#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx') && !f.includes(' copy') && !f.includes('.backup'));

console.log('Fixing all indentation issues...\n');

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  //Fix: return ( followed by <div> with 8-space-indented child
  content = content.replace(
    /return \(\n    <div>\n        <div className="mb-6/g,
    'return (\n    <div>\n      <div className="mb-6'
  );

  // Fix corresponding closing div - from 8 spaces to 6
  content = content.replace(
    /      <\/div>\n        <\/div>\n\n        <div className="/g,
    '      </div>\n      </div>\n\n      <div className="'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed ${file}`);
  }
});

console.log('\n✅ Done!\n');
