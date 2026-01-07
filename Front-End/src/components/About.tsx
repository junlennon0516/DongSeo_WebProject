import { Card } from './ui/card';
import { STATS, PROCESS_STEPS } from '../constants';

export function About() {
  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="mb-6">동서인테리어를 선택해야 하는 이유</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                동서인테리어는 20년 이상의 경력을 바탕으로 창호, 도어 전문 시공 서비스를 제공하고 있습니다.
              </p>
              <p>
                고객님의 공간을 완벽히 이해하고, 최적의 솔루션을 제안하며, 정확하고 신속한 시공으로 만족을 드립니다.
              </p>
              <p>
                프리미엄 자재 사용, 숙련된 기술진, 합리적인 가격, 그리고 철저한 A/S까지 - 
                동서인테리어는 고객님의 소중한 공간을 책임지겠습니다.
              </p>
            </div>
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-600">
              <p className="text-blue-900">
                <strong>"품질과 신뢰"</strong>를 최우선 가치로, 고객님께 최상의 서비스를 제공합니다.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {STATS.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow bg-white">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="text-4xl mb-2 text-blue-600">{stat.value}</div>
                  <div className="mb-1">{stat.label}</div>
                  <p className="text-sm text-gray-600">{stat.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
          <h3 className="text-center mb-8">시공 프로세스</h3>
          <div className="grid md:grid-cols-5 gap-6">
            {PROCESS_STEPS.map((process, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                  {process.step}
                </div>
                <h4 className="mb-2">{process.title}</h4>
                <p className="text-sm text-gray-600">{process.desc}</p>
                {index < PROCESS_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gray-200"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
