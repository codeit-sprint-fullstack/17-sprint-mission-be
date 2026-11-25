import { coerce, integer, min, string } from 'superstruct';

// URL 파라미터(문자열)를 1 이상의 정수 ID로 변환합니다. ('abc', '0', '1.5' 등은 400 에러)
export const IdStruct = coerce(min(integer(), 1), string(), (value) => Number(value));
