import * as amqp from 'amqplib/callback_api';
import * as CM from '../constant/response';

class RabbitMqProducer {
  private channel: amqp.Channel | undefined;
  constructor() {
    this.connect();
  }

  public async connect() {
    try {
      let connectionUrl = process.env.RABITMQ_CON_URL || '';
      amqp.connect(connectionUrl, (err, conn) => {
        if (err) {
          console.log('ERROR WHILE CONNECTING RABBIT MQ::', err);
          return false;
        } else
          conn?.createChannel(async (error, ch) => {
            if (error) {
              console.log('ERROR WHILE CONNECTING RABBIT CHANNEL::', error);
              return false;
            } else {
              ch.prefetch(1);
              this.channel = ch;

              for (let queue of Object.values(CM.RABBIT_MQ.QUEUE)) {
                console.log('RABBIT_MQ QUEUE ', queue);
                // creating queue
                this.channel.assertQueue(queue, {
                  durable: true,
                });
              }
            }
          });
      });
    } catch (error) {
      console.log('error while connecting rabbit', error);
      return false;
    }
  }

  sendToqueue = async (queue: string, data: any) => {
    try {
      if (this.channel)
        this.channel.sendToQueue(`${queue}`, Buffer.from(data), {
          persistent: true,
        });
    } catch (error) {
      console.log('ERROR WHILE CREATING QUEUE ', error, queue.toString());
      return false;
    }
  };
}
export default new RabbitMqProducer();
