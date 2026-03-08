const fs = require('fs').promises;

// Define allowed MIME types and their configurations
const ALLOWED_MIMETYPES = {
  'image/jpeg': { ext: 'jpg', maxSize: 5 * 1024 * 1024 }, // 5MB
  'image/png': { ext: 'png', maxSize: 5 * 1024 * 1024 },
  'image/webp': { ext: 'webp', maxSize: 5 * 1024 * 1024 }
};

/**
 * Validates uploaded file by checking actual content and size
 * This prevents MIME type spoofing attacks
 * @param {string} filePath - Path to the uploaded file
 * @returns {Promise<object>} - { valid: boolean, mimeType: string }
 */
const validateUploadFile = async (filePath) => {
  try {
    // Check if file exists
    if (!filePath) {
      throw new Error('No file path provided');
    }

    // Check file size
    const stats = await fs.stat(filePath);
    const maxSize = Math.max(...Object.values(ALLOWED_MIMETYPES).map(m => m.maxSize));
    
    if (stats.size > maxSize) {
      throw new Error(`File size ${stats.size} exceeds maximum allowed size of ${maxSize} bytes`);
    }

    // Read file header to verify actual type
    // In production, you should use file-type library: npm install file-type
    // For now, we do basic magic number verification
    const buffer = Buffer.alloc(12);
    const fd = await fs.open(filePath, 'r');
    await fd.read(buffer, 0, 12, 0);
    await fd.close();

    let detectedMimeType = null;

    // Check magic numbers for common image types
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      // JPEG: starts with FFD8FF
      detectedMimeType = 'image/jpeg';
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      // PNG: starts with 89504E47
      detectedMimeType = 'image/png';
    } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      // WebP: starts with RIFF
      detectedMimeType = 'image/webp';
    } else {
      throw new Error('File type not recognized or not allowed');
    }

    // Verify detected type is in allowed list
    if (!ALLOWED_MIMETYPES[detectedMimeType]) {
      throw new Error(`File type ${detectedMimeType} is not allowed`);
    }

    return { 
      valid: true, 
      mimeType: detectedMimeType,
      size: stats.size
    };
  } catch (error) {
    throw new Error(`File validation failed: ${error.message}`);
  }
};

module.exports = { validateUploadFile, ALLOWED_MIMETYPES };
