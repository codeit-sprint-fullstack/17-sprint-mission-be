import { object, nonempty, string } from 'superstruct';

export const CreateCommentRequestStruct = object({
    content: nonempty(string()),
});
