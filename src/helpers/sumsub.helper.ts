import axios from 'axios';
import { SumsubInterface } from '../interfaces';
import { envAlias } from '../constant/response';

const crypto = require('crypto');

let appToken = envAlias.SUMSUB_APP_TOKEN;
let secretKey = envAlias.SUMSUB_SECRET_KEY;
let baseURL = envAlias.SUMSUB_BASE_URL;

let config: any = {
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
};

const client = axios.create(config);

client.interceptors.request.use(
  (config: any) => createSignature(config, secretKey, appToken),
  (error: object) => Promise.reject(error)
);

const createSignature = (config: any, secretKey: string, appToken: string) => {
  const ts = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac('sha256', secretKey);
  signature.update(ts + config.method.toUpperCase() + config.url);

  if (config.data instanceof FormData) {
    signature.update(config.data.getBuffer());
  } else if (config.data) {
    signature.update(config.data);
  }

  config.headers['X-App-Access-Ts'] = ts;
  config.headers['X-App-Token'] = appToken;
  config.headers['X-App-Access-Sig'] = signature.digest('hex');

  return config;
};

export const getExternalLink = async (
  levelName: string,
  ttlInSecs: number,
  externalUserId: string
) => {
  const url = `/resources/sdkIntegrations/levels/${encodeURIComponent(
    levelName
  )}/websdkLink?ttlInSecs=${encodeURIComponent(
    ttlInSecs
  )}&externalUserId=${encodeURIComponent(externalUserId)}&lang=en`;
  return (await client.post<Record<string, any>>(url)).data.url;
};

export async function createAccessToken(
  userId: string,
  levelName: string
): Promise<SumsubInterface.GetAccessTokenResponse> {
  let sessionTimeout = 60000;
  const url = `/resources/accessTokens?userId=${encodeURIComponent(
    userId
  )}&ttlInSecs=${sessionTimeout}&levelName=${encodeURIComponent(levelName)}`;
  return (await client.post<SumsubInterface.GetAccessTokenResponse>(url)).data;
}

export async function getDocumentImage(
  inspectionId: string,
  imageId: number | string
) {
  const url = `/resources/inspections/${inspectionId}/resources/${imageId}`;
  let response = await client.get(url, {
    responseType: 'arraybuffer',
    transformResponse: (data) => Buffer.from(data, 'binary'),
  });
  return response.data;
}

export const getApplicantDocs = async (applicantId: string) => {
  try {
    const url = `/resources/applicants/${encodeURIComponent(
      applicantId
    )}/requiredIdDocsStatus`;
    return await client.get(url);
  } catch (error) {
    return false;
  }
};

export const submitTransaction = async (transactionPayload: any) => {
  console.log('TRANSACTION PAYLOAD :',transactionPayload);
  
  const submitTransactionApiUrl = `/resources/applicants/-/kyt/txns/-/data?levelName=${encodeURIComponent(transactionPayload.levelName)}`;
  console.log('SUMSUB SUBMIT TXN URL:',submitTransactionApiUrl);
  
  return await client
    .post(submitTransactionApiUrl, JSON.stringify(transactionPayload))
    .then((response) => {
      return response?.data;
    })
    .catch((error) => {
      throw error?.response?.data;
    });
};

export const getApplicantData = async (applicantId: string) => {
  try {
    const questionaireData = `/resources/applicants/${applicantId}/one`;
    return await client
      .get(questionaireData)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log('QUESTIONAIRE DATA ERROR', error.repsonse);
        throw error.repsonse;
      });
  } catch (error) {
    throw error;
  }
};

export const getBeneficiaryDetail = async (applicantId: any) => {
  try {
    const fetchedResponse = `/resources/applicants/${applicantId}/one`;
    return await client.get(fetchedResponse);
  } catch (error) {
    console.log(`ERROR WHILE GET BENEFICIARY DETAIL::`, error);
    return false;
  }
};

export const getUserVerificationStatus = async (applicantId: any) => {
  try {
    const fetchedResponse = `/resources/applicants/${applicantId}/requiredIdDocsStatus`;
    return await client.get(fetchedResponse);
  } catch (error) {
    console.log(`ERROR WHILE GET BENEFICIARY DETAIL::`, error);
    return false;
  }
};

export const getTxnDetailFromSumsub = async (externalTxnId: any) => {
  try {
    const fetchedResponse = `/resources/kyt/txns/-;data.txnId=${externalTxnId}/one`;
    if (fetchedResponse) {
      return (await client.get(fetchedResponse)).data;
    } else {
      return {};
    }
  } catch (error) {
    console.log(`ERROR WHILE GET BENEFICIARY DETAIL::`);
    return {};
  }
};
