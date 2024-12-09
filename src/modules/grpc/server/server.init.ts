import { resolve } from 'path';
var PROTO_PATH_USER = resolve(__dirname, '..', 'protoservices/user.proto');
import {
  loadPackageDefinition,
  Server,
  ServerCredentials,
} from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { GRPC } from '../../../constant/response';
import {  UserServiceHelper } from '../server.helper';
import { QuestionnaireGrpcService } from '../../questionnaire/questionnaire.grpc-service';
let PROTO_PATH_KYC = resolve(__dirname, '..', 'protoservices/kyc.proto');
let PROTO_PATH_TRANSACTION = resolve(
  __dirname,
  '..',
  'protoservices/transaction.proto'
);

class GrpcServer extends UserServiceHelper {
  private serverAlias;
  constructor() {
    super();
    this.serverAlias = new Server();
    this.userServices();
    this.initializeServer();
    // this.kycServices();
    // this.transactionServices();
  }

  // kycServices = () => {
  //   try {
  //     const kyc = new KycServiceHelper();
  //     const questionnaire = new QuestionnaireGrpcService();

  //     const packageDefinition = loadSync(PROTO_PATH_KYC);
  //     const kycProto: any = loadPackageDefinition(packageDefinition).KycService;
  //     this.serverAlias.addService(kycProto.KycService.service, {
  //       getUserKycDocs: kyc.getUserKycDocs,
  //       getKycs: kyc.getAllKycs,
  //       updateUserKycStatus: kyc.updateKycStatus,
  //       getAllKyts: kyc.getAllKyts,
  //       getAllKytsByUser: kyc.getAllKytsByUser,
  //       uploadKycDoc: kyc.uploadKycDoc,
  //       getComplianceKycs: kyc.getComplianceKycs,
  //       updateKycByCompliance: kyc.updateKycStatusByCompliance,
  //       getTxnDetailByTxnId: kyc.getTxnDetailByTxnId,
  //       getVerificationScreening: kyc.getVerificationScreeningDetail,
  //       getQuestionnaire: questionnaire.getQuestionnaireByUser,
  //       updateManualScore: questionnaire.updateManualScore,
  //       getKytDocList: kyc.getKytDocList,
  //       updateAdditionalDoc : kyc.updateAdditionalDocument,
  //       removeAdditionalDocument:kyc.removeAdditionalDocument
  //     });
  //   } catch (error) {
  //     console.log(`ERROR WHILE CREATING GRPC SERVER OUTSIDE::`, error);
  //   }
  // };


  // transactionServices = () => {
  //   try {
  //     const transaction = new TransactionHelper();
  //     const packageDefinition = loadSync(PROTO_PATH_TRANSACTION);
  //     const transactionProto: any =
  //       loadPackageDefinition(packageDefinition).TransactionService;
  //     this.serverAlias.addService(transactionProto.TransactionService.service, {
  //       submitDepositTransationForApproval:
  //         transaction.submitDepositTransationForApproval,
  //       submitWithdrawTransationForApproval:
  //         transaction.submitWithdrawTransationForApproval,
  //       updateKYTLogStatus: transaction.updateKytLogStatus,
  //       checkKytTrxStatus: transaction.checkKytTrxStatus,
  //       SubmitFiatTransaction: transaction.submitFiatTransaction,
  //       updateFiatTransaction: transaction.updatefiatTxn
  //     });
  //   } catch (error) {
  //     console.log(`ERROR WHILE CREATING GRPC SERVER OUTSIDE::`, error);
  //   }
  // };

  userServices = () => {
    try {
      // const kyc = new KycServiceHelper();
      // const questionnaire = new QuestionnaireGrpcService();
      const packageDefinition = loadSync(PROTO_PATH_USER);
      const userProto: any =
        loadPackageDefinition(packageDefinition).UserService;

      this.serverAlias.addService(userProto.UserService.service, {
        getCountryList: this.getCountryList,
        getUsers: this.getUsers,
        blockUnblockUser: this.blockUnblockUser,
        updateUserTxnStatus: this.updateUserTxnStatus,
        getTxnStatusByKey: this.getTxnStatusByKey,
        getUserDetails: this.getUserDetails,
        updateUserKycStatus: this.updateUserKycStatus,
        getUserInfo: this.getUserInfo,
        updateAdminKycStatus: this.updateAdminKycStatus,
        getUserCounts: this.getUserCounts,
        updateUserClientId: this.updateUserClientId,
        verifyTransactionOtp: this.verifyTransactionOtp,
        getClientId: this.getClientId,
        GetUserFcmTokens: this.getUserFcmTokens,
        GetUserDataByEmail: this.getUserDataByEmail,
        getUserDetailByClientId: this.getUserDetailByClientId,
        getUserByClientId: this.getUserByClientId,
        IsUserSessionExist: this.isUserSessionExist,
        GetSupportTickets: this.getSupportTickets,
        getAllOtps: this.getAllOtps,
        updateSupportTicketStatus: this.updateSupportTicketStatus,
        getUserInfoByUid: this.getUserInfoByUid,
        deleteUserAccount: this.deleteUserAccount,
        getUserKycDocs: this.getUserKycDocs,
        getKycs: this.getAllKycs,
        getAllKyts: this.getAllKyts,
        getAllKytsByUser: this.getAllKytsByUser,
        uploadKycDoc: this.uploadKycDoc,
        getComplianceKycs: this.getComplianceKycs,
        updateKycByCompliance: this.updateKycStatusByCompliance,
        getTxnDetailByTxnId: this.getTxnDetailByTxnId,
        getVerificationScreening: this.getVerificationScreeningDetail,
        // getQuestionnaire: this.getQuestionnaireByUser,
        // updateManualScore: this.updateManualScore,
        getKytDocList: this.getKytDocList,
        updateAdditionalDoc : this.updateAdditionalDocument,
        removeAdditionalDocument:this.removeAdditionalDocument
      });

    } catch (error) {
      console.log(`ERROR WHILE CREATING GRPC SERVER OUTSIDE::`, error);
    }
  };

  initializeServer = () => {
    try {
      this.serverAlias.bindAsync(
        GRPC.USER,
        ServerCredentials.createInsecure(),
        (err: any, port: any) => {
          if (err) {
            throw err;
          } else {
            console.log('GRPC SERVER SUCCESSFULLY CREATED::', port);
            this.serverAlias.start();
          }
        }
      );
    } catch (error) {
      console.log(`ERROR WHILE CREATING GRPC SERVER OUTSIDE::`, error);
    }
  };
}

export { GrpcServer };
