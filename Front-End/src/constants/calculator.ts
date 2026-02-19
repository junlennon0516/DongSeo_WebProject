/**
 * 계산기 관련 상수
 */
export const COMPANY_ID = 1; // 쉐누
/** 우딘 (발포 문틀 등) - DB companies.code='WOODIN' 인 회사의 id와 맞출 것 */
export const WOODIN_COMPANY_ID = 11;

/** 쉐누 메인 카테고리에서 제외할 이름 (도어/문틀 외 잘못 들어간 목재·자재 등) */
export const CHENOUS_EXCLUDE_CATEGORY_NAMES = [
  "합판",
  "석고보드",
  "목재 각재",
  "철물 부자재",
  "MDF",
];

export const DEFAULT_TYPE_NAME = "일반형 3방";

export const DEFAULT_QUANTITY = 1;

// ABS 도어 기본 사이즈
export const DEFAULT_ABS_DOOR_WIDTH = "1000";
export const DEFAULT_ABS_DOOR_HEIGHT = "2100";
