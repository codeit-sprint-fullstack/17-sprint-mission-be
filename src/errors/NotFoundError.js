export default class NotFoundError extends Error {
    constructor(message = '상품을 찾을 수 없습니다.') {
        super(message);
        this.name = 'NotFoundError';
    }
}
