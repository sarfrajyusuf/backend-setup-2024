import { KytLogs } from "../../models/index";
import * as CM from "../../constant/response";
import { Op } from "../../models/index"
import clientHelper from "../grpc/client.helper";


class KytHelper {

  updateKyt = async (payload: object, txnId: string) => {
    try {
      return await KytLogs.update(payload, {
        where: { txnId: txnId },
      })
        .then((result: number[]) => {
          if (result[0] == 1) {
            return true;
          } else {
            return false;
          }
        })
        .catch((error) => {
          console.log('UPDATE KYT ERROR:', error);
          throw error;
        });
    } catch (error) {
      return false;
    }
  };

  findKyt = async (payload: any) => {
    try {
      const row = await KytLogs.findOne({ where: payload, raw: true });
      if (!row) {
        return false;
      } else {
        return row;
      }
    } catch (error) {
      console.log('FIND KYT:', error);
      return false;
    }
  };

  manageKytStatuses = async (trxStatus: string, txnId: string) => {
    let endResponse: boolean = false;

    try {
      switch (trxStatus) {
        case CM.ENUM.TRANSACTION_STATUS.APPROVED:
          endResponse = await this.approvedTrx(trxStatus, txnId)
          break;
        case CM.ENUM.TRANSACTION_STATUS.REJECTED:
          endResponse = await this.rejectTrx(trxStatus, txnId)
          break;
        case CM.ENUM.TRANSACTION_STATUS.IN_REVIEW:
          endResponse = await this.inReviewTrx();
          break;
        default:
          endResponse = false
          break;
      }
      return endResponse;
    } catch (error) {
      console.log(`INSIDE MANAGE STATUS ERROR::`, error)
      return endResponse
    }
  }

  approvedTrx = async (trxStatus: string, txnId: string) => {
    let status = false;
    if (typeof txnId !== 'undefined') {
      console.log('INSIDE APPROVED TRX:', trxStatus, txnId);
      const isKytExist: any = await this.findKyt({
        txnId: txnId,
        kytStatus: {
          [Op.notIn]: [
            CM.ENUM.TRANSACTION_STATUS.APPROVED,
            CM.ENUM.TRANSACTION_STATUS.REJECTED
          ]
        }
      })
      console.log('KYT RECORD:', isKytExist.txnId);
      if (isKytExist) {
        const isUpdated = await this.updateKyt({
          txnStatus: trxStatus,
          kytStatus: trxStatus
        }, txnId)


        if (isUpdated) {
          console.log('KYT LOG UPDATED', isUpdated);
          if (isKytExist.type === 'FIAT') {
            const isSuccess = await clientHelper.updateFiatTransactionKytStatus({
              txnId: isKytExist.txnId,
              status: trxStatus,
              txnType: isKytExist.txnType,
              updatedAt: (new Date()).toString()
            });


            if (isSuccess) status = true;

          }
          else {

            const isSuccess = await clientHelper.updateTransactionKytStatus({
              typeId: isKytExist.typeId,
              status: trxStatus,
              trxType: isKytExist.txnType,
              clientId: isKytExist.clientId,
              coin: isKytExist.coinSymbol,
              adminId: txnId
            });


            if (isSuccess) status = true;
          }
        }
      }
    }
    return status;
  }

  rejectTrx = async (trxStatus: string, txnId: string) => {
    let status = false;
    if (typeof txnId !== 'undefined') {
      console.log('INSIDE REJECT TRX:', trxStatus, txnId);
      const isKytExist: any = await this.findKyt({
        txnId: txnId,
        kytStatus: {
          [Op.notIn]: [
            CM.ENUM.TRANSACTION_STATUS.APPROVED,
            CM.ENUM.TRANSACTION_STATUS.REJECTED
          ]
        }
      })
      console.log('KYT RECORD:', isKytExist.txnId);
      if (isKytExist) {
        const isUpdated = await this.updateKyt({
          txnStatus: trxStatus,
          kytStatus: trxStatus
        }, txnId)

        if (isUpdated) {
          console.log('KYT LOG UPDATED', isUpdated);
          if (isKytExist.type === 'FIAT') {
            const isSuccess = await clientHelper.updateFiatTransactionKytStatus({
              txnId: isKytExist.txnId,
              status: trxStatus,
              txnType: isKytExist.txnType
            });


            if (isSuccess) status = true;
          }
          else {

            const isSuccess = await clientHelper.updateTransactionKytStatus({
              typeId: isKytExist.typeId,
              status: trxStatus,
              trxType: isKytExist.txnType,
              clientId: isKytExist.clientId,
              coin: isKytExist.coinSymbol,
              adminId: txnId
            });


            if (isSuccess) status = true;

          }
        }
      }
    }
    return status;
  }

  inReviewTrx = async () => {
    console.log('INSIDE IN_REVIEW TRX');
    return true;
  }

  handleSumsubKYTStatus = (type: string, reviewStatus: string, reviewAnswer: string) => {
    let status = CM.ENUM.TRANSACTION_STATUS.PENDING;
    let sumsubInReviewStatusArr = ['onHold', 'awaitingUser', 'init', 'pending', 'queued']

    if (type === CM.ENUM.TRANSACTION_WEBHOOK_TYPES.APPROVED && reviewStatus === 'completed' && reviewAnswer === 'GREEN') {
      status = CM.ENUM.TRANSACTION_STATUS.APPROVED
    }
    else if (type === CM.ENUM.TRANSACTION_WEBHOOK_TYPES.REJECTED && reviewStatus === 'completed' && reviewAnswer === 'RED') {
      status = CM.ENUM.TRANSACTION_STATUS.REJECTED
    }
    else if (sumsubInReviewStatusArr.includes(reviewStatus)) {
      status = CM.ENUM.TRANSACTION_STATUS.IN_REVIEW
    } 
    return status;
  }

}
export default new KytHelper()