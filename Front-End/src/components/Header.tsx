import { LogOut, Phone } from "lucide-react";
import { CONTACT_INFO } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

export function Header() {
  const { username, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl shadow-sm z-50 border-b border-gray-100">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-indigo-500/40">
              <span className="text-white font-bold text-lg sm:text-xl">
                동서
              </span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg sm:text-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">동서</h1>
              <p className="text-xs text-gray-500 font-medium">
                창호·도어 전문
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {username && (
              <span className="hidden sm:inline-block text-sm text-gray-700 font-medium px-2 sm:px-3 py-1.5 rounded-lg bg-slate-100">
                {username}
              </span>
            )}
            <a
              href={`tel:${CONTACT_INFO.phone}`}
              className="flex items-center gap-1 sm:gap-2 text-sm text-gray-700 hover:text-indigo-600 transition-all duration-300 px-2 sm:px-4 py-2 rounded-lg hover:bg-indigo-50"
              aria-label={`전화하기: ${CONTACT_INFO.phone}`}
            >
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline font-medium">{CONTACT_INFO.phone}</span>
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-1 sm:gap-2 border-gray-200 hover:bg-slate-50 hover:border-gray-300 px-2 sm:px-3"
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
