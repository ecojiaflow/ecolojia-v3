// PATH: frontend/src/services/cloudinaryService.ts
import axios from 'axios';

// Configuration Cloudinary (à adapter selon votre compte)
const CLOUDINARY_CONFIG = {
  cloudName: 'ecolojia', // Remplacer par votre cloud name
  uploadPreset: 'ecolojia_unsigned', // Créer un preset unsigned dans Cloudinary
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '', // Optionnel pour unsigned
  apiSecret: '', // Ne jamais mettre côté client !
  folders: {
    products: 'ecolojia/products',
    receipts: 'ecolojia/receipts',
    avatars: 'ecolojia/avatars'
  }
};

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  created_at: string;
  bytes: number;
  etag: string;
  url: string;
}

class CloudinaryServiceClass {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}`;
  }

  /**
   * Upload une image vers Cloudinary
   * @param file - Fichier à uploader (File ou Blob)
   * @param folder - Dossier de destination
   * @param options - Options supplémentaires
   */
  async uploadImage(
    file: File | Blob,
    folder: keyof typeof CLOUDINARY_CONFIG.folders = 'products',
    options?: {
      publicId?: string;
      tags?: string[];
      context?: string;
    }
  ): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', CLOUDINARY_CONFIG.folders[folder]);
    
    if (options?.publicId) {
      formData.append('public_id', options.publicId);
    }
    
    if (options?.tags?.length) {
      formData.append('tags', options.tags.join(','));
    }
    
    if (options?.context) {
      formData.append('context', options.context);
    }
    
    try {
      const response = await axios.post<CloudinaryUploadResponse>(
        `${this.baseUrl}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur upload Cloudinary:', error);
      throw new Error('Échec de l\'upload de l\'image');
    }
  }

  /**
   * Upload une image base64
   * @param base64Data - Image en base64
   * @param folder - Dossier de destination
   */
  async uploadBase64(
    base64Data: string,
    folder: keyof typeof CLOUDINARY_CONFIG.folders = 'products'
  ): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', base64Data);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', CLOUDINARY_CONFIG.folders[folder]);
    
    try {
      const response = await axios.post<CloudinaryUploadResponse>(
        `${this.baseUrl}/image/upload`,
        formData
      );
      
      return response.data;
    } catch (error) {
      console.error('Erreur upload base64 Cloudinary:', error);
      throw new Error('Échec de l\'upload de l\'image base64');
    }
  }

  /**
   * Upload multiple images
   * @param files - Liste des fichiers
   * @param folder - Dossier de destination
   */
  async uploadMultiple(
    files: File[],
    folder: keyof typeof CLOUDINARY_CONFIG.folders = 'products'
  ): Promise<CloudinaryUploadResponse[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Génère une URL transformée Cloudinary
   * @param publicId - ID public de l'image
   * @param transformations - Transformations à appliquer
   */
  getTransformedUrl(
    publicId: string,
    transformations: {
      width?: number;
      height?: number;
      crop?: 'fill' | 'fit' | 'scale' | 'pad' | 'crop';
      quality?: 'auto' | number;
      format?: 'auto' | 'jpg' | 'png' | 'webp';
    } = {}
  ): string {
    const defaultTransformations = {
      quality: 'auto',
      format: 'auto',
      ...transformations
    };
    
    const transformString = Object.entries(defaultTransformations)
      .map(([key, value]) => {
        if (key === 'quality') return `q_${value}`;
        if (key === 'format') return `f_${value}`;
        if (key === 'width') return `w_${value}`;
        if (key === 'height') return `h_${value}`;
        if (key === 'crop') return `c_${value}`;
        return '';
      })
      .filter(Boolean)
      .join(',');
    
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformString}/${publicId}`;
  }

  /**
   * Supprime une image de Cloudinary (nécessite API key côté serveur)
   * @param publicId - ID public de l'image
   */
  async deleteImage(publicId: string): Promise<void> {
    // Cette opération doit être faite côté serveur pour la sécurité
    console.warn('La suppression d\'images doit être effectuée côté serveur');
    throw new Error('Opération non supportée côté client');
  }
}

// Instance singleton
export const cloudinaryService = new CloudinaryServiceClass();

// Export default pour compatibilité
export default cloudinaryService;

// Helper pour créer un File depuis un blob
export function createFileFromBlob(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type });
}

// Helper pour convertir base64 en blob
export function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64.replace(/^data:image\/\w+;base64,/, ''));
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
