import { Button } from "./ui/button";
import { ArrowRight, Star } from "lucide-react";
import { HERO_STATS, HERO_IMAGE_URL } from "../constants";
import { scrollToSection } from "../utils";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20">
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE_URL}
          alt="Modern interior"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <span className="text-white/90 text-sm">
              30년 경력의 전문가
            </span>
          </div>

          <h1 className="text-white mb-6">
            <span className="block text-5xl md:text-7xl mb-2">
              품격있는 공간,
            </span>
            <span className="block text-5xl md:text-7xl">
              동서가 만듭니다
            </span>
          </h1>

          <p className="text-white/90 text-xl mb-8 max-w-2xl">
            창호, 도어, 중문까지 프리미엄 인테리어 솔루션을
            제공합니다.
            <br />
            정확한 시공과 합리적인 가격으로 고객님의 만족을
            책임집니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={() => scrollToSection("quote")}
              className="text-lg px-8 py-6"
            >
              무료 견적 상담받기
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 bg-white hover:bg-gray-100"
            >
              시공사례 보기
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-white/20">
            {HERO_STATS.map((stat, index) => (
              <div key={index}>
                <div className="text-white text-4xl mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80 text-sm">
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