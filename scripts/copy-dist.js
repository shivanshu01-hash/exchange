const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'apps', 'api', 'dist');
const targetDir = path.join(__dirname, '..', 'dist', 'api');

function copyDir(src, dest) {
  // Remove destination if exists
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  // Create destination
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log(`Copying ${sourceDir} to ${targetDir}`);
if (fs.existsSync(sourceDir)) {
  copyDir(sourceDir, targetDir);
  console.log('Copy completed.');
} else {
  console.error(`Source directory ${sourceDir} does not exist.`);
  process.exit(1);
}