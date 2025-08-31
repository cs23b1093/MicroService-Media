import { rateLimit } from 'express-rate-limit'

export const  limiter = (max, time) => rateLimit({
    max: max,
    windowMs: time,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    message: 'too many request, Please try again'
})