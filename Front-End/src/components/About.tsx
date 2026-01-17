import { Card } from './ui/card';
import { STATS, PROCESS_STEPS } from '../constants';

export function About() {
  return (
    <section id="about" className="py-20 bg-pastel-50">
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
            <div className="mt-8 p-6 bg-gradient-to-br from-pastel-200 to-pastel-300 rounded-2xl border-l-4 border-pastel-600 shadow-lg shadow-pastel-200/30">
              <p className="text-pastel-900 font-medium text-lg">
                <strong className="text-pastel-800">"품질과 신뢰"</strong>를 최우선 가치로, 고객님께 최상의 서비스를 제공합니다.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {STATS.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="p-8 text-center hover:shadow-2xl hover:shadow-pastel-200/40 transition-all duration-500 bg-pastel-100 rounded-3xl border-2 border-pastel-300 hover:border-pastel-400 hover:-translate-y-2 group shadow-lg shadow-pastel-200/20">
                  <div className="w-16 h-16 bg-gradient-to-br from-pastel-200 to-pastel-300 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-pastel-200/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <IconComponent className="w-8 h-8 text-pastel-700" />
                  </div>
                  <div className="text-5xl mb-3 font-extrabold bg-gradient-to-br from-pastel-700 to-pastel-800 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">{stat.value}</div>
                  <div className="mb-2 font-bold text-gray-800 text-lg">{stat.label}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{stat.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="bg-pastel-100 rounded-3xl p-8 md:p-12 shadow-2xl shadow-pastel-200/30 border-2 border-pastel-300">
          <h3 className="text-center mb-12 text-3xl font-bold text-gray-800">시공 프로세스</h3>
          <div className="grid md:grid-cols-5 gap-6">
            {PROCESS_STEPS.map((process, index) => (
              <div key={index} className="text-center relative group">
                <div className="w-20 h-20 bg-gradient-to-br from-pastel-600 to-pastel-700 text-black rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-bold shadow-lg shadow-pastel-600/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  {process.step}
                </div>
                <h4 className="mb-3 font-bold text-gray-800 group-hover:text-pastel-700 transition-colors">{process.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{process.desc}</p>
                {index < PROCESS_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-1 bg-gradient-to-r from-pastel-200 to-pastel-300 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
