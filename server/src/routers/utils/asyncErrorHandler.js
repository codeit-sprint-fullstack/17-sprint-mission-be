import { StructError } from 'superstruct';
import { HttpException } from '../../exceptions/HttpException.js';

export function asyncErrorHandler(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);
    if (err instanceof HttpException) {
        return res.status(err.status).json({ name: err.name, message: err.message });
    }
    if (err instanceof StructError || err.type === 'entity.parse.failed') {
        return res.status(400).json({ name: 'Validation failed', message: 'Invalid request data' });
    }
    if (err.type === 'entity.too.large') return res.status(413).json({ name: 'Payload too large', message: 'Request body too large' });
    if (err.type === 'charset.unsupported' || err.type === 'encoding.unsupported') {
        return res.status(415).json({ name: 'Unsupported media type', message: 'Unsupported request encoding' });
    }
    if (err.code === 'P2025') return res.status(404).json({ name: 'Not found', message: 'Resource not found' });
    if (err.code === 'P2002' || err.code === 'P2003') {
        return res.status(409).json({ name: 'Conflict', message: 'Resource conflicts with existing data' });
    }
    res.status(500).json({ name: 'Internal server error', message: 'Unexpected server error' });
}
