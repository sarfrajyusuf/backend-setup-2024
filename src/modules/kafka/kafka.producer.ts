import { Kafka, Producer, Admin } from 'kafkajs';
import { KAFKA } from '../../constant/response';
const kafkaCred = {
  clientId: KAFKA.CREDS.CLIENT_ID,
  brokers: [KAFKA.CREDS.BROKER],
};
const kafka = new Kafka(kafkaCred);

class KafkaProducer {
  public producer: Producer;
  private admin: Admin;
  private isConnected: boolean;
  constructor() {
    this.isConnected = false;
    this.producer = kafka.producer();
    this.admin = kafka.admin();
  }

  public connect = async () => {
    try {
      await this.producer
        .connect()
        .then(async (res) => {
          this.isConnected = true;
          console.log('KAFKA CONECTED PRODUCER:: ', this.isConnected);
        })
        .catch((err) => {
          console.log('ERROR IN CONNECTING PRODUCER', err);
        });
    } catch (error) {
      console.log(`ERROR IN KAFKA CONNECT::`, error);
    }
  };
  public send = async (
    topicName: string,
    topicPayload: Array<object> | string
  ) => {
    try {
      console.log('TOPIC PAYLOADD', topicPayload, topicName);
      if (this.isConnected) {
        await this.producer.send({
          topic: topicName,
          messages: [{ value: JSON.stringify(topicPayload) }],
        });
        console.log('KAFKA SEND DATA:: ', this.isConnected);
      } else {
        throw false;
      }
    } catch (error) {
      console.log('KAFKA IS NOT CONNECTED', error);
      return false;
    }
  };
  public disconnect = async () => {
    try {
      if (this.isConnected) {
        await this.producer.disconnect();
        console.log('KAFKA CLOSED CONNECTION:: ', this.isConnected);
      }
    } catch (error) {
      return false;
    }
  };
  public createTopics = async () => {
    try {
      await this.admin
        .connect()
        .then(async (res) => {
          console.log('KAFKA CREATED ALL TOPICS :: ');
          await this.admin.createTopics({
            topics: KAFKA.INIT_TOPICS,
          });
        })
        .catch((err) => {
          console.log('ERROR IN CONNECTING PRODUCER', err);
          throw err;
        });
      await this.admin.disconnect();
    } catch (error) {
      console.log('ERROR IN CONNECTING PRODUCER WHILE CREATE TOPICS', error);
    }
  };
}
export default new KafkaProducer();
