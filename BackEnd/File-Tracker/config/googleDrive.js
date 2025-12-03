import { google } from 'googleapis';
import stream from 'stream';

class GoogleDriveService {
  constructor() {
    try {
      // Get private key from environment variable
      const privateKey = process.env.GOOGLE_PRIVATE_KEY;
      
      if (!privateKey) {
        throw new Error('GOOGLE_PRIVATE_KEY environment variable is not set');
      }

      // Fix line breaks for private key
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      
      // Full credentials object
      const credentials = {
        type: 'service_account',
        project_id: 'file-tracker-480014',
        private_key_id: '81087fc3fb4291a94c2a09104ea9f0d2b9431a0a',
        private_key: formattedPrivateKey,
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'file-storage-service@file-tracker-480014.iam.gserviceaccount.com',
        client_id: '105242339722036405775',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/file-storage-service%40file-tracker-480014.iam.gserviceaccount.com',
        universe_domain: 'googleapis.com'
      };

      console.log('Initializing Google Drive service...');
      console.log('Service Account Email:', credentials.client_email);
      console.log('Folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);

      this.auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      console.log('Google Drive service initialized successfully');
      
    } catch (error) {
      console.error('Error initializing Google Drive service:', error);
      throw error;
    }
  }

  // Initialize authentication - FIXED: Now this method exists
  async initialize() {
    try {
      const client = await this.auth.getClient();
      console.log('Google Drive authentication successful');
      return client;
    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      throw error;
    }
  }

  // Upload file to Google Drive
  async uploadFile(file, fileName, mimeType) {
    try {
      console.log(`Uploading file to Google Drive: ${fileName}`);
      console.log('File size:', file.size, 'bytes');
      console.log('MIME type:', mimeType);
      
      // Ensure authentication is initialized
      await this.initialize();
      
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);

      const fileMetadata = {
        name: fileName,
        parents: [this.folderId],
      };

      const media = {
        mimeType: mimeType,
        body: bufferStream,
      };

      console.log('Uploading to folder:', this.folderId);
      
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink, size, mimeType',
        supportsAllDrives: true,
      });

      console.log('File uploaded successfully:', {
        id: response.data.id,
        name: response.data.name,
        size: response.data.size,
        mimeType: response.data.mimeType
      });
      
      return {
        fileId: response.data.id,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        fileSize: response.data.size,
        mimeType: response.data.mimeType
      };
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        errors: error.errors
      });
      throw new Error(`Google Drive upload failed: ${error.message}`);
    }
  }

  // Download file from Google Drive
  async downloadFile(fileId) {
    try {
      console.log(`Downloading file from Google Drive: ${fileId}`);
      
      await this.initialize();
      
      const response = await this.drive.files.get(
        { 
          fileId: fileId, 
          alt: 'media',
          supportsAllDrives: true
        },
        { responseType: 'stream' }
      );

      return response.data;
    } catch (error) {
      console.error('Error downloading from Google Drive:', error);
      throw new Error(`Google Drive download failed: ${error.message}`);
    }
  }

  // Delete file from Google Drive
  async deleteFile(fileId) {
    try {
      console.log(`Deleting file from Google Drive: ${fileId}`);
      await this.initialize();
      
      await this.drive.files.delete({ 
        fileId: fileId,
        supportsAllDrives: true
      });
      console.log(`File deleted successfully: ${fileId}`);
      return true;
    } catch (error) {
      console.error('Error deleting from Google Drive:', error);
      throw new Error(`Google Drive delete failed: ${error.message}`);
    }
  }

  // Get file metadata
  async getFileMetadata(fileId) {
    try {
      await this.initialize();
      
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, webViewLink, webContentLink, size, mimeType, createdTime',
        supportsAllDrives: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }

  // Generate direct download link
  async generateDownloadLink(fileId) {
    try {
      await this.initialize();
      
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'webContentLink',
        supportsAllDrives: true,
      });
      return response.data.webContentLink;
    } catch (error) {
      console.error('Error generating download link:', error);
      throw error;
    }
  }
}

export default new GoogleDriveService();