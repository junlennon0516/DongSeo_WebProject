import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Send, Phone, Mail, MapPin } from 'lucide-react';
import { CONTACT_INFO } from '../../constants';
import type { FormData } from '../../types';

interface FormTabProps {
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function FormTab({ formData, onChange, onSubmit }: FormTabProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-12">
      <Card className="p-8 bg-white border-2 border-pastel-200 shadow-lg shadow-pastel-200/20 rounded-3xl">
        <h3 className="mb-6">견적 신청서</h3>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={onChange}
              placeholder="홍길동"
              required
              className="bg-white"
            />
          </div>

          <div>
            <Label htmlFor="phone">연락처 *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={onChange}
              placeholder="010-1234-5678"
              required
              className="bg-white"
            />
          </div>

          <div>
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              placeholder="example@email.com"
              className="bg-white"
            />
          </div>

          <div>
            <Label htmlFor="service">시공 종류</Label>
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={onChange}
              className="w-full px-3 py-2 border border-pastel-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-pastel-600"
            >
              <option value="">선택해주세요</option>
              <option value="window">창호</option>
              <option value="door">도어</option>
              <option value="middle-door">중문</option>
              <option value="all">전체</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div>
            <Label htmlFor="address">시공 주소</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={onChange}
              placeholder="서울시 강남구..."
              className="bg-white"
            />
          </div>

          <div>
            <Label htmlFor="message">상세 내용</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={onChange}
              placeholder="시공하실 내용을 자세히 적어주세요"
              rows={4}
              className="bg-white"
            />
          </div>

          <Button type="submit" size="lg" className="w-full">
            <Send className="mr-2 w-5 h-5" />
            견적 문의하기
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="p-8 bg-pastel-100 border-2 border-pastel-300 shadow-lg shadow-pastel-200/20 rounded-3xl">
          <h3 className="mb-6">연락처 정보</h3>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-pastel-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-pastel-700" />
              </div>
              <div>
                <h4 className="mb-1">전화 문의</h4>
                <a href={`tel:${CONTACT_INFO.phone}`} className="text-gray-600 hover:text-pastel-700">
                  {CONTACT_INFO.phone}
                </a>
                <p className="text-sm text-gray-500 mt-1">평일 09:00 - 18:00</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-pastel-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-pastel-700" />
              </div>
              <div>
                <h4 className="mb-1">이메일</h4>
                <a href={`mailto:${CONTACT_INFO.email}`} className="text-gray-600 hover:text-pastel-700">
                  {CONTACT_INFO.email}
                </a>
                <p className="text-sm text-gray-500 mt-1">24시간 접수 가능</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-pastel-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-pastel-700" />
              </div>
              <div>
                <h4 className="mb-1">본사 위치</h4>
                <p className="text-gray-600">
                  {CONTACT_INFO.address}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-br from-pastel-600 to-pastel-700 text-pastel-50">
          <h3 className="mb-4">빠른 상담 원하세요?</h3>
          <p className="mb-6 text-pastel-100">
            전화 한 통으로 전문 상담사와 즉시 상담 가능합니다.
          </p>
          <a href={`tel:${CONTACT_INFO.phone}`}>
            <Button size="lg" className="w-full bg-white text-pastel-700 hover:bg-gray-100">
              <Phone className="mr-2 w-5 h-5" />
              지금 전화하기
            </Button>
          </a>
        </Card>
      </div>
    </div>
  );
}






