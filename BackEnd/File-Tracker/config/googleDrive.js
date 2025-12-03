import { google } from 'googleapis';
import stream from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class GoogleDriveService {
  constructor() {
    // Load service account credentials from JSON file
    const serviceAccountPath = path.join(__dirname, 'service-account.json');
    
    try {
      // For Render.com environment, use environment variable if JSON file doesn't exist
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        this.auth = new google.auth.GoogleAuth({
          credentials: credentials,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
      } else {
        // For local development with JSON file
        this.auth = new google.auth.GoogleAuth({
          keyFile: serviceAccountPath,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
      }
      
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      
    } catch (error) {
      console.error('Error initializing Google Drive service:', error);
      throw error;
    }
  }

  // Upload file to Google Drive
  async uploadFile(file, fileName, mimeType) {
    try {
      console.log(`Uploading file to Google Drive: ${fileName}`);
      
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

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink, webContentLink, size, mimeType',
        supportsAllDrives: true,
      });

      console.log('File uploaded successfully:', response.data);
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