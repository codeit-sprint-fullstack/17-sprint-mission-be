import { Prisma } from '../../generated/prisma/client.ts';
import NotFoundError from '../errors/NotFoundError.js';
import BadRequestError from '../errors/BadRequestError.js';

export default function errorHandler(err, req, res, next) {
    if (err instanceof NotFoundError) {
        return res.status(404).json({ message: err.message });
    }

    if (err instanceof BadRequestError) {
        return res.status(400).json({ message: err.message });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
            return res
                .status(404)
                .json({ message: '요청한 대상을 찾을 수 없습니다.' });
        }
        // PostgreSQL은 NUL 문자를 받지 못한다 (오류 코드 22021)
        if (err.meta?.driverAdapterError?.cause?.originalCode === '22021') {
            return res
                .status(400)
                .json({ message: '사용할 수 없는 문자가 포함되어 있습니다.' });
        }
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: '요청 본문이 너무 큽니다.' });
    }

    if (err instanceof SyntaxError && err.status === 400) {
        return res
            .status(400)
            .json({ message: '요청 본문이 올바른 JSON이 아닙니다.' });
    }

    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
}
