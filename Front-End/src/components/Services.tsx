import { Card } from './ui/card';
import { SERVICES, FEATURES } from '../constants';

export function Services() {
  return (
    <section id="services" className="py-20 bg-gray-50">
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
              <Card key={index} className="p-8 hover:shadow-xl transition-shadow bg-white">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <IconComponent className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-6">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-3"></div>
                      {feature}
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
              <div key={index} className="flex items-start gap-4 p-6 bg-white rounded-lg">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}