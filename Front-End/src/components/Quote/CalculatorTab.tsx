import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ScrollArea } from "../ui/scroll-area";
import { Calculator, ShoppingCart, RefreshCw, Loader2, Plus, Trash2, CreditCard, FileDown, Search, X } from "lucide-react";
import { toast } from "sonner";
import { logger } from "../../utils/logger";
import { COMPANY_ID, DEFAULT_TYPE_NAME, DEFAULT_QUANTITY, DEFAULT_ABS_DOOR_WIDTH, DEFAULT_ABS_DOOR_HEIGHT } from "../../constants/calculator";
import type { ExtendedEstimateResponse, CartItem } from "../../types/calculator";
import {
  fetchCategories,
  fetchSubCategories,
  fetchProducts,
  fetchOptions,
  fetchVariants,
  fetchColors,
  calculateEstimate,
  exportEstimatePdf,
  type EstimatePdfRequest,
  type Category,
  type Product,
  type Option,
  type ProductVariant,
  type Color,
} from "../../api/estimateApi";
import { getFontUrl } from "../../config/api";

export function CalculatorTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [specName, setSpecName] = useState<string>("");
  const [typeName, setTypeName] = useState<string>(DEFAULT_TYPE_NAME);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [colorSearchQuery, setColorSearchQuery] = useState<string>("");
  const [isColorPopoverOpen, setIsColorPopoverOpen] = useState(false);
  const [quantity, setQuantity] = useState<number>(DEFAULT_QUANTITY);
  const [margin, setMargin] = useState<string>(""); // 회사 마진 (%)

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [result, setResult] = useState<ExtendedEstimateResponse | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // 초기 데이터 로드
  useEffect(() => {
    loadCategories();
    loadColors();
  }, []);

  // 메인 카테고리 선택 시 세부 카테고리 로드
  useEffect(() => {
    if (selectedCategory) {
      loadSubCategories(parseInt(selectedCategory));
    } else {
      setSubCategories([]);
      setProducts([]);
      setOptions([]);
    }
  }, [selectedCategory]);

  // 세부 카테고리 선택 시 제품 로드
  useEffect(() => {
    if (selectedSubCategory) {
      loadProducts(parseInt(selectedSubCategory));
      // 간살 목창호인 경우 제품을 자동으로 로드하고 첫 번째 제품 선택
      const subCategoryObj = subCategories.find(
        (sc) => sc.id.toString() === selectedSubCategory
      );
      if (subCategoryObj?.name === "간살 목창호") {
        // 제품 로드 후 자동 선택을 위해 별도 처리
      }
    } else {
      setProducts([]);
      setOptions([]);
    }
  }, [selectedSubCategory, subCategories]);

  // 제품 로드 후 간살 목창호인 경우 첫 번째 제품 자동 선택
  useEffect(() => {
    if (products.length > 0 && selectedSubCategory) {
      const subCategoryObj = subCategories.find(
        (sc) => sc.id.toString() === selectedSubCategory
      );
      if (subCategoryObj?.name === "간살 목창호" && !selectedProduct) {
        // 간살 목창호의 첫 번째 제품 자동 선택
        const firstProduct = products[0];
        if (firstProduct) {
          setSelectedProduct(firstProduct.id.toString());
        }
      }
    }
  }, [products, selectedSubCategory, subCategories, selectedProduct]);

  // 제품 선택 시 옵션 및 variants 로드
  useEffect(() => {
    if (selectedProduct) {
      loadOptions(parseInt(selectedProduct));
      loadVariants(parseInt(selectedProduct));
    } else {
      setOptions([]);
      setVariants([]);
    }
  }, [selectedProduct]);

  // 몰딩 variants 로드 후 첫 번째 타입으로 자동 설정
  useEffect(() => {
    const selectedCategoryObj = categories.find(
      (c) => c.id.toString() === selectedCategory
    );
    const categoryCode = selectedCategoryObj?.code;
    
    if (categoryCode === "MOLDING" && variants.length > 0 && !typeName) {
      const firstType = Array.from(new Set(variants.map(v => v.typeName)))[0];
      if (firstType) {
        setTypeName(firstType);
        // 첫 번째 타입에 해당하는 첫 번째 규격 설정
        const firstSpec = variants.find(v => v.typeName === firstType)?.specName;
        if (firstSpec) {
          setSpecName(firstSpec);
        }
      }
    }
  }, [variants, selectedCategory, categories, typeName]);

  // 필름 variants 로드 후 첫 번째 규격으로 자동 설정
  useEffect(() => {
    const selectedCategoryObj = categories.find(
      (c) => c.id.toString() === selectedCategory
    );
    const categoryCode = selectedCategoryObj?.code;
    
    if (categoryCode === "FILM" && variants.length > 0 && !specName) {
      const firstSpec = Array.from(new Set(variants.map(v => v.specName)))[0];
      if (firstSpec) {
        setSpecName(firstSpec);
        // 첫 번째 규격에 해당하는 첫 번째 타입 설정
        const firstType = variants.find(v => v.specName === firstSpec)?.typeName;
        if (firstType) {
          setTypeName(firstType);
        }
      }
    }
  }, [variants, selectedCategory, categories, specName]);

  // 메인 카테고리 변경 시 리셋
  useEffect(() => {
    setSelectedSubCategory("");
    setSelectedProduct("");
    setSelectedOptions([]);
    setResult(null);
    setWidth("");
    setHeight("");
    setSpecName("");
    setTypeName("");
    setVariants([]);
    setSubCategories([]);
  }, [selectedCategory]);
  
  // 세부 카테고리 변경 시 리셋
  useEffect(() => {
    setSelectedProduct("");
    setSelectedOptions([]);
    setResult(null);
    setWidth("");
    setHeight("");
    setSpecName("");
    // 간살 목창호가 아닌 경우에만 타입 리셋
    const subCategoryObj = subCategories.find(
      (sc) => sc.id.toString() === selectedSubCategory
    );
    if (subCategoryObj?.name !== "간살 목창호") {
      setTypeName("");
    } else {
      // 간살 목창호인 경우 기본 타입 설정
      setTypeName("미닫이 (80바)");
    }
    setVariants([]);
  }, [selectedSubCategory, subCategories]);

  // 제품 선택 시 타입 자동 설정
  useEffect(() => {
    if (selectedProduct) {
      const selectedProductObj = products.find(
        (p) => p.id.toString() === selectedProduct
      );
      const selectedCategoryObj = categories.find(
        (c) => c.id.toString() === selectedCategory
      );
      const categoryCode = selectedCategoryObj?.code;

      // ABS 도어인 경우 기본 가로/세로 설정
      const isABSDoor = selectedProductObj?.name?.includes("ABS") || 
                       selectedProductObj?.description?.includes("ABS") ||
                       selectedProductObj?.name?.includes("ABS 도어") ||
                       selectedProductObj?.description?.includes("ABS 도어");
      
      if (isABSDoor) {
        if (!width) setWidth(DEFAULT_ABS_DOOR_WIDTH);
        if (!height) setHeight(DEFAULT_ABS_DOOR_HEIGHT);
      }

      if (selectedProductObj?.name?.includes("슬림문틀")) {
        setTypeName("가스켓형 슬림문틀");
      } else if (selectedProductObj?.name?.includes("목재문틀")) {
        setTypeName("스토퍼형");
        setSpecName("110"); // 목재문틀 기본 규격
      } else if (categoryCode === "FILM") {
        // 필름 카테고리인 경우 기본값 설정
        setSpecName("25m 1롤");
        setTypeName("원롤");
      } else if (categoryCode === "WINDOW") {
        // 목창호 카테고리인 경우 기본값 설정
        setTypeName("미닫이 (80바)");
      } else if (categoryCode === "MOLDING") {
        // 몰딩 카테고리는 variants 로드 후 첫 번째 값으로 설정
        // variants가 로드되면 useEffect에서 처리
        setSpecName("");
        setTypeName("");
      } else {
        setTypeName("일반형 3방");
      }
    }
  }, [selectedProduct, products, selectedCategory, categories]);

  const loadCategories = async () => {
    try {
      setIsLoadingData(true);
      const data = await fetchCategories(COMPANY_ID);
      logger.debug("로드된 메인 카테고리 데이터:", data);
      logger.info("메인 카테고리 개수:", data.length);
      if (data && data.length > 0) {
        setCategories(data);
        logger.debug("메인 카테고리 상태 업데이트 완료");
      } else {
        logger.warn("메인 카테고리 데이터가 비어있습니다.");
        toast.warning("메인 카테고리 데이터가 없습니다.");
      }
    } catch (error: any) {
      logger.error("메인 카테고리 로드 실패:", error);
      const errorMessage = error.message || "메인 카테고리를 불러오는데 실패했습니다.";
      toast.error(errorMessage);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadSubCategories = async (parentId: number) => {
    try {
      setIsLoadingData(true);
      logger.debug("세부 카테고리 로드 시작 - parentId:", parentId);
      const data = await fetchSubCategories(parentId);
      logger.debug("로드된 세부 카테고리 데이터:", data);
      logger.info("세부 카테고리 개수:", data.length);
      if (data && data.length > 0) {
        setSubCategories(data);
        logger.debug("세부 카테고리 상태 업데이트 완료");
      } else {
        logger.warn("세부 카테고리 데이터가 비어있습니다. 메인 카테고리로 제품 로드 시도");
        setSubCategories([]);
        // 세부 카테고리가 없으면 메인 카테고리로 제품 로드
        loadProducts(parentId);
      }
    } catch (error: any) {
      logger.error("세부 카테고리 로드 실패:", error);
      // 세부 카테고리가 없을 수도 있으므로 에러는 표시하지 않음
      setSubCategories([]);
      // 세부 카테고리가 없으면 메인 카테고리로 제품 로드 시도
      loadProducts(parentId);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadProducts = async (categoryId: number) => {
    try {
      setIsLoadingData(true);
      logger.debug("제품 로드 시작 - categoryId:", categoryId);
      const data = await fetchProducts(categoryId);
      logger.debug("로드된 제품 데이터:", data);
      logger.info("제품 개수:", data.length);
      if (data && data.length > 0) {
        // 중복 제거: id 기준으로 중복 제거
        const uniqueProducts = Array.from(
          new Map(data.map((product) => [product.id, product])).values()
        );
        logger.debug("중복 제거 후 제품 개수:", uniqueProducts.length);
        setProducts(uniqueProducts);
        logger.debug("제품 상태 업데이트 완료");
      } else {
        logger.warn("제품 데이터가 비어있습니다.");
        setProducts([]);
        toast.warning("해당 카테고리에 등록된 제품이 없습니다.");
      }
    } catch (error: any) {
      logger.error("제품 로드 실패:", error);
      const errorMessage = error.message || "제품을 불러오는데 실패했습니다.";
      toast.error(errorMessage);
      setProducts([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadOptions = async (productId: number) => {
    try {
      setIsLoadingData(true);
      logger.debug("옵션 로드 시작 - productId:", productId, "companyId:", COMPANY_ID);
      const data = await fetchOptions(productId, COMPANY_ID);
      logger.debug("로드된 옵션 데이터:", data);
      logger.info("옵션 개수:", data.length);
      if (data && data.length > 0) {
        setOptions(data);
        logger.debug("옵션 상태 업데이트 완료");
      } else {
        logger.warn("옵션 데이터가 비어있습니다.");
        setOptions([]);
        // 옵션이 없어도 경고는 표시하지 않음 (옵션이 없는 제품도 있을 수 있음)
      }
    } catch (error: any) {
      logger.error("옵션 로드 실패:", error);
      const errorMessage = error.message || "옵션을 불러오는데 실패했습니다.";
      toast.error(errorMessage);
      setOptions([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadVariants = async (productId: number) => {
    try {
      setIsLoadingData(true);
      logger.debug("Variants 로드 시작 - productId:", productId);
      const data = await fetchVariants(productId);
      logger.debug("로드된 variants 데이터:", data);
      logger.info("Variants 개수:", data.length);
      if (data && data.length > 0) {
        setVariants(data);
        logger.debug("Variants 상태 업데이트 완료");
      } else {
        logger.warn("Variants 데이터가 비어있습니다.");
        setVariants([]);
      }
    } catch (error: any) {
      logger.error("Variants 로드 실패:", error);
      // Variants가 없어도 경고는 표시하지 않음 (variants가 없는 제품도 있을 수 있음)
      setVariants([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadColors = async () => {
    try {
      setIsLoadingData(true);
      logger.debug("색상 로드 시작 - companyId:", COMPANY_ID);
      const data = await fetchColors(COMPANY_ID);
      logger.debug("로드된 색상 데이터:", data);
      logger.info("색상 개수:", data.length);
      if (data && data.length > 0) {
        setColors(data);
        logger.debug("색상 상태 업데이트 완료");
      } else {
        logger.warn("색상 데이터가 비어있습니다.");
        setColors([]);
      }
    } catch (error: any) {
      logger.error("색상 로드 실패:", error);
      const errorMessage = error.message || "색상을 불러오는데 실패했습니다.";
      toast.error(errorMessage);
      setColors([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleOption = (optionId: number) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  };

  // 장바구니에 견적 추가
  const addToCart = () => {
    if (!result) {
      toast.error("견적을 먼저 계산해주세요.");
      return;
    }

    // 선택된 색상 정보 가져오기
    const selectedColorObj = selectedColor ? colors.find((c) => c.id.toString() === selectedColor) : null;

    const cartItem: CartItem = {
      ...result,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // 고유 ID 생성
      categoryName: result.categoryName || "",
      subCategoryName: result.subCategoryName || "",
      selectedOptions: result.selectedOptions || [],
      priceIncreaseInfo: result.priceIncreaseInfo,
      colorCostInfo: result.colorCostInfo,
      width: width || undefined,
      height: height || undefined,
      specName: specName || undefined,
      typeName: typeName || undefined,
      selectedColorId: selectedColor || undefined,
      selectedColorName: selectedColorObj?.name || undefined,
      selectedColorCode: selectedColorObj?.colorCode || undefined,
      margin: margin || undefined,
      marginAmount: result.marginAmount,
      finalPrice: result.finalPrice,
    };

    setCart((prev) => [...prev, cartItem]);
    toast.success("장바구니에 추가되었습니다.");
    
    // 계산 폼 초기화 (마진은 유지)
    setResult(null);
    setSelectedProduct("");
    setSelectedOptions([]);
    setQuantity(1);
    setWidth("");
    setHeight("");
    setSpecName("");
    setTypeName(DEFAULT_TYPE_NAME);
    setSelectedColor("");
    // 마진은 초기화하지 않음 (여러 견적에 동일하게 적용)
  };

  // 장바구니에서 견적 제거
  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.success("장바구니에서 제거되었습니다.");
  };

  // 장바구니 총합 계산
  const calculateCartTotal = (): number => {
    // 마진이 적용된 최종 가격이 있으면 그것을 사용, 없으면 totalPrice 사용
    return cart.reduce((total, item) => {
      return total + (item.finalPrice || item.totalPrice || 0);
    }, 0);
  };

  // 한글 텍스트 인코딩 정규화 함수
  // EUC-KR/CP949로 잘못 인코딩된 텍스트를 UTF-8로 변환
  const normalizeKoreanText = (text: string | null | undefined): string => {
    if (!text) return "";
    
    // 이미 정상적인 UTF-8 문자열인 경우 그대로 반환
    try {
      // 깨진 문자 패턴 감지 (EUC-KR을 UTF-8로 잘못 읽은 경우)
      // ÂP², Ç'Á1Ç|, ÆÐ, ¼ø 같은 패턴
      if (/Â|Ç|Æ|¼|ø/.test(text) && text.length > 0) {
        logger.debug("인코딩 문제 감지된 텍스트:", text.substring(0, 50));
        
        // 브라우저에서는 직접 EUC-KR 디코딩이 어려우므로
        // 백엔드에서 올바른 인코딩으로 보내는 것이 중요
        // 여기서는 텍스트가 이미 깨진 상태라면 원본 반환
        // (실제 변환은 백엔드에서 처리해야 함)
        return text;
      }
    } catch (e) {
      logger.warn("텍스트 정규화 실패:", e);
    }
    
    return text;
  };

  // PDF 생성: 서버 export-pdf 우선 (EC2 한글 폰트), 실패 시 클라이언트 jsPDF 폴백
  const generatePDF = async () => {
    if (cart.length === 0) {
      toast.error("장바구니가 비어있습니다.");
      return;
    }

    const dateStr = new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const baseTotal = cart.reduce((sum, item) => {
      const base = item.finalPrice ? item.finalPrice - (item.marginAmount || 0) : item.totalPrice;
      return sum + base;
    }, 0);
    const totalMargin = cart.reduce((sum, item) => sum + (item.marginAmount || 0), 0);
    const totalPrice = calculateCartTotal();
    const marginPercent = cart.find((i) => i.margin)?.margin ?? "0";

    const pdfRequest: EstimatePdfRequest = {
      companyName: "쉐누 (CHENOUS)",
      dateStr,
      items: cart.map((item) => {
        const base = item.finalPrice ? item.finalPrice - (item.marginAmount || 0) : item.totalPrice;
        const colorCost = item.colorCostInfo
          ? `(${item.colorCostInfo.colorName}) (${Math.round((item.colorCostInfo.costRate ?? 0) * 100)}% 인상)`
          : undefined;
        return {
          productName: item.productName,
          categoryName: item.categoryName,
          subCategoryName: item.subCategoryName,
          specName: item.specName,
          typeName: item.typeName,
          width: item.width,
          height: item.height,
          selectedColorName: item.selectedColorName,
          selectedColorCode: item.selectedColorCode,
          unitPrice: item.unitPrice,
          priceIncreaseReason: item.priceIncreaseInfo?.reason,
          colorCostInfo: colorCost,
          optionPrice: item.optionPrice ?? 0,
          selectedOptions: item.selectedOptions ?? [],
          quantity: item.quantity,
          baseTotal: base,
          margin: item.margin,
          marginAmount: item.marginAmount ?? 0,
          finalTotal: item.finalPrice ?? item.totalPrice,
        };
      }),
      baseTotal,
      totalMargin,
      marginPercent,
      totalPrice,
    };

    try {
      const blob = await exportEstimatePdf(pdfRequest);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `견적서_${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF 파일이 다운로드되었습니다.");
      return;
    } catch (e) {
      logger.warn("서버 PDF 생성 실패, 클라이언트 jsPDF 폴백:", e);
      toast.info("서버 PDF 생성에 실패해 브라우저에서 생성합니다.");
    }

    try {
      // jsPDF 동적 import (폴백)
      const { jsPDF } = await import("jspdf");
      
      const doc = new jsPDF("p", "mm", "a4");

      // 한글 폰트 동적 로드 및 등록
      let fontLoaded = false;
      
      try {
        // base64로 인코딩된 폰트 파일 로드 (백엔드 서버에서 제공)
        const fontUrl = getFontUrl();
        logger.debug("폰트 파일 URL:", fontUrl);
        const fontResponse = await fetch(fontUrl);
        if (!fontResponse.ok) {
          throw new Error(`HTTP ${fontResponse.status}`);
        }
        // 폰트 파일을 텍스트로 로드 (UTF-8로 디코딩)
        // 서버에서 올바른 Content-Type과 charset을 보내야 함
        const fontText = await fontResponse.text();
        
        // base64 문자열 추출
        let fontBase64: string | null = null;
        
        // 형식 1: fontconverter 형식 - var font = 'base64...';
        const base64Match1 = fontText.match(/var\s+font\s*=\s*['"]([^'"]+)['"]/);
        if (base64Match1 && base64Match1[1]) {
          fontBase64 = base64Match1[1];
        } else {
          // 형식 2: export default 'base64...';
          const base64Match2 = fontText.match(/export\s+default\s+['"]([^'"]+)['"]/);
          if (base64Match2 && base64Match2[1]) {
            fontBase64 = base64Match2[1];
          } else {
            // 형식 3: 전체가 base64 문자열인 경우 (공백, 줄바꿈 제거)
            const trimmedText = fontText.trim().replace(/\s/g, '').replace(/\n/g, '');
            // base64 문자열은 최소 1000자 이상이고, base64 문자만 포함
            if (trimmedText.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(trimmedText)) {
              fontBase64 = trimmedText;
            }
          }
        }
        
        if (fontBase64) {
          // VFS에 폰트 파일 추가
          doc.addFileToVFS("NanumGothic-normal.ttf", fontBase64);
          // 폰트 등록
          doc.addFont("NanumGothic-normal.ttf", "NanumGothic", "normal");
          fontLoaded = true;
            logger.info("한글 폰트 등록 성공");
          } else {
            logger.error("폰트 base64 문자열을 찾을 수 없습니다. 파일 형식을 확인해주세요.");
            logger.debug("파일 시작 부분:", fontText.substring(0, 200));
        }
      } catch (e) {
        logger.error("폰트 등록 실패:", e);
      }
      
      // 폰트 설정 (한글 표시를 위해 필수)
      if (fontLoaded) {
        try {
          doc.setFont("NanumGothic", "normal");
        } catch (e) {
          logger.warn("NanumGothic 폰트 설정 실패:", e);
          fontLoaded = false;
        }
      } else {
        logger.warn("NanumGothic 폰트를 사용할 수 없습니다. 한글이 깨질 수 있습니다.");
      }

      const margin = 20;
      let yPosition = 20;
      const pageHeight = 297; // A4 세로 (mm)

      // 제목
      doc.setFontSize(24);
      doc.text("견적서", 105, yPosition, { align: "center" });
      yPosition += 15;

      // 회사 정보
      doc.setFontSize(14);
      doc.text("쉐누 (CHENOUS)", margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      const dateStr = new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.text(`작성일: ${dateStr}`, margin, yPosition);
      yPosition += 12;

      // 구분선
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, 190, yPosition);
      yPosition += 12;

      // 장바구니 항목들
      doc.setFontSize(12);
      doc.setFont("NanumGothic", "normal");
      doc.text("견적 내역", margin, yPosition);
      yPosition += 12;

      doc.setFontSize(10);
      doc.setFont("NanumGothic", "normal");

      cart.forEach((item, index) => {
        // 페이지 넘김 체크
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }

        // 항목 번호 및 제품명
        doc.setFontSize(11);
        doc.setFont("NanumGothic", "normal");
        // 목재문틀인 경우 제품명을 "목재문틀"로 변경
        const normalizedProductName = normalizeKoreanText(item.productName);
        const displayProductName = (normalizedProductName?.includes("목재문틀") || 
                                   normalizedProductName?.includes("才") ||
                                   normalizedProductName?.includes("사이")) 
                                   ? "목재문틀" 
                                   : normalizedProductName;
        const productName = `${index + 1}. ${displayProductName}`;
        // 긴 제품명은 여러 줄로 분할
        const splitProductName = doc.splitTextToSize(productName, 170);
        doc.text(splitProductName, margin, yPosition);
        yPosition += splitProductName.length * 6 + 2;

        // 카테고리 정보
        if (item.categoryName) {
          doc.setFontSize(9);
          doc.setFont("NanumGothic", "normal");
          const normalizedCategoryName = normalizeKoreanText(item.categoryName);
          const normalizedSubCategoryName = normalizeKoreanText(item.subCategoryName);
          const categoryText = normalizedSubCategoryName
            ? `${normalizedCategoryName} > ${normalizedSubCategoryName}`
            : normalizedCategoryName;
          doc.text(`카테고리: ${categoryText}`, margin + 5, yPosition);
          yPosition += 6;
        }

        // 규격 및 타입 정보
        if (item.specName || item.typeName) {
          doc.setFontSize(9);
          doc.setFont("NanumGothic", "normal");
          const normalizedSpecName = normalizeKoreanText(item.specName);
          const normalizedTypeName = normalizeKoreanText(item.typeName);
          const specTypeText = [normalizedSpecName, normalizedTypeName].filter(Boolean).join(" / ");
          if (specTypeText) {
            doc.text(`규격/타입: ${specTypeText}`, margin + 5, yPosition);
            yPosition += 6;
          }
        }

        // 사이즈 정보
        if (item.width || item.height) {
          doc.setFontSize(9);
          doc.setFont("NanumGothic", "normal");
          const sizeText = [item.width ? `가로: ${item.width}mm` : "", item.height ? `세로: ${item.height}mm` : ""]
            .filter(Boolean)
            .join(", ");
          if (sizeText) {
            doc.text(`사이즈: ${sizeText}`, margin + 5, yPosition);
            yPosition += 6;
          }
        }

        // 색상 정보
        if (item.selectedColorName) {
          doc.setFontSize(9);
          doc.setFont("NanumGothic", "normal");
          const normalizedColorName = normalizeKoreanText(item.selectedColorName);
          const normalizedColorCode = normalizeKoreanText(item.selectedColorCode);
          const colorText = normalizedColorCode
            ? `${normalizedColorName} (${normalizedColorCode})`
            : normalizedColorName;
          doc.text(`색상: ${colorText}`, margin + 5, yPosition);
          yPosition += 6;
        }

        // 상세 정보
        doc.setFontSize(9);
        doc.setFont("NanumGothic", "normal");
        doc.text(`기본 단가: ${item.unitPrice.toLocaleString()}원`, margin + 5, yPosition);
        yPosition += 6;

        // 사이즈로 인한 가격 인상 정보
        if (item.priceIncreaseInfo) {
          doc.setFontSize(9);
          doc.setFont("NanumGothic", "normal");
          const increaseText = `${item.priceIncreaseInfo.reason}`;
          doc.text(increaseText, margin + 5, yPosition);
          yPosition += 6;
        }

        // 색상 추가 비용 정보
        if (item.colorCostInfo) {
          doc.setFontSize(9);
          doc.setFont("NanumGothic", "normal");
          const colorCostText = `색상 추가 비용 (${item.colorCostInfo.colorName}) (${Math.round(item.colorCostInfo.costRate * 100)}% 인상)`;
          doc.text(colorCostText, margin + 5, yPosition);
          yPosition += 6;
        }

        if (item.optionPrice !== 0) {
          doc.setFontSize(9);
          doc.setFont("NanumGothic", "normal");
          doc.text(
            `추가 옵션 가격: ${item.optionPrice > 0 ? "+" : ""}${item.optionPrice.toLocaleString()}원`,
            margin + 5,
            yPosition
          );
          yPosition += 6;
        }

        // 선택된 옵션 상세 정보
        if (item.selectedOptions && item.selectedOptions.length > 0) {
          doc.setFontSize(9);
          doc.setFont("NanumGothic", "normal");
          const normalizedOptions = item.selectedOptions.map(opt => normalizeKoreanText(opt));
          const optionsText = `선택 옵션: ${normalizedOptions.join(", ")}`;
          const splitOptions = doc.splitTextToSize(optionsText, 170);
          doc.text(splitOptions, margin + 5, yPosition);
          yPosition += splitOptions.length * 5;
        }

        doc.setFontSize(9);
        doc.setFont("NanumGothic", "normal");
        doc.text(`수량: ${item.quantity}개`, margin + 5, yPosition);
        yPosition += 7;

        // 소계 (마진 적용 전)
        const baseTotal = item.finalPrice ? (item.finalPrice - (item.marginAmount || 0)) : item.totalPrice;
        doc.setFont("NanumGothic", "normal");
        doc.text(`소계 (마진 적용 전): ${baseTotal.toLocaleString()}원`, margin + 5, yPosition);
        yPosition += 6;

        // 마진 정보
        if (item.margin && item.marginAmount) {
          doc.setFontSize(9);
          doc.setFont("NanumGothic", "normal");
          doc.text(`회사 마진 (${item.margin}%): +${item.marginAmount.toLocaleString()}원`, margin + 5, yPosition);
          yPosition += 6;
        }

        // 최종 소계 (마진 적용 후)
        const finalTotal = item.finalPrice || item.totalPrice;
        doc.setFontSize(11);
        doc.setFont("NanumGothic", "normal"); // bold 대신 normal 사용 (한글 깨짐 방지)
        doc.setDrawColor(0, 0, 0); // 검은색으로 강조
        doc.text(`최종 소계: ${finalTotal.toLocaleString()}원`, margin + 5, yPosition);
        yPosition += 10;

        // 구분선
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPosition, 190, yPosition);
        yPosition += 8;
      });

      // 총합
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont("NanumGothic", "normal");
      doc.setDrawColor(0, 0, 0);
      doc.line(margin, yPosition, 190, yPosition);
      yPosition += 10;

      const totalPrice = calculateCartTotal();
      
      // 마진 적용 전 총액 계산
      const baseTotal = cart.reduce((sum, item) => {
        const base = item.finalPrice ? (item.finalPrice - (item.marginAmount || 0)) : item.totalPrice;
        return sum + base;
      }, 0);
      
      // 총 마진 금액
      const totalMargin = cart.reduce((sum, item) => sum + (item.marginAmount || 0), 0);
      
      doc.setFontSize(11);
      doc.setFont("NanumGothic", "normal");
      doc.text(`총액 (마진 적용 전): ${baseTotal.toLocaleString()}원`, margin, yPosition);
      yPosition += 7;
      
      if (totalMargin > 0) {
        const marginPercent = cart.find(item => item.margin)?.margin || "0";
        doc.setFontSize(10);
        doc.setFont("NanumGothic", "normal");
        doc.text(`회사 마진 (${marginPercent}%): +${totalMargin.toLocaleString()}원`, margin, yPosition);
        yPosition += 7;
      }
      
      doc.setFontSize(14);
      doc.setFont("NanumGothic", "normal"); // bold 대신 normal 사용 (한글 깨짐 방지)
      doc.setDrawColor(0, 0, 0); // 검은색으로 강조
      doc.text(`총 예상 금액: ${totalPrice.toLocaleString()}원`, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont("NanumGothic", "normal");
      doc.text("* VAT 별도", margin, yPosition);
      yPosition += 6;
      const noteText = "* 본 견적서는 참고용이며, 실제 견적은 현장 확인 후 결정됩니다.";
      const splitNote = doc.splitTextToSize(noteText, 170);
      doc.text(splitNote, margin, yPosition);

      // PDF 저장
      const fileName = `견적서_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      toast.success("PDF 파일이 다운로드되었습니다.");
    } catch (error) {
      logger.error("PDF 생성 오류:", error);
      toast.error("PDF 생성에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleCalculate = async () => {
    const subCategoryObj = subCategories.find(
      (sc) => sc.id.toString() === selectedSubCategory
    );
    const isGansalWindow = subCategoryObj?.name === "간살 목창호";
    
    // 간살 목창호가 아닌 경우에만 제품 선택 체크
    if (!isGansalWindow && !selectedProduct) {
      toast.error("제품을 선택해주세요.");
      return;
    }
    
    // 간살 목창호인 경우 타입 선택 체크
    if (isGansalWindow && !typeName) {
      toast.error("타입을 선택해주세요.");
      return;
    }

    const selectedCategoryObj = categories.find(
      (c) => c.id.toString() === selectedCategory
    );
    const categoryCode = selectedCategoryObj?.code;

    // 문틀 카테고리인 경우 가로/세로 입력 체크
    if (categoryCode === "FRAME" && selectedProduct) {
      if (!width || !height) {
        toast.error("가로 폭과 세로 높이를 입력해주세요.");
        return;
      }
    }
    
    // 일반 목창호인 경우 가로/세로 입력 체크
    if (categoryCode === "WINDOW" && !isGansalWindow && selectedProduct) {
      if (!width || !height) {
        toast.error("가로 폭과 세로 높이를 입력해주세요.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const selectedProductObj = products.find(
        (p) => p.id.toString() === selectedProduct
      );
      const isWoodFrame = selectedProductObj?.name?.includes("목재문틀");
      const isSlimFrame = selectedProductObj?.name?.includes("슬림문틀");
      const isABSDoor = selectedProductObj?.name?.includes("ABS") || 
                       selectedProductObj?.description?.includes("ABS") ||
                       selectedProductObj?.name?.includes("ABS 도어") ||
                       selectedProductObj?.description?.includes("ABS 도어");
      const isFrame = categoryCode === "FRAME";
      
      // 간살 목창호인 경우 타입 선택 시 제품이 자동 선택되므로, 제품이 없으면 타입으로 찾기
      let productIdToUse = selectedProduct ? parseInt(selectedProduct) : null;
      if (isGansalWindow && !productIdToUse && typeName) {
        // 간살 목창호 제품 찾기: 타입명이 제품명에 포함되어 있는지 확인
        const matchedProduct = products.find((p) => {
          if (!p.name) return false;
          // "미닫이 (80바)" -> "미닫이" 또는 "80바" 포함 확인
          // "여닫이 (120바)" -> "여닫이" 또는 "120바" 포함 확인
          const typeNameLower = typeName.toLowerCase();
          const productNameLower = p.name.toLowerCase();
          return productNameLower.includes(typeNameLower) || 
                 (typeNameLower.includes("미닫이") && productNameLower.includes("미닫이")) ||
                 (typeNameLower.includes("여닫이") && productNameLower.includes("여닫이"));
        });
        if (matchedProduct) {
          productIdToUse = matchedProduct.id;
          logger.debug("간살 목창호 제품 자동 선택:", matchedProduct.name, "ID:", productIdToUse);
        } else {
          logger.error("간살 목창호 제품을 찾을 수 없습니다. typeName:", typeName, "products:", products);
        }
      }
      
      if (!productIdToUse) {
        if (isGansalWindow) {
          toast.error("간살 목창호 제품을 찾을 수 없습니다. 타입을 다시 선택해주세요.");
        } else {
          toast.error("제품을 찾을 수 없습니다.");
        }
        return;
      }
      
      // 간살 목창호인 경우 width와 height 필수 체크
      if (isGansalWindow && (!width || !height)) {
        toast.error("가로폭과 세로 높이를 입력해주세요.");
        return;
      }
      
      const request = {
        companyId: COMPANY_ID,
        productId: productIdToUse,
        quantity: quantity,
        optionIds: selectedOptions.length > 0 ? selectedOptions : undefined,
        // 카테고리별 조건부 필드
        ...(categoryCode === "INTERLOCK" && width && height
          ? {
              width: parseInt(width),
              height: parseInt(height),
            }
          : {}),
        ...(categoryCode === "FRAME" && specName
          ? {
              specName: specName,
              typeName: typeName,
              // 모든 문틀 제품에 가로/세로 전달
              ...(width && height
                ? {
                    width: parseInt(width),
                    height: parseInt(height),
                  }
                : {}),
            }
          : {}),
        // ABS 도어인 경우 가로/세로 전달
        ...(isABSDoor && width && height
          ? {
              width: parseInt(width),
              height: parseInt(height),
            }
          : {}),
        ...((categoryCode === "MOLDING" || categoryCode === "FILM") && specName && typeName
          ? {
              specName: specName,
              typeName: typeName,
            }
          : {}),
        ...(categoryCode === "WINDOW" && (width || isGansalWindow || selectedProduct) && (typeName || selectedProduct)
          ? {
              width: width ? parseInt(width) : undefined,
              height: height ? parseInt(height) : undefined,
              typeName: typeName || undefined,
            }
          : {}),
      };

      let response = await calculateEstimate(request);
      
      // 선택된 옵션 이름들 가져오기
      const selectedOptionsNames = selectedOptions
        .map((optionId) => {
          const option = options.find((o) => o.id === optionId);
          return option ? option.name : null;
        })
        .filter((name): name is string => name !== null);
      
      // ExtendedEstimateResponse로 변환
      let extendedResponse: ExtendedEstimateResponse = {
        ...response,
        categoryName: selectedCategoryObj?.name,
        subCategoryName: subCategoryObj?.name,
        selectedOptions: selectedOptionsNames,
      };
      
      // 색상 cost 반영
      if (selectedColor) {
        const selectedColorObj = colors.find((c) => c.id.toString() === selectedColor);
        if (selectedColorObj?.cost && selectedColorObj.cost > 0) {
          // cost가 있는 경우 (예: 0.1 = 10%) unitPrice에 반영
          const colorCostRate = Number(selectedColorObj.cost);
          const colorCostIncrease = Math.round(extendedResponse.unitPrice * colorCostRate);
          const increasedUnitPrice = extendedResponse.unitPrice + colorCostIncrease;
          
          // totalPrice 재계산
          const newTotalPrice = (increasedUnitPrice + extendedResponse.optionPrice) * extendedResponse.quantity;
          
          extendedResponse = {
            ...extendedResponse,
            unitPrice: increasedUnitPrice,
            totalPrice: newTotalPrice,
            colorCostInfo: {
              colorName: selectedColorObj.name,
              costRate: colorCostRate,
            },
          };
        }
      }
      
      // 간살 목창호인 경우 특별 계산 규칙 적용
      let priceIncreaseInfo: { rate: number; reason: string } | null = null;
      if (isGansalWindow && width && height && typeName) {
        const widthNum = parseInt(width);
        const heightNum = parseInt(height);
        let additionalAmount = 0;
        const reasons: string[] = [];
        
        if (heightNum >= 2101 && widthNum > 0) {
          const isMidari = typeName.includes("미닫이");
          const isYeodari = typeName.includes("여닫이");
          
          if (isMidari) {
            // 미닫이(80바): 350, 386, 461, 561, 651 → +20,000
            if ([350, 386, 461, 561, 651].includes(widthNum)) {
              additionalAmount = 20000;
              reasons.push(`높이 ${heightNum}mm, 가로폭 ${widthNum}mm (+20,000원)`);
            }
            // 미닫이(80바): 751, 851, 951, 1041 → +25,000
            else if ([751, 851, 951, 1041].includes(widthNum)) {
              additionalAmount = 25000;
              reasons.push(`높이 ${heightNum}mm, 가로폭 ${widthNum}mm (+25,000원)`);
            }
          } else if (isYeodari) {
            // 여닫이(120바): 430, 456, 541, 631, 731 → +20,000
            if ([430, 456, 541, 631, 731].includes(widthNum)) {
              additionalAmount = 20000;
              reasons.push(`높이 ${heightNum}mm, 가로폭 ${widthNum}mm (+20,000원)`);
            }
            // 여닫이(120바): 831, 931, 1031, 1131 → +25,000
            else if ([831, 931, 1031, 1131].includes(widthNum)) {
              additionalAmount = 25000;
              reasons.push(`높이 ${heightNum}mm, 가로폭 ${widthNum}mm (+25,000원)`);
            }
          }
        }
        
        if (additionalAmount > 0) {
          // unitPrice에 추가 금액 적용
          const increasedUnitPrice = extendedResponse.unitPrice + additionalAmount;
          
          // totalPrice 재계산 (인상된 unitPrice + optionPrice) * quantity
          const newTotalPrice = (increasedUnitPrice + extendedResponse.optionPrice) * extendedResponse.quantity;
          
          priceIncreaseInfo = {
            rate: 0, // 고정 금액이므로 rate는 사용하지 않음
            reason: `간살 목창호 추가 비용 (${reasons.join(", ")})`,
          };
          
          extendedResponse = {
            ...extendedResponse,
            unitPrice: increasedUnitPrice,
            totalPrice: newTotalPrice,
            priceIncreaseInfo: priceIncreaseInfo,
          };
        }
      }
      
      // 슬림문틀인 경우 특별 계산 규칙 적용 (간살 목창호가 아닌 경우에만)
      if (!isGansalWindow && isSlimFrame && width && height && specName) {
        const widthNum = parseInt(width);
        const heightNum = parseInt(height);
        let additionalAmount = 0;
        const reasons: string[] = [];
        
        // 규격 추출 (예: "110바" -> 110)
        const specNumber = parseInt(specName.replace("바", ""));
        
        // 110, 130, 140, 155바
        if ([110, 130, 140, 155].includes(specNumber)) {
          if (heightNum >= 2101) {
            additionalAmount += 3000;
            reasons.push(`높이 ${heightNum}mm (+3,000원)`);
          }
          if (widthNum >= 1201) {
            additionalAmount += 10000;
            reasons.push(`가로폭 ${widthNum}mm (+10,000원)`);
          }
        }
        // 175바, 195바
        else if ([175, 195].includes(specNumber)) {
          if (heightNum >= 2101) {
            additionalAmount += 5000;
            reasons.push(`높이 ${heightNum}mm (+5,000원)`);
          }
          if (widthNum >= 1201) {
            additionalAmount += 13000;
            reasons.push(`가로폭 ${widthNum}mm (+13,000원)`);
          }
        }
        // 210바, 230바
        else if ([210, 230].includes(specNumber)) {
          if (heightNum >= 2101) {
            additionalAmount += 7000;
            reasons.push(`높이 ${heightNum}mm (+7,000원)`);
          }
          if (widthNum >= 2101) {
            additionalAmount += 15000;
            reasons.push(`가로폭 ${widthNum}mm (+15,000원)`);
          }
        }
        
        if (additionalAmount > 0) {
          // unitPrice에 추가 금액 적용
          const increasedUnitPrice = extendedResponse.unitPrice + additionalAmount;
          
          // totalPrice 재계산 (인상된 unitPrice + optionPrice) * quantity
          const newTotalPrice = (increasedUnitPrice + extendedResponse.optionPrice) * extendedResponse.quantity;
          
          // 슬림문틀은 고정 금액 추가이므로 rate는 0으로 설정하고 reason에 금액 표시
          priceIncreaseInfo = {
            rate: 0, // 고정 금액이므로 rate는 사용하지 않음
            reason: `슬림문틀 추가 비용 (${reasons.join(", ")})`,
          };
          
          extendedResponse = {
            ...extendedResponse,
            unitPrice: increasedUnitPrice,
            totalPrice: newTotalPrice,
            priceIncreaseInfo: priceIncreaseInfo,
          };
        }
      }
      // 일반 목창호인 경우 특별 계산 규칙 적용
      else if (categoryCode === "WINDOW" && !isGansalWindow && width && height) {
        const widthNum = parseInt(width);
        const heightNum = parseInt(height);
        let additionalAmount = 0;
        const reasons: string[] = [];
        
        // 폭 1051 이상일 때 +5,000원
        if (widthNum >= 1051) {
          additionalAmount += 5000;
          reasons.push(`폭 ${widthNum}mm (+5,000원)`);
        }
        
        // 높이 2101 이상일 때 +10,000원
        if (heightNum >= 2101) {
          additionalAmount += 10000;
          reasons.push(`높이 ${heightNum}mm (+10,000원)`);
        }
        
        if (additionalAmount > 0) {
          // unitPrice에 추가 금액 적용
          const increasedUnitPrice = extendedResponse.unitPrice + additionalAmount;
          
          // totalPrice 재계산 (인상된 unitPrice + optionPrice) * quantity
          const newTotalPrice = (increasedUnitPrice + extendedResponse.optionPrice) * extendedResponse.quantity;
          
          priceIncreaseInfo = {
            rate: 0, // 고정 금액이므로 rate는 사용하지 않음
            reason: `일반 목창호 추가 비용 (${reasons.join(", ")})`,
          };
          
          extendedResponse = {
            ...extendedResponse,
            unitPrice: increasedUnitPrice,
            totalPrice: newTotalPrice,
            priceIncreaseInfo: priceIncreaseInfo,
          };
        }
      }
      // ABS 도어인 경우 가격 인상 규칙 적용
      else if (isABSDoor && width && height) {
        const widthNum = parseInt(width);
        const heightNum = parseInt(height);
        let additionalAmount = 0;
        const reasons: string[] = [];
        
        // 제품명에서 도어 타입 확인
        const productName = selectedProductObj?.name || "";
        const productNameLower = productName.toLowerCase();
        const isBasicDoor = productNameLower.includes("베이직");
        const isNaturalDoor = productNameLower.includes("내추럴");
        const isLineDoor = productNameLower.includes("라인");
        const isMinjaDoor = productNameLower.includes("민자");
        
        // 베이직, 내추럴, 라인 도어: 높이 2066 이상일 경우 +10,000원
        if ((isBasicDoor || isNaturalDoor || isLineDoor) && heightNum >= 2066) {
          additionalAmount += 10000;
          reasons.push(`높이 ${heightNum}mm (+10,000원)`);
        }
        
        // 민자 도어 계산 규칙
        if (isMinjaDoor) {
          // 1. 가로 951~1070 & 세로 2101~2260일 경우 +10,000원
          if (widthNum >= 951 && widthNum <= 1070 && heightNum >= 2101 && heightNum <= 2260) {
            additionalAmount += 10000;
            reasons.push(`가로 ${widthNum}mm & 세로 ${heightNum}mm (+10,000원)`);
          }
          // 2. 높이 2261~2380일 경우 +20,000원
          if (heightNum >= 2261 && heightNum <= 2380) {
            additionalAmount += 20000;
            reasons.push(`높이 ${heightNum}mm (+20,000원)`);
          }
          // 3. 가로 1071~1170 사이일 경우 +30,000원
          if (widthNum >= 1071 && widthNum <= 1170) {
            additionalAmount += 30000;
            reasons.push(`가로 ${widthNum}mm (+30,000원)`);
          }
        }
        
        if (additionalAmount > 0) {
          // unitPrice에 추가 금액 적용
          const increasedUnitPrice = extendedResponse.unitPrice + additionalAmount;
          
          // totalPrice 재계산 (인상된 unitPrice + optionPrice) * quantity
          const newTotalPrice = (increasedUnitPrice + extendedResponse.optionPrice) * extendedResponse.quantity;
          
          priceIncreaseInfo = {
            rate: 0, // 고정 금액이므로 rate는 사용하지 않음
            reason: `ABS 도어 추가 비용 (${reasons.join(", ")})`,
          };
          
          extendedResponse = {
            ...extendedResponse,
            unitPrice: increasedUnitPrice,
            totalPrice: newTotalPrice,
            priceIncreaseInfo: priceIncreaseInfo,
          };
        }
      }
      // 일반 문틀인 경우 가격 인상 규칙 적용 (슬림문틀 제외)
      else if (isFrame && !isSlimFrame && width && height) {
        const widthNum = parseInt(width);
        const heightNum = parseInt(height);
        let priceIncreaseRate = 0;
        let increaseReason = "";
        
        // 가로폭 1001 ~ 1200이하 또는 세로높이 2101 ~ 2300이하 = 10% 인상
        if ((widthNum >= 1001 && widthNum <= 1200) || (heightNum >= 2101 && heightNum <= 2300)) {
          priceIncreaseRate = 0.1;
          const reasons: string[] = [];
          if (widthNum >= 1001 && widthNum <= 1200) {
            reasons.push(`가로폭 ${widthNum}mm`);
          }
          if (heightNum >= 2101 && heightNum <= 2300) {
            reasons.push(`세로높이 ${heightNum}mm`);
          }
          increaseReason = `규격 인상 (${reasons.join(", ")})`;
        }
        // 가로폭 1201 ~ 1500이하 또는 세로높이 2301 ~ 2400이하 = 20% 인상
        else if ((widthNum >= 1201 && widthNum <= 1500) || (heightNum >= 2301 && heightNum <= 2400)) {
          priceIncreaseRate = 0.2;
          const reasons: string[] = [];
          if (widthNum >= 1201 && widthNum <= 1500) {
            reasons.push(`가로폭 ${widthNum}mm`);
          }
          if (heightNum >= 2301 && heightNum <= 2400) {
            reasons.push(`세로높이 ${heightNum}mm`);
          }
          increaseReason = `규격 인상 (${reasons.join(", ")})`;
        }
        
        if (priceIncreaseRate > 0) {
          // unitPrice에 인상률 적용
          const increasedUnitPrice = Math.round(extendedResponse.unitPrice * (1 + priceIncreaseRate));
          
          // totalPrice 재계산 (인상된 unitPrice + optionPrice) * quantity
          const newTotalPrice = (increasedUnitPrice + extendedResponse.optionPrice) * extendedResponse.quantity;
          
          priceIncreaseInfo = {
            rate: priceIncreaseRate,
            reason: increaseReason,
          };
          
          extendedResponse = {
            ...extendedResponse,
            unitPrice: increasedUnitPrice,
            totalPrice: newTotalPrice,
            priceIncreaseInfo: priceIncreaseInfo,
          };
        }
      }
      
      // 마진 적용
      let finalResponse = extendedResponse;
      if (margin && margin.trim() !== "") {
        const marginRate = parseFloat(margin) / 100; // %를 소수로 변환
        if (!isNaN(marginRate) && marginRate >= 0) {
          const marginAmount = Math.round(extendedResponse.totalPrice * marginRate);
          const finalPrice = extendedResponse.totalPrice + marginAmount;
          
          finalResponse = {
            ...extendedResponse,
            totalPrice: finalPrice,
            // @ts-ignore - 마진 정보 추가
            margin: margin,
            marginAmount: marginAmount,
            finalPrice: finalPrice,
          };
        }
      }
      
      setResult(finalResponse);
      toast.success("견적이 계산되었습니다.");
    } catch (error: any) {
      logger.error("견적 계산 오류:", error);
      toast.error(error.message || "견적 계산에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCategoryObj = categories.find(
    (c) => c.id.toString() === selectedCategory
  );
  const categoryCode = selectedCategoryObj?.code;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 shadow-xl shadow-indigo-500/5">
        <h3 className="mb-8 flex items-center gap-3 text-2xl font-bold">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-gray-900 via-indigo-700 to-gray-900 bg-clip-text text-transparent">상세 견적 계산기 - 쉐누</span>
        </h3>

        <div className="space-y-6">
          {/* 메인 카테고리 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>메인 카테고리</Label>
              <Select
                onValueChange={setSelectedCategory}
                value={selectedCategory}
                disabled={isLoadingData}
              >
                <SelectTrigger className="bg-slate-50 border-gray-200">
                  <SelectValue placeholder="메인 카테고리 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {categories.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      {isLoadingData ? "로딩 중..." : "카테고리가 없습니다"}
                    </div>
                  ) : (
                    categories.map((category) => {
                      logger.debug("카테고리 렌더링:", category);
                      return (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name || `카테고리 ${category.id}`}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* 세부 카테고리 선택 (세부 카테고리가 있는 경우) */}
            {selectedCategory && subCategories.length > 0 && (
              <div className="space-y-2">
                <Label>세부 카테고리</Label>
                <Select
                  onValueChange={setSelectedSubCategory}
                  value={selectedSubCategory}
                  disabled={!selectedCategory || isLoadingData}
                >
                  <SelectTrigger className="bg-slate-50 border-gray-200">
                    <SelectValue placeholder="세부 카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {subCategories.map((subCategory) => (
                      <SelectItem
                        key={subCategory.id}
                        value={subCategory.id.toString()}
                      >
                        {subCategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          {/* 제품명 선택 (간살 목창호는 제외) */}
          {(() => {
            const subCategoryObj = subCategories.find(
              (sc) => sc.id.toString() === selectedSubCategory
            );
            const isGansalWindow = subCategoryObj?.name === "간살 목창호";
            
            if (isGansalWindow) {
              return null; // 간살 목창호는 제품명 선택 UI 숨김
            }
            
            return (
              <div className="space-y-2">
                <Label>제품명</Label>
                <Select
                  onValueChange={setSelectedProduct}
                  value={selectedProduct}
                  disabled={(!selectedCategory && !selectedSubCategory) || isLoadingData}
                >
                  <SelectTrigger className="bg-slate-50 border-gray-200">
                    <SelectValue placeholder="제품 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {products.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {!selectedCategory && !selectedSubCategory
                          ? "카테고리를 먼저 선택하세요"
                          : isLoadingData
                          ? "로딩 중..."
                          : "제품이 없습니다"}
                      </div>
                      ) : (
                        products.map((product) => {
                          // 목재문틀인 경우 제품명을 "목재문틀"로 변경
                          const isWoodFrame = product.name?.includes("목재문틀") || product.description?.includes("목재문틀");
                          const displayName = isWoodFrame ? "목재문틀" : (product.description || product.name);
                          
                          return (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {displayName}
                            </SelectItem>
                          );
                        })
                      )}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}

          {/* 일반 목창호: 폭/높이 입력 */}
          {(() => {
            const subCategoryObj = subCategories.find(
              (sc) => sc.id.toString() === selectedSubCategory
            );
            const isGansalWindow = subCategoryObj?.name === "간살 목창호";
            
            // 일반 목창호인 경우 폭/높이 입력 필드 표시
            if (categoryCode === "WINDOW" && !isGansalWindow && selectedProduct) {
              return (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-100 rounded-xl">
                  <div className="space-y-2">
                    <Label>가로폭 (mm)</Label>
                    <Input
                      type="number"
                      placeholder="예: 1000"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="bg-white border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>세로 높이 (mm)</Label>
                    <Input
                      type="number"
                      placeholder="예: 2100"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="bg-white border-gray-200"
                    />
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* ABS 도어: 가로/세로 입력 (제품명 아래) */}
          {(() => {
            const selectedProductObj = products.find(
              (p) => p.id.toString() === selectedProduct
            );
            const isABSDoor = selectedProductObj?.name?.includes("ABS") || 
                             selectedProductObj?.description?.includes("ABS") ||
                             selectedProductObj?.name?.includes("ABS 도어") ||
                             selectedProductObj?.description?.includes("ABS 도어");
            
            if (isABSDoor) {
              return (
                <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-xl">
                  <div className="space-y-2">
                    <Label>가로 폭 (mm)</Label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={width || "1000"}
                      onChange={(e) => setWidth(e.target.value)}
                      className="bg-white border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>세로 높이 (mm)</Label>
                    <Input
                      type="number"
                      placeholder="2100"
                      value={height || "2100"}
                      onChange={(e) => setHeight(e.target.value)}
                      className="bg-white border-gray-200"
                    />
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* 3연동 중문: 가로/세로 입력 */}
          {categoryCode === "INTERLOCK" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-100 rounded-xl border-gray-200">
              <div className="space-y-2">
                <Label>가로 폭 (mm)</Label>
                <Input
                  type="number"
                  placeholder="예: 1200"
                  value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="bg-white border-gray-200"
                    />
              </div>
              <div className="space-y-2">
                <Label>세로 높이 (mm)</Label>
                <Input
                  type="number"
                  placeholder="예: 2100"
                  value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="bg-white border-gray-200"
                    />
              </div>
            </div>
          )}

          {/* 문틀: 규격 선택 */}
          {categoryCode === "FRAME" && (() => {
            const selectedProductObj = products.find(
              (p) => p.id.toString() === selectedProduct
            );
            const isWoodFrame = selectedProductObj?.name?.includes("목재문틀");
            const isSlimFrame = selectedProductObj?.name?.includes("슬림문틀");
            const isPVCFrame = selectedProductObj?.name?.includes("PVC 발포문틀");
            
            // 목재문틀인 경우: 규격 110, 140, 170, 200 + 가로/세로 입력
            if (isWoodFrame) {
              return (
                <div className="space-y-4 p-4 bg-slate-100 rounded-xl border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>가로 폭 (mm)</Label>
                      <Input
                        type="number"
                        placeholder="예: 900"
                        value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="bg-white border-gray-200"
                    />
                    </div>
                    <div className="space-y-2">
                      <Label>세로 높이 (mm)</Label>
                      <Input
                        type="number"
                        placeholder="예: 2100"
                        value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="bg-white border-gray-200"
                    />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>규격</Label>
                    <Select onValueChange={setSpecName} value={specName}>
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue placeholder="규격 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="110">110</SelectItem>
                        <SelectItem value="140">140</SelectItem>
                        <SelectItem value="170">170</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>타입</Label>
                    <Select onValueChange={setTypeName} value={typeName}>
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue placeholder="타입 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="스토퍼형">스토퍼형</SelectItem>
                        <SelectItem value="미서기">미서기</SelectItem>
                        <SelectItem value="무매공틀">무매공틀</SelectItem>
                        <SelectItem value="외줄미서기 / 포켓행거">외줄미서기 / 포켓행거</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            }
            
            // PVC 발포문틀, 슬림문틀인 경우: 가로/세로 입력 추가
            return (
              <div className="space-y-4 p-4 bg-slate-100 rounded-xl border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>가로 폭 (mm)</Label>
                    <Input
                      type="number"
                      placeholder="예: 900"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="bg-white border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>세로 높이 (mm)</Label>
                    <Input
                      type="number"
                      placeholder="예: 2100"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="bg-white border-gray-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>문틀 규격 (바 두께)</Label>
                  <Select onValueChange={setSpecName} value={specName}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="규격 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="110바">110바</SelectItem>
                      <SelectItem value="130바">130바</SelectItem>
                      <SelectItem value="140바">140바</SelectItem>
                      <SelectItem value="155바">155바</SelectItem>
                      <SelectItem value="175바">175바</SelectItem>
                      <SelectItem value="195바">195바</SelectItem>
                      <SelectItem value="210바">210바</SelectItem>
                      <SelectItem value="230바">230바</SelectItem>
                      {/* 슬림문틀인 경우 245바 제외 */}
                      {!isSlimFrame && <SelectItem value="245바">245바</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                {/* 슬림문틀인 경우 타입 선택 UI 숨김 */}
                {!isSlimFrame && (
                  <div className="space-y-2">
                    <Label>타입</Label>
                    <Select onValueChange={setTypeName} value={typeName}>
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue placeholder="타입 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {isPVCFrame ? (
                          <>
                            <SelectItem value="일반형 3방">일반형 3방</SelectItem>
                            <SelectItem value="일반형 4방">일반형 4방</SelectItem>
                            <SelectItem value="가스켓 3방">가스켓 3방</SelectItem>
                            <SelectItem value="가스켓 4방">가스켓 4방</SelectItem>
                          </>
                        ) : null}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 몰딩: 타입 먼저 선택, 그에 따른 규격 출력 */}
          {categoryCode === "MOLDING" && selectedProduct && (
            <div className="space-y-4 p-4 bg-slate-100 rounded-xl border-gray-200">
              <div className="space-y-2">
                <Label>타입 (type_name)</Label>
                <Select onValueChange={(value) => {
                  setTypeName(value);
                  // 타입 변경 시 규격 초기화
                  const firstSpec = variants.find(v => v.typeName === value)?.specName;
                  setSpecName(firstSpec || "");
                }} value={typeName}>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {variants
                      .sort((a, b) => a.id - b.id) // id 순서로 정렬
                      .reduce((acc, v) => {
                        if (!acc.find(item => item.typeName === v.typeName)) {
                          acc.push(v);
                        }
                        return acc;
                      }, [] as ProductVariant[])
                      .map((variant) => (
                        <SelectItem key={variant.typeName} value={variant.typeName}>
                          {variant.typeName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {typeName && (
                <div className="space-y-2">
                  <Label>규격 (spec_name)</Label>
                  <Select onValueChange={setSpecName} value={specName}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="규격 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {variants
                        .filter(v => v.typeName === typeName)
                        .sort((a, b) => a.id - b.id) // id 순서로 정렬
                        .map((variant) => (
                          <SelectItem key={variant.specName} value={variant.specName}>
                            {variant.specName}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* 선택된 타입과 규격 정보 표시 */}
              {typeName && specName && (
                <div className="p-3 bg-blue-50 rounded-md border-blue-200">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium mb-1">선택된 정보:</div>
                    <div>타입: <span className="font-semibold">{typeName}</span></div>
                    <div>규격: <span className="font-semibold">{specName}</span></div>
                    {variants.find(v => v.typeName === typeName && v.specName === specName) && (
                      <div className="mt-1 text-blue-600">
                        단가: {variants.find(v => v.typeName === typeName && v.specName === specName)?.price.toLocaleString()}원
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 목창호: 타입 선택 및 가로폭/세로 높이 입력 (간살 목창호만) */}
          {(() => {
            const subCategoryObj = subCategories.find(
              (sc) => sc.id.toString() === selectedSubCategory
            );
            const isGansalWindow = subCategoryObj?.name === "간살 목창호";
            
            // 간살 목창호만 타입 선택 UI 표시 (일반 목창호는 제품 선택만)
            if (categoryCode === "WINDOW" && isGansalWindow) {
              return (
                <div className="space-y-4 p-4 bg-slate-100 rounded-xl">
                  <div className="space-y-2">
                    <Label>타입</Label>
                    <Select 
                      onValueChange={(value) => {
                        setTypeName(value);
                        // 간살 목창호인 경우 타입 선택 시 해당 타입의 제품 자동 선택
                        if (isGansalWindow && products.length > 0) {
                          const matchedProduct = products.find((p) => {
                            if (!p.name) return false;
                            // "미닫이 (80바)" -> "미닫이" 또는 "80바" 포함 확인
                            // "여닫이 (120바)" -> "여닫이" 또는 "120바" 포함 확인
                            const valueLower = value.toLowerCase();
                            const productNameLower = p.name.toLowerCase();
                            return productNameLower.includes(valueLower) || 
                                   (valueLower.includes("미닫이") && productNameLower.includes("미닫이")) ||
                                   (valueLower.includes("여닫이") && productNameLower.includes("여닫이"));
                          });
                          if (matchedProduct) {
                            setSelectedProduct(matchedProduct.id.toString());
                            logger.debug("간살 목창호 제품 자동 선택:", matchedProduct.name, "ID:", matchedProduct.id);
                          } else {
                            logger.error("간살 목창호 제품을 찾을 수 없습니다. typeName:", value, "products:", products);
                          }
                        }
                      }} 
                      value={typeName}
                    >
                      <SelectTrigger className="bg-white border-gray-200">
                        <SelectValue placeholder="타입 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="미닫이 (80바)">미닫이 (80바)</SelectItem>
                        <SelectItem value="여닫이 (120바)">여닫이 (120바)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>가로폭 (mm)</Label>
                      <Input
                        type="number"
                        placeholder="예: 350"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="bg-white border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>세로 높이 (mm)</Label>
                      <Input
                        type="number"
                        placeholder="예: 2100"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="bg-white border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* 필름: 규격 선택 시 타입 자동 결정 */}
          {categoryCode === "FILM" && selectedProduct && (
            <div className="space-y-4 p-4 bg-slate-100 rounded-xl border-gray-200">
              <div className="space-y-2">
                <Label>규격 (spec_name)</Label>
                <Select onValueChange={(value) => {
                  setSpecName(value);
                  // 규격 선택 시 해당 규격의 타입 자동 설정
                  const matchedVariant = variants.find(v => v.specName === value);
                  if (matchedVariant) {
                    setTypeName(matchedVariant.typeName);
                  }
                }} value={specName}>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue placeholder="규격 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {variants
                      .sort((a, b) => a.id - b.id) // id 순서로 정렬
                      .reduce((acc, v) => {
                        if (!acc.find(item => item.specName === v.specName)) {
                          acc.push(v);
                        }
                        return acc;
                      }, [] as ProductVariant[])
                      .map((variant) => (
                        <SelectItem key={variant.specName} value={variant.specName}>
                          {variant.specName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {/* 선택된 규격과 타입 정보 표시 (타입은 자동 결정) */}
              {specName && typeName && (
                <div className="p-4 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl shadow-lg shadow-indigo-500/10">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium mb-1">선택된 정보:</div>
                    <div>규격: <span className="font-semibold">{specName}</span></div>
                    <div>타입: <span className="font-semibold">{typeName}</span></div>
                    {variants.find(v => v.specName === specName && v.typeName === typeName) && (
                      <div className="mt-1 text-indigo-700">
                        단가: {variants.find(v => v.specName === specName && v.typeName === typeName)?.price.toLocaleString()}원
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 옵션 선택 */}
          {(() => {
            const subCategoryObj = subCategories.find(
              (sc) => sc.id.toString() === selectedSubCategory
            );
            const isGansalWindow = subCategoryObj?.name === "간살 목창호";
            
            if (!selectedProduct) return false;
            
            const selectedProductObj = products.find(
              (p) => p.id.toString() === selectedProduct
            );
            const isSlimFrame = selectedProductObj?.name?.includes("슬림문틀");
            
            const selectedCategoryObj = categories.find(
              (c) => c.id.toString() === selectedCategory
            );
            const categoryCode = selectedCategoryObj?.code;
            const isNormalWindow = categoryCode === "WINDOW" && !isGansalWindow;
            
            // 간살 목창호 또는 일반 목창호는 특정 옵션 제외
            let optionsToShow = options;
            if (isGansalWindow || isNormalWindow) {
              // 간살 목창호에서 제외할 옵션들
              optionsToShow = options.filter(opt => {
                const optName = (opt.name || "").trim().toLowerCase();
                // 제외할 옵션들 - 키워드 기반 필터링 (대소문자 무시)
                // 높이 2101 이상 (+20,000원) 제외
                if (optName.includes("높이 2101 이상") && (opt.addPrice === 20000 || optName.includes("20000") || optName.includes("20,000"))) {
                  return false;
                }
                // 높이 2101 이상 (일부 구간) (+25,000원) 제외
                if (optName.includes("높이 2101 이상") && (optName.includes("일부 구간") || optName.includes("일부구간"))) {
                  return false;
                }
                // 폭 1051 이상 (+5,000원) 제외
                if (optName.includes("폭 1051 이상") || optName.includes("폭1051")) {
                  return false;
                }
                // 높이 2101 이상 (일반) (+10,000원) 제외
                if (optName.includes("높이 2101 이상") && optName.includes("일반")) {
                  return false;
                }
                return true;
              });
            }
            
            // 슬림문틀은 특정 옵션 두 개 제외 (첫 번째와 두 번째 옵션 제외)
            if (isSlimFrame && options.length > 0) {
              // 옵션을 id 순서로 정렬 후 첫 두 개 제외
              const sortedOptions = [...options].sort((a, b) => a.id - b.id);
              const excludedIds = sortedOptions.slice(0, 2).map(opt => opt.id);
              optionsToShow = optionsToShow.filter(opt => !excludedIds.includes(opt.id));
            }
            
            // 모든 제품에서 "디자인 포인트 추가" 옵션 제외
            optionsToShow = optionsToShow.filter(opt => {
              const optName = (opt.name || "").trim().toLowerCase();
              // 디자인 포인트 추가 옵션 제외
              if (optName.includes("디자인 포인트") || optName.includes("오르토") || optName.includes("리벨")) {
                return false;
              }
              return true;
            });
            
            return optionsToShow.length > 0;
          })() && (
            <div className="space-y-3">
              <Label>추가 옵션</Label>
              <div className="grid grid-cols-2 gap-3">
                {(() => {
                  const subCategoryObj = subCategories.find(
                    (sc) => sc.id.toString() === selectedSubCategory
                  );
                  const isGansalWindow = subCategoryObj?.name === "간살 목창호";
                  
                  const selectedProductObj = products.find(
                    (p) => p.id.toString() === selectedProduct
                  );
                  const isSlimFrame = selectedProductObj?.name?.includes("슬림문틀");
                  
                  const selectedCategoryObj = categories.find(
                    (c) => c.id.toString() === selectedCategory
                  );
                  const categoryCode = selectedCategoryObj?.code;
                  const isNormalWindow = categoryCode === "WINDOW" && !isGansalWindow;
                  
                  // 간살 목창호 또는 일반 목창호는 특정 옵션 제외
                  let optionsToShow = options;
                  if (isGansalWindow || isNormalWindow) {
                    // 간살 목창호에서 제외할 옵션들
                    optionsToShow = options.filter(opt => {
                      const optName = (opt.name || "").trim().toLowerCase();
                      // 제외할 옵션들 - 키워드 기반 필터링 (대소문자 무시)
                      // 높이 2101 이상 (+20,000원) 제외
                      if (optName.includes("높이 2101 이상") && (opt.addPrice === 20000 || optName.includes("20000") || optName.includes("20,000"))) {
                        return false;
                      }
                      // 높이 2101 이상 (일부 구간) (+25,000원) 제외
                      if (optName.includes("높이 2101 이상") && (optName.includes("일부 구간") || optName.includes("일부구간"))) {
                        return false;
                      }
                      // 폭 1051 이상 (+5,000원) 제외
                      if (optName.includes("폭 1051 이상") || optName.includes("폭1051")) {
                        return false;
                      }
                      // 높이 2101 이상 (일반) (+10,000원) 제외
                      if (optName.includes("높이 2101 이상") && optName.includes("일반")) {
                        return false;
                      }
                      return true;
                    });
                  }
                  // 슬림문틀은 특정 옵션 두 개 제외 (첫 번째와 두 번째 옵션 제외)
                  if (isSlimFrame && options.length > 0) {
                    // 옵션을 id 순서로 정렬 후 첫 두 개 제외
                    const sortedOptions = [...options].sort((a, b) => a.id - b.id);
                    const excludedIds = sortedOptions.slice(0, 2).map(opt => opt.id);
                    optionsToShow = optionsToShow.filter(opt => !excludedIds.includes(opt.id));
                  }
                  
                  // 모든 제품에서 "디자인 포인트 추가" 옵션 제외
                  optionsToShow = optionsToShow.filter(opt => {
                    const optName = (opt.name || "").trim().toLowerCase();
                    // 디자인 포인트 추가 옵션 제외
                    if (optName.includes("디자인 포인트") || optName.includes("오르토") || optName.includes("리벨")) {
                      return false;
                    }
                    return true;
                  });
                  
                  return optionsToShow;
                })()
                  .sort((a, b) => a.id - b.id) // id 순서로 정렬
                  .map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center space-x-2 border-gray-200 p-3 rounded-md hover:bg-gray-50"
                  >
                    <Checkbox
                      id={`opt-${opt.id}`}
                      checked={selectedOptions.includes(opt.id)}
                      onCheckedChange={() => toggleOption(opt.id)}
                    />
                    <label
                      htmlFor={`opt-${opt.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                    >
                      {opt.name} {opt.addPrice !== 0 && (
                        opt.addPrice > 0 
                          ? `(+${opt.addPrice.toLocaleString()}원)`
                          : `(${opt.addPrice.toLocaleString()}원)`
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 색상 선택 (검색 가능) */}
          {colors.length > 0 && (
            <div className="space-y-3">
              <Label>색상</Label>
              <Popover open={isColorPopoverOpen} onOpenChange={setIsColorPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border-gray-200 bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 w-full justify-between bg-white hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      {selectedColor ? (
                        <>
                          {(() => {
                            const color = colors.find((c) => c.id.toString() === selectedColor);
                            return color ? (
                              <>
                                {color.colorCode && (
                                  <div
                                    className="w-4 h-4 rounded border-gray-200"
                                    style={{ backgroundColor: color.colorCode }}
                                  />
                                )}
                                <span>{color.name}</span>
                                {color.cost && color.cost > 0 && (
                                  <span className="text-xs text-indigo-700 font-medium">
                                    (+{Math.round(color.cost * 100)}%)
                                  </span>
                                )}
                              </>
                            ) : (
                              "색상을 선택하세요"
                            );
                          })()}
                        </>
                      ) : (
                        "색상을 선택하세요"
                      )}
                    </span>
                    <Search className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0 bg-white border-gray-200" align="start">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="색상 검색..."
                        value={colorSearchQuery}
                        onChange={(e) => setColorSearchQuery(e.target.value)}
                        className="pl-9 pr-9"
                      />
                      {colorSearchQuery && (
                        <button
                          onClick={() => setColorSearchQuery("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="p-2">
                      {(() => {
                        // 간살 목창호인지 확인
                        const subCategoryObj = subCategories.find(
                          (sc) => sc.id.toString() === selectedSubCategory
                        );
                        const isGansalWindow = subCategoryObj?.name === "간살 목창호";
                        
                        // 간살 목창호인 경우 마일드오크, 딥오크만 필터링
                        let availableColors = colors;
                        if (isGansalWindow) {
                          // 간살 목창호는 마일드오크, 딥오크만 선택 가능
                          const filtered = colors.filter(color => {
                            const colorName = (color.name || "").toLowerCase();
                            // 이름으로 필터링 (ID는 순서에 따라 달라질 수 있음)
                            return colorName.includes("마일드오크") || colorName.includes("딥오크");
                          });
                          
                          // 중복 제거: 같은 이름의 색상이 여러 개 있으면 첫 번째 것만 사용
                          const seenNames = new Set<string>();
                          availableColors = filtered.filter(color => {
                            const colorName = (color.name || "").trim().toLowerCase();
                            if (seenNames.has(colorName)) {
                              return false;
                            }
                            seenNames.add(colorName);
                            return true;
                          });
                        }
                        
                        const filteredColors = availableColors.filter((color) => {
                          if (!colorSearchQuery) return true;
                          const query = colorSearchQuery.toLowerCase();
                          return (
                            color.name.toLowerCase().includes(query) ||
                            (color.colorCode && color.colorCode.toLowerCase().includes(query))
                          );
                        });

                        if (filteredColors.length === 0) {
                          if (isGansalWindow) {
                            return (
                              <div className="text-center py-8 text-gray-400">
                                간살 목창호는 마일드오크, 딥오크만 선택 가능합니다.
                                <br />
                                (현재 사용 가능한 색상이 없습니다.)
                              </div>
                            );
                          }
                          return (
                            <div className="text-center py-8 text-gray-400">
                              검색 결과가 없습니다.
                            </div>
                          );
                        }

                        return filteredColors.map((color) => (
                          <button
                            key={color.id}
                            onClick={() => {
                              setSelectedColor(color.id.toString());
                              setIsColorPopoverOpen(false);
                              setColorSearchQuery("");
                            }}
                            className={`w-full text-left p-3 rounded-md hover:bg-indigo-50 transition-colors ${
                              selectedColor === color.id.toString()
                                ? "bg-indigo-100 border-indigo-300 bg-indigo-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {color.colorCode && (
                                <div
                                  className="w-8 h-8 rounded border-gray-200 flex-shrink-0"
                                  style={{ backgroundColor: color.colorCode }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{color.name}</div>
                                {color.colorCode && (
                                  <div className="text-xs text-gray-500">{color.colorCode}</div>
                                )}
                              </div>
                              {color.cost && color.cost > 0 && (
                                <div className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
                                  +{Math.round(color.cost * 100)}%
                                </div>
                              )}
                            </div>
                          </button>
                        ));
                      })()}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {selectedColor && (
                <button
                  onClick={() => {
                    setSelectedColor("");
                    setColorSearchQuery("");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  선택한 색상 제거
                </button>
              )}
            </div>
          )}

          {/* 회사 마진 입력 */}
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg border-blue-200">
            <Label className="text-base font-semibold text-blue-900">회사 마진 설정</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="예: 10 (10% 마진)"
                value={margin}
                onChange={(e) => {
                  const value = e.target.value;
                  // 숫자만 입력 가능, 음수 불가
                  if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                    setMargin(value);
                  }
                }}
                className="bg-white max-w-[200px]"
                min="0"
                step="0.1"
              />
              <span className="text-gray-600 font-medium">%</span>
              {margin && margin.trim() !== "" && !isNaN(Number(margin)) && Number(margin) > 0 && (
                <span className="text-sm text-blue-700 font-medium">
                  (마진 적용 시 {Number(margin)}% 추가)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              * 마진은 계산된 최종 가격에 적용됩니다. 여러 견적에 동일하게 적용됩니다.
            </p>
          </div>

          {/* 수량 및 계산 버튼 */}
          <div className="flex items-end gap-4">
            <div className="space-y-2 w-24">
              <Label>수량</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="bg-white border-gray-200"
              />
            </div>
            <Button
              className="flex-1 bg-gradient-to-r from-pastel-600 to-pastel-700 hover:from-pastel-700 hover:to-pastel-800 h-12 text-black shadow-lg shadow-pastel-600/30 hover:shadow-xl hover:shadow-pastel-600/40 transition-all duration-300 hover:scale-105 rounded-xl font-semibold"
              onClick={handleCalculate}
              disabled={(() => {
                const subCategoryObj = subCategories.find(
                  (sc) => sc.id.toString() === selectedSubCategory
                );
                const isGansalWindow = subCategoryObj?.name === "간살 목창호";
                
                const selectedCategoryObj = categories.find(
                  (c) => c.id.toString() === selectedCategory
                );
                const categoryCode = selectedCategoryObj?.code;
                
                if (isLoading || isLoadingData) return true;
                if (isGansalWindow) {
                  // 간살 목창호는 타입과 가로폭이 필수
                  return !typeName || !width;
                }
                // 문틀 카테고리인 경우 가로/세로 입력 필수
                if (categoryCode === "FRAME" && selectedProduct) {
                  return !width || !height;
                }
                // 일반 목창호는 제품 선택 필수
                return !selectedProduct;
              })()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              견적 산출하기
            </Button>
          </div>
        </div>
      </Card>

      {/* 결과 표시 영역 */}
      <div className="space-y-6">
        {/* 현재 계산된 견적 */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50/50 sticky top-4 rounded-3xl shadow-xl shadow-indigo-500/5">
          <CardHeader className="pb-4 border-b-2 border-gray-400">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>예상 견적서</span>
              <span className="text-sm font-normal text-gray-500">
                VAT 별도
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {!result ? (
              <div className="text-center py-10 text-gray-400">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>
                  제품과 옵션을 선택하고
                  <br />
                  견적을 산출해보세요.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-medium text-lg">
                    <span>
                      {(() => {
                        // 목재문틀인 경우 제품명을 "목재문틀"로 변경
                        const isWoodFrame = result.productName?.includes("목재문틀") || 
                                          result.productName?.includes("才") ||
                                          result.productName?.includes("사이");
                        return isWoodFrame ? "목재문틀" : result.productName;
                      })()}
                    </span>
                  </div>
                  {result.categoryName && (
                    <div className="text-xs text-gray-500">
                      {result.categoryName}
                      {result.subCategoryName && ` > ${result.subCategoryName}`}
                    </div>
                  )}
                  {/* 규격 및 타입 정보 */}
                  {(specName || typeName) && (
                    <div className="text-xs text-gray-500">
                      {specName && `규격: ${specName}`}
                      {specName && typeName && " / "}
                      {typeName && `타입: ${typeName}`}
                    </div>
                  )}
                  {/* 사이즈 정보 */}
                  {(width || height) && (
                    <div className="text-xs text-gray-500">
                      {width && `가로: ${width}mm`}
                      {width && height && " / "}
                      {height && `세로: ${height}mm`}
                    </div>
                  )}
                  {/* 색상 정보 */}
                  {selectedColor && (() => {
                    const selectedColorObj = colors.find((c) => c.id.toString() === selectedColor);
                    return selectedColorObj ? (
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        색상: {selectedColorObj.name}
                        {selectedColorObj.colorCode && (
                          <>
                            <div
                              className="w-4 h-4 rounded border-gray-200"
                              style={{ backgroundColor: selectedColorObj.colorCode }}
                            />
                            <span>({selectedColorObj.colorCode})</span>
                          </>
                        )}
                      </div>
                    ) : null;
                  })()}
                  <div className="flex justify-between text-gray-600">
                    <span>기본 단가</span>
                    <span>{result.unitPrice.toLocaleString()}원</span>
                  </div>
                  {/* @ts-ignore - 가격 인상 정보 표시 */}
                  {result.priceIncreaseInfo && (
                    <div className="flex justify-between items-center bg-indigo-100/70 p-2 rounded-lg">
                      <span className="text-sm text-indigo-800 font-medium">
                        {/* @ts-ignore */}
                        {result.priceIncreaseInfo.reason}
                        {/* @ts-ignore */}
                        {result.priceIncreaseInfo.rate > 0 && ` (${Math.round(result.priceIncreaseInfo.rate * 100)}% 인상)`}
                      </span>
                    </div>
                  )}
                  {/* @ts-ignore - 색상 cost 정보 표시 */}
                  {result.colorCostInfo && (
                    <div className="flex justify-between items-center bg-indigo-100/70 p-2 rounded-lg">
                      <span className="text-sm text-indigo-800 font-medium">
                        {/* @ts-ignore */}
                        색상 추가 비용 ({result.colorCostInfo.colorName}) ({Math.round(result.colorCostInfo.costRate * 100)}% 인상)
                      </span>
                    </div>
                  )}
                  {result.optionPrice !== 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>추가 옵션 합계</span>
                      <span>
                        {result.optionPrice > 0 ? '+' : ''} {result.optionPrice.toLocaleString()}원
                      </span>
                    </div>
                  )}
                  {result.selectedOptions && result.selectedOptions.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      옵션: {result.selectedOptions.join(", ")}
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>수량</span>
                    <span>{result.quantity}개</span>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-gray-400 mt-4 space-y-2">
                  {/* 마진 적용 전 금액 */}
                  {result.finalPrice ? (
                    <>
                      <div className="flex justify-between text-gray-600">
                        <span>소계 (마진 적용 전)</span>
                        <span>{(result.finalPrice - (result.marginAmount || 0)).toLocaleString()}원</span>
                      </div>
                      {result.margin && result.marginAmount && (
                        <div className="flex justify-between text-blue-700 font-medium">
                          <span>회사 마진 ({result.margin}%)</span>
                          <span>+{result.marginAmount.toLocaleString()}원</span>
                        </div>
                      )}
                    </>
                  ) : null}
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-700">
                      총 예상 금액
                    </span>
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-gray-700">
                      {(result.finalPrice || result.totalPrice).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          {result && (
            <CardFooter className="pt-2 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setResult(null)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                초기화
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl font-semibold"
                onClick={addToCart}
              >
                <Plus className="w-4 h-4 mr-2" />
                장바구니에 추가
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* 장바구니 */}
        <Card className="p-6 bg-gradient-to-br from-slate-100 to-slate-50/50">
          <CardHeader className="pb-4 border-b border-gray-200">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                장바구니 ({cart.length})
              </span>
              <span className="text-sm font-normal text-gray-500">
                VAT 별도
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>장바구니가 비어있습니다.</p>
              </div>
            ) : (
              <>
                {/* 화면 표시용 장바구니 (삭제 버튼 포함) */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-base">
                            {(() => {
                              // 목재문틀인 경우 제품명을 "목재문틀"로 변경
                              const isWoodFrame = item.productName?.includes("목재문틀") || 
                                                item.productName?.includes("才") ||
                                                item.productName?.includes("사이");
                              return isWoodFrame ? "목재문틀" : item.productName;
                            })()}
                          </div>
                          {item.categoryName && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.categoryName}
                              {item.subCategoryName && ` > ${item.subCategoryName}`}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 mt-2">
                        <div className="flex justify-between">
                          <span>기본 단가</span>
                          <span>{item.unitPrice.toLocaleString()}원</span>
                        </div>
                        {item.optionPrice !== 0 && (
                          <div className="flex justify-between">
                            <span>추가 옵션</span>
                            <span>
                              {item.optionPrice > 0 ? '+' : ''} {item.optionPrice.toLocaleString()}원
                            </span>
                          </div>
                        )}
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            옵션: {item.selectedOptions.join(", ")}
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>수량</span>
                          <span>{item.quantity}개</span>
                        </div>
                        <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t-2 border-gray-300 mt-2">
                          <span>소계</span>
                          <span>{item.totalPrice.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t-2 border-gray-400 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg text-gray-700">
                      총 예상 금액
                    </span>
                    <span className="text-3xl font-bold text-green-700">
                      {calculateCartTotal().toLocaleString()}원
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          {cart.length > 0 && (
            <CardFooter className="pt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCart([])}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  장바구니 비우기
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={generatePDF}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF로 변환
                </Button>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-pastel-600 to-pastel-700 hover:from-pastel-700 hover:to-pastel-800 text-white shadow-lg shadow-pastel-600/30 hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl font-semibold h-12"
                onClick={() => {
                  toast.success(`주문하기 페이지로 이동합니다. (총 ${cart.length}개 항목, ${calculateCartTotal().toLocaleString()}원)`);
                  // TODO: 주문하기 페이지로 이동하는 로직 구현
                }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                주문하기
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}