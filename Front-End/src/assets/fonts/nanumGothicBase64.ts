/**
 * NanumGothic 폰트 Base64 인코딩 문자열
 * 
 * 이 파일을 생성하려면:
 * 1. NanumGothic.ttf 파일을 준비합니다
 * 2. 온라인 Base64 변환 도구를 사용하거나, 다음 명령어를 사용합니다:
 *    - Windows PowerShell: [Convert]::ToBase64String([IO.File]::ReadAllBytes("NanumGothic.ttf"))
 *    - Linux/Mac: base64 -i NanumGothic.ttf
 * 3. 변환된 Base64 문자열을 아래 상수에 붙여넣습니다
 * 
 * 참고: Base64 문자열은 매우 깁니다 (수백 KB ~ 수 MB)
 */

// TODO: NanumGothic.ttf 파일을 Base64로 변환하여 아래에 붙여넣으세요
// 예시: export const NANUM_GOTHIC_BASE64 = "AAEAAAASAQAABAAgDR...";
export const NANUM_GOTHIC_BASE64 = "";

/**
 * 폰트가 로드되었는지 확인
 */
export function isFontLoaded(): boolean {
  return NANUM_GOTHIC_BASE64.length > 0;
}
