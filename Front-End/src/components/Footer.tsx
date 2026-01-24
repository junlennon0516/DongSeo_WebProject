import { Mail, Phone, MapPin } from "lucide-react";
import { CONTACT_INFO } from "../constants";

export function Footer() {
    return (
        <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffda85' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="container mx-auto px-4 py-12 relative z-10">
                <div className="grid md:grid-cols-2 gap-12 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <span className="text-white font-bold text-xl">
                                    동서
                                </span>
                            </div>
                            <span className="font-bold text-2xl bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                                동서인테리어
                            </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            품격있는 공간을 만드는
                            <br />
                            창호·도어 전문 기업
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-6 text-lg font-bold text-white">연락처</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center gap-3 group">
                                <div className="w-10 h-10 bg-pastel-600/20 rounded-lg flex items-center justify-center group-hover:bg-pastel-600/30 transition-colors">
                                    <Phone className="w-5 h-5 text-pastel-400" />
                                </div>
                                <a
                                    href={`tel:${CONTACT_INFO.phone}`}
                                    className="text-gray-300 hover:text-indigo-400 transition-colors font-medium"
                                >
                                    {CONTACT_INFO.phone}
                                </a>
                            </li>
                            <li className="flex items-center gap-3 group">
                                <div className="w-10 h-10 bg-pastel-600/20 rounded-lg flex items-center justify-center group-hover:bg-pastel-600/30 transition-colors">
                                    <Mail className="w-5 h-5 text-pastel-400" />
                                </div>
                                <a
                                    href={`mailto:${CONTACT_INFO.email}`}
                                    className="text-gray-300 hover:text-indigo-400 transition-colors font-medium"
                                >
                                    {CONTACT_INFO.email}
                                </a>
                            </li>
                            <li className="flex items-start gap-3 group">
                                <div className="w-10 h-10 bg-pastel-600/20 rounded-lg flex items-center justify-center group-hover:bg-pastel-600/30 transition-colors mt-1">
                                    <MapPin className="w-5 h-5 text-pastel-400" />
                                </div>
                                <span className="text-gray-300 leading-relaxed">{CONTACT_INFO.address}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700/50 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-400">
                            © 2025 동서인테리어. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}