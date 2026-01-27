import { useState, useEffect } from 'react';
import { CalculatorTab } from './Quote/CalculatorTab';
import { WoodTab } from './Quote/WoodTab';
import { AIChatTab } from './Quote/AIChatTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Calculator, Package, Bot } from 'lucide-react';

export function Quote() {
  const [activeTab, setActiveTab] = useState('calculator');

  // URL 해시나 쿼리 파라미터로 탭 전환 지원
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#ai' || hash === '#ai-chat') {
        setActiveTab('ai');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 전역 이벤트로 탭 전환 지원 (Hero에서 사용)
  useEffect(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };

    window.addEventListener('changeTab', handleTabChange);
    return () => window.removeEventListener('changeTab', handleTabChange);
  }, []);

  return (
    <section id="quote" className="py-20 bg-gradient-to-b from-[#FFF8DE] via-[#FFF2C6] to-[#FFF8DE] pt-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-6 text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-[#8CA9FF] to-gray-900 bg-clip-text text-transparent">
            견적 계산
          </h2>
          <p className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            제품을 선택하고 옵션을 설정하여 견적을 계산하세요.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 bg-[#FFF2C6] p-1.5 rounded-xl">
              <TabsTrigger value="calculator" className="flex items-center gap-2 data-[state=active]:bg-[#8CA9FF] data-[state=active]:text-white data-[state=active]:shadow-md">
                <Calculator className="w-4 h-4" />
                도어/문틀 견적
              </TabsTrigger>
              <TabsTrigger value="wood" className="flex items-center gap-2 data-[state=active]:bg-[#8CA9FF] data-[state=active]:text-white data-[state=active]:shadow-md">
                <Package className="w-4 h-4" />
                목재 자재
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2 data-[state=active]:bg-[#8CA9FF] data-[state=active]:text-white data-[state=active]:shadow-md">
                <Bot className="w-4 h-4" />
                AI 상담
              </TabsTrigger>
            </TabsList>
            <TabsContent value="calculator">
              <CalculatorTab />
            </TabsContent>
            <TabsContent value="wood">
              <WoodTab />
            </TabsContent>
            <TabsContent value="ai">
              <AIChatTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}