interface KAFKA_PAYLOAD {
  randomString?: string;
  topicName: string;
  type?: string;
  code?: string;
  data?: {
    [key: string]: any;
  };
}

export { KAFKA_PAYLOAD };
