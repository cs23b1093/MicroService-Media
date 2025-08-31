import cors from 'cors';

const alowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
]

export const CorsInitialisation = cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true)
        
        if (alowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS: ', origin))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
    optionsSuccessStatus: 200
})