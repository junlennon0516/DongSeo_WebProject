import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { PRODUCTS } from '../constants';
import { scrollToSection } from '../utils';

export function Products() {
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
          {PRODUCTS.map((product, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <div className="relative h-72 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-blue-600 text-white">{product.category}</Badge>
                </div>
              </div>
              <div className="p-6">
                <h3 className="mb-2">{product.title}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            더 많은 제품이 궁금하신가요?{' '}
            <button 
              onClick={() => scrollToSection('quote')}
              className="text-blue-600 hover:underline font-medium"
            >
              상담 문의하기
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}