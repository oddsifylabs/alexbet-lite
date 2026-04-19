#!/usr/bin/env node

/**
 * AlexBET Lite - Pre-Deployment Verification Checklist
 * Runs all checks to ensure app is ready for Netlify
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 AlexBET Lite - Deployment Readiness Check\n');
console.log('=' .repeat(60));

const checks = {
  files: {
    title: '📄 Required Files',
    items: [
      'index.html',
      'favicon.svg',
      'netlify.toml',
      'package.json',
      'README.md'
    ]
  },
  src: {
    title: '📁 Source Files',
    items: [
      'src/app.js',
      'src/styles/main.css'
    ]
  },
  docs: {
    title: '📚 Documentation',
    items: [
      'DEPLOYMENT_GUIDE.md',
      'SECURITY.md',
      'PROJECT_STATUS.md'
    ]
  }
};

let totalChecks = 0;
let passedChecks = 0;

for (const [category, data] of Object.entries(checks)) {
  console.log(`\n${data.title}`);
  console.log('-'.repeat(40));
  
  for (const file of data.items) {
    totalChecks++;
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
    if (exists) passedChecks++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Checks: ${passedChecks}/${totalChecks} passed`);

if (passedChecks === totalChecks) {
  console.log('\n✨ All checks passed! Ready to deploy to Netlify.\n');
  console.log('Next steps:');
  console.log('1. Go to: https://app.netlify.com/start');
  console.log('2. Connect GitHub → Select oddsifylabs/alexbet-lite');
  console.log('3. Build command: (leave empty)');
  console.log('4. Publish directory: . (root)');
  console.log('5. Click Deploy\n');
  console.log('Your site will be live in ~2 minutes! 🚀\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some files are missing. Please check before deploying.\n');
  process.exit(1);
}
