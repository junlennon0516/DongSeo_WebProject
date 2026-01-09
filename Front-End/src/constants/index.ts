import { DoorOpen, Frame, Sparkles, Shield, Clock, ThumbsUp, Building2, Users, Award, TrendingUp } from 'lucide-react';
import type { Service, Feature, Product, Stat, ProcessStep, QuoteItem } from '../types';

export const NAVIGATION_ITEMS = [
  { id: 'services', label: '서비스' },
  { id: 'products', label: '제품' },
  { id: 'about', label: '회사소개' },
  { id: 'quote', label: '견적문의' },
] as const;

export const CONTACT_INFO = {
  phone: '1588-7003',
  email: '3132200@hanmail.net',
  address: '경기도 시흥시 신현로 463-1(방산동)',
} as const;

export const SERVICES: Service[] = [
  {
    icon: Frame,
    title: '창호 시공',
    description: '단열, 방음, 디자인을 모두 만족하는 고품질 창호 시공',
    features: ['시스템 창호', '샷시 교체', '방음창', '단열창']
  },
  {
    icon: DoorOpen,
    title: '도어 시공',
    description: '주거 공간의 품격을 높이는 프리미엄 도어 솔루션',
    features: ['현관문', '중문', '실내문', '슬라이딩도어']
  },
  {
    icon: Sparkles,
    title: '맞춤 제작',
    description: '공간과 취향에 맞춘 맞춤형 창호/도어 제작',
    features: ['디자인 컨설팅', '맞춤 설계', '다양한 소재', '색상 선택']
  }
];

export const FEATURES: Feature[] = [
  {
    icon: Shield,
    title: '품질 보증',
    description: 'A/S 보증 기간 제공'
  },
  {
    icon: Clock,
    title: '빠른 시공',
    description: '정확한 일정 준수'
  },
  {
    icon: ThumbsUp,
    title: '합리적 가격',
    description: '투명한 견적 시스템'
  }
];

export const PRODUCTS: Product[] = [
  {
    image: 'https://images.unsplash.com/photo-1718066236074-13f8cf7ae93e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBnbGFzcyUyMHdpbmRvd3xlbnwxfHx8fDE3NjY5MjEwMDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: '창호',
    title: '프리미엄 시스템 창호',
    description: '최고급 단열 및 방음 성능',
    tags: ['3중 유리', '단열 우수', 'UPVC']
  },
  {
    image: 'https://images.unsplash.com/photo-1760385737098-0b555a75b2ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBkb29yJTIwZGVzaWdufGVufDF8fHx8MTc2NjkyMTAwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: '도어',
    title: '럭셔리 현관문',
    description: '고급스러운 디자인과 보안성',
    tags: ['디지털도어락', '방범 기능', '고급 마감']
  },
  {
    image: 'https://images.unsplash.com/photo-1731871688430-a3e509d9227e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMHJlbm92YXRpb258ZW58MXx8fHwxNzY2OTIxMDA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: '중문',
    title: '슬라이딩 중문',
    description: '공간 활용도를 높이는 스마트한 선택',
    tags: ['공간 절약', '세련된 디자인', '다양한 색상']
  }
];

export const STATS: Stat[] = [
  {
    icon: Building2,
    value: '20+',
    label: '년 업력',
    description: '오랜 경험으로 쌓은 노하우'
  },
  {
    icon: Users,
    value: '5,000+',
    label: '시공 건수',
    description: '다양한 현장 경험'
  },
  {
    icon: Award,
    value: '98%',
    label: '만족도',
    description: '고객 추천 의향'
  },
  {
    icon: TrendingUp,
    value: '1위',
    label: '지역 점유율',
    description: '신뢰받는 브랜드'
  }
];

export const PROCESS_STEPS: ProcessStep[] = [
  { step: '01', title: '상담', desc: '무료 현장 방문 상담' },
  { step: '02', title: '견적', desc: '정확한 견적 제공' },
  { step: '03', title: '계약', desc: '투명한 계약 진행' },
  { step: '04', title: '시공', desc: '전문가 시공 진행' },
  { step: '05', title: '완료', desc: '최종 점검 및 A/S' }
];

export const QUOTE_ITEMS: QuoteItem[] = [
  { id: '1', category: '창호', name: '시스템 창호 (1㎡ 기준)', price: 350000, description: '3중 유리, 단열/방음 우수' },
  { id: '2', category: '창호', name: '샷시 교체 (1㎡ 기준)', price: 280000, description: '기존 창틀 철거 및 신규 설치' },
  { id: '3', category: '창호', name: '방음창 (1㎡ 기준)', price: 420000, description: '4중 유리, 특수 방음 프레임' },
  { id: '4', category: '도어', name: '현관문 교체', price: 1800000, description: '디지털 도어락 포함, A급 방화문' },
  { id: '5', category: '도어', name: '실내문 (1개)', price: 450000, description: '원목 도어, 손잡이 포함' },
  { id: '6', category: '도어', name: '중문 설치', price: 1200000, description: '슬라이딩 중문, 강화유리' },
  { id: '7', category: '부가서비스', name: '기존 창호 철거', price: 150000, description: '폐기물 처리 포함' },
  { id: '8', category: '부가서비스', name: '실리콘 마감', price: 80000, description: '방수/방습 실리콘 마감' },
  { id: '9', category: '부가서비스', name: '단열재 보강', price: 120000, description: '틈새 단열재 추가 시공' }
];

export const QUOTE_CATEGORIES = ['창호', '도어', '부가서비스'] as const;

export const HERO_STATS = [
  { value: '20+', label: '년 경력' },
  { value: '5,000+', label: '시공 완료' },
  { value: '98%', label: '고객 만족도' },
] as const;

export const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1603430416807-87dd6f9538d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBkb29yJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY2OTIxMDAzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';






