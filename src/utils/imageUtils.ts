/**
 * Get the file size in a human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get the size of an image from its URL by making a HEAD request
 */
export const getImageSize = async (url: string): Promise<number | null> => {
  if (!url) return null;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : null;
  } catch (error) {
    console.error('Error getting image size:', error);
    return null;
  }
};

export interface ImageSizeInfo {
  originalSize: string | null;
  optimizedSize: string | null;
}
