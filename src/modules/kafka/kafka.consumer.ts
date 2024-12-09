import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { KAFKA } from '../../constant/response';
import * as Helpers from '../../helpers';
const kafkaCred = {
  clientId: KAFKA.CREDS.CLIENT_ID,
  brokers: [KAFKA.CREDS.BROKER],
};
const kafka = new Kafka(kafkaCred);

class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor() {
    this.kafka = kafka;
    this.consumer = this.kafka.consumer({
      groupId: Helpers.utilitiesHelper.generateRandomString(30),
    });
  }

  async run() {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({
        topics: KAFKA.CONSUMERS_TOPICS,
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async ({ topic, message }: EachMessagePayload) => {
          console.log(
            `Received message on topic ${topic}: ${message?.value?.toString()}`
          );
          const data = message?.value?.toString();
        },
      });
    } catch (error) {
      console.log(`KAFKA CONSUMER ERROR::`, error);
    }
  }
}

export { KafkaConsumer };
