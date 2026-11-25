import { coerce, optional, object, integer, string, min, max, defaulted } from 'superstruct';

// cursor 방식 페이지네이션: cursor(마지막으로 받은 댓글 id) 다음부터 take 개를 가져옵니다.
export const GetCommentListRequestStruct = object({
    cursor: optional(coerce(min(integer(), 1), string(), (value) => Number(value))),
    take: defaulted(
        coerce(max(min(integer(), 1), 100), string(), (value) => Number.parseInt(value, 10)),
        10,
    ),
});
