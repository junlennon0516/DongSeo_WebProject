import { LogOut, Phone, Package } from "lucide-react";
import { CONTACT_INFO } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

export function Header() {
  const { username, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#FFF8DE]/90 backdrop-blur-xl shadow-sm z-50 border-b border-[#AAC4F5]/30">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#8CA9FF] via-[#AAC4F5] to-[#8CA9FF] rounded-xl flex items-center justify-center shadow-lg shadow-[#8CA9FF]/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-[#8CA9FF]/40">
              <span className="text-white font-bold text-lg sm:text-xl">
                동서
              </span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg sm:text-xl bg-gradient-to-r from-gray-900 via-[#8CA9FF] to-gray-900 bg-clip-text text-transparent">동서</h1>
              <p className="text-xs text-gray-600 font-medium">
                창호·도어 전문
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {username && (
              <span className="hidden sm:inline-block text-sm text-gray-700 font-medium px-2 sm:px-3 py-1.5 rounded-lg bg-[#FFF2C6]">
                {username}
              </span>
            )}
            <a
              href="#admin-products"
              className="flex items-center gap-1 sm:gap-2 text-sm text-gray-700 hover:text-[#8CA9FF] transition-all duration-300 px-2 sm:px-4 py-2 rounded-lg hover:bg-[#AAC4F5]/20"
            >
              <Package className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline font-medium">제품 관리</span>
            </a>
            <a
              href={`tel:${CONTACT_INFO.phone}`}
              className="flex items-center gap-1 sm:gap-2 text-sm text-gray-700 hover:text-[#8CA9FF] transition-all duration-300 px-2 sm:px-4 py-2 rounded-lg hover:bg-[#AAC4F5]/20"
              aria-label={`전화하기: ${CONTACT_INFO.phone}`}
            >
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline font-medium">{CONTACT_INFO.phone}</span>
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-1 sm:gap-2 border-[#AAC4F5] hover:bg-[#FFF2C6] hover:border-[#8CA9FF] px-2 sm:px-3"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
