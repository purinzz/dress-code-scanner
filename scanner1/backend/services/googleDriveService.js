const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GoogleDriveService {
  constructor() {
    this.auth = null;
    this.drive = null;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
    this.initialized = false;
  }

  // Initialize Google Drive authentication
  async initialize() {
    try {
      // Check if service account credentials exist
      let keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      
      // If relative path provided, resolve it from the project root
      if (keyPath && !path.isAbsolute(keyPath)) {
        keyPath = path.join(__dirname, '../../', keyPath);
      }
      
      // Fallback to default location
      if (!keyPath) {
        keyPath = path.join(__dirname, '../config/credentials.json');
      }

      if (!fs.existsSync(keyPath)) {
        console.warn(`Google Drive credentials not found at: ${keyPath}`);
        // Try to use API key as fallback
        if (process.env.GOOGLE_API_KEY) {
          this.drive = google.drive({ version: 'v3', auth: process.env.GOOGLE_API_KEY });
          this.initialized = true;
          return true;
        }
        return false;
      }

      const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      this.auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.initialized = true;
      console.log('Google Drive service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error.message);
      return false;
    }
  }

  // Get latest image from Google Drive folder
  async getLatestImage() {
    try {
      if (!this.initialized || !this.drive) {
        console.log('Google Drive not initialized');
        return null;
      }

      if (!this.folderId) {
        console.warn('Google Drive folder ID not configured');
        return null;
      }

      // Query for image files in the folder, sorted by creation time
      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and mimeType contains 'image' and trashed=false`,
        spaces: 'drive',
        pageSize: 1,
        fields: 'files(id, name, webViewLink, webContentLink, createdTime, mimeType)',
        orderBy: 'createdTime desc'
      });

      if (response.data.files && response.data.files.length > 0) {
        const file = response.data.files[0];
        return {
          id: file.id,
          name: file.name,
          url: `https://drive.google.com/uc?id=${file.id}&export=view`,
          webLink: file.webViewLink,
          createdTime: file.createdTime,
          mimeType: file.mimeType
        };
      }

      console.log('No images found in Google Drive folder');
      return null;
    } catch (error) {
      console.error('Error fetching latest image from Google Drive:', error.message);
      return null;
    }
  }

  // Get file by ID
  async getFileById(fileId) {
    try {
      if (!this.initialized || !this.drive) {
        return null;
      }

      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, webViewLink, webContentLink, createdTime, mimeType'
      });

      return {
        id: response.data.id,
        name: response.data.name,
        url: `https://drive.google.com/uc?id=${response.data.id}&export=view`,
        webLink: response.data.webViewLink,
        createdTime: response.data.createdTime,
        mimeType: response.data.mimeType
      };
    } catch (error) {
      console.error('Error fetching file from Google Drive:', error.message);
      return null;
    }
  }

  // List all images in folder
  async listImages(limit = 10) {
    try {
      if (!this.initialized || !this.drive) {
        return [];
      }

      if (!this.folderId) {
        return [];
      }

      const response = await this.drive.files.list({
        q: `'${this.folderId}' in parents and mimeType contains 'image' and trashed=false`,
        spaces: 'drive',
        pageSize: limit,
        fields: 'files(id, name, webViewLink, createdTime, mimeType)',
        orderBy: 'createdTime desc'
      });

      return response.data.files.map(file => ({
        id: file.id,
        name: file.name,
        url: `https://drive.google.com/uc?id=${file.id}&export=view`,
        webLink: file.webViewLink,
        createdTime: file.createdTime,
        mimeType: file.mimeType
      })) || [];
    } catch (error) {
      console.error('Error listing images from Google Drive:', error.message);
      return [];
    }
  }

  // Set folder ID (can be called after initialization)
  setFolderId(folderId) {
    this.folderId = folderId;
  }

  // Get folder ID
  getFolderId() {
    return this.folderId;
  }

  // Check if service is initialized
  isInitialized() {
    return this.initialized;
  }

  // Get drive instance (for direct API access)
  getDrive() {
    return this.drive;
  }
}

// Create singleton instance
let gdrive = null;

// Export initialize function
async function initializeGoogleDrive() {
  if (!gdrive) {
    gdrive = new GoogleDriveService();
    const success = await gdrive.initialize();
    return { service: gdrive, success };
  }
  return { service: gdrive, success: gdrive.isInitialized() };
}

// Export getter function
function getGoogleDriveService() {
  if (!gdrive) {
    gdrive = new GoogleDriveService();
  }
  return gdrive;
}

module.exports = {
  initializeGoogleDrive,
  getGoogleDriveService,
  GoogleDriveService
};
