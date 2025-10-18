#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx') && !f.includes(' copy') && !f.includes('.backup'));

console.log('Fixing missing closing divs...\n');

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Find the pattern: whitespace before );
  let fixed = false;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();

    // If we find );
    if (line === ');') {
      // Check previous line
      const prevLine = i > 0 ? lines[i - 1].trim() : '';

      // If previous line is empty or just whitespace
      if (prevLine === '') {
        // Look back further for actual content
        let contentIdx = i - 1;
        while (contentIdx > 0 && lines[contentIdx].trim() === '') {
          contentIdx--;
        }

        // If the content line doesn't end with </div>, add closing div
        if (contentIdx > 0 && !lines[contentIdx].includes('</div>')) {
          // Insert closing div before the empty lines
          lines.splice(i - 1, 0, '    </div>');
          fixed = true;
          break;
        }
      }
    }
  }

  if (fixed) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`✓ Fixed ${file}`);
  }
});

console.log('\n✅ Done!\n');
