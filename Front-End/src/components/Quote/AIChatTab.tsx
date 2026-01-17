import { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Bot, Phone, Send, Loader2 } from 'lucide-react';
import type { Message } from '../../types';

interface AIChatTabProps {
  messages: Message[];
  inputMessage: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
}

export function AIChatTab({
  messages,
  inputMessage,
  isLoading,
  onInputChange,
  onSendMessage,
}: AIChatTabProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6 bg-pastel-100 border-2 border-pastel-300 shadow-lg shadow-pastel-200/20 rounded-3xl">
        <h3 className="mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-pastel-700" />
          AI 상담사와 대화하기
        </h3>
        
        <ScrollArea className="h-[500px] mb-4 border rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-pastel-600 text-pastel-50'
                      : 'bg-white border border-pastel-300'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <Loader2 className="w-5 h-5 animate-spin text-pastel-700" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder="메시지를 입력하세요..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={onSendMessage} disabled={isLoading || !inputMessage.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-pastel-200 border border-pastel-400 rounded-lg">
          <p className="text-sm text-pastel-800">
            <strong>개발자 안내:</strong> OpenAI API 키를 환경 변수 <code className="bg-pastel-300 px-1 rounded">VITE_OPENAI_API_KEY</code>에 설정하세요.
            프로덕션 환경에서는 보안을 위해 백엔드 서버에서 API를 호출해야 합니다.
          </p>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6 bg-pastel-100 border-2 border-pastel-300 shadow-lg shadow-pastel-200/20 rounded-3xl">
          <h4 className="mb-4">AI 상담 안내</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-pastel-700">•</span>
              <span>24시간 즉시 견적 상담</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pastel-700">•</span>
              <span>맞춤형 제품 추천</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pastel-700">•</span>
              <span>실시간 가격 계산</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pastel-700">•</span>
              <span>전문가 수준의 답변</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-pastel-600 to-pastel-700 text-pastel-50">
          <h4 className="mb-2">빠른 상담</h4>
          <p className="text-pastel-100 text-sm mb-4">
            전화로 상담하시려면
          </p>
          <a href="tel:1588-7003">
            <Button size="lg" className="w-full bg-white text-pastel-700 hover:bg-gray-100">
              <Phone className="mr-2 w-5 h-5" />
              1588-7003
            </Button>
          </a>
        </Card>
      </div>
    </div>
  );
}

