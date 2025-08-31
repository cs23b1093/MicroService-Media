import amqp from "amqplib";
import logger from "./logger.js";

const EXCHANGE_NAME = "post-service"; // use as exchange

class RabbitMQ {
  constructor() {
    this.connection = null;
    this.channels = new Map();
    this.url = null;
  }

  async connect(url) {
    this.url = url || this.url || "amqp://localhost:5672";
    if (this.connection) return this.connection;

    try {
      this.connection = await amqp.connect(this.url);

      this.connection.on("error", (err) => {
        logger.error("RabbitMQ connection error:", err);
        this.connection = null;
      });

      this.connection.on("close", () => {
        logger.warn("RabbitMQ connection closed. Reconnecting...");
        this.connection = null;
        setTimeout(() => this.connect(this.url), 5000);
      });

      logger.info("Connected to RabbitMQ");
      return this.connection;
    } catch (error) {
      logger.error("Failed to connect to RabbitMQ", error);
      this.connection = null;
      setTimeout(() => this.connect(this.url), 5000);
      throw error;
    }
  }

  async createChannel() {
    if (this.channels.has(EXCHANGE_NAME)) return this.channels.get(EXCHANGE_NAME);

    const conn = await this.connect();
    const channel = await conn.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    await channel.prefetch(10);

    this.channels.set(EXCHANGE_NAME, channel);
    logger.info(`Channel + Exchange "${EXCHANGE_NAME}" ready`);
    return channel;
  }

  async publishEvent(routingKey, message) {
    const channel = await this.createChannel();
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    logger.info(`Event published to "${routingKey}"`);
  }

  async consumeEvent(routingKey, callback, queueName = "") {
    const channel = await this.createChannel();

    const q = await channel.assertQueue(queueName, { exclusive: queueName === "", durable: queueName !== "" });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);

    channel.consume(q.queue, (msg) => {
      if (msg) {
        const data = JSON.parse(msg.content.toString());
        callback(data, msg, channel);
        channel.ack(msg);
      }
    });

    logger.info(`Listening for "${routingKey}" on queue "${q.queue}"`);
  }
}

export default new RabbitMQ();
