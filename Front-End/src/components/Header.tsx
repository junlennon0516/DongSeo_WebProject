import { Menu, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { NAVIGATION_ITEMS, CONTACT_INFO } from "../constants";
import { scrollToSection } from "../utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: string) => {
    scrollToSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg shadow-pastel-200/30 border-b-2 border-pastel-300/50 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-pastel-600 via-pastel-500 to-pastel-700 rounded-2xl flex items-center justify-center shadow-lg shadow-pastel-600/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-pastel-600/40">
              <span className="text-white font-bold text-xl">
                동서
              </span>
            </div>
            <div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">동서</h1>
              <p className="text-xs text-gray-500 font-medium">
                창호·도어 전문
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {NAVIGATION_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="px-4 py-2 text-gray-700 hover:text-pastel-700 font-medium rounded-xl hover:bg-pastel-50 transition-all duration-300 hover:scale-105"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a
              href={`tel:${CONTACT_INFO.phone}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-pastel-700 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-pastel-50"
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">{CONTACT_INFO.phone}</span>
            </a>
            <Button 
              onClick={() => handleNavClick("quote")}
              className="bg-gradient-to-r from-pastel-600 to-pastel-700 hover:from-pastel-700 hover:to-pastel-800 text-white shadow-lg shadow-pastel-600/30 hover:shadow-xl hover:shadow-pastel-600/40 transition-all duration-300 hover:scale-105"
            >
              무료 견적
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴 열기"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-2 bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-pastel-200/30">
            {NAVIGATION_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="text-left py-3 px-4 text-gray-700 hover:text-pastel-700 hover:bg-pastel-50 rounded-xl transition-all duration-300 font-medium"
              >
                {item.label}
              </button>
            ))}
            <a
              href={`tel:${CONTACT_INFO.phone}`}
              className="flex items-center gap-2 py-3 px-4 text-gray-600 hover:text-pastel-700 hover:bg-pastel-50 rounded-xl transition-all duration-300"
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">{CONTACT_INFO.phone}</span>
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
