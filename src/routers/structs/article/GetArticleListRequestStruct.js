import {
    coerce,
    optional,
    object,
    integer,
    string,
    min,
    max,
    enums,
    nonempty,
    defaulted,
} from 'superstruct';

// offset 방식 페이지네이션: skip 개를 건너뛰고 take 개를 가져옵니다.
export const GetArticleListRequestStruct = object({
    skip: defaulted(
        coerce(min(integer(), 0), string(), (value) => Number.parseInt(value, 10)),
        0,
    ),
    take: defaulted(
        coerce(max(min(integer(), 1), 100), string(), (value) => Number.parseInt(value, 10)),
        10,
    ),
    orderBy: optional(enums(['recent'])),
    word: optional(nonempty(string())),
});
