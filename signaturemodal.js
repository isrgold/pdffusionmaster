import fs from 'fs';
import path from 'path';

function combineFiles(srcDir, outputFile) {
  const writeStream = fs.createWriteStream(outputFile, { flags: 'w' });

  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        try {
          const data = fs.readFileSync(fullPath);
          writeStream.write(data);
        } catch (err) {
          console.error(`Skipping ${fullPath}: ${err.message}`);
        }
      }
    }
  }

  walkDir(srcDir);
  writeStream.end(() => console.log(`✅ Combined files written to ${outputFile}`));
}

// Usage
const sourceFolder = './src/components/SignatureModal'; // Replace with your folder path
const outputFile = './combined_output.txt';
combineFiles(sourceFolder, outputFile);
