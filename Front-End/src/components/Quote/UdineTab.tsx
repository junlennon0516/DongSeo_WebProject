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
  fetchProducts,
  fetchOptions,
  fetchVariants,
  calculateEstimate,
  searchProductsForEstimate,
  type Category,
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
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [options, setOptions] = useState<Option[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [specName, setSpecName] = useState<string>("");
  const [typeName, setTypeName] = useState<string>("");
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

  // 카테고리 선택 시 제품 로드
  useEffect(() => {
    if (!selectedCategory) {
      setProducts([]);
      setSelectedProduct("");
      return;
    }
    const categoryId = parseInt(selectedCategory, 10);
    if (Number.isNaN(categoryId)) return;
    loadProducts(categoryId);
  }, [selectedCategory]);

  const loadProducts = async (categoryId: number) => {
    try {
      setIsLoadingData(true);
      const data = await fetchProducts(categoryId);
      setProducts(data || []);
      setSelectedProduct("");
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
  const typeOptions = specName
    ? variants.filter((v) => v.specName === specName).map((v) => v.typeName).filter(Boolean)
    : [];

  const selectedCategoryObj = categories.find((c) => c.id.toString() === selectedCategory);
  const selectedProductObj = products.find((p) => p.id.toString() === selectedProduct);

  const canCalculate =
    woodinCompanyId != null &&
    selectedProduct &&
    specName &&
    typeName &&
    quantity >= 1;

  const handleCalculate = async () => {
    if (!canCalculate) {
      toast.error("카테고리 · 제품 · 규격(문폭/타입) · 수량을 선택해주세요.");
      return;
    }
    if (woodinCompanyId == null) return;
    const productId = parseInt(selectedProduct, 10);
    if (Number.isNaN(productId)) return;
    try {
      setIsCalculating(true);
      setResult(null);
      const response = await calculateEstimate({
        companyId: woodinCompanyId,
        productId,
        specName,
        typeName,
        optionIds: selectedOptions.length > 0 ? selectedOptions : undefined,
        quantity,
      });
      const optionNames = selectedOptions
        .map((id) => options.find((o) => o.id === id)?.name)
        .filter((n): n is string => Boolean(n));
      let extended: ExtendedEstimateResponse = {
        ...response,
        categoryName: selectedCategoryObj?.name,
        subCategoryName: undefined,
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
    setQuantity(1);
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
            {/* 카테고리 */}
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={woodinCompanyId == null || isLoadingData}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 제품 */}
            <div className="space-y-2">
              <Label>제품</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
                disabled={!selectedCategory || isLoadingData || products.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="제품 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 규격: 문폭(spec) / 타입(type) */}
            {variants.length > 0 && (
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

            {/* 옵션 */}
            {options.length > 0 && (
              <div className="space-y-2">
                <Label>옵션</Label>
                <div className="flex flex-wrap gap-4 rounded-lg border p-3 bg-slate-50/50">
                  {options.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedOptions.includes(opt.id)}
                        onCheckedChange={() => {
                          setSelectedOptions((prev) =>
                            prev.includes(opt.id) ? prev.filter((id) => id !== opt.id) : [...prev, opt.id]
                          );
                        }}
                      />
                      <span className="text-sm">
                        {opt.name} {opt.addPrice >= 0 ? `+${opt.addPrice.toLocaleString()}원` : `${opt.addPrice.toLocaleString()}원`}
                      </span>
                    </label>
                  ))}
                </div>
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
                    {(specName || typeName) && (
                      <div className="text-xs text-gray-500">
                        {specName && `규격: ${specName}`}
                        {specName && typeName && " / "}
                        {typeName && `타입: ${typeName}`}
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
