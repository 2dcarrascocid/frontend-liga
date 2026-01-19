import axios from 'axios';
import CryptoJS from 'crypto-js';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET;

export const uploadImage = async (file) => {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error('Faltan credenciales de Cloudinary en .env');
  }

  const timestamp = Math.round((new Date()).getTime() / 1000);
  
  // Generate signature: timestamp=<ts><secret>
  // Note: parameters must be sorted alphabetically if there are more
  const paramsToSign = `timestamp=${timestamp}${API_SECRET}`;
  const signature = CryptoJS.SHA1(paramsToSign).toString();
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  
  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
