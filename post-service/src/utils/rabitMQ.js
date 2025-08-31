import amqp from 'amqplib';
import logger from './logger.js';

const channelName = 'post-service';

class RabbitMQ {
    constructor() {
        this.connection = null;
        this.channels = new Map();
        this.url = null;
    }

    async connect(url) {
        this.url = url || this.url || "amqp://localhost:5672";

        if (this.connection) {
            return this.connection;
        }
        
        try {
            this.connection = await amqp.connect(this.url);

            this.connection.on('error', (err) => {
                logger.error('RabbitMQ connection error:', err);
                this.connection = null;
            });

            this.connection.on('close', () => {
                logger.warn('RabbitMQ connection closed. Reconnecting in 5 seconds...');
                this.connection = null;
                setTimeout(() => {
                    this.connect(this.url);
                }, 5000);
            });

            logger.info('Connected to RabbitMQ');
            return this.connection;
        } catch (error) {
            logger.error('Failed to connect to RabbitMQ. Retrying in 5 seconds...', error);
            // Clean up and schedule a retry
            this.connection = null;
            setTimeout(() => {
                this.connect(this.url);
            }, 5000);
            // Throw error to let the initial caller know the connection failed
            throw error;
        }
    }

    async createChannel() {
        if (!channelName) {
            throw new Error('A channel name must be provided to create a channel.');
        }

        if (this.channels.has(channelName)) {
            return this.channels.get(channelName);
        }

        const conn = await this.connect(); 
        const channel = await conn.createChannel();

        await channel.prefetch(10);
        this.channels.set(channelName, channel);
        logger.info(`RabbitMQ channel "${channelName}" created.`);
        return channel;
    }

    async publishEvent (routingKey, message) {
        if (!this.channels.has(channelName)) {
            await this.createChannel();
        }

        this.channels.get(channelName).publish(channelName, routingKey, Buffer.from(JSON.stringify(message)));
        logger.info(`Event published successfully to ${routingKey}`);
    }

    async consumeEvent (routingKey, callback) {
        if (this.channels.has(channelName)) {
            await this.createChannel();
        }

        const channel = this.channels.get(channelName);
        const q = await channel.assertQueue("", { exclusive: true });
        await channel.bindQueue(q.queue, channelName, routingKey);

        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const message = JSON.parse(msg.content.toString());
                callback(message, msg, channel);
                channel.ack(msg);
            }
        })

        logger.info(`Event consumer for ${routingKey} started.`);
    }
}

export default new RabbitMQ();