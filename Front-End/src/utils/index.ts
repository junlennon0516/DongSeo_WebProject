/**
 * 특정 섹션으로 부드럽게 스크롤하는 함수
 */
export const scrollToSection = (id: string): void => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

/**
 * 숫자를 한국어 형식으로 포맷팅 (천 단위 구분)
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('ko-KR');
};

/**
 * 전화번호 형식 검증
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9-]+$/;
  return phoneRegex.test(phone);
};

/**
 * 이메일 형식 검증
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

