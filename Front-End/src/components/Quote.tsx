import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Bot, Send, Calculator } from 'lucide-react';
import { useAIChat } from '../hooks/useAIChat';
import { AIChatTab } from './Quote/AIChatTab';
import { FormTab } from './Quote/FormTab';
import { CalculatorTab } from './Quote/CalculatorTab';
import type { FormData } from '../types';

export function Quote() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    service: '',
    address: '',
    message: ''
  });

  const aiChat = useAIChat();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast.error('이름과 연락처는 필수 입력 항목입니다.');
      return;
    }

    console.log('견적 문의:', formData);
    toast.success('견적 문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.');
    
    setFormData({
      name: '',
      phone: '',
      email: '',
      service: '',
      address: '',
      message: ''
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  return (
    <section id="quote" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="mb-4">무료 견적 문의</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            셀프 견적, AI 채팅, 또는 직접 문의 - 원하시는 방법으로 견적을 받아보세요!
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="calculator" className="flex items-center gap-2 cursor-pointer">
                <Calculator className="w-4 h-4" />
                ⚡ 셀프 견적
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2 cursor-pointer">
                <Bot className="w-4 h-4" />
                AI 상담
              </TabsTrigger>
              <TabsTrigger value="form" className="flex items-center gap-2 cursor-pointer">
                <Send className="w-4 h-4" />
                상세 문의
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator">
              <CalculatorTab />
            </TabsContent>

            <TabsContent value="chat">
              <AIChatTab
                messages={aiChat.messages}
                inputMessage={aiChat.inputMessage}
                isLoading={aiChat.isLoading}
                onInputChange={aiChat.setInputMessage}
                onSendMessage={aiChat.sendMessage}
              />
            </TabsContent>

            <TabsContent value="form">
              <FormTab
                formData={formData}
                onChange={handleFormChange}
                onSubmit={handleFormSubmit}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}