import React, { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";
import { logger } from "../utils/logger";
import { getFontUrl } from "../config/api";
import type { CartItem, WoodProduct, UnifiedCartItem } from "../types/calculator";

interface CartContextValue {
  cart: UnifiedCartItem[];
  addEstimateItem: (item: CartItem) => void;
  addWoodItem: (item: WoodProduct) => void;
  removeCartItem: (id: string) => void;
  updateWoodItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  generatePDF: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function getItemId(entry: UnifiedCartItem): string {
  return entry.source === "estimate" ? entry.item.id : entry.item.id;
}

function getItemFinalPrice(entry: UnifiedCartItem): number {
  if (entry.source === "estimate") {
    return entry.item.finalPrice ?? entry.item.totalPrice ?? 0;
  }
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

      let fontLoaded = false;
      try {
        const fontUrl = getFontUrl();
        const fontResponse = await fetch(fontUrl);
        if (fontResponse.ok) {
          const fontText = await fontResponse.text();
          let fontBase64: string | null = null;
          const base64Match1 = fontText.match(/var\s+font\s*=\s*['"]([^'"]+)['"]/);
          if (base64Match1?.[1]) fontBase64 = base64Match1[1];
          else {
            const base64Match2 = fontText.match(/export\s+default\s+['"]([^'"]+)['"]/);
            if (base64Match2?.[1]) fontBase64 = base64Match2[1];
            else {
              const trimmed = fontText.trim().replace(/\s/g, "").replace(/\n/g, "");
              if (trimmed.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(trimmed)) fontBase64 = trimmed;
            }
          }
          if (fontBase64) {
            doc.addFileToVFS("NanumGothic-normal.ttf", fontBase64);
            doc.addFont("NanumGothic-normal.ttf", "NanumGothic", "normal");
            fontLoaded = true;
          }
        }
      } catch (e) {
        logger.error("폰트 등록 실패:", e);
      }
      if (fontLoaded) {
        try {
          doc.setFont("NanumGothic", "normal");
        } catch {
          fontLoaded = false;
        }
      }

      const margin = 20;
      let yPosition = 20;
      const pageHeight = 297;

      doc.setFontSize(24);
      doc.text("견적서 (도어/문틀 · 목재 통합)", 105, yPosition, { align: "center" });
      yPosition += 15;

      doc.setFontSize(14);
      doc.text("쉐누 (CHENOUS)", margin, yPosition);
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

      for (let index = 0; index < cart.length; index++) {
        const entry = cart[index];
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
          const productName = `${index + 1}. ${displayName}`;
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
        } else {
          const item = entry.item;
          doc.setFontSize(11);
          if (fontLoaded) doc.setFont("NanumGothic", "normal");
          const productName = `${index + 1}. ${item.name}`;
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
        }

        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, 190, yPosition);
        yPosition += 8;
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
        if (entry.source === "estimate") {
          const item = entry.item;
          return sum + (item.finalPrice ? (item.finalPrice - (item.marginAmount ?? 0)) : item.totalPrice);
        }
        const item = entry.item;
        return sum + (item.finalPrice ? (item.finalPrice - (item.marginAmount ?? 0)) : item.totalPrice);
      }, 0);
      const totalMargin = cart.reduce((sum, entry) => {
        if (entry.source === "estimate") return sum + (entry.item.marginAmount ?? 0);
        return sum + (entry.item.marginAmount ?? 0);
      }, 0);

      doc.setFontSize(11);
      if (fontLoaded) doc.setFont("NanumGothic", "normal");
      doc.text(`총액 (마진 적용 전): ${baseTotal.toLocaleString()}원`, margin, yPosition);
      yPosition += 7;
      if (totalMargin > 0) {
        const firstWithMargin = cart.find(
          (e) => (e.source === "estimate" && e.item.margin) || (e.source === "wood" && e.item.margin)
        );
        const marginPercent =
          firstWithMargin?.source === "estimate"
            ? firstWithMargin.item.margin
            : firstWithMargin?.source === "wood"
              ? firstWithMargin.item.margin
              : "0";
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

  const value: CartContextValue = {
    cart,
    addEstimateItem,
    addWoodItem,
    removeCartItem,
    updateWoodItemQuantity,
    clearCart,
    getCartTotal,
    generatePDF,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
