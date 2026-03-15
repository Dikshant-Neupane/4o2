import imageCompression from 'browser-image-compression';

export const validateImage = (file) => {
  console.log('[IMG] Validating:', file.name);
  
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    const error = 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.';
    console.error('[IMG] ❌ Invalid:', error);
    return { valid: false, error };
  }

  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeInBytes) {
    const error = 'File size exceeds 10MB limit.';
    console.error('[IMG] ❌ Invalid:', error);
    return { valid: false, error };
  }

  return { valid: true, error: null };
};

export const compressImage = async (file) => {
  console.log('[IMG] Compressing...');
  
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    const beforeKb = (file.size / 1024).toFixed(2);
    const afterKb = (compressedFile.size / 1024).toFixed(2);
    console.log(`[IMG] ✅ Done: ${beforeKb}KB → ${afterKb}KB`);
    return compressedFile;
  } catch (error) {
    console.error('[IMG] ❌ Compression Error:', error.message);
    throw error;
  }
};
