import BadRequestError from '../errors/BadRequestError.js';

function parseInteger(value, defaultValue, max, message) {
    if (value === undefined) return defaultValue;

    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > max) {
        throw new BadRequestError(message);
    }
    return number;
}

export function parsePagination(query) {
    return {
        page: parseInteger(
            query.page,
            1,
            Number.MAX_SAFE_INTEGER,
            'page는 1 이상의 정수여야 합니다.',
        ),
        pageSize: parseInteger(
            query.pageSize,
            10,
            100,
            'pageSize는 1 이상 100 이하의 정수여야 합니다.',
        ),
    };
}
