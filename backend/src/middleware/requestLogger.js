import { logger } from '../utils/logger.js';

export function requestLogger(req, res, next) {
    logger.info(`Incoming Request: ${req.method} ${req.originalUrl} from ${req.ip}`);

    next();
}