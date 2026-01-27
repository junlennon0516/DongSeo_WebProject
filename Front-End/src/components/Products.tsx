import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { PRODUCTS } from '../constants';
import { scrollToSection } from '../utils';
import { Frame, DoorOpen, Move } from 'lucide-react';

export function Products() {
  const productIcons = [Frame, DoorOpen, Move];
  
  return (
    <section id="products" className="py-20 bg-[#FFF8DE]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4 bg-gradient-to-r from-gray-900 via-[#8CA9FF] to-gray-900 bg-clip-text text-transparent">주요 제품</h2>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            엄선된 자재와 최신 기술로 제작된 프리미엄 제품을 만나보세요
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PRODUCTS.map((product, index) => {
            const IconComponent = productIcons[index] || Frame;
            return (
              <Card key={index} className="overflow-hidden hover:shadow-2xl hover:shadow-[#AAC4F5]/40 transition-all duration-500 group cursor-pointer rounded-3xl border-2 border-[#AAC4F5] hover:border-[#8CA9FF] hover:-translate-y-2 bg-[#FFF2C6] shadow-lg shadow-[#AAC4F5]/20">
              <div className="relative h-72 overflow-hidden">
                {/* 그라데이션 배경 */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#AAC4F5] via-[#FFF2C6] to-[#FFF8DE] group-hover:from-[#8CA9FF] group-hover:via-[#AAC4F5] group-hover:to-[#FFF2C6] transition-all duration-700"></div>
                
                {/* 패턴 오버레이 */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238CA9FF' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
                
                {/* 아이콘 중앙 배치 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                    <IconComponent className="w-16 h-16 text-[#8CA9FF] group-hover:text-[#7A99FF] transition-colors" />
                  </div>
                </div>
                
                {/* 장식 원형 요소 */}
                <div className="absolute top-8 right-8 w-24 h-24 bg-[#8CA9FF]/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute bottom-8 left-8 w-20 h-20 bg-[#AAC4F5]/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-gradient-to-r from-[#8CA9FF] to-[#AAC4F5] text-white border-0 shadow-lg shadow-[#8CA9FF]/30 px-3 py-1.5 font-semibold">
                    {product.category}
                  </Badge>
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-3 text-xl font-bold text-gray-800 group-hover:text-[#8CA9FF] transition-colors">{product.title}</h3>
                <p className="text-gray-700 mb-5 leading-relaxed">{product.description}</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-[#AAC4F5] text-gray-700 hover:bg-[#FFF8DE] hover:border-[#8CA9FF] transition-colors">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-700">
            더 많은 제품이 궁금하신가요?{' '}
            <button 
              onClick={() => scrollToSection('quote')}
              className="text-[#8CA9FF] hover:underline font-medium"
            >
              상담 문의하기
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}