import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { PRODUCTS } from '../constants';
import { scrollToSection } from '../utils';
import { Frame, DoorOpen, Move } from 'lucide-react';

export function Products() {
  const productIcons = [Frame, DoorOpen, Move];
  
  return (
    <section id="products" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4">주요 제품</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            엄선된 자재와 최신 기술로 제작된 프리미엄 제품을 만나보세요
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {PRODUCTS.map((product, index) => {
            const IconComponent = productIcons[index] || Frame;
            return (
              <Card key={index} className="overflow-hidden hover:shadow-2xl hover:shadow-pastel-200/40 transition-all duration-500 group cursor-pointer rounded-3xl border-2 border-pastel-300 hover:border-pastel-400 hover:-translate-y-2 bg-pastel-100 shadow-lg shadow-pastel-200/20">
              <div className="relative h-72 overflow-hidden">
                {/* 그라데이션 배경 */}
                <div className="absolute inset-0 bg-gradient-to-br from-pastel-200 via-pastel-100 to-pastel-300 group-hover:from-pastel-300 group-hover:via-pastel-200 group-hover:to-pastel-400 transition-all duration-700"></div>
                
                {/* 패턴 오버레이 */}
                <div className="absolute inset-0 opacity-50" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffda85' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}></div>
                
                {/* 아이콘 중앙 배치 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                    <IconComponent className="w-16 h-16 text-pastel-700 group-hover:text-pastel-800 transition-colors" />
                  </div>
                </div>
                
                {/* 장식 원형 요소 */}
                <div className="absolute top-8 right-8 w-24 h-24 bg-pastel-600/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute bottom-8 left-8 w-20 h-20 bg-pastel-700/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-gradient-to-r from-pastel-600 to-pastel-700 text-white border-0 shadow-lg shadow-pastel-600/30 px-3 py-1.5 font-semibold">
                    {product.category}
                  </Badge>
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-3 text-xl font-bold text-gray-800 group-hover:text-pastel-700 transition-colors">{product.title}</h3>
                <p className="text-gray-600 mb-5 leading-relaxed">{product.description}</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs border-pastel-200 text-gray-600 hover:bg-pastel-50 hover:border-pastel-300 transition-colors">
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
          <p className="text-gray-600">
            더 많은 제품이 궁금하신가요?{' '}
            <button 
              onClick={() => scrollToSection('quote')}
              className="text-pastel-700 hover:underline font-medium"
            >
              상담 문의하기
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}