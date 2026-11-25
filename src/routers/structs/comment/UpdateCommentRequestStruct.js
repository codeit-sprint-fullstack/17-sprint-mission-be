import { CreateCommentRequestStruct } from './CreateCommentRequestStruct.js';

// 댓글은 수정할 필드가 content 하나뿐이라 등록과 같은 형태를 사용합니다.
export const UpdateCommentRequestStruct = CreateCommentRequestStruct;
