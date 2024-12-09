import * as cron from 'cron';
const runTime = '0 5 */30 * *'; //30 days
import KycHelper from '../modules/kyc/kyc.helper';

const CronJob = cron.CronJob;
class CronService {
  constructor() {
    this.saveKycDocumentCron();
    this.uploadKycDocumentCron();
  }

  public saveKycDocumentCron() {

    const job = new CronJob(
      '*/4 * * * * *',
      async () => {
        await KycHelper.saveKycDocs();
      },
      null,
      true,
      'America/Los_Angeles'
    );
  }

  public uploadKycDocumentCron() {
    const job = new CronJob(
      '*/5 * * * * *',
      async () => {
        await KycHelper.updateKycDocs();
      },
      null,
      true,
      'America/Los_Angeles'
    );
  }
  
}

export default CronService;
