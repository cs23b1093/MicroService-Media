import logger from "../utils/logger.js";

export const ApiVersioning = (version) => (req, res, next) => {
    const url = req.url;
    if(url.startsWith(`/api/${version}`)) next()
    else res.status(400).json({
        success: false,
        message: 'url version is not supported',
        statusCode: 400
    })
}