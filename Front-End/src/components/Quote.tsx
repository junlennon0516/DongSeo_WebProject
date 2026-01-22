import { CalculatorTab } from './Quote/CalculatorTab';
import { WoodTab } from './Quote/WoodTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Calculator, Package } from 'lucide-react';

export function Quote() {
  return (
    <section id="quote" className="py-20 bg-white pt-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-6 text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent">
            견적 계산
          </h2>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            제품을 선택하고 옵션을 설정하여 견적을 계산하세요.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="mb-6 bg-pastel-100 border-2 border-gray-400 p-1">
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                도어/문틀 견적
              </TabsTrigger>
              <TabsTrigger value="wood" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                목재 자재
              </TabsTrigger>
            </TabsList>
            <TabsContent value="calculator">
              <CalculatorTab />
            </TabsContent>
            <TabsContent value="wood">
              <WoodTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}