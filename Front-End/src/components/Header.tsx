import { Phone } from "lucide-react";
import { CONTACT_INFO } from "../constants";

export function Header() {
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

          <div className="flex items-center gap-4">
            <a
              href={`tel:${CONTACT_INFO.phone}`}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-pastel-700 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-pastel-50"
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">{CONTACT_INFO.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
