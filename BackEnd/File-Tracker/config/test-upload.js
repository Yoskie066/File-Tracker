import { google } from 'googleapis';
import fs from 'fs';

async function testGoogleDrive() {
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    console.log('Private key length:', privateKey.length);
    console.log('Formatted private key length:', formattedPrivateKey.length);
    
    const credentials = {
      type: 'service_account',
      project_id: 'file-tracker-480014',
      private_key_id: '81087fc3fb4291a94c2a09104ea9f0d2b9431a0a',
      private_key: formattedPrivateKey,
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      client_id: '105242339722036405775',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/file-storage-service%40file-tracker-480014.iam.gserviceaccount.com',
      universe_domain: 'googleapis.com'
    };

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const client = await auth.getClient();
    console.log('✅ Google Drive authentication SUCCESSFUL!');
    
    return true;
  } catch (error) {
    console.error('❌ Google Drive authentication FAILED:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

// Run test
testGoogleDrive();