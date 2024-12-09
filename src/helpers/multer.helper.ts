import * as CM from '../constant/response';
import { Storage } from '@google-cloud/storage';

const projectId = CM.GOOGLE_CLOUD.PROJECT_ID;
const bucketName = CM.GOOGLE_CLOUD.BUCKET_NAME;

// Google Cloud Configuration
const storage = new Storage({
  projectId: projectId,
});

// Uploading Images/Buffer on Google Cloud Storage
export async function uploadToGoogleStorage(
  data: any,
  attachmentName: string,
  contentType: string
) {
  try {
    const imageBuffer = Buffer.from(data, 'base64');
    const imageName = `${CM.GOOGLE_CLOUD.DIRECTORY.QUERIES}/${attachmentName}`;
    const stream = storage
      .bucket(bucketName)
      .file(imageName)
      .createWriteStream({
        metadata: {
          contentType: contentType,
        },
      });
    stream.end(imageBuffer);
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    return {
      docPath: `/${bucketName}/${imageName}`,
    };
  } catch (err: any) {
    console.error('ERROR IN GOOGLE CLOUD UPLOAD:', err);
    return false;
  }
}
