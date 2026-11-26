import BadRequestError from '../errors/BadRequestError.js';

export function parseText(value, message) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new BadRequestError(message);
    }
    return value.trim();
}
