import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Bot, Send, Loader2, Calculator, ShoppingCart, RefreshCw, Plus, Trash2, CreditCard, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import type { ExtendedEstimateResponse, CartItem } from '../../types/calculator';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 동서인테리어 AI 상담사입니다. 도어, 문틀, 목재 자재에 대한 견적 상담을 도와드리겠습니다. 무엇을 도와드릴까요?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 예상 견적 및 장바구니 (CalculatorTab과 동일한 구조)
  const [result, setResult] = useState<ExtendedEstimateResponse | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // 메시지 추가 시 스크롤
  useEffect(() => {
    // ScrollArea의 viewport를 직접 찾아서 스크롤
    const scrollContainer = document.querySelector('[data-slot="scroll-area-viewport"]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  // 견적 관련 키워드 감지
  const isEstimateQuery = (text: string): boolean => {
    const estimateKeywords = ['견적', '가격', '비용', '얼마', '돈', '원', '개', '필요', '주문', '시공'];
    const lowerText = text.toLowerCase();
    return estimateKeywords.some(keyword => lowerText.includes(keyword));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiApiBaseUrl = import.meta.env.DEV 
        ? 'http://localhost:8000'
        : '/ai-api';

      // 견적 질문인 경우 /analyze 엔드포인트도 함께 호출
      const isEstimate = isEstimateQuery(currentInput);
      let estimateData = null;

      if (isEstimate) {
        try {
          const analyzeResponse = await fetch(`${aiApiBaseUrl}/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: currentInput,
            }),
          });

          if (analyzeResponse.ok) {
            estimateData = await analyzeResponse.json();
          }
        } catch (err) {
          console.warn('견적 분석 실패 (채팅은 계속 진행):', err);
        }
      }

      // 채팅 API 호출
      const chatResponse = await fetch(`${aiApiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: 'gemini-2.5-flash-lite',
          temperature: 0.7,
          estimateData: estimateData, // 견적 데이터를 프롬프트에 포함
        }),
      });

      if (!chatResponse.ok) {
        throw new Error(`AI 서버 오류: ${chatResponse.status}`);
      }

      const chatData = await chatResponse.json();
      
      // AI-Server에서 이미 가격 정보가 포함된 응답을 받음
      let responseContent = chatData.content || '죄송합니다. 응답을 생성할 수 없습니다.';
      
      // 견적 데이터가 있으면 첫 번째 항목을 result에 설정 (UI에 표시)
      if (estimateData && estimateData.items && estimateData.items.length > 0) {
        const firstItem = estimateData.items[0];
        setResult({
          productName: firstItem.product_name,
          categoryName: '',
          subCategoryName: '',
          unitPrice: firstItem.unit_price || 0,
          optionPrice: 0,
          quantity: firstItem.quantity,
          totalPrice: firstItem.total_price,
          finalPrice: firstItem.total_price,
          margin: 0,
          marginAmount: 0,
          selectedOptions: [],
        });
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: responseContent
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI 채팅 오류:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: '죄송합니다. 현재 AI 상담 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주시거나, 일반 견적 문의 탭을 이용해주세요.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addToCart = () => {
    if (!result) return;

    const cartItem: CartItem = {
      id: Date.now(),
      productName: result.productName,
      categoryName: result.categoryName || '',
      subCategoryName: result.subCategoryName || '',
      unitPrice: result.unitPrice,
      optionPrice: result.optionPrice || 0,
      quantity: result.quantity,
      totalPrice: result.finalPrice || result.totalPrice,
      selectedOptions: result.selectedOptions || [],
      margin: result.margin,
      marginAmount: result.marginAmount,
      finalPrice: result.finalPrice || result.totalPrice,
    };

    setCart(prev => [...prev, cartItem]);
    toast.success('장바구니에 추가되었습니다.');
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
    toast.success('장바구니에서 제거되었습니다.');
  };

  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.finalPrice || item.totalPrice), 0);
  };

  const generatePDF = () => {
    // TODO: PDF 생성 로직 (CalculatorTab과 동일)
    toast.info('PDF 생성 기능은 준비 중입니다.');
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* 왼쪽: AI 채팅 */}
      <Card className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 shadow-xl shadow-indigo-500/5">
        <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-gray-900 via-indigo-700 to-gray-900 bg-clip-text text-transparent">
            AI 상담사와 대화하기
          </span>
        </h3>
        
        <ScrollArea className="h-[500px] mb-4 pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-white border border-gray-200 shadow-sm'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-600">AI 상담사</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 border-gray-200 focus-visible:ring-indigo-500"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/30"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
          <p className="text-sm text-indigo-800">
            <strong>안내:</strong> AI 상담 기능은 Google Gemini API를 사용하여 실시간으로 견적 상담을 제공합니다. 
            도어, 문틀, 목재 자재에 대한 질문을 자유롭게 해주세요.
          </p>
        </div>
      </Card>

      {/* 오른쪽: 예상 견적 및 장바구니 */}
      <div className="space-y-6">
        {/* 현재 계산된 견적 */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50/50 sticky top-4 rounded-3xl shadow-xl shadow-indigo-500/5">
          <CardHeader className="pb-4 border-b border-gray-200">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>예상 견적서</span>
              <span className="text-sm font-normal text-gray-500">
                VAT 별도
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {!result ? (
              <div className="text-center py-10 text-gray-400">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>
                  AI 상담을 통해
                  <br />
                  견적을 받아보세요.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-medium text-lg">
                    <span>{result.productName}</span>
                  </div>
                  {result.categoryName && (
                    <div className="text-xs text-gray-500">
                      {result.categoryName}
                      {result.subCategoryName && ` > ${result.subCategoryName}`}
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>기본 단가</span>
                    <span>{result.unitPrice.toLocaleString()}원</span>
                  </div>
                  {result.optionPrice !== 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>추가 옵션 합계</span>
                      <span>
                        {result.optionPrice > 0 ? '+' : ''} {result.optionPrice.toLocaleString()}원
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>수량</span>
                    <span>{result.quantity}개</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
                  {result.finalPrice && (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>소계 (마진 적용 전)</span>
                        <span>{(result.finalPrice - (result.marginAmount || 0)).toLocaleString()}원</span>
                      </div>
                      {result.margin && result.marginAmount && (
                        <div className="flex justify-between text-blue-700 font-medium">
                          <span>회사 마진 ({result.margin}%)</span>
                          <span>+{result.marginAmount.toLocaleString()}원</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">
                      총 예상 금액
                    </span>
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-gray-700">
                      {(result.finalPrice || result.totalPrice).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          {result && (
            <CardFooter className="pt-2 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setResult(null)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                초기화
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl font-semibold"
                onClick={addToCart}
              >
                <Plus className="w-4 h-4 mr-2" />
                장바구니에 추가
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* 장바구니 */}
        <Card className="p-6 bg-gradient-to-br from-slate-100 to-slate-50/50">
          <CardHeader className="pb-4 border-b border-gray-200">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                장바구니 ({cart.length})
              </span>
              <span className="text-sm font-normal text-gray-500">
                VAT 별도
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>장바구니가 비어있습니다.</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-base">{item.productName}</div>
                            {item.categoryName && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.categoryName}
                                {item.subCategoryName && ` > ${item.subCategoryName}`}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600 mt-2">
                          <div className="flex justify-between">
                            <span>기본 단가</span>
                            <span>{item.unitPrice.toLocaleString()}원</span>
                          </div>
                          {item.optionPrice !== 0 && (
                            <div className="flex justify-between">
                              <span>추가 옵션</span>
                              <span>
                                {item.optionPrice > 0 ? '+' : ''} {item.optionPrice.toLocaleString()}원
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>수량</span>
                            <span>{item.quantity}개</span>
                          </div>
                          <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t border-gray-200 mt-2">
                            <span>소계</span>
                            <span>{(item.finalPrice || item.totalPrice).toLocaleString()}원</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg text-gray-700">
                      총 예상 금액
                    </span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                      {calculateCartTotal().toLocaleString()}원
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          {cart.length > 0 && (
            <CardFooter className="pt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCart([])}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  장바구니 비우기
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={generatePDF}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF로 변환
                </Button>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl font-semibold h-12"
                onClick={() => {
                  toast.success(`주문하기 페이지로 이동합니다. (총 ${cart.length}개 항목, ${calculateCartTotal().toLocaleString()}원)`);
                }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                주문하기
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
