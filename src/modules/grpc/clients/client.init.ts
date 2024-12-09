import { resolve } from 'path';
var PROTO_PATH_ADMIN = resolve(__dirname, '..', 'protoservices/admin.proto');
var PROTO_PATH_REFERRAL = resolve(
  __dirname,
  '..',
  'protoservices/referral.proto'
);
let PROTO_PATH_OVER_WALLET = resolve(
  __dirname,
  '..',
  'protoservices/overwallet.proto'
);
let PROTO_PATH_BANKING = resolve(
  __dirname,
  '..',
  'protoservices/banking.proto'
);
import { GRPC } from '../../../constant/response';
import { loadPackageDefinition, ChannelCredentials } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

class GrpcClients {
  public adminClient: any;
  public referralClient: any;
  public walletClient: any;
  public bankingClient: any;

  constructor() {
    this.adminClient = this.initializeAdminClient();
    // this.referralClient = this.initializeReferralClient();
    // this.walletClient = this.initializeOverWallet();
    // this.bankingClient = this.initializeBanking();
  }

  initializeAdminClient = () => {
    try {
      console.log(`INSIDE CONNECT ADMIN CLIENT::`);
      const packageDefinition = loadSync(PROTO_PATH_ADMIN);
      const clientAlias: any =
        loadPackageDefinition(packageDefinition).AdminService;
      const adminServiceCon = new clientAlias.AdminService(
        GRPC.ADMIN,
        ChannelCredentials.createInsecure()
      );
      return adminServiceCon;
    } catch (error) {
      console.log(`UNABLE TO CONNECT ADMIN CLIENT::`, error);
      return false;
    }
  };

  initializeReferralClient = () => {
    try {
      console.log(`INSIDE CONNECT REFERRAL CLIENT::`);
      const packageDefinition = loadSync(PROTO_PATH_REFERRAL);
      const clientAlias: any =
        loadPackageDefinition(packageDefinition).ReferralService;
      const referralServiceCon = new clientAlias.ReferralService(
        GRPC.REFERRAL,
        ChannelCredentials.createInsecure()
      );
      return referralServiceCon;
    } catch (error) {
      console.log(`UNABLE TO CONNECT REFERRAL CLIENT::`, error);
      return false;
    }
  };

  initializeOverWallet = () => {
    try {
      const packageDefinition = loadSync(PROTO_PATH_OVER_WALLET);
      const clientAlias: any =
        loadPackageDefinition(packageDefinition).overWalletService;
      const overWalletClientConnection = new clientAlias.overWalletService(
        GRPC.OVER_WALLET,
        ChannelCredentials.createInsecure()
      );
      console.log('INSIDE OVER WALLET CLIENT CONNECTION ::');
      return overWalletClientConnection;
    } catch (error) {
      console.log(`UNABLE TO CONNECT OVER WALLET CLIENT CLIENT::`, error);
      return false;
    }
  };

  initializeBanking = () => {
    try {
      const packageDefinition = loadSync(PROTO_PATH_BANKING);
      const clientAlias: any =
        loadPackageDefinition(packageDefinition).BankingService;
      const overWalletClientConnection = new clientAlias.BankingService(
        GRPC.BANKING,
        ChannelCredentials.createInsecure()
      );
      console.log('INSIDE BANKING CONNECTION ::');
      return overWalletClientConnection;
    } catch (error) {
      console.log(`UNABLE TO CONNECT BANKING CLIENT::`, error);
      return false;
    }
  };
}

export { GrpcClients };
