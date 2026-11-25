import superstruct from 'superstruct';

import { HttpException } from '../../exceptions/HttpException.js';
import { BadRequestException } from '../../exceptions/BadRequestException.js';
import { NotFoundException } from '../../exceptions/NotFoundException.js';
import { InternalServerErrorException } from '../../exceptions/InternalServerErrorException.js';

export function asyncErrorHandler(handler) {
    return async function (req, res) {
        try {
            await handler(req, res);
        } catch (e) {
            // 에러처리 로직을 일관화하기 위해, HttpException 으로 변환합니다.
            const httpException = mapToHttpException(e);
            handleHttpException(httpException, res);
        }
    };
}

// 라우터 밖에서 난 에러(express.json 파싱 실패 등)를 같은 형식으로 응답하는 전역 에러 미들웨어
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    handleHttpException(mapToHttpException(err), res);
}

function handleHttpException(httpError, res) {
    res.status(httpError.status).send({
        name: httpError.name,
        message: httpError.message,
    });
}

/**
 * [에러로직 일관화를 위한, Exception 변환 메서드]
 *
 * 해당 메서드는 항상 HttpException 을 반환합니다.
 *
 * 동작:
 *   1. HttpException 이라면 그대로 반환합니다.
 *   2. Known Error 라면, 해당 에러에 맞는 HttpException 으로 변환합니다.
 *   3. Unknown Error 라면, InternalServerErrorException 으로 변환합니다.
 */
function mapToHttpException(e) {
    if (e instanceof HttpException) {
        return e;
    }

    // Known Error
    if (e instanceof superstruct.StructError) {
        return new BadRequestException('Validation failed', e.message);
    }

    // express.json(body-parser) 에러: 깨진 JSON(400), 너무 큰 본문(413) 등. expose 는 클라이언트 잘못일 때만 true
    if (e?.expose && e.status) {
        return new HttpException({ status: e.status, name: 'Bad request body', message: e.message });
    }

    // Prisma: update/delete 대상 레코드가 없을 때 (P2025)
    if (e?.code === 'P2025') {
        return new NotFoundException('Not found', e.meta?.cause ?? 'Record not found');
    }

    // 마지막까지 처리되지 않았다면, Unknown Error 입니다.
    // InternalServerErrorException 으로 변환합니다.
    return new InternalServerErrorException('Internal server error', e.message);
}
