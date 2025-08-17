import axios from 'axios';

const CLOUDINARY_UPLOAD_URL = import.met?.env.VITE_CLOUDINARY_UPLOAD_URL;
const CLOUDINARY_PRESET = import.met?.env.VITE_CLOUDINARY_PRESET;

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formDat?.append('file', file);
  formDat?.append('upload_preset', CLOUDINARY_PRESET);

  const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.dat?.secure_url;
}



