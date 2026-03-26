/** 当前系统唯一业务分类；后期可扩展 ALLOWED 列表与校验 */
export const PROJECT_ATTACHMENT_CATEGORY_ORIGINAL = '原始附件';

export const ALLOWED_PROJECT_ATTACHMENT_CATEGORIES = [PROJECT_ATTACHMENT_CATEGORY_ORIGINAL] as const;

export type ProjectAttachmentCategory = (typeof ALLOWED_PROJECT_ATTACHMENT_CATEGORIES)[number];
