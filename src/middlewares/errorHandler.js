import NotFoundError from '../errors/NotFoundError.js';

export default function errorHandler(err, req, res, next) {
    if (err instanceof NotFoundError) {
        return res.status(404).json({ message: err.message });
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)[0].message;
        return res.status(400).json({ message });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({ message: '잘못된 요청입니다.' });
    }

    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
}
