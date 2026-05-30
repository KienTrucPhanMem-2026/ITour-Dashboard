/**
 * Cloudinary Configuration & Upload Utility
 * Using signed upload with API secret for direct frontend upload
 */

// Cloudinary Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: 'dthx1zz57',
  apiKey: '583347454266549',
  apiSecret: 'YprYIQXv_EEjq5G_X-jVzCJqLX4',
};

/**
 * Generate signature for signed upload using webcrypto
 */
async function generateSignature(params: Record<string, any>): Promise<string> {
  // Sort parameters and create string to sign
  const sortedKeys = Object.keys(params).sort();
  const stringToSign = sortedKeys
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  
  const stringWithSecret = stringToSign + CLOUDINARY_CONFIG.apiSecret;
  
  console.log('🔐 String to sign:', stringToSign);
  
  // Use Web Crypto API (available in browsers and Node.js)
  const encoder = new TextEncoder();
  const data = encoder.encode(stringWithSecret);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  
  console.log('🔐 Generated signature:', signature);
  
  return signature;
}

/**
 * Upload image to Cloudinary using signed upload
 * @param file - File object from input
 * @returns Promise with Cloudinary response containing imageUrl
 */
export async function uploadToCloudinary(
  file: File
): Promise<{
  success: boolean;
  imageUrl?: string;
  publicId?: string;
  error?: string;
}> {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Chỉ hỗ trợ các định dạng: JPG, PNG, WebP, GIF',
      };
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Kích thước ảnh không được vượt quá 50MB',
      };
    }

    // Prepare params for signed upload
    // NOTE: Only folder and timestamp are signed by Cloudinary
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = {
      folder: 'itour/tours',
      timestamp: timestamp,
    };

    // Generate signature - only for params to sign
    const signature = await generateSignature(paramsToSign);

    // Create FormData - include all parameters
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
    formData.append('folder', 'itour/tours');
    formData.append('resource_type', 'auto');
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);

    // Upload to Cloudinary
    console.log('📤 Uploading to Cloudinary...');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.message || 'Upload failed',
      };
    }

    const data = await response.json();
    console.log('✅ Image uploaded successfully:', data.secure_url);

    return {
      success: true,
      imageUrl: data.secure_url, // Use secure_url (HTTPS)
      publicId: data.public_id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload error';
    console.error('❌ Cloudinary upload error:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    // Backend will handle this with signed authentication
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Delete failed:', error);
    return false;
  }
}
