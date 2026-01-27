/**
 * API 기본 URL 설정
 *
 * 1. VITE_API_BASE_URL이 있으면 항상 사용 (배포 환경 권장)
 *    - Vercel: Settings → Environment Variables에 추가
 *    - 예: https://api.totaldongseo.com 또는 /api (프록시 사용 시)
 *
 * 2. 없으면:
 *    - 개발(DEV): http://localhost:8080/api
 *    - 프로덕션: /api (Vercel rewrites로 EC2 프록시)
 */
const envUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL =
  typeof envUrl === "string" && envUrl.length > 0
    ? envUrl.replace(/\/$/, "") // trailing slash 제거
    : import.meta.env.DEV
      ? "http://localhost:8080/api"
      : "/api";

/** 배포 환경 디버깅: 브라우저 콘솔에서 로그인 요청 주소 확인용 */
if (import.meta.env.PROD && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[API_BASE_URL]", API_BASE_URL);
}

/**
 * 환경 정보
 */
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

/**
 * NanumGothic 폰트 파일 URL
 * 백엔드 서버에서 제공하는 폰트 파일을 사용
 */
export const getFontUrl = (): string => {
  // API_BASE_URL에서 /api를 제거하고 루트 경로로 변경
  // 예: "http://localhost:8080/api" -> "http://localhost:8080"
  // 예: "/api" -> "" (같은 도메인)
  let baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  
  // 프로덕션에서 /api만 있는 경우 (프록시 사용)
  if (baseUrl === "" || baseUrl === "/") {
    // 같은 도메인에서 제공 (Vercel rewrites를 통해 백엔드로 프록시)
    baseUrl = "";
  }
  
  const fontUrl = `${baseUrl}/NanumGothic-normal.js`;
  
  // 디버깅용 로그
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[getFontUrl] API_BASE_URL:", API_BASE_URL, "→ fontUrl:", fontUrl);
  }
  
  return fontUrl;
};
