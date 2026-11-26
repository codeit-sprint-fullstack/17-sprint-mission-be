import { BadRequestException } from './exceptions/BadRequestException.js';

const maxInt = 2147483647;

export function parsePage(value, defaultValue, min, max, label) {
    if (value === undefined && defaultValue !== undefined) return defaultValue;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        throw new BadRequestException('Validation failed', `${label} must be an integer`);
    }
    const result = Number(value);
    if (!Number.isSafeInteger(result) || result < min || result > max) {
        throw new BadRequestException('Validation failed', `${label} must be between ${min} and ${max}`);
    }
    return result;
}

export function parseId(value, label = 'id') {
    return parsePage(value, undefined, 1, maxInt, label);
}
