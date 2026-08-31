const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Extract raw text content from uploaded file
 * Supports .txt, .pdf, .docx, .xlsx
 */
async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.txt') {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (e) {
      return '';
    }
  }

  // Use Python doc_parser if Python 3 is available, otherwise fall back to string extraction
  return new Promise((resolve) => {
    const pythonProc = spawn('python', [
      path.join(__dirname, '../../python_services/doc_parser.py'),
      filePath
    ]);

    let outputData = '';
    pythonProc.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProc.on('close', (code) => {
      if (code === 0 && outputData) {
        try {
          const parsed = JSON.parse(outputData);
          if (parsed.success && parsed.text) {
            return resolve(parsed.text);
          }
        } catch (err) {
          // Fallback
        }
      }

      // Node.js fallback: read raw buffer & clean printable ASCII
      try {
        const buffer = fs.readFileSync(filePath);
        const text = buffer.toString('utf8', 0, Math.min(buffer.length, 50000));
        const cleanText = text
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        resolve(cleanText);
      } catch (err) {
        resolve(`Document Content for ${originalName}`);
      }
    });

    pythonProc.on('error', () => {
      // Fallback if Python command fails
      try {
        const buffer = fs.readFileSync(filePath);
        const text = buffer.toString('utf8', 0, Math.min(buffer.length, 50000));
        const cleanText = text
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        resolve(cleanText);
      } catch (err) {
        resolve(`Document Content for ${originalName}`);
      }
    });
  });
}

module.exports = {
  extractTextFromFile
};
