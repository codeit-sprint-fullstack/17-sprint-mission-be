export default class BadRequestError extends Error {
    constructor(message = '잘못된 요청입니다.') {
        super(message);
        this.name = 'BadRequestError';
    }
}
