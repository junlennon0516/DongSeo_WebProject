import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Send } from 'lucide-react';
import { QUOTE_ITEMS, QUOTE_CATEGORIES } from '../../constants';
import { formatCurrency } from '../../utils';

interface CheckboxTabProps {
  selectedItems: string[];
  onItemToggle: (itemId: string) => void;
  onSubmit: () => void;
}

export function CheckboxTab({ selectedItems, onItemToggle, onSubmit }: CheckboxTabProps) {
  const calculateTotal = (): number => {
    return selectedItems.reduce((total, itemId) => {
      const item = QUOTE_ITEMS.find(i => i.id === itemId);
      return total + (item?.price || 0);
    }, 0);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6 bg-pastel-100 border-2 border-pastel-300 shadow-lg shadow-pastel-200/20 rounded-3xl">
        <h3 className="mb-6">시공 항목을 선택하세요</h3>
        
        <div className="space-y-6">
          {QUOTE_CATEGORIES.map(category => (
            <div key={category}>
              <h4 className="mb-3 pb-2 border-b">{category}</h4>
              <div className="space-y-3">
                {QUOTE_ITEMS.filter(item => item.category === category).map(item => (
                  <div key={item.id} className="flex items-start gap-3 p-3 border-2 border-pastel-300 rounded-lg hover:bg-pastel-200 hover:border-pastel-400 transition-colors bg-pastel-100">
                    <Checkbox
                      id={item.id}
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => onItemToggle(item.id)}
                      className="mt-1"
                    />
                    <label htmlFor={item.id} className="flex-1 cursor-pointer">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-pastel-700 font-semibold">{formatCurrency(item.price)}원</span>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6 sticky top-4 bg-pastel-100 border-2 border-pastel-300 shadow-lg shadow-pastel-200/20 rounded-3xl">
          <h4 className="mb-4">견적 요약</h4>
          
          {selectedItems.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              항목을 선택해주세요
            </p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {selectedItems.map(id => {
                  const item = QUOTE_ITEMS.find(i => i.id === id);
                  return (
                    <div key={id} className="flex justify-between text-sm">
                      <span>{item?.name}</span>
                      <span className="text-gray-600">{formatCurrency(item?.price || 0)}원</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">총 금액</span>
                  <span className="text-2xl text-pastel-700">
                    {formatCurrency(calculateTotal())}원
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">* VAT 별도</p>
              </div>

              <Button onClick={onSubmit} size="lg" className="w-full">
                <Send className="mr-2 w-5 h-5" />
                견적서 받기
              </Button>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h4 className="mb-3">안내사항</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-pastel-700">•</span>
              <span>표시된 가격은 기본 시공 기준입니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pastel-700">•</span>
              <span>현장 상황에 따라 변동될 수 있습니다</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pastel-700">•</span>
              <span>정확한 견적은 현장 방문 후 제공됩니다</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

