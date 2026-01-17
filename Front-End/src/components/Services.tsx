import { Card } from './ui/card';
import { SERVICES, FEATURES } from '../constants';

export function Services() {
  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4">전문 시공 서비스</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            20년 경험의 전문가들이 완벽한 시공으로 고객님의 공간을 새롭게 만들어 드립니다
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {SERVICES.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card key={index} className="p-8 hover:shadow-2xl hover:shadow-pastel-200/50 transition-all duration-500 bg-pastel-100 rounded-3xl border-2 border-pastel-300 hover:border-pastel-400 hover:-translate-y-2 group shadow-lg shadow-pastel-200/20">
                <div className="w-20 h-20 bg-gradient-to-br from-pastel-200 to-pastel-300 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pastel-200/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <IconComponent className="w-10 h-10 text-pastel-700" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-gray-800">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-700 group/item">
                      <div className="w-2 h-2 bg-gradient-to-br from-pastel-600 to-pastel-700 rounded-full mr-3 group-hover/item:scale-150 transition-transform duration-300"></div>
                      <span className="group-hover/item:text-pastel-700 transition-colors">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="flex items-start gap-4 p-6 bg-pastel-100 rounded-2xl border-2 border-pastel-300 hover:border-pastel-400 hover:shadow-lg transition-all duration-300 group shadow-md shadow-pastel-200/10">
                <div className="w-14 h-14 bg-gradient-to-br from-pastel-200 to-pastel-300 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-pastel-200/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <IconComponent className="w-7 h-7 text-pastel-700" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-2 font-bold text-gray-800 group-hover:text-pastel-700 transition-colors">{feature.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}