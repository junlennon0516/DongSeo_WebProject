/**
 * API 기본 URL 설정
 * - 개발 환경 (DEV): localhost:8080 사용
 * - 프로덕션 환경: Vercel 프록시(/api) 사용
 *   Vercel의 vercel.json에서 /api/* 요청을 EC2 서버로 프록시
 */
export const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8080/api' 
  : '/api';

/**
 * 환경 정보
 */
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;
