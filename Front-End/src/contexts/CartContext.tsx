import React, { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";
import { logger } from "../utils/logger";
import { NANUM_GOTHIC_BASE64, isFontLoaded } from "../assets/fonts/nanumGothicBase64";
import type { CartItem, WoodProduct, WoodinProduct, UnifiedCartItem } from "../types/calculator";

function getWoodCompanyName(entry: UnifiedCartItem): string {
  if (entry.source !== "wood" && entry.source !== "woodin") return "";
  const name = entry.item.companyName?.trim();
  return name || "회사 미지정";
}

interface CartContextValue {
  cart: UnifiedCartItem[];
  addEstimateItem: (item: CartItem) => void;
  addWoodItem: (item: WoodProduct) => void;
  addUdineItem: (item: WoodinProduct) => void;
  removeCartItem: (id: string) => void;
  updateWoodItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  generatePDF: () => Promise<void>;
  generatePDFAndEmail: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

/** PDF 회사별 섹션 라벨 */
const COMPANY_LABELS: Record<UnifiedCartItem["source"], string> = {
  estimate: "쉐누",
  wood: "우드랜드",
  woodin: "우딘",
};

function getItemId(entry: UnifiedCartItem): string {
  return entry.item.id;
}

function getItemFinalPrice(entry: UnifiedCartItem): number {
  return entry.item.finalPrice ?? entry.item.totalPrice ?? 0;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<UnifiedCartItem[]>([]);

  const addEstimateItem = useCallback((item: CartItem) => {
    setCart((prev) => [...prev, { source: "estimate", item }]);
    toast.success("장바구니에 추가되었습니다.");
  }, []);

  const addWoodItem = useCallback((item: WoodProduct) => {
    setCart((prev) => [...prev, { source: "wood", item }]);
    toast.success("장바구니에 추가되었습니다.");
  }, []);

  const addUdineItem = useCallback((item: WoodinProduct) => {
    setCart((prev) => [...prev, { source: "woodin", item }]);
    toast.success("장바구니에 추가되었습니다.");
  }, []);

  const removeCartItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((entry) => getItemId(entry) !== id));
    toast.success("장바구니에서 제거되었습니다.");
  }, []);

  const updateWoodItemQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((entry) => {
        if (entry.source !== "wood" || entry.item.id !== id) return entry;
        const item = entry.item;
        const baseTotal = item.unitPrice * quantity;
        let finalPrice = baseTotal;
        let marginAmount = 0;
        if (item.margin) {
          const marginRate = parseFloat(item.margin) / 100;
          if (!isNaN(marginRate) && marginRate >= 0) {
            marginAmount = Math.round(baseTotal * marginRate);
            finalPrice = baseTotal + marginAmount;
          }
        }
        return {
          source: "wood" as const,
          item: {
            ...item,
            quantity,
            totalPrice: baseTotal,
            marginAmount: marginAmount > 0 ? marginAmount : undefined,
            finalPrice,
          },
        };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((sum, entry) => sum + getItemFinalPrice(entry), 0);
  }, [cart]);

  const generatePDF = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("장바구니가 비어있습니다.");
      return;
    }

    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");

      // 한글 폰트: Base64만 사용 (서버/경로 의존 없음, 404 방지)
      let fontLoaded = false;
      if (isFontLoaded()) {
        try {
          doc.addFileToVFS("NanumGothic.ttf", NANUM_GOTHIC_BASE64);
          doc.addFont("NanumGothic.ttf", "NanumGothic", "normal");
          doc.setFont("NanumGothic", "normal");
          fontLoaded = true;
        } catch (e) {
          logger.error("PDF 폰트 등록 실패:", e);
        }
      }
      if (!fontLoaded) {
        logger.warn("한글 폰트 미적용. PDF 한글 사용 시: src/assets/fonts/nanumGothicBase64.ts에 NanumGothic.ttf Base64 추가.");
      }

      const margin = 20;
      let yPosition = 20;
      const pageHeight = 297;

      doc.setFontSize(24);
      doc.text("견적서 (도어/문틀 · 목재 통합)", 105, yPosition, { align: "center" });
      yPosition += 15;

      doc.setFontSize(14);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");
      doc.text("(주) 동서", margin, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      const dateStr = new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(`작성일: ${dateStr}`, margin, yPosition);
      yPosition += 12;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, 190, yPosition);
      yPosition += 12;

      doc.setFontSize(12);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");
      doc.text("견적 내역", margin, yPosition);
      yPosition += 12;

      doc.setFontSize(10);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");

      let itemIndex = 0;

      const estimateEntries = cart.filter((e) => e.source === "estimate");
      const estimateByCompany = estimateEntries.reduce<{ label: string; entries: typeof estimateEntries }[]>((acc, entry) => {
        const item = entry.item;
        const isWoodin = item.companyCode === "WOODIN";
        const label = isWoodin ? "우딘" : "쉐누";
        let group = acc.find((g) => g.label === label);
        if (!group) {
          group = { label, entries: [] };
          acc.push(group);
        }
        group.entries.push(entry);
        return acc;
      }, []);

      for (const { label, entries } of estimateByCompany) {
        if (entries.length === 0) continue;
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(12);
        if (fontLoaded) doc.setFont("NanumGothic", "normal");
        doc.text(`【 ${label} 】`, margin, yPosition);
        yPosition += 10;

        for (const entry of entries) {
          itemIndex += 1;
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
          }

          if (entry.source === "estimate") {
            const item = entry.item;
            const displayName =
              item.productName?.includes("목재문틀") || item.productName?.includes("才") || item.productName?.includes("사이")
                ? "목재문틀"
                : item.productName;
            doc.setFontSize(11);
            if (fontLoaded) doc.setFont("NanumGothic", "normal");
            const productName = `${itemIndex}. ${displayName}`;
            const splitProductName = doc.splitTextToSize(productName, 170);
            doc.text(splitProductName, margin, yPosition);
            yPosition += splitProductName.length * 6 + 2;
            if (item.categoryName) {
              doc.setFontSize(9);
              if (fontLoaded) doc.setFont("NanumGothic", "normal");
              doc.text(
                `카테고리: ${item.subCategoryName ? `${item.categoryName} > ${item.subCategoryName}` : item.categoryName}`,
                margin + 5,
                yPosition
              );
              yPosition += 6;
            }
            doc.setFontSize(9);
            if (fontLoaded) doc.setFont("NanumGothic", "normal");
            doc.text(`단가: ${item.unitPrice.toLocaleString()}원`, margin + 5, yPosition);
            yPosition += 6;
            if (item.optionPrice !== 0) {
              doc.text(`옵션: ${item.optionPrice > 0 ? "+" : ""}${item.optionPrice.toLocaleString()}원`, margin + 5, yPosition);
              yPosition += 6;
            }
            doc.text(`수량: ${item.quantity}개`, margin + 5, yPosition);
            yPosition += 6;
            const baseTotal = item.finalPrice ? (item.finalPrice - (item.marginAmount ?? 0)) : item.totalPrice;
            doc.text(`소계 (마진 적용 전): ${baseTotal.toLocaleString()}원`, margin + 5, yPosition);
            yPosition += 6;
            if (item.margin && item.marginAmount) {
              doc.text(`회사 마진 (${item.margin}%): +${item.marginAmount.toLocaleString()}원`, margin + 5, yPosition);
              yPosition += 6;
            }
            const finalTotal = item.finalPrice ?? item.totalPrice;
            doc.setFontSize(11);
            if (fontLoaded) doc.setFont("NanumGothic", "normal");
            doc.text(`최종 소계: ${finalTotal.toLocaleString()}원`, margin + 5, yPosition);
            yPosition += 10;
          }

          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, 190, yPosition);
          yPosition += 8;
        }
      }

      // 2) 목재 - 회사별 구분 (에스와이보드, KCC 인천 영업소, 우드 뱅크, 우드랜드 등)
      const woodEntries = cart.filter((e) => e.source === "wood");
      const woodByCompany = woodEntries.reduce<Record<string, typeof woodEntries>>((acc, entry) => {
        const company = getWoodCompanyName(entry);
        if (!acc[company]) acc[company] = [];
        acc[company].push(entry);
        return acc;
      }, {});
      for (const [companyName, entries] of Object.entries(woodByCompany)) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(12);
        if (fontLoaded) doc.setFont("NanumGothic", "normal");
        doc.text(`【 목재 - ${companyName} 】`, margin, yPosition);
        yPosition += 10;

        for (const entry of entries) {
          itemIndex += 1;
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
          }
          const item = entry.item;
          doc.setFontSize(11);
          if (fontLoaded) doc.setFont("NanumGothic", "normal");
          const productName = `${itemIndex}. ${item.name}`;
          const splitProductName = doc.splitTextToSize(productName, 170);
          doc.text(splitProductName, margin, yPosition);
          yPosition += splitProductName.length * 6 + 2;
          if (item.category) {
            doc.setFontSize(9);
            if (fontLoaded) doc.setFont("NanumGothic", "normal");
            const categoryText =
              item.subCategory !== item.category ? `${item.category} > ${item.subCategory}` : item.category;
            doc.text(`카테고리: ${categoryText}`, margin + 5, yPosition);
            yPosition += 6;
          }
          doc.setFontSize(9);
          if (fontLoaded) doc.setFont("NanumGothic", "normal");
          doc.text(`단가: ${item.unitPrice.toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`수량: ${item.quantity}개`, margin + 5, yPosition);
          yPosition += 7;
          const baseTotal = item.finalPrice ? (item.finalPrice - (item.marginAmount ?? 0)) : item.totalPrice;
          doc.text(`소계 (마진 적용 전): ${baseTotal.toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 6;
          if (item.margin && item.marginAmount) {
            doc.text(`회사 마진 (${item.margin}%): +${item.marginAmount.toLocaleString()}원`, margin + 5, yPosition);
            yPosition += 6;
          }
          const finalTotal = item.finalPrice ?? item.totalPrice;
          doc.setFontSize(11);
          if (fontLoaded) doc.setFont("NanumGothic", "normal");
          doc.text(`최종 소계: ${finalTotal.toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 10;
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, 190, yPosition);
          yPosition += 8;
        }
      }

      // 3) 우딘
      const woodinEntries = cart.filter((e) => e.source === "woodin");
      if (woodinEntries.length > 0) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(12);
        if (fontLoaded) doc.setFont("NanumGothic", "normal");
        doc.text(`【 ${COMPANY_LABELS.woodin} 】`, margin, yPosition);
        yPosition += 10;

        for (const entry of woodinEntries) {
          itemIndex += 1;
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
          }
          const item = entry.item;
          doc.setFontSize(11);
          if (fontLoaded) doc.setFont("NanumGothic", "normal");
          const productName = `${itemIndex}. ${item.name}`;
          const splitProductName = doc.splitTextToSize(productName, 170);
          doc.text(splitProductName, margin, yPosition);
          yPosition += splitProductName.length * 6 + 2;
          if (item.category) {
            doc.setFontSize(9);
            if (fontLoaded) doc.setFont("NanumGothic", "normal");
            const categoryText =
              item.subCategory !== item.category ? `${item.category} > ${item.subCategory}` : item.category;
            doc.text(`카테고리: ${categoryText}`, margin + 5, yPosition);
            yPosition += 6;
          }
          doc.setFontSize(9);
          if (fontLoaded) doc.setFont("NanumGothic", "normal");
          doc.text(`단가: ${item.unitPrice.toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`수량: ${item.quantity}개`, margin + 5, yPosition);
          yPosition += 7;
          const baseTotal = item.finalPrice ? (item.finalPrice - (item.marginAmount ?? 0)) : item.totalPrice;
          doc.text(`소계 (마진 적용 전): ${baseTotal.toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 6;
          if (item.margin && item.marginAmount) {
            doc.text(`회사 마진 (${item.margin}%): +${item.marginAmount.toLocaleString()}원`, margin + 5, yPosition);
            yPosition += 6;
          }
          const finalTotal = item.finalPrice ?? item.totalPrice;
          doc.setFontSize(11);
          if (fontLoaded) doc.setFont("NanumGothic", "normal");
          doc.text(`최종 소계: ${finalTotal.toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 10;
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, 190, yPosition);
          yPosition += 8;
        }
      }

      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(12);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");
      doc.line(margin, yPosition, 190, yPosition);
      yPosition += 10;

      const totalPrice = cart.reduce((sum, entry) => sum + getItemFinalPrice(entry), 0);
      const baseTotal = cart.reduce((sum, entry) => {
        const item = entry.item;
        return sum + (item.finalPrice ? (item.finalPrice - (item.marginAmount ?? 0)) : item.totalPrice);
      }, 0);
      const totalMargin = cart.reduce((sum, entry) => sum + (entry.item.marginAmount ?? 0), 0);

      doc.setFontSize(11);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");
      doc.text(`총액 (마진 적용 전): ${baseTotal.toLocaleString()}원`, margin, yPosition);
      yPosition += 7;
      if (totalMargin > 0) {
        const firstWithMargin = cart.find((e) => e.item.margin);
        const marginPercent = firstWithMargin?.item.margin ?? "0";
        doc.setFontSize(10);
        if (fontLoaded) doc.setFont("NanumGothic", "normal");
        doc.text(`회사 마진 (${marginPercent}%): +${totalMargin.toLocaleString()}원`, margin, yPosition);
        yPosition += 7;
      }
      doc.setFontSize(14);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");
      doc.text(`총 예상 금액: ${totalPrice.toLocaleString()}원`, margin, yPosition);
      yPosition += 10;
      doc.setFontSize(9);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");
      doc.text("* VAT 별도", margin, yPosition);
      yPosition += 6;
      const noteText = "* 본 견적서는 참고용이며, 실제 견적은 현장 확인 후 결정됩니다.";
      doc.text(doc.splitTextToSize(noteText, 170), margin, yPosition);

      const fileName = `견적서_통합_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      toast.success("PDF 파일이 다운로드되었습니다.");
    } catch (error) {
      logger.error("PDF 생성 오류:", error);
      toast.error("PDF 생성에 실패했습니다. 다시 시도해주세요.");
    }
  }, [cart]);

  /** PDF 생성 후 이메일로 보내기 (Gmail 연결 / Web Share API) */
  const generatePDFAndEmail = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("장바구니가 비어있습니다.");
      return;
    }

    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");

      let fontLoaded = false;
      if (isFontLoaded()) {
        try {
          doc.addFileToVFS("NanumGothic.ttf", NANUM_GOTHIC_BASE64);
          doc.addFont("NanumGothic.ttf", "NanumGothic", "normal");
          doc.setFont("NanumGothic", "normal");
          fontLoaded = true;
        } catch (e) {
          logger.error("PDF 폰트 등록 실패:", e);
        }
      }
      if (!fontLoaded) {
        doc.setFont("helvetica", "normal");
      }

      const margin = 20;
      let yPosition = 20;
      const pageHeight = 297;

      doc.setFontSize(24);
      doc.text("견적서 (도어/문틀 · 목재 통합)", 105, yPosition, { align: "center" });
      yPosition += 15;

      doc.setFontSize(14);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");
      doc.text("(주) 동서", margin, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      const dateStr = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
      doc.text(`작성일: ${dateStr}`, margin, yPosition);
      yPosition += 12;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, 190, yPosition);
      yPosition += 12;

      doc.setFontSize(12);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");
      doc.text("견적 내역", margin, yPosition);
      yPosition += 12;

      doc.setFontSize(10);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");

      let itemIndex = 0;

      const estimateEntries = cart.filter((e) => e.source === "estimate");
      const estimateByCompany = estimateEntries.reduce<{ label: string; entries: typeof estimateEntries }[]>((acc, entry) => {
        const item = entry.item;
        const isWoodin = item.companyCode === "WOODIN";
        const label = isWoodin ? "우딘" : "쉐누";
        let group = acc.find((g) => g.label === label);
        if (!group) {
          group = { label, entries: [] };
          acc.push(group);
        }
        group.entries.push(entry);
        return acc;
      }, []);

      for (const { label, entries } of estimateByCompany) {
        if (entries.length === 0) continue;
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(12);
        if (fontLoaded) doc.setFont("NanumGothic", "normal");
        doc.text(`【 ${label} 】`, margin, yPosition);
        yPosition += 10;

        for (const entry of entries) {
          itemIndex += 1;
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
          }
          if (entry.source === "estimate") {
            const item = entry.item;
            const displayName =
              item.productName?.includes("목재문틀") || item.productName?.includes("才") || item.productName?.includes("사이")
                ? "목재문틀"
                : item.productName;
            doc.setFontSize(11);
            if (fontLoaded) doc.setFont("NanumGothic", "normal");
            const productName = `${itemIndex}. ${displayName}`;
            const splitProductName = doc.splitTextToSize(productName, 170);
            doc.text(splitProductName, margin, yPosition);
            yPosition += splitProductName.length * 6 + 2;
            if (item.categoryName) {
              doc.setFontSize(9);
              doc.text(
                `카테고리: ${item.subCategoryName ? `${item.categoryName} > ${item.subCategoryName}` : item.categoryName}`,
                margin + 5,
                yPosition
              );
              yPosition += 6;
            }
            doc.setFontSize(9);
            doc.text(`단가: ${item.unitPrice.toLocaleString()}원`, margin + 5, yPosition);
            yPosition += 6;
            if (item.optionPrice !== 0) {
              doc.text(`옵션: ${item.optionPrice > 0 ? "+" : ""}${item.optionPrice.toLocaleString()}원`, margin + 5, yPosition);
              yPosition += 6;
            }
            doc.text(`수량: ${item.quantity}개`, margin + 5, yPosition);
            yPosition += 6;
            const baseTotal = item.finalPrice ? item.finalPrice - (item.marginAmount ?? 0) : item.totalPrice;
            doc.text(`소계 (마진 적용 전): ${baseTotal.toLocaleString()}원`, margin + 5, yPosition);
            yPosition += 6;
            if (item.margin && item.marginAmount) {
              doc.text(`회사 마진 (${item.margin}%): +${item.marginAmount.toLocaleString()}원`, margin + 5, yPosition);
              yPosition += 6;
            }
            const finalTotal = item.finalPrice ?? item.totalPrice;
            doc.setFontSize(11);
            doc.text(`최종 소계: ${finalTotal.toLocaleString()}원`, margin + 5, yPosition);
            yPosition += 10;
          }
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, 190, yPosition);
          yPosition += 8;
        }
      }

      const woodEntries = cart.filter((e) => e.source === "wood");
      const woodByCompany = woodEntries.reduce<Record<string, typeof woodEntries>>((acc, entry) => {
        const company = getWoodCompanyName(entry);
        if (!acc[company]) acc[company] = [];
        acc[company].push(entry);
        return acc;
      }, {});
      for (const [companyName, entries] of Object.entries(woodByCompany)) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(12);
        if (fontLoaded) doc.setFont("NanumGothic", "normal");
        doc.text(`【 목재 - ${companyName} 】`, margin, yPosition);
        yPosition += 10;

        for (const entry of entries) {
          if (entry.source !== "wood") continue;
          const item = entry.item;
          itemIndex += 1;
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
          }
          doc.setFontSize(11);
          doc.text(`${itemIndex}. ${item.name}`, margin, yPosition);
          yPosition += 7;
          doc.setFontSize(9);
          doc.text(`카테고리: ${item.category}${item.subCategory !== item.category ? ` > ${item.subCategory}` : ""}`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`단가: ${item.unitPrice.toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`수량: ${item.quantity}개`, margin + 5, yPosition);
          yPosition += 6;
          doc.setFontSize(11);
          doc.text(`소계: ${(item.finalPrice ?? item.totalPrice).toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 10;
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, 190, yPosition);
          yPosition += 8;
        }
      }

      const woodinEntries = cart.filter((e) => e.source === "woodin");
      if (woodinEntries.length > 0) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(12);
        if (fontLoaded) doc.setFont("NanumGothic", "normal");
        doc.text("【 우딘 】", margin, yPosition);
        yPosition += 10;
        for (const entry of woodinEntries) {
          if (entry.source !== "woodin") continue;
          const item = entry.item;
          itemIndex += 1;
          if (yPosition > pageHeight - 50) {
            doc.addPage();
            yPosition = 20;
          }
          doc.setFontSize(11);
          doc.text(`${itemIndex}. ${item.name}`, margin, yPosition);
          yPosition += 7;
          doc.setFontSize(9);
          doc.text(`카테고리: ${item.category}`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`단가: ${item.unitPrice.toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 6;
          doc.text(`수량: ${item.quantity}개`, margin + 5, yPosition);
          yPosition += 6;
          doc.setFontSize(11);
          doc.text(`소계: ${(item.finalPrice ?? item.totalPrice).toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 10;
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition, 190, yPosition);
          yPosition += 8;
        }
      }

      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, 190, yPosition);
      yPosition += 10;

      const totalPrice = cart.reduce((sum, entry) => sum + getItemFinalPrice(entry), 0);
      const baseTotal = cart.reduce((sum, entry) => {
        const item = entry.item;
        return sum + (item.finalPrice ? item.finalPrice - (item.marginAmount ?? 0) : item.totalPrice);
      }, 0);
      const totalMargin = cart.reduce((sum, entry) => sum + (entry.item.marginAmount ?? 0), 0);

      doc.setFontSize(11);
      doc.text(`총액 (마진 적용 전): ${baseTotal.toLocaleString()}원`, margin, yPosition);
      yPosition += 7;
      if (totalMargin > 0) {
        const firstWithMargin = cart.find((e) => e.item.margin);
        const marginPercent = firstWithMargin?.item.margin ?? "0";
        doc.setFontSize(10);
        doc.text(`회사 마진 (${marginPercent}%): +${totalMargin.toLocaleString()}원`, margin, yPosition);
        yPosition += 7;
      }
      doc.setFontSize(14);
      doc.text(`총 예상 금액: ${totalPrice.toLocaleString()}원`, margin, yPosition);
      yPosition += 10;
      doc.setFontSize(9);
      doc.text("* VAT 별도", margin, yPosition);
      yPosition += 6;
      doc.text(doc.splitTextToSize("* 본 견적서는 참고용이며, 실제 견적은 현장 확인 후 결정됩니다.", 170), margin, yPosition);

      const fileName = `견적서_통합_${new Date().toISOString().split("T")[0]}.pdf`;
      const blob = doc.output("blob");
      const file = new File([blob], fileName, { type: "application/pdf" });

      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "견적서",
          text: "(주) 동서 견적서를 보내드립니다.",
        });
        toast.success("이메일 앱이 열렸습니다. 받는 사람을 선택해 보내주세요.");
      } else {
        doc.save(fileName);
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent("견적서")}&body=${encodeURIComponent("견적서를 첨부해 보내드립니다. 방금 다운로드된 PDF 파일을 첨부해 주세요.")}`;
        window.open(gmailUrl, "_blank", "noopener,noreferrer");
        toast.success("PDF를 다운로드했습니다. Gmail이 열렸습니다. 첨부 버튼으로 PDF를 추가해 보내주세요.");
      }
    } catch (error) {
      logger.error("PDF 이메일 전송 오류:", error);
      toast.error("PDF 생성 또는 전송에 실패했습니다. 다시 시도해주세요.");
    }
  }, [cart]);

  const value: CartContextValue = {
    cart,
    addEstimateItem,
    addWoodItem,
    addUdineItem,
    removeCartItem,
    updateWoodItemQuantity,
    clearCart,
    getCartTotal,
    generatePDF,
    generatePDFAndEmail,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
