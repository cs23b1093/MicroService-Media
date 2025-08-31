import express from 'express';

export const customMiddleware = (req, res, next) => {
    const timeStamp = new Date().toISOString();
    const url = req.url;
    const userAgent = req.get('User-Agent');
    const method = req.method;
    const content = req.get('Content-Type');
    console.log(`[ [ ${url} ${method} ${content} ${userAgent} ] on ${timeStamp} ]`)
    next();
}