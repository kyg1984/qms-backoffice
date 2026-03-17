/** 웹뷰에서 인라인 렌더링 가능한 파일 확장자 */
export const WEB_VIEW_EXTS: readonly string[] = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

/** 업로드 가능한 최대 파일 크기 (bytes) */
export const MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024; // 300MB

/** 파일 확장자가 웹뷰 지원 여부 확인 */
export const isWebViewSupported = (ext: string): boolean =>
  WEB_VIEW_EXTS.includes(ext.toLowerCase());
