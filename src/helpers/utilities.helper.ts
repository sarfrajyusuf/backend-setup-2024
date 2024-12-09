import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import {
  GenericGenerateJwt,
  GenerateJwtPayload,
} from '../interfaces/responses.interface';
const expiresIn = '2h';
import { JWT } from '../constant/response';

class UtilitiesHelper {
  generateRandomString = function (length: number) {
    const characters =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    return result;
  };

  public async generateJwt(
    jwtPayload: GenerateJwtPayload,
    isRequiredRefreshTokem: boolean
  ): Promise<GenericGenerateJwt> {
    console.log('GENERATE JWT::', jwtPayload);
    return new Promise((resolve, reject) => {
      try {
        const ACCESS_JWT = jwt.sign(jwtPayload, JWT.JWT_USER_ACCESS_SECRET, {
          expiresIn: JWT.JWT_USER_ACCESS_EXPIRE_TIME,
        });
        let REFRESH_JWT: string = '';
        if (isRequiredRefreshTokem) {
          REFRESH_JWT = jwt.sign(
            { userId: jwtPayload.userId },
            JWT.JWT_USER_REFRESH_SECRET,
            {
              expiresIn: JWT.JWT_USER_REFRESH_EXPIRE_TIME,
            }
          );
        }

        resolve({ accessJwt: ACCESS_JWT, refreshJwt: REFRESH_JWT });
      } catch (error) {
        console.log('ERROR IN GENERATE JWT', error);
        reject(error);
      }
    });
  }

  public async generateJwtAdmin(jwtPayload: {
    userId: string;
  }): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const ADMIN_JWT = jwt.sign(jwtPayload, JWT.JWT_ADMIN_SECRET, {
          expiresIn,
        });
        resolve(ADMIN_JWT);
      } catch (error) {
        console.log('ERROR IN GENERATE ADMIN JWT', error);
        reject(error);
      }
    });
  }

  public async createOTP() {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000);
      return `${otp}`;
    } catch (error) {
      return false;
    }
  }

  public async generateRandomNumber(length: number) {
    try {
      let randomNumber = '';
      for (let i = 0; i < length; i++) {
        randomNumber += Math.floor(Math.random() * 10);
      }
      return randomNumber;
    } catch (error) {
      return false;
    }
  }

  public async comparePassword(password: string, dbHash: string) {
    const hash = await this.generateSHA256(password);
    console.log('Hash ::', hash, 'DB Hash ::', dbHash);
    return hash === dbHash;
  }

  public async generateSHA256(target: string) {
    try {
      const hash = crypto.createHash('sha256');
      hash.update(target);
      const hashedPassword = hash.digest('hex');
      return hashedPassword;
    } catch (error) {
      return false;
    }
  }

  public replaceStringPlaceholder(
    originalString: string,
    placeholder: string,
    replacement: string
  ) {
    return originalString.replace(`{${placeholder}}`, replacement);
  }
}

export default new UtilitiesHelper();
