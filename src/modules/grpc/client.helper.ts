import kycHelper from '../../modules/kyc/kyc.helper';
import { GrpcClients } from './clients/client.init';
import * as Interfaces from './grpc.interface';
import * as CM from '../../constant/response';

interface activityPayload {
  name: string;
  slug: string;
  type: string;
  body: string;
}

interface saveTxnDocumentPayload {
  serviceName?: string;
  keyName: string;
  mediaId: string;
  type: string;
  docId?: string;
  userId: string;
  service: string;
}

interface businessBasicInfo {
  businessName?: string;
  brandName?: string;
  incorporationDate?: string;
  companyType?: string;
}

class GrpcClientHelper extends GrpcClients {
  getMarketingContent = async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      this.adminClient.getContents({}, function (err: any, response: any) {
        if (err) {
          console.log('ERROR IN GET USER INFO', err);
          resolve(false);
        } else {
          resolve(response);
        }
      });
    });
  };

  getMarketingBanners = async (payload: any): Promise<any> => {
    console.log('PAYLOAD', payload);
    return new Promise((resolve, reject) => {
      this.adminClient.getMarketingBanners(
        payload,
        function (err: any, response: any) {
          if (err) {
            console.log('ERROR IN GET USER INFO', err);
            resolve(false);
          } else {
            console.log('RESPONSE::', response);
            resolve(response);
          }
        }
      );
    });
  };

  saveReferralCode = async (
    payload: Interfaces.SAVE_REFERRAL_CODE_REQUEST_PAYLOAD
  ): Promise<any> => {
    console.log('PAYLOAD', payload);
    return new Promise((resolve, reject) => {
      this.referralClient.saveReferralCode(
        payload,
        function (err: any, response: any) {
          if (err) {
            console.log('ERROR IN SAVE REFERRAL CODE', err);
            resolve(false);
          } else {
            console.log('RESPONSE::', response);
            resolve(response);
          }
        }
      );
    });
  };

  UpdateUserKycStatus = async (
    userId: string,
    userKycStatus: string,
    businessDetail: businessBasicInfo = {}
  ): Promise<any> => {
    const isUserAlreadyApproved = await kycHelper.findKycLog({
      userId: userId,
    });

    if (isUserAlreadyApproved.adminKycStatus !== CM.ENUM.KYC_STATUS.APPROVED) {
      return new Promise((resolve, reject) => {
        // this.userClient.updateUserKycStatus(
        //   {
        //     userId: userId,
        //     userKycStatus: userKycStatus,
        //     businessDetail: businessDetail || {},
        //   },
        //   function (err: any, response: any) {
        //     if (err) {
        //       console.log('ERROR IN UPDATE USER KYC STATUS:', err);
        //       resolve(false);
        //     } else {
        //       resolve(response);
        //     }
        //   }
        // );
      });
    }
  };

  updateAdminKycStatus = async (
    userId: string,
    adminKycStatus: string,
    rejectionReason: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      // this.userClient.updateAdminKycStatus(
      //   {
      //     userId: userId,
      //     adminKycStatus: adminKycStatus,
      //     rejectionReason: rejectionReason || '',
      //   },
      //   function (error: any, response: any) {
      //     if (error) {
      //       resolve(false);
      //     } else {
      //       console.log('UPDATE USER ADMIN KYC STATUS', response);
      //       resolve(response);
      //     }
      //   }
      // );
    });
  };

  getUserInfo = async (userId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      // this.userClient.getUserInfo(
      //   { userId: userId },
      //   function (err: any, response: any) {
      //     if (err) {
      //       console.log('ERROR IN GET USER INFO', err);
      //       resolve(false);
      //     } else {
      //       resolve(response);
      //     }
      //   }
      // );
    });
  };

  saveActivityLog = async (activityPayload: activityPayload) => {
    try {
      this.adminClient.addActivityData(
        activityPayload,
        function (err: any, response: any) {
          if (err) {
            console.log('ERROR IN SAVE ACTIVITY LOG:', err);
          } else {
            console.log('SAVE ACTIVITY LOG SOCCESS:', response);
          }
        }
      );
    } catch (error) {
      console.log(`ERROR IN GRPC SAVE ACTIVITY LOG:`, error);
    }
  };

  saveTransactionDocs = async (payload: saveTxnDocumentPayload) => {
    try {
      this.adminClient.saveTransactionDocs(
        payload,
        function (err: any, response: any) {
          if (err) {
            throw err;
          } else {
            console.log('SUCCESS GRPC TRANSACTION DOCUMENT:', response);
            return response;
          }
        }
      );
    } catch (error) {
      console.log('ERROR GRPC TRANSACTION DOCUMENT:', error);
    }
  };

  updateTransactionKytStatus = async (payload: any) => {
    let isSuccess = false;
    try {
      this.walletClient.updateTransactionKytStatus(
        payload,
        function (err: any, response: any) {
          if (err) {
            throw err;
          } else {
            console.log(
              'SUCCESS UPDATE CRYPTO KYT STATUS:',
              response,
              typeof response.status
            );
            if (response.status === 200) {
              isSuccess = true;
            }
          }
        }
      );
    } catch (error) {
      console.log('ERROR UPDATE KYT STATUS:', error);
    }

    return isSuccess;
  };

  updateFiatTransactionKytStatus = async (payload: any) => {
    let isSuccess = false;
    try {
      this.bankingClient.updateTransactionKytStatus(
        payload,
        function (err: any, response: any) {
          console.log(
            'SUCCESS UPDATE FIAT KYT STATUS:',
            response,
            response.status
          );

          if (err) {
            throw err;
          } else {
            if (response.status === 200) {
              isSuccess = true;
            }
          }
        }
      );
    } catch (error) {
      console.log('ERROR UPDATE KYT STATUS:', error);
    }

    return isSuccess;
  };
}

export default new GrpcClientHelper();
