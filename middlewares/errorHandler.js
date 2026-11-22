export default function errorHandler(err, req, res, next) {
    if (err.name === 'ValidationError')
        return res.status(400).json({ message: err.message });
    if (err.name === 'CastError')
        return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });

    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
}
