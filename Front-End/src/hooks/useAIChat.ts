import { useState, useCallback } from 'react';
import OpenAI from 'openai';
import type { Message } from '../types';

// OpenAI API 클라이언트 설정
// 실제 사용시 환경 변수로 API 키를 설정하세요: VITE_OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE',
  dangerouslyAllowBrowser: true // 주의: 프로덕션에서는 백엔드에서 API를 호출해야 합니다
});

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: '안녕하세요! 동서인테리어 AI 견적 상담사입니다. 어떤 시공을 원하시나요? 창호, 도어, 중문 등에 대해 자유롭게 질문해주세요.'
};

export function useAIChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `당신은 동서인테리어의 전문 상담사입니다. 창호, 도어, 중문 시공에 대한 견적 상담을 제공합니다. 
            다음 가격을 참고하여 상담하세요:
            - 시스템 창호: 35만원/㎡ (3중 유리, 단열/방음 우수)
            - 샷시 교체: 28만원/㎡ (기존 창틀 철거 및 신규 설치)
            - 방음창: 42만원/㎡ (4중 유리, 특수 방음 프레임)
            - 현관문 교체: 180만원 (디지털 도어락 포함, A급 방화문)
            - 실내문: 45만원/개 (원목 도어, 손잡이 포함)
            - 중문 설치: 120만원 (슬라이딩 중문, 강화유리)
            
            친절하고 전문적으로 답변하며, 고객의 요구사항을 정확히 파악하여 적절한 견적을 제시하세요.`
          },
          ...messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          {
            role: 'user',
            content: inputMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.choices[0]?.message?.content || '죄송합니다. 응답을 생성할 수 없습니다.'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('OpenAI API 오류:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: '죄송합니다. 현재 AI 상담 서비스를 이용할 수 없습니다. OpenAI API 키를 환경 변수(VITE_OPENAI_API_KEY)에 설정해주세요. 일반 견적 문의 탭을 이용하시거나 1588-7003로 전화 주시기 바랍니다.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, messages]);

  return {
    messages,
    inputMessage,
    isLoading,
    setInputMessage,
    sendMessage,
  };
}

