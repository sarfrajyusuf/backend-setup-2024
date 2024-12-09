import * as multer from 'multer';
import { AWS_CONFIG } from '../constant/response';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

class S3ClientHelper {
  private s3Client: S3Client;
  constructor() {
    this.s3Client = new S3Client({
      region: AWS_CONFIG.AWS_USER_REGION,
      endpoint: AWS_CONFIG.AWS_S3_ENDPOINT,
    });
  }

  uploadMultiple = multer({
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype == 'image/png' ||
        file.mimetype == 'image/jpg' ||
        file.mimetype == 'image/jpeg' ||
        file.mimetype == 'image/gif' ||
        file.mimetype == 'image/svg' ||
        file.mimetype === 'application/pdf'
      ) {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('Please upload document in correct format'));
      }
    },
  });

  uploadS3 = async (data: any, directory: string, imageRawName: string) => {
    try {
      let imageName = `${directory}/${imageRawName}`;
      console.log(' BUFFER FORM DATA:', data.buffer);

      let params: any = {
        Bucket: AWS_CONFIG.BUCKET_NAME,
        Key: imageName,
        Body: data.buffer,
        ContentSHA256: 'UNSIGNED-PAYLOAD',
      };

      const command = new PutObjectCommand(params);
      const response = await this.s3Client.send(command);
      console.log('S3 RESPONSE::', response);
      if (response?.ETag) {
        console.log('imageName', imageName);

        return {
          error: false,
          data: imageName,
        };
      } else {
        return { error: true, data: '' };
      }
    } catch (error) {
      console.log('ERROR WHILE SAVING DOC TO S3::', error);
      return { error: true, data: '' };
    }
  };
}

export default new S3ClientHelper();
