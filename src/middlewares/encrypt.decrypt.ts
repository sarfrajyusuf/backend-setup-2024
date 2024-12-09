import * as CryptoJS from 'crypto-js';

class EncryptDecrypt {
  encryptArray = function (array: string | object[]): string {
    const jsonString = JSON.stringify(array);
    const encrypted = CryptoJS.AES.encrypt(
      jsonString,
      'yoursecretKey'
    ).toString();
    return encrypted;
  };

  decryptArray = function (encryptedData: string): string | object[] {
    const decryptedString = CryptoJS.AES.decrypt(
      encryptedData,
      'yoursecretKey'
    ).toString(CryptoJS.enc.Utf8);
    const decryptedArray = JSON.parse(decryptedString) as object[];
    return decryptedArray;
  };
}

export default new EncryptDecrypt();
