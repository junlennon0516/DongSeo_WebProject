import { Button } from "./ui/button";
import { ArrowRight, Star, Bot, Sparkles } from "lucide-react";
import { HERO_STATS } from "../constants";
import { scrollToSection } from "../utils";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        {/* 그라데이션 배경 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#8CA9FF] via-[#AAC4F5] to-[#8CA9FF]"></div>
        
        {/* 패턴 오버레이 */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23 11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23FFF2C6' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`
        }}></div>
        
        {/* 추가 그라데이션 레이어 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF2C6]/10 via-transparent to-[#FFF8DE]/10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#8CA9FF]/60 via-[#AAC4F5]/40 to-transparent"></div>
        
        {/* 빛나는 효과 */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#8CA9FF]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#AAC4F5]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-[#FFF2C6] text-[#FFF2C6] drop-shadow-lg"
                />
              ))}
            </div>
            <span className="text-white/95 text-sm font-medium bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              30년 경력의 전문가
            </span>
          </div>

          <h1 className="text-white mb-8 leading-tight">
            <span className="block text-5xl md:text-7xl mb-3 font-extrabold drop-shadow-2xl bg-gradient-to-r from-white via-[#FFF2C6] to-white bg-clip-text text-transparent animate-slide-up">
              품격있는 공간,
            </span>
            <span className="block text-5xl md:text-7xl font-extrabold drop-shadow-2xl">
              동서가 만듭니다
            </span>
          </h1>

          <p className="text-white/95 text-xl md:text-2xl mb-10 max-w-2xl leading-relaxed font-light">
            창호, 도어, 중문까지 프리미엄 인테리어 솔루션을
            제공합니다.
            <br />
            <span className="text-[#FFF2C6] font-medium">정확한 시공과 합리적인 가격</span>으로 고객님의 만족을
            책임집니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button
              size="lg"
              onClick={() => scrollToSection("quote")}
              className="text-lg px-10 py-7 bg-gradient-to-r from-[#8CA9FF] to-[#AAC4F5] hover:from-[#7A99FF] hover:to-[#9AB4E5] text-white shadow-2xl shadow-[#8CA9FF]/40 hover:shadow-2xl hover:shadow-[#8CA9FF]/50 transition-all duration-300 hover:scale-105 rounded-2xl font-semibold"
            >
              무료 견적 상담받기
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              onClick={() => {
                scrollToSection("quote");
                // AI 탭으로 이동하기 위해 커스텀 이벤트 발생
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('changeTab', { detail: 'ai' }));
                }, 300);
              }}
              className="text-lg px-10 py-7 bg-gradient-to-r from-[#FFF2C6] to-[#FFF8DE] hover:from-[#FFE9B6] hover:to-[#FFF0D6] text-gray-800 shadow-2xl shadow-[#FFF2C6]/40 hover:shadow-2xl hover:shadow-[#FFF2C6]/50 transition-all duration-300 hover:scale-105 rounded-2xl font-semibold relative overflow-hidden group"
            >
              <Sparkles className="absolute top-0 left-0 w-full h-full opacity-20 group-hover:opacity-40 transition-opacity text-[#8CA9FF]" />
              <Bot className="mr-2 w-5 h-5 relative z-10" />
              <span className="relative z-10">AI 상담 시작하기</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-7 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border-2 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 rounded-2xl font-semibold"
            >
              시공사례 보기
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-8 pt-12 border-t border-white/20 backdrop-blur-sm bg-white/5 rounded-3xl p-8">
            {HERO_STATS.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-white text-5xl md:text-6xl mb-3 font-extrabold bg-gradient-to-br from-white to-[#FFF2C6] bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-white/90 text-sm md:text-base font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}