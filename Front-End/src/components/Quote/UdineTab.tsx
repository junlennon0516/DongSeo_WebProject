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
import { Building2, Search, Loader2, Calculator, ShoppingCart, RefreshCw, Plus, Trash2, FileDown, CreditCard, Mail } from "lucide-react";
import { toast } from "sonner";
import type { ExtendedEstimateResponse, CartItem } from "../../types/calculator";
import { useCart } from "../../contexts/CartContext";
import {
  fetchCategories,
  fetchSubCategories,
  fetchColors,
  fetchProducts,
  fetchOptions,
  fetchVariants,
  calculateEstimate,
  searchProductsForEstimate,
  type Category,
  type Color,
  type Product,
  type ProductSearchItem,
  type Option,
  type ProductVariant,
} from "../../api/estimateApi";
import { fetchAdminCompanies } from "../../api/adminApi";

/**
 * 우딘 견적 탭 — 카테고리 · 제품 · 규격(spec/type) · 옵션 · 견적 계산
 */
export function UdineTab() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]); // ABS 등 메인 하위 세부 카테고리
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [colors, setColors] = useState<Color[]>([]);

  /** 대분류: 도어 / 문틀 / 몰딩 중 하나 선택 후 세부 카테고리 선택 */
  const [mainGroup, setMainGroup] = useState<"도어" | "문틀" | "몰딩" | "">("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(""); // ABS 베이직/라인/포인트 등
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [specName, setSpecName] = useState<string>("");
  const [typeName, setTypeName] = useState<string>("");
  const [width, setWidth] = useState<string>("");   // 가로폭 (mm)
  const [height, setHeight] = useState<string>(""); // 세로높이 (mm)
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [margin, setMargin] = useState<string>(""); // 회사 마진 (%)

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<ExtendedEstimateResponse | null>(null);
  /** DB에서 조회한 우딘 회사 ID (상수 11이 아닐 수 있음) */
  const [woodinCompanyId, setWoodinCompanyId] = useState<number | null>(null);

  const { cart, addEstimateItem, removeCartItem, clearCart, getCartTotal, generatePDF, generatePDFAndEmail } = useCart();
  const calculateCartTotal = (): number => getCartTotal();

  // 초기: 우딘 회사 ID 조회 후 카테고리 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const companies = await fetchAdminCompanies();
        const woodin = companies.find((c) => c.code === "WOODIN");
        if (!mounted) return;
        if (!woodin) {
          setWoodinCompanyId(null);
          setCategories([]);
          toast.error("우딘 회사가 DB에 등록되어 있지 않습니다. data.sql에서 우딘 회사 삽입을 확인해주세요.");
          return;
        }
        setWoodinCompanyId(woodin.id);
      } catch (e: unknown) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : "회사 목록을 불러오지 못했습니다.";
        toast.error(msg);
        setWoodinCompanyId(null);
        setCategories([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (woodinCompanyId == null) return;
    loadCategories(woodinCompanyId);
    loadColors(woodinCompanyId);
  }, [woodinCompanyId]);

  const loadCategories = async (companyId: number) => {
    try {
      setIsLoadingData(true);
      const data = await fetchCategories(companyId);
      const list = (data || []).filter((c) => c.name && c.code);
      setCategories(list);
      if (list.length === 0) {
        toast.warning(
          "우딘 카테고리가 없습니다. Back-End/src/main/resources/woodin/ 폴더의 01, 07, 08, 09, 10번 SQL 파일을 DB에 실행해주세요."
        );
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "카테고리를 불러오지 못했습니다.";
      toast.error(msg);
      setCategories([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadColors = async (companyId: number) => {
    try {
      const data = await fetchColors(companyId);
      setColors(data || []);
    } catch {
      setColors([]);
    }
  };

  // 몰딩 선택 시: "몰딩" 한 단계 없이 바로 PS 도장/웨인스코팅 등 세부만 노출 (MOLDING 자동 선택)
  useEffect(() => {
    if (mainGroup !== "몰딩" || categories.length === 0) return;
    const moldingCat = categories.find((c) => (c.code || "").toUpperCase() === "MOLDING");
    if (moldingCat) setSelectedCategory(moldingCat.id.toString());
  }, [mainGroup, categories]);

  // 메인 카테고리 선택 시: 세부 카테고리 로드 (ABS 등). 세부가 없으면 바로 제품 로드
  useEffect(() => {
    if (!selectedCategory) {
      setSubCategories([]);
      setSelectedSubCategory("");
      setProducts([]);
      setSelectedProduct("");
      setWidth("");
      setHeight("");
      return;
    }
    const categoryId = parseInt(selectedCategory, 10);
    if (Number.isNaN(categoryId)) return;
    setSelectedSubCategory("");
    (async () => {
      try {
        setIsLoadingData(true);
        const sub = await fetchSubCategories(categoryId);
        const list = sub || [];
        setSubCategories(list);
        if (list.length === 0) {
          const data = await fetchProducts(categoryId);
          setProducts(data || []);
        } else {
          setProducts([]);
        }
        setSelectedProduct("");
        setSelectedColor("");
        setSpecName("");
        setTypeName("");
        setSelectedOptions([]);
        setVariants([]);
        setOptions([]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.";
        toast.error(msg);
        setSubCategories([]);
        setProducts([]);
      } finally {
        setIsLoadingData(false);
      }
    })();
  }, [selectedCategory]);

  // ABS 등 세부 카테고리 선택 시 해당 세부의 제품만 로드
  useEffect(() => {
    if (!selectedSubCategory) return;
    const subId = parseInt(selectedSubCategory, 10);
    if (Number.isNaN(subId)) return;
    loadProducts(subId);
  }, [selectedSubCategory]);

  const loadProducts = async (categoryId: number) => {
    try {
      setIsLoadingData(true);
      const data = await fetchProducts(categoryId);
      setProducts(data || []);
      setSelectedProduct("");
      setSelectedColor("");
      setSpecName("");
      setTypeName("");
      setSelectedOptions([]);
      setVariants([]);
      setOptions([]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "제품을 불러오지 못했습니다.";
      toast.error(msg);
      setProducts([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 제품 선택 시 규격(variants)·옵션 로드
  useEffect(() => {
    if (!selectedProduct) {
      setVariants([]);
      setOptions([]);
      setSpecName("");
      setTypeName("");
      setSelectedOptions([]);
      setSelectedColor("");
      setWidth("");
      setHeight("");
      return;
    }
    const productId = parseInt(selectedProduct, 10);
    if (Number.isNaN(productId)) return;
    if (woodinCompanyId != null) loadVariantsAndOptions(productId);
  }, [selectedProduct, woodinCompanyId]);

  const loadVariantsAndOptions = async (productId: number) => {
    if (woodinCompanyId == null) return;
    try {
      setIsLoadingData(true);
      const [vars, opts] = await Promise.all([
        fetchVariants(productId),
        fetchOptions(productId, woodinCompanyId),
      ]);
      setVariants(vars || []);
      setOptions(opts || []);
      setSpecName("");
      setTypeName("");
      setSelectedOptions([]);
      setSelectedColor("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "규격/옵션을 불러오지 못했습니다.";
      toast.error(msg);
      setVariants([]);
      setOptions([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSearch = async () => {
    const kw = searchKeyword.trim();
    if (!kw) {
      toast.info("검색어를 입력해주세요.");
      return;
    }
    try {
      setSearchLoading(true);
      const list = await searchProductsForEstimate({
        keyword: kw,
        companyId: woodinCompanyId ?? undefined,
      });
      setSearchResults(list || []);
      if ((list || []).length === 0) toast.info("검색 결과가 없습니다.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "검색에 실패했습니다.";
      toast.error(msg);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const specOptions = Array.from(new Set(variants.map((v) => v.specName).filter(Boolean)));
  const allTypeOptions = Array.from(new Set(variants.map((v) => v.typeName).filter(Boolean)));
  const typeOptions = specName
    ? variants.filter((v) => v.specName === specName).map((v) => v.typeName).filter(Boolean)
    : [];

  const selectedCategoryObj = categories.find((c) => c.id.toString() === selectedCategory);
  const selectedSubCategoryObj = subCategories.find((c) => c.id.toString() === selectedSubCategory);
  const selectedProductObj = products.find((p) => p.id.toString() === selectedProduct);
  const categoryCode = selectedCategoryObj?.code || "";
  const isWoodFrameProduct = (selectedProductObj?.name || "") === "목재 문틀";
  const isGongFrameProduct = (selectedProductObj?.name || "") === "공틀";
  const isGirdLvbProduct = (selectedProductObj?.name || "").includes("가틀 LVB");
  const isGirdCapProduct = (selectedProductObj?.name || "").includes("가틀캡");
  const isAbsDoor = (selectedCategoryObj?.code || "") === "WOODIN_ABS_DOOR";
  const isAbsNaturalDoor = (selectedSubCategoryObj?.code || "") === "WOODIN_ABS_EDIT";
  const isSignatureDoor = (selectedCategoryObj?.code || "") === "WOODIN_SIG_DOOR";
  const isHiddenDoor = (selectedCategoryObj?.code || "") === "WOODIN_HIDDEN_DOOR";
  const isHiddenFrame = (selectedCategoryObj?.code || "") === "WOODIN_HIDDEN_FRAME";
  const isWoodinFrameCategory = ["FOAM_FRAME", "SLIM_FRAME", "WOOD_FRAME_GIRD", "FRAME_WINDOW", "WOODIN_HIDDEN_FRAME"].includes(categoryCode);
  const signatureColorNames = [
    "샤이엔 UV",
    "마제스틱 UV",
    "빈티지파인 UV",
    "산토리니파인 UV",
    "키타미엘름 UV",
    "펄오크 UV",
    "살리나스 UV",
    "스모크페어 UV",
    "스테인드메이플 가로 UV",
    "플레인 엠보 UV",
    "엘모 가로UV",
    "리비에라오크 엠보UV",
    "오카미 UV",
    "베네치아 UV",
  ];
  const signatureMinjaAColorNames = [
    "샤이엔 UV",
    "마제스틱 UV",
    "빈티지파인 UV",
  ];
  const signatureMinjaBColorNames = [
    "산토리니파인 UV",
    "키타미엘름 UV",
    "펄오크 UV",
    "살리나스 UV",
    "스모크페어 UV",
    "스테인드메이플 가로 UV",
    "오카미 UV",
    "베네치아 UV",
  ];
  const signatureColors = (() => {
    const productName = selectedProductObj?.name || "";
    if (productName.includes("민자A")) {
      return colors.filter((color) => signatureMinjaAColorNames.includes(color.name));
    }
    if (
      productName.includes("민자B (샤이엔") ||
      productName.includes("민자B(샤이엔") ||
      productName.includes("민자 A")
    ) {
      return colors.filter((color) => signatureMinjaAColorNames.includes(color.name));
    }
    if (
      productName.includes("민자B (프로모션)") ||
      productName.includes("민자B(프로모션)") ||
      productName.includes("민자 B")
    ) {
      return colors.filter((color) => signatureMinjaBColorNames.includes(color.name));
    }
    return colors.filter((color) => signatureColorNames.includes(color.name));
  })();
  const absGeneralColorNames = [
    "백골", "스노우펄", "컬럭시화이트", "네이처오크", "화이트펄", "아이스크림", "펄오크", "살리나스",
    "프렌치오크", "소노마오크", "인디오오크", "K808", "아카시아", "나르본오크", "홍송체리", "라이온월넛",
    "월넛", "백색", "파스텔백색", "파스텔중백색", "웜화이트", "도브화이트", "유백색", "S31",
    "파스텔베이지", "옐로우와인", "레드와인", "도브그레이", "파스텔그레이", "페인트그레이", "모던그레이",
    "라이트그레이", "회색", "진회색", "검회색", "블루그레이", "네이비", "다크네이비", "검정",
  ];
  const absColorNames = (() => {
    const productName = selectedProductObj?.name || "";
    if (!productName) return [] as string[];
    if (!isAbsNaturalDoor) return absGeneralColorNames;
    if (productName.includes("한일")) return ["살리나스", "프렌치오크", "백색", "파스텔중백색", "갤럭시화이트"];
    if (productName.includes("두이")) return [];
    if (productName.includes("석삼")) return ["살리나스", "프렌치오크", "백색", "파스텔중백색", "갤럭시화이트"];
    if (productName.includes("넉사")) return ["살리나스", "프렌치오크", "백색", "갤럭시화이트"];
    if (productName.includes("ED-18")) return ["살리나스", "프렌치오크", "백색"];
    if (productName.includes("ED-17")) return [];
    if (productName.includes("ED-16")) return ["백색", "갤럭시화이트"];
    if (productName.includes("ED-15")) return ["펄오크", "살리나스", "프렌치오크", "소노마오크", "아카시아", "백색", "갤럭시화이트"];
    if (productName.includes("ED-11")) return ["펄오크", "살리나스", "프렌치오크", "소노마오크", "아카시아", "K808", "인디언오크", "백색", "갤럭시화이트"];
    if (productName.includes("ED-09")) return ["펄오크", "살리나스", "프렌치오크", "소노마오크", "아카시아", "백색", "갤럭시화이트"];
    if (productName.includes("ED-07")) return ["펄오크", "살리나스", "프렌치오크", "소노마오크", "아카시아", "K808", "인디언오크", "백색", "갤럭시화이트"];
    if (productName.includes("ED-05")) return ["펄오크", "살리나스", "프렌치오크", "소노마오크", "아카시아", "K808", "인디언오크", "백색", "화이트펄", "갤럭시화이트"];
    if (productName.includes("네슬") || productName.includes("네솔")) return ["살리나스", "프렌치오크", "소노마오크", "아카시아", "K808", "인디언오크", "체리", "백색", "갤럭시화이트"];
    if (productName.includes("민자")) return ["백골", "스노우펄", "컬럭시화이트", "네이처오크", "화이트펄", "아이스크림", "펄오크", "살리나스", "프렌치오크", "소노마오크", "인디오오크", "K808", "아카시아", "나르본오크", "홍송체리", "라이온월넛", "월넛", "백색", "파스텔백색", "파스텔중백색", "웜화이트", "도브화이트", "유백색", "S31", "파스텔베이지", "옐로우와인", "레드와인", "도브그레이", "파스텔그레이", "페인트그레이", "모던그레이", "라이트그레이", "회색", "진회색", "검회색", "블루그레이", "네이비", "다크네이비", "검정"];
    if (productName.includes("프리롤")) return ["컬럭시화이트", "백색", "파스텔그레이", "블루그레이", "다크네이비", "진회색", "검회색", "슈퍼매트01", "슈퍼매트02"];
    return absGeneralColorNames;
  })();
  const absColors = colors.filter((color) => absColorNames.includes(color.name));
  const woodinFrameColorNames = [
    "K808",
    "인디언오크",
    "스노우펄",
    "네이처오크",
    "블루그레이",
    "아이스크림",
    "파스텔그레이",
    "백색",
    "회색",
    "검회색",
    "진회색",
    "네이비",
    "다크네이비",
    "화이트펄",
    "살리나스",
    "아카시아",
    "프렌치오크",
    "갤럭시화이트",
    "라이온월넛",
    "유백색",
    "파스텔백색",
    "월넛화이트",
    "스노우오크",
    "벨모그레이",
  ];
  const woodinFrameColors = colors.filter((color) => woodinFrameColorNames.includes(color.name));
  const autoSignatureOptionNames = ["ABS - 특대", "멤브레인 - 특대", "멤브레인 / ABS - 특소"];
  const autoHiddenDoorOptionNames = ["히든 도어 - 특대 (2,170 이상)"];
  const autoHiddenFrameOptionNames = [
    "히든 문틀 110 - 높이 2,100 이상 추가",
    "히든 문틀 120 - 높이 2,100 이상 추가",
    "히든 문틀 130 - 높이 2,100 이상 추가",
    "히든 문틀 140 - 높이 2,100 이상 추가",
    "히든 문틀 150 - 높이 2,100 이상 추가",
    "히든 문틀 160 - 높이 2,100 이상 추가",
    "히든 문틀 170 - 높이 2,100 이상 추가",
    "히든 문틀 180 - 높이 2,100 이상 추가",
    "히든 문틀 190 - 높이 2,100 이상 추가",
    "히든 문틀 200 - 높이 2,100 이상 추가",
  ];
  const autoWoodFrameOptionPrefix = "랩핑 문틀 비규격 - ";
  const autoGirdLvbOptionNames = ["높이 2,100~2,400"];
  const autoSignatureOptionIds = options
    .filter((opt) => autoSignatureOptionNames.includes(opt.name))
    .map((opt) => opt.id);
  const autoHiddenDoorOptionIds = options
    .filter((opt) => autoHiddenDoorOptionNames.includes(opt.name))
    .map((opt) => opt.id);
  const autoHiddenFrameOptionIds = options
    .filter((opt) => autoHiddenFrameOptionNames.includes(opt.name))
    .map((opt) => opt.id);
  const autoWoodFrameOptionIds = options
    .filter((opt) => opt.name.startsWith(autoWoodFrameOptionPrefix))
    .map((opt) => opt.id);
  const autoGirdLvbOptionIds = options
    .filter((opt) => autoGirdLvbOptionNames.includes(opt.name))
    .map((opt) => opt.id);
  const hiddenFrameSizeMatch = (selectedProductObj?.name || "").match(/히든 문틀\s+(\d+)/);
  const hiddenFrameWidthCode = hiddenFrameSizeMatch?.[1];
  const visibleOptions = options.filter(
    (opt) =>
      !autoSignatureOptionNames.includes(opt.name) &&
      !autoHiddenDoorOptionNames.includes(opt.name) &&
      !autoHiddenFrameOptionNames.includes(opt.name) &&
      !opt.name.startsWith(autoWoodFrameOptionPrefix) &&
      !autoGirdLvbOptionNames.includes(opt.name)
  );
  const hiddenCloseHandleNames = ["버터컵 (PULL - 세로)", "리무브 (PULL - 가로)", "엣지 라인(하프)", "데드락(하프)"];
  const hiddenMiniHandleNames = ["카누", "플란 (유광골드)", "플란 (실버)", "로우", "브리트", "샤프B"];
  const hiddenCylinderOptionNames = ["히든 도어 - 실린더 가공 (소구경)", "히든 도어 - 실린더 가공 (일반)"];
  const hiddenReinforcementOptionNames = ["히든 도어 - 상하 심재보강", "히든 도어 - 좌우 심재보강", "히든 도어 - 4면 심재보강"];
  const formatHiddenOptionLabel = (name: string) =>
    name
      .replace(/^히든 도어 - /, "")
      .replace(/^히든 액세서리 - /, "")
      .replace(/^히든 핸들 - /, "");
  const hiddenHandleOptionIds = visibleOptions
    .filter((opt) => opt.name.startsWith("히든 핸들 - "))
    .map((opt) => opt.id);
  const hiddenCylinderOptionIds = visibleOptions
    .filter((opt) => hiddenCylinderOptionNames.includes(opt.name))
    .map((opt) => opt.id);
  const hiddenReinforcementOptionIds = visibleOptions
    .filter((opt) => hiddenReinforcementOptionNames.includes(opt.name))
    .map((opt) => opt.id);
  const hiddenOptionSections = [
    {
      title: "히든 옵션",
      description: "도어 가공/사이즈/심재보강 옵션",
      items: visibleOptions.filter((opt) => opt.name.startsWith("히든 도어 - ")),
    },
    {
      title: "히든 액세서리",
      description: "클로저, 히든경첩, 지그, 캡 옵션",
      items: visibleOptions.filter((opt) => opt.name.startsWith("히든 액세서리 - ")),
    },
    {
      title: "히든 핸들 - 히든(클로저) 타입",
      description: "하프 타입 / 도어 클로저와 함께 사용",
      items: visibleOptions.filter(
        (opt) => opt.name.startsWith("히든 핸들 - ") && hiddenCloseHandleNames.includes(formatHiddenOptionLabel(opt.name))
      ),
    },
    {
      title: "히든 핸들 - 소구경(미니) 타입",
      description: undefined,
      items: visibleOptions.filter(
        (opt) => opt.name.startsWith("히든 핸들 - ") && hiddenMiniHandleNames.includes(formatHiddenOptionLabel(opt.name))
      ),
    },
    {
      title: "히든 핸들 - 모티스 타입",
      description: undefined,
      items: visibleOptions.filter(
        (opt) => opt.name.startsWith("히든 핸들 - ") && formatHiddenOptionLabel(opt.name).includes("모티스")
      ),
    },
    {
      title: "히든 핸들 - 일반 타입",
      description: undefined,
      items: visibleOptions.filter(
        (opt) =>
          opt.name.startsWith("히든 핸들 - ") &&
          !hiddenCloseHandleNames.includes(formatHiddenOptionLabel(opt.name)) &&
          !hiddenMiniHandleNames.includes(formatHiddenOptionLabel(opt.name)) &&
          !formatHiddenOptionLabel(opt.name).includes("모티스")
      ),
    },
  ].filter((section) => section.items.length > 0);
  const hasOnlyDefaultVariant =
    specOptions.length === 1 &&
    specOptions[0] === "기본" &&
    allTypeOptions.length === 1 &&
    allTypeOptions[0] === "기본";

  const selectedAutoSignatureOption = (() => {
    if (!isSignatureDoor) return null;
    const widthNum = parseInt(width, 10);
    const heightNum = parseInt(height, 10);
    if (Number.isNaN(widthNum) || Number.isNaN(heightNum)) return null;
    if (widthNum <= 450 || heightNum <= 1030) {
      return options.find((opt) => opt.name === "멤브레인 / ABS - 특소") ?? null;
    }
    if (widthNum >= 1001 || heightNum >= 2170) {
      return options.find((opt) => opt.name === "ABS - 특대") ?? null;
    }
    if (widthNum >= 941 || heightNum >= 2061) {
      return options.find((opt) => opt.name === "멤브레인 - 특대") ?? null;
    }
    return null;
  })();
  const selectedAutoHiddenFrameOption = (() => {
    if (!isHiddenFrame) return null;
    const heightNum = parseInt(height, 10);
    if (Number.isNaN(heightNum) || heightNum < 2100 || !hiddenFrameWidthCode) return null;
    return (
      options.find((opt) => opt.name === `히든 문틀 ${hiddenFrameWidthCode} - 높이 2,100 이상 추가`) ?? null
    );
  })();
  const selectedAutoHiddenDoorOption = (() => {
    if (!isHiddenDoor) return null;
    const heightNum = parseInt(height, 10);
    if (Number.isNaN(heightNum) || heightNum < 2170) return null;
    return options.find((opt) => opt.name === "히든 도어 - 특대 (2,170 이상)") ?? null;
  })();
  const woodFrameGroupLabel = (() => {
    const specWidth = parseInt(specName, 10);
    if (Number.isNaN(specWidth)) return null;
    if (specWidth <= 140) return "~140";
    if (specWidth <= 170) return "~170";
    if (specWidth <= 200) return "~200";
    return "~210";
  })();
  const selectedAutoWoodFrameHeightOption = (() => {
    if (!(isWoodFrameProduct || isGongFrameProduct) || !woodFrameGroupLabel) return null;
    const heightNum = parseInt(height, 10);
    if (Number.isNaN(heightNum) || heightNum > 1500) return null;
    return options.find((opt) => opt.name === `랩핑 문틀 비규격 - 높이 1,500 이하 (${woodFrameGroupLabel})`) ?? null;
  })();
  const selectedAutoWoodFrameWidthOption = (() => {
    if (!(isWoodFrameProduct || isGongFrameProduct) || !woodFrameGroupLabel) return null;
    const widthNum = parseInt(width, 10);
    if (Number.isNaN(widthNum)) return null;
    if (widthNum <= 500) {
      return options.find((opt) => opt.name === `랩핑 문틀 비규격 - 폭 500 이하 (${woodFrameGroupLabel})`) ?? null;
    }
    if (widthNum >= 1050 && widthNum <= 1500) {
      return options.find((opt) => opt.name === `랩핑 문틀 비규격 - 폭 1,050~1,500 (${woodFrameGroupLabel})`) ?? null;
    }
    if (widthNum >= 1501 && widthNum <= 1800) {
      return options.find((opt) => opt.name === `랩핑 문틀 비규격 - 폭 1,501~1,800 (${woodFrameGroupLabel})`) ?? null;
    }
    return null;
  })();
  const selectedAutoGirdLvbOption = (() => {
    if (!isGirdLvbProduct) return null;
    const heightNum = parseInt(height, 10);
    if (Number.isNaN(heightNum) || heightNum <= 2100 || heightNum > 2400) return null;
    return options.find((opt) => opt.name === "높이 2,100~2,400") ?? null;
  })();

  const toggleOptionSelection = (optionId: number, optionName: string) => {
    setSelectedOptions((prev) => {
      const isSelected = prev.includes(optionId);
      if (isSelected) {
        return prev.filter((id) => id !== optionId);
      }

      let next = [...prev];

      if (optionName.startsWith("히든 핸들 - ")) {
        next = next.filter((id) => !hiddenHandleOptionIds.includes(id));
      }
      if (hiddenCylinderOptionNames.includes(optionName)) {
        next = next.filter((id) => !hiddenCylinderOptionIds.includes(id));
      }
      if (hiddenReinforcementOptionNames.includes(optionName)) {
        next = next.filter((id) => !hiddenReinforcementOptionIds.includes(id));
      }

      next.push(optionId);
      return next;
    });
  };

  useEffect(() => {
    if (!isSignatureDoor) {
      setSelectedOptions((prev) => prev.filter((id) => !autoSignatureOptionIds.includes(id)));
      return;
    }
    setSelectedOptions((prev) => {
      const manualOnly = prev.filter((id) => !autoSignatureOptionIds.includes(id));
      if (!selectedAutoSignatureOption) return manualOnly;
      return [...manualOnly, selectedAutoSignatureOption.id];
    });
  }, [isSignatureDoor, selectedAutoSignatureOption, width, height, options]);

  useEffect(() => {
    if (!isHiddenDoor) {
      setSelectedOptions((prev) => prev.filter((id) => !autoHiddenDoorOptionIds.includes(id)));
      return;
    }
    setSelectedOptions((prev) => {
      const manualOnly = prev.filter((id) => !autoHiddenDoorOptionIds.includes(id));
      if (!selectedAutoHiddenDoorOption) return manualOnly;
      return [...manualOnly, selectedAutoHiddenDoorOption.id];
    });
  }, [isHiddenDoor, selectedAutoHiddenDoorOption, height, options]);

  useEffect(() => {
    if (!isHiddenFrame) {
      setSelectedOptions((prev) => prev.filter((id) => !autoHiddenFrameOptionIds.includes(id)));
      return;
    }
    setSelectedOptions((prev) => {
      const manualOnly = prev.filter((id) => !autoHiddenFrameOptionIds.includes(id));
      if (!selectedAutoHiddenFrameOption) return manualOnly;
      return [...manualOnly, selectedAutoHiddenFrameOption.id];
    });
  }, [isHiddenFrame, selectedAutoHiddenFrameOption, height, options]);

  useEffect(() => {
    if (!(isWoodFrameProduct || isGongFrameProduct)) {
      setSelectedOptions((prev) => prev.filter((id) => !autoWoodFrameOptionIds.includes(id)));
      return;
    }
    setSelectedOptions((prev) => {
      const manualOnly = prev.filter((id) => !autoWoodFrameOptionIds.includes(id));
      const next = [...manualOnly];
      if (selectedAutoWoodFrameHeightOption) next.push(selectedAutoWoodFrameHeightOption.id);
      if (selectedAutoWoodFrameWidthOption) next.push(selectedAutoWoodFrameWidthOption.id);
      return next;
    });
  }, [isWoodFrameProduct, isGongFrameProduct, selectedAutoWoodFrameHeightOption, selectedAutoWoodFrameWidthOption, width, height, specName, options]);

  useEffect(() => {
    if (!isGirdLvbProduct) {
      setSelectedOptions((prev) => prev.filter((id) => !autoGirdLvbOptionIds.includes(id)));
      return;
    }
    setSelectedOptions((prev) => {
      const manualOnly = prev.filter((id) => !autoGirdLvbOptionIds.includes(id));
      if (!selectedAutoGirdLvbOption) return manualOnly;
      return [...manualOnly, selectedAutoGirdLvbOption.id];
    });
  }, [isGirdLvbProduct, selectedAutoGirdLvbOption, height, options]);

  useEffect(() => {
    if (!selectedColor) return;
    const availableColors = isSignatureDoor
      ? signatureColors
      : isAbsDoor
        ? absColors
        : isWoodinFrameCategory
          ? woodinFrameColors
          : colors;
    const existsInFilteredColors = availableColors.some((color) => color.id.toString() === selectedColor);
    if (!existsInFilteredColors) {
      setSelectedColor("");
    }
  }, [selectedColor, signatureColors, absColors, woodinFrameColors, isSignatureDoor, isAbsDoor, isWoodinFrameCategory, colors]);

  useEffect(() => {
    if (specOptions.length === 1 && !specName) {
      setSpecName(specOptions[0]);
    }
  }, [specOptions, specName]);

  useEffect(() => {
    if (allTypeOptions.length === 1 && !typeName) {
      setTypeName(allTypeOptions[0]);
    }
  }, [allTypeOptions, typeName]);

  // 대분류에 해당하는 세부 카테고리만 필터 (도어 / 문틀 / 몰딩)
  const subCategoriesByGroup = ((): Category[] => {
    if (!mainGroup) return [];
    const list = categories.filter((c) => {
      const name = (c.name || "").trim();
      const code = (c.code || "").toUpperCase();
      if (mainGroup === "도어") return name.includes("도어");
      if (mainGroup === "문틀") return name.includes("문틀");
      if (mainGroup === "몰딩") return name.includes("몰딩") || code === "MOLDING";
      return false;
    });
    // 도어: ABS → 히든 → 시그니처 순
    if (mainGroup === "도어") {
      const order = (n: string) => {
        if (n.includes("ABS")) return 0;
        if (n.includes("히든")) return 1;
        if (n.includes("시그니처")) return 2;
        return 3;
      };
      return [...list].sort((a, b) => order(a.name || "") - order(b.name || "") || (a.name || "").localeCompare(b.name || "", "ko"));
    }
    return list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));
  })();

  const hasRequiredVariantSelection =
    variants.length === 0 || (Boolean(specName) && Boolean(typeName));

  const canCalculate =
    woodinCompanyId != null &&
    selectedProduct &&
    hasRequiredVariantSelection &&
    (!(isSignatureDoor || (isAbsDoor && absColors.length > 0)) || !!selectedColor) &&
    quantity >= 1;

  const handleCalculate = async () => {
    if (!canCalculate) {
      toast.error(
        isSignatureDoor || (isAbsDoor && absColors.length > 0)
          ? "카테고리 · 제품 · 규격 · 색상 · 수량을 선택해주세요."
          : "카테고리 · 제품 · 규격(필요 시) · 수량을 선택해주세요."
      );
      return;
    }
    if (woodinCompanyId == null) return;
    const productId = parseInt(selectedProduct, 10);
    if (Number.isNaN(productId)) return;
    try {
      setIsCalculating(true);
      setResult(null);
      const request = {
        companyId: woodinCompanyId,
        productId,
        specName,
        typeName,
        optionIds: selectedOptions.length > 0 ? selectedOptions : undefined,
        quantity,
        // 문짝/도어·문틀 카테고리에서는 가로/세로를 함께 전달 (백엔드에서 사용 시 확장 대비)
        ...(width
          ? { width: parseInt(width, 10) || undefined }
          : {}),
        ...(height
          ? { height: parseInt(height, 10) || undefined }
          : {}),
      };

      const response = await calculateEstimate(request);
      const optionNames = selectedOptions
        .map((id) => options.find((o) => o.id === id)?.name)
        .filter((n): n is string => Boolean(n));
      let extended: ExtendedEstimateResponse = {
        ...response,
        categoryName: selectedCategoryObj?.name,
        subCategoryName: selectedSubCategoryObj?.name,
        selectedOptions: optionNames,
      };
      
      // 마진 적용
      if (margin && margin.trim() !== "") {
        const marginRate = parseFloat(margin) / 100; // %를 소수로 변환
        if (!isNaN(marginRate) && marginRate >= 0) {
          const marginAmount = Math.round(extended.totalPrice * marginRate);
          const finalPrice = extended.totalPrice + marginAmount;
          
          extended = {
            ...extended,
            totalPrice: finalPrice,
            // @ts-ignore - 마진 정보 추가
            margin: margin,
            marginAmount: marginAmount,
            finalPrice: finalPrice,
          };
        }
      }
      
      setResult(extended);
      toast.success("견적이 계산되었습니다.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "견적 계산에 실패했습니다.";
      toast.error(msg);
      setResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const addToCart = () => {
    if (!result) {
      toast.error("먼저 견적을 계산해주세요.");
      return;
    }
    if (woodinCompanyId == null) return;
    const cartItem: CartItem = {
      ...result,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      companyId: woodinCompanyId,
      companyCode: "WOODIN",
      categoryName: result.categoryName ?? selectedCategoryObj?.name ?? "",
      subCategoryName: result.subCategoryName,
      specName: specName || undefined,
      typeName: typeName || undefined,
      width: width || undefined,
      height: height || undefined,
      selectedColorId: selectedColor || undefined,
      selectedColorName: selectedColor ? colors.find((c) => c.id.toString() === selectedColor)?.name : undefined,
      selectedColorCode: selectedColor ? colors.find((c) => c.id.toString() === selectedColor)?.colorCode : undefined,
      margin: result.margin || margin || undefined,
      marginAmount: result.marginAmount,
      finalPrice: result.finalPrice,
    };
    addEstimateItem(cartItem);
    toast.success("장바구니에 담았습니다.");
    setResult(null);
    setSelectedProduct("");
    setSpecName("");
    setTypeName("");
    setSelectedOptions([]);
    setSelectedColor("");
    setQuantity(1);
    setWidth("");
    setHeight("");
  };

  return (
    <div className="space-y-6">
      {/* 견적 검색 */}
      <Card className="p-4 rounded-2xl bg-white/80 shadow-md">
        <div className="flex flex-wrap gap-2 items-center">
          <Search className="w-5 h-5 text-indigo-600" />
          <Input
            placeholder="제품명으로 견적 찾기..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            className="max-w-xs"
          />
          <Button type="button" size="sm" onClick={handleSearch} disabled={woodinCompanyId == null || searchLoading}>
            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
            검색
          </Button>
        </div>
        {searchResults.length > 0 && (
          <ul className="mt-2 text-sm text-slate-600 space-y-1">
            {searchResults.slice(0, 5).map((r) => (
              <li key={`${r.productId}-${r.categoryId}`}>
                {r.productName} — {r.categoryName}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 좌측: 카테고리 · 제품 · 규격 · 옵션 · 견적 계산 */}
        <Card className="lg:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 shadow-xl shadow-indigo-500/5">
          <h3 className="mb-6 flex items-center gap-3 text-2xl font-bold">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 via-indigo-700 to-gray-900 bg-clip-text text-transparent">
              상세 견적 계산기 - 우딘
            </span>
          </h3>

          {woodinCompanyId == null && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              우딘 회사가 DB에 등록되어 있지 않습니다. data.sql에 우딘(WOODIN) 회사가 들어 있는지 확인해주세요.
            </div>
            )}
            {woodinCompanyId != null && categories.length === 0 && !isLoadingData && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
              우딘 카테고리가 비어 있습니다. <strong>Back-End/src/main/resources/woodin/</strong> 폴더의 <strong>01, 07, 08, 09, 10</strong>번 SQL 파일을 DB에 순서대로 실행해주세요.
            </div>
            )}
            <div className="space-y-5">
            {/* 1. 대분류 선택 (도어 / 문틀 / 몰딩) */}
            <div className="space-y-2">
              <Label>대분류</Label>
              <div className="flex flex-wrap gap-2">
                {(["도어", "문틀", "몰딩"] as const).map((group) => (
                  <Button
                    key={group}
                    type="button"
                    variant={mainGroup === group ? "default" : "outline"}
                    size="lg"
                    className="min-w-[100px]"
                    disabled={woodinCompanyId == null || isLoadingData}
                    onClick={() => {
                      setMainGroup(group);
                      setSelectedCategory("");
                    }}
                  >
                    {group}
                  </Button>
                ))}
              </div>
            </div>

            {/* 2. 세부 카테고리 선택 (대분류 선택 후 표시). 몰딩은 아래 한 줄로만 표시하므로 여기서 제외 */}
            {mainGroup && mainGroup !== "몰딩" && (
              <div className="space-y-2">
                <Label>세부 카테고리</Label>
                {subCategoriesByGroup.length === 0 ? (
                  <p className="text-sm text-amber-600">해당 대분류의 카테고리가 없습니다. DB에 카테고리를 추가해주세요.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subCategoriesByGroup.map((c) => (
                      <Button
                        key={c.id}
                        type="button"
                        variant={selectedCategory === c.id.toString() ? "default" : "outline"}
                        size="sm"
                        disabled={isLoadingData}
                        onClick={() => setSelectedCategory(c.id.toString())}
                      >
                        {c.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. 세부 카테고리 (ABS 베이직/라인/포인트 등, 몰딩은 PS 도장/웨인스코팅 등) */}
            {(selectedCategory && subCategories.length > 0) || (mainGroup === "몰딩" && subCategories.length > 0) ? (
              <div className="space-y-2">
                <Label>세부 카테고리</Label>
                <div className="flex flex-wrap gap-2">
                  {subCategories.map((sub) => (
                    <Button
                      key={sub.id}
                      type="button"
                      variant={selectedSubCategory === sub.id.toString() ? "default" : "outline"}
                      size="sm"
                      disabled={isLoadingData}
                      onClick={() => setSelectedSubCategory(sub.id.toString())}
                    >
                      {sub.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 제품 (세부가 있으면 세부 선택 후, 없으면 메인 선택 후 표시) */}
            <div className="space-y-2">
              <Label>제품</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
                disabled={
                  !selectedCategory ||
                  (subCategories.length > 0 && !selectedSubCategory) ||
                  isLoadingData ||
                  products.length === 0
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      subCategories.length > 0 && !selectedSubCategory
                        ? "세부 카테고리를 먼저 선택하세요"
                        : "제품 선택"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProductObj && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <div className="font-medium text-gray-900">선택 제품 정보</div>
                  <div className="mt-1">
                    {(selectedProductObj.description || selectedProductObj.size) && (
                      <div>규격: {[selectedProductObj.description, selectedProductObj.size].filter(Boolean).join(" · ") || "-"}</div>
                    )}
                    <div>단가: {selectedProductObj.basePrice != null ? `${selectedProductObj.basePrice.toLocaleString()}원` : "-"}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 규격: 문폭(spec) / 타입(type) */}
            {variants.length > 0 && !hasOnlyDefaultVariant && (
              <>
                <div className="space-y-2">
                  <Label>규격 (문폭 등)</Label>
                  <Select value={specName} onValueChange={(v) => { setSpecName(v); setTypeName(""); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="규격 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {specOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>타입 (식기 유/무 등)</Label>
                  <Select value={typeName} onValueChange={setTypeName} disabled={!specName}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="타입 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {typeOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* 문짝/도어 및 문틀 계열: 가로/세로 입력 (쉐누 계산기와 동일 UX) */}
            {selectedCategoryObj && selectedProduct && (
              (() => {
                const catName = selectedCategoryObj.name || "";
                const isDoorOrFrame =
                  catName.includes("도어") ||
                  catName.includes("문짝") ||
                  catName.includes("문틀");

                if (!isDoorOrFrame || isGirdCapProduct) return null;

                return (
                  <div className="space-y-3 rounded-xl border border-gray-200 bg-slate-100 p-4">
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
                    {isSignatureDoor && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        기준 사이즈: 최대 폭 1000mm / 최대 길이 2250mm. 입력값에 따라 특소/특대 옵션이 자동 반영됩니다.
                      </div>
                    )}
                    {isAbsDoor && selectedProductObj && (() => {
                      const p = selectedProductObj;
                      const hasSpec = p.minWidth != null || p.maxWidth != null || p.minHeight != null || p.maxHeight != null;
                      if (!hasSpec) return null;
                      const wMin = p.minWidth != null ? `최소폭 ${p.minWidth}mm` : "최소폭 제한없음";
                      const wMax = p.maxWidth != null ? `최대폭 ${p.maxWidth}mm` : "최대폭 제한없음";
                      const hMin = p.minHeight != null ? `최소길이 ${p.minHeight}mm` : "최소길이 제한없음";
                      const hMax = p.maxHeight != null ? `최대길이 ${p.maxHeight}mm` : "최대길이 제한없음";
                      const specText = `${wMin}, ${wMax} / ${hMin}, ${hMax}`;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                          기준 사이즈: {specText}. 입력값에 따라 특소/특대 옵션이 자동 반영됩니다.
                        </div>
                      );
                    })()}
                    {isHiddenFrame && (
                      <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                        히든 문틀은 높이 2100mm 이상일 때 문폭별 추가금이 자동 반영됩니다. 가스켓 적용 불가 / 200 이상은 별도 문의입니다.
                      </div>
                    )}
                    {isHiddenDoor && (
                      <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-800">
                        히든 도어는 높이 2170mm 이상일 때 특대 옵션이 자동 반영됩니다. 핸들은 1개만 선택 가능하며, 실린더 가공/심재보강도 그룹별로 1개씩만 선택됩니다.
                      </div>
                    )}
                    {(isWoodFrameProduct || isGongFrameProduct) && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                        목재 문틀/공틀은 1050 x 2100 이하 기준이며, 랩핑 문틀 비규격 옵션이 입력 사이즈에 따라 자동 반영됩니다.
                      </div>
                    )}
                    {isGirdLvbProduct && (
                      <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800">
                        가틀 LVB는 높이 2100~2400 구간에서 추가금이 자동 반영됩니다.
                      </div>
                    )}
                  </div>
                );
              })()
            )}

            {/* 시그니처 도어 전용 컬러 */}
            {isSignatureDoor && selectedProduct && (
              <div className="space-y-2">
                <Label>시그니처 컬러</Label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="시그니처 컬러 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {signatureColors.map((color) => (
                      <SelectItem key={color.id} value={color.id.toString()}>
                        {color.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  시그니처 도어에서는 시그니처 전용 컬러만 표시됩니다.
                </p>
              </div>
            )}

            {/* ABS 도어 전용 컬러 */}
            {isAbsDoor && selectedProduct && (
              <div className="space-y-2">
                <Label>ABS 가능 색상</Label>
                {absColors.length > 0 ? (
                  <>
                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="가능 색상 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {absColors.map((color) => (
                          <SelectItem key={color.id} value={color.id.toString()}>
                            {color.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {isAbsNaturalDoor
                        ? "네추럴 도어는 모델별 가능 색상만 표시됩니다."
                        : "네추럴 도어를 제외한 ABS 도어는 전체 ABS 색상 중에서 선택할 수 있습니다."}
                    </p>
                  </>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    현재 이 모델에 등록된 가능 색상 정보가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 우딘 문틀 전용 컬러 */}
            {isWoodinFrameCategory && selectedProduct && (
              <div className="space-y-2">
                <Label>문틀 가능 색상</Label>
                {woodinFrameColors.length > 0 ? (
                  <>
                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="문틀 색상 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {woodinFrameColors.map((color) => (
                          <SelectItem key={color.id} value={color.id.toString()}>
                            {color.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      발포문틀 재고 컬러 기준으로 선택 가능합니다.
                    </p>
                  </>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    문틀용 재고 컬러 정보가 아직 등록되지 않았습니다.
                  </div>
                )}
              </div>
            )}

            {/* 시그니처 도어 자동 사이즈 옵션 */}
            {isSignatureDoor && selectedProduct && (
              <div className="space-y-2">
                <Label>자동 적용 사이즈 옵션</Label>
                <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                  {selectedAutoSignatureOption ? (
                    <>
                      {selectedAutoSignatureOption.name}{" "}
                      ({selectedAutoSignatureOption.addPrice >= 0 ? "+" : ""}
                      {selectedAutoSignatureOption.addPrice.toLocaleString()}원)
                    </>
                  ) : (
                    "현재 자동 적용되는 사이즈 옵션이 없습니다."
                  )}
                </div>
              </div>
            )}

            {isHiddenFrame && selectedProduct && (
              <div className="space-y-2">
                <Label>자동 적용 문틀 추가금</Label>
                <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                  {selectedAutoHiddenFrameOption ? (
                    <>
                      {selectedAutoHiddenFrameOption.name}{" "}
                      ({selectedAutoHiddenFrameOption.addPrice >= 0 ? "+" : ""}
                      {selectedAutoHiddenFrameOption.addPrice.toLocaleString()}원)
                    </>
                  ) : (
                    "현재 자동 적용되는 높이 추가금이 없습니다."
                  )}
                </div>
              </div>
            )}

            {(isWoodFrameProduct || isGongFrameProduct) && selectedProduct && (
              <div className="space-y-2">
                <Label>자동 적용 랩핑 문틀 비규격</Label>
                <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  {selectedAutoWoodFrameHeightOption || selectedAutoWoodFrameWidthOption ? (
                    <div className="space-y-1">
                      {selectedAutoWoodFrameHeightOption && (
                        <div>
                          {selectedAutoWoodFrameHeightOption.name} ({selectedAutoWoodFrameHeightOption.addPrice >= 0 ? "+" : ""}
                          {selectedAutoWoodFrameHeightOption.addPrice.toLocaleString()}원)
                        </div>
                      )}
                      {selectedAutoWoodFrameWidthOption && (
                        <div>
                          {selectedAutoWoodFrameWidthOption.name} ({selectedAutoWoodFrameWidthOption.addPrice >= 0 ? "+" : ""}
                          {selectedAutoWoodFrameWidthOption.addPrice.toLocaleString()}원)
                        </div>
                      )}
                    </div>
                  ) : (
                    "현재 자동 적용되는 비규격 옵션이 없습니다."
                  )}
                </div>
              </div>
            )}

            {isGirdLvbProduct && selectedProduct && (
              <div className="space-y-2">
                <Label>자동 적용 가틀 추가금</Label>
                <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
                  {selectedAutoGirdLvbOption ? (
                    <>
                      {selectedAutoGirdLvbOption.name} ({selectedAutoGirdLvbOption.addPrice >= 0 ? "+" : ""}
                      {selectedAutoGirdLvbOption.addPrice.toLocaleString()}원)
                    </>
                  ) : (
                    "현재 자동 적용되는 가틀 추가금이 없습니다."
                  )}
                </div>
              </div>
            )}

            {isHiddenDoor && selectedProduct && (
              <div className="space-y-2">
                <Label>자동 적용 도어 추가금</Label>
                <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-900">
                  {selectedAutoHiddenDoorOption ? (
                    <>
                      {selectedAutoHiddenDoorOption.name}{" "}
                      ({selectedAutoHiddenDoorOption.addPrice >= 0 ? "+" : ""}
                      {selectedAutoHiddenDoorOption.addPrice.toLocaleString()}원)
                    </>
                  ) : (
                    "현재 자동 적용되는 도어 추가금이 없습니다."
                  )}
                </div>
              </div>
            )}

            {/* 옵션 */}
            {visibleOptions.length > 0 && (
              <div className="space-y-2">
                <Label>{isHiddenDoor ? "히든 도어 옵션" : "옵션"}</Label>
                {isHiddenDoor ? (
                  <div className="space-y-4">
                    {hiddenOptionSections.map((section) => (
                      <div key={section.title} className="rounded-lg border bg-slate-50/50 p-4">
                        <div className="mb-3">
                          <div className="font-medium text-sm text-slate-900">{section.title}</div>
                          {section.description && (
                            <div className="text-xs text-slate-500 mt-1">{section.description}</div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {section.items.map((opt) => (
                            <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={selectedOptions.includes(opt.id)}
                                onCheckedChange={() => {
                                  toggleOptionSelection(opt.id, opt.name);
                                }}
                              />
                              <span className="text-sm">
                                {formatHiddenOptionLabel(opt.name)}{" "}
                                {opt.addPrice >= 0 ? `+${opt.addPrice.toLocaleString()}원` : `${opt.addPrice.toLocaleString()}원`}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4 rounded-lg border p-3 bg-slate-50/50">
                    {visibleOptions.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedOptions.includes(opt.id)}
                          onCheckedChange={() => {
                            toggleOptionSelection(opt.id, opt.name);
                          }}
                        />
                        <span className="text-sm">
                          {opt.name} {opt.addPrice >= 0 ? `+${opt.addPrice.toLocaleString()}원` : `${opt.addPrice.toLocaleString()}원`}
                        </span>
                      </label>
                    ))}
                  </div>
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

            {/* 수량 */}
            <div className="space-y-2">
              <Label>수량</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="bg-white"
              />
            </div>

            <Button
              type="button"
              onClick={handleCalculate}
              disabled={!canCalculate || isCalculating}
              className="w-full"
            >
              {isCalculating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
              견적 계산
            </Button>
          </div>
        </Card>

        {/* 우측: 예상 견적서 + 장바구니 (쉐누 탭과 동일 컴포넌트 구조) */}
        <div className="space-y-6 pb-8 overflow-visible">
          {/* 예상 견적서 */}
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50/50 sticky top-4 rounded-3xl shadow-xl shadow-indigo-500/5">
            <CardHeader className="pb-4 border-b-2 border-gray-400">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>예상 견적서</span>
                <span className="text-sm font-normal text-gray-500">VAT 별도</span>
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
                      <span>{result.productName}</span>
                    </div>
                    {result.categoryName && (
                      <div className="text-xs text-gray-500">{result.categoryName}</div>
                    )}
                    {result.subCategoryName && (
                      <div className="text-xs text-gray-500">세부: {result.subCategoryName}</div>
                    )}
                    {(specName || typeName) && (
                      <div className="text-xs text-gray-500">
                        {specName && `규격: ${specName}`}
                        {specName && typeName && " / "}
                        {typeName && `타입: ${typeName}`}
                      </div>
                    )}
                    {selectedColor && (
                      <div className="text-xs text-gray-500">
                        색상: {colors.find((c) => c.id.toString() === selectedColor)?.name}
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>기본 단가</span>
                      <span>{result.unitPrice.toLocaleString()}원</span>
                    </div>
                    {result.optionPrice !== 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>추가 옵션 합계</span>
                        <span>{result.optionPrice > 0 ? "+" : ""}{result.optionPrice.toLocaleString()}원</span>
                      </div>
                    )}
                    {result.selectedOptions && result.selectedOptions.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">옵션: {result.selectedOptions.join(", ")}</div>
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
                      <span className="font-semibold text-gray-700">총 예상 금액</span>
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
                <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
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
                <span className="text-sm font-normal text-gray-500">VAT 별도</span>
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
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {cart.map((entry) => {
                      const id = entry.source === "estimate" ? entry.item.id : entry.item.id;
                      return (
                        <div
                          key={id}
                          className="p-5 bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              {entry.source === "estimate" ? (
                                <>
                                  <div className="font-medium text-base">{entry.item.productName}</div>
                                  {entry.item.categoryName && (
                                    <div className="text-xs text-gray-500 mt-1">{entry.item.categoryName}</div>
                                  )}
                                </>
                              ) : (
                                <>
                                  {"companyName" in entry.item && entry.item.companyName && (
                                    <div className="text-xs text-indigo-600 font-medium mb-0.5">{entry.item.companyName}</div>
                                  )}
                                  <div className="font-medium text-base">{entry.item.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {entry.item.category}
                                    {"subCategory" in entry.item && entry.item.subCategory !== entry.item.category && ` > ${entry.item.subCategory}`}
                                  </div>
                                </>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeCartItem(id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 mt-2">
                            {entry.source === "estimate" ? (
                              <>
                                <div className="flex justify-between">
                                  <span>기본 단가</span>
                                  <span>{entry.item.unitPrice.toLocaleString()}원</span>
                                </div>
                                {entry.item.optionPrice !== 0 && (
                                  <div className="flex justify-between">
                                    <span>추가 옵션</span>
                                    <span>{entry.item.optionPrice! > 0 ? "+" : ""}{entry.item.optionPrice!.toLocaleString()}원</span>
                                  </div>
                                )}
                                {entry.item.selectedOptions && entry.item.selectedOptions.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">옵션: {entry.item.selectedOptions.join(", ")}</div>
                                )}
                                <div className="flex justify-between">
                                  <span>수량</span>
                                  <span>{entry.item.quantity}개</span>
                                </div>
                                <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t-2 border-gray-300 mt-2">
                                  <span>소계</span>
                                  <span>{(entry.item.finalPrice ?? entry.item.totalPrice).toLocaleString()}원</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between">
                                  <span>단가</span>
                                  <span>{entry.item.unitPrice.toLocaleString()}원</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>수량</span>
                                  <span>{entry.item.quantity}개</span>
                                </div>
                                {"margin" in entry.item && entry.item.margin && "marginAmount" in entry.item && entry.item.marginAmount && (
                                  <div className="flex justify-between text-blue-700">
                                    <span>회사 마진 ({entry.item.margin}%)</span>
                                    <span>+{entry.item.marginAmount.toLocaleString()}원</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-semibold text-gray-800 pt-2 border-t-2 border-gray-300 mt-2">
                                  <span>소계</span>
                                  <span>{(entry.item.finalPrice ?? entry.item.totalPrice).toLocaleString()}원</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4 border-t-2 border-gray-400 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg text-gray-700">총 예상 금액</span>
                      <span className="text-3xl font-bold text-green-700">{calculateCartTotal().toLocaleString()}원</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            {cart.length > 0 && (
              <CardFooter className="pt-2 pb-6 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={clearCart}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    장바구니 비우기
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => generatePDF()}>
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF로 변환
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={() => generatePDFAndEmail()}>
                  <Mail className="w-4 h-4 mr-2" />
                  이메일로 보내기
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-pastel-600 to-pastel-700 hover:from-pastel-700 hover:to-pastel-800 text-black shadow-lg shadow-pastel-600/30 hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl font-semibold h-12"
                  onClick={() => {
                    toast.success(`주문하기 페이지로 이동합니다. (총 ${cart.length}개 항목, ${calculateCartTotal().toLocaleString()}원)`);
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
    </div>
  );
}
