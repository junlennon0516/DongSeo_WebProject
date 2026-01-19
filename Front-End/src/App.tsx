import { Header } from './components/Header';
import { Quote } from './components/Quote';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Quote />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
