import BadRequestError from '../errors/BadRequestError.js';

export const MAX_INT = 2147483647;

export function parseId(value) {
    if (!/^\d+$/.test(value)) throw new BadRequestError('잘못된 id입니다.');

    const id = Number(value);
    if (id < 1 || id > MAX_INT) throw new BadRequestError('잘못된 id입니다.');
    return id;
}
