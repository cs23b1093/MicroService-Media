import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config()
const dbConnect = async () => {
    const url = process.env.MONGOOSE_URI || '';
    if (!url) throw new Error('mongoose url is not defined!');

    try {
        const connection = await mongoose.connect(url)
        if(!connection) throw new Error('No connection found', 400);
        console.log(`MongoDb connected successfully on ${connection.connection.host}`)
    } catch (error) {
        console.error('Error: ', error.message);
    }
}

export default dbConnect;