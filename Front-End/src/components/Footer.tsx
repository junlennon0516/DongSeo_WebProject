import { Mail, Phone, MapPin } from "lucide-react";
import { CONTACT_INFO, NAVIGATION_ITEMS } from "../constants";
import { scrollToSection } from "../utils";

const FOOTER_SERVICES = [
    { label: '창호 시공', id: 'services' },
    { label: '도어 시공', id: 'services' },
    { label: '중문 시공', id: 'services' },
    { label: '맞춤 제작', id: 'services' },
] as const;

const FOOTER_COMPANY_LINKS = [
    { label: '회사소개', id: 'about' },
    { label: '제품안내', id: 'products' },
    { label: '견적문의', id: 'quote' },
] as const;

export function Footer() {
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        scrollToSection(id);
    };

    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-12">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">
                                    동서
                                </span>
                            </div>
                            <span className="font-bold text-xl">
                                동서인테리어
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            품격있는 공간을 만드는
                            <br />
                            창호·도어 전문 기업
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-4">서비스</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            {FOOTER_SERVICES.map((service, index) => (
                                <li key={index}>
                                    <a
                                        href={`#${service.id}`}
                                        onClick={(e) => handleLinkClick(e, service.id)}
                                        className="hover:text-white transition-colors"
                                    >
                                        {service.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4">회사정보</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            {FOOTER_COMPANY_LINKS.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={`#${link.id}`}
                                        onClick={(e) => handleLinkClick(e, link.id)}
                                        className="hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4">연락처</h4>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <a
                                    href={`tel:${CONTACT_INFO.phone}`}
                                    className="hover:text-white transition-colors"
                                >
                                    {CONTACT_INFO.phone}
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <a
                                    href={`mailto:${CONTACT_INFO.email}`}
                                    className="hover:text-white transition-colors"
                                >
                                    {CONTACT_INFO.email}
                                </a>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                                <span>{CONTACT_INFO.address}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8">
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