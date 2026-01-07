export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface QuoteItem {
  id: string;
  category: string;
  name: string;
  price: number;
  description: string;
}

export interface FormData {
  name: string;
  phone: string;
  email: string;
  service: string;
  address: string;
  message: string;
}

export interface Service {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
}

export interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export interface Product {
  image: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
}

export interface Stat {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  description: string;
}

export interface ProcessStep {
  step: string;
  title: string;
  desc: string;
}

