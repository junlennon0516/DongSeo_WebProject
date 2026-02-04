import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { ShoppingCart, Loader2, Plus, Trash2, Search, X, Calculator, RefreshCw, FileDown, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { logger } from "../../utils/logger";
import {
  fetchCategories,
  fetchSubCategories,
  fetchProducts,
  searchProductsForEstimate,
  type Category,
  type Product,
  type ProductSearchItem,
} from "../../api/estimateApi";
import { COMPANY_ID } from "../../constants/calculator";
import type { WoodProduct } from "../../types/calculator";
import { useCart } from "../../contexts/CartContext";

interface WoodEstimate {
  productName: string;
  categoryName: string;
  subCategoryName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  margin?: string;
  marginAmount?: number;
  finalPrice?: number;
}

export function WoodTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [margin, setMargin] = useState<string>("");
  
  const [result, setResult] = useState<WoodEstimate | null>(null);
  const { cart, addWoodItem, removeCartItem, updateWoodItemQuantity, clearCart, getCartTotal, generatePDF } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  // 목재 제품 검색 (상단 검색)
  const [woodSearchKeyword, setWoodSearchKeyword] = useState("");
  const [woodSearchResults, setWoodSearchResults] = useState<ProductSearchItem[]>([]);
  const [woodSearchLoading, setWoodSearchLoading] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadCategories();
  }, []);

  // 카테고리 선택 시 세부 카테고리 로드
  useEffect(() => {
    if (selectedCategory) {
      loadSubCategories(parseInt(selectedCategory));
    } else {
      setSubCategories([]);
      setProducts([]);
    }
  }, [selectedCategory]);

  // 세부 카테고리 선택 시 제품 로드
  useEffect(() => {
    if (selectedSubCategory) {
      loadProducts(parseInt(selectedSubCategory));
    } else {
      setProducts([]);
    }
  }, [selectedSubCategory]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await fetchCategories(COMPANY_ID);
      logger.debug("로드된 전체 카테고리 데이터:", data);
      if (data && data.length > 0) {
        // 목재 관련 카테고리만 필터링 (WOOD로 시작하는 코드)
        const woodCategories = data.filter(cat => 
          cat.code?.startsWith("WOOD_") && !cat.code?.includes("DOOR")
        );
        logger.debug("필터링된 목재 카테고리:", woodCategories);
        if (woodCategories.length > 0) {
          setCategories(woodCategories);
        } else {
          logger.warn("목재 카테고리를 찾을 수 없습니다. 전체 카테고리:", data);
          toast.warning("목재 카테고리 데이터가 없습니다. 관리자에게 문의하세요.");
        }
      } else {
        logger.warn("카테고리 데이터가 비어있습니다.");
        toast.warning("카테고리 데이터가 없습니다.");
      }
    } catch (error: any) {
      logger.error("목재 카테고리 로드 실패:", error);
      toast.error(error.message || "카테고리를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubCategories = async (parentId: number) => {
    try {
      setIsLoading(true);
      const data = await fetchSubCategories(parentId);
      logger.debug("로드된 세부 카테고리 데이터:", data);
      if (data && data.length > 0) {
        setSubCategories(data);
      } else {
        setSubCategories([]);
        // 세부 카테고리가 없으면 메인 카테고리로 제품 로드
        loadProducts(parentId);
      }
    } catch (error: any) {
      logger.error("세부 카테고리 로드 실패:", error);
      setSubCategories([]);
      loadProducts(parentId);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async (categoryId: number) => {
    try {
      setIsLoading(true);
      const data = await fetchProducts(categoryId);
      logger.debug("로드된 제품 데이터:", data);
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts([]);
        toast.warning("해당 카테고리에 등록된 제품이 없습니다.");
      }
    } catch (error: any) {
      logger.error("제품 로드 실패:", error);
      toast.error(error.message || "제품을 불러오는데 실패했습니다.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWoodProductSearch = async () => {
    setWoodSearchLoading(true);
    try {
      const list = await searchProductsForEstimate({
        keyword: woodSearchKeyword.trim() || undefined,
        companyId: COMPANY_ID,
      });
      const woodOnly = list.filter(
        (item) =>
          item.categoryCode?.startsWith("WOOD_") && !item.categoryCode?.includes("DOOR")
      );
      setWoodSearchResults(woodOnly);
    } catch (e: any) {
      toast.error(e.message || "검색 실패");
      setWoodSearchResults([]);
    } finally {
      setWoodSearchLoading(false);
    }
  };

  const handleWoodSearchResultClick = (item: ProductSearchItem) => {
    const mainId = item.parentCategoryId ?? item.categoryId;
    const subId = item.parentCategoryId != null ? item.categoryId : null;
    setSelectedCategory(mainId.toString());
    setSelectedSubCategory(subId != null ? subId.toString() : "");
    setSelectedProduct(item.productId.toString());
    setWoodSearchResults([]);
    setWoodSearchKeyword("");
  };

  const handleCalculate = () => {
    if (!selectedProduct) {
      toast.error("제품을 선택해주세요.");
      return;
    }

    const product = products.find(p => p.id.toString() === selectedProduct);
    if (!product) {
      toast.error("제품을 찾을 수 없습니다.");
      return;
    }

    const categoryName = categories.find(c => c.id.toString() === selectedCategory)?.name || "";
    const subCategoryName = subCategories.find(sc => sc.id.toString() === selectedSubCategory)?.name || categoryName;
    
    const unitPrice = product.basePrice || 0;
    const baseTotal = unitPrice * quantity;
    
    // 마진 적용
    let finalPrice = baseTotal;
    let marginAmount = 0;
    if (margin && margin.trim() !== "") {
      const marginRate = parseFloat(margin) / 100;
      if (!isNaN(marginRate) && marginRate >= 0) {
        marginAmount = Math.round(baseTotal * marginRate);
        finalPrice = baseTotal + marginAmount;
      }
    }

    const estimate: WoodEstimate = {
      productName: product.name,
      categoryName,
      subCategoryName,
      unitPrice,
      quantity,
      totalPrice: baseTotal,
      margin: margin || undefined,
      marginAmount: marginAmount > 0 ? marginAmount : undefined,
      finalPrice,
    };

    setResult(estimate);
    toast.success("견적이 계산되었습니다.");
  };

  const addToCart = () => {
    if (!result) {
      toast.error("견적을 먼저 계산해주세요.");
      return;
    }

    const cartItem: WoodProduct = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: result.productName,
      category: result.categoryName,
      subCategory: result.subCategoryName,
      quantity: result.quantity,
      unitPrice: result.unitPrice,
      totalPrice: result.finalPrice || result.totalPrice,
      margin: result.margin,
      marginAmount: result.marginAmount,
      finalPrice: result.finalPrice,
    };

    addWoodItem(cartItem);

    // 계산 폼 초기화 (마진은 유지)
    setResult(null);
    setSelectedProduct("");
    setQuantity(1);
  };

  const calculateCartTotal = (): number => getCartTotal();

  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* 목재 제품 검색 - 카테고리 선택 위 */}
      <Card className="p-4 rounded-2xl bg-white/80 shadow-md">
        <div className="flex flex-wrap gap-2 items-center">
          <Search className="w-5 h-5 text-indigo-600" />
          <Input
            placeholder="목재 제품명으로 검색..."
            value={woodSearchKeyword}
            onChange={(e) => setWoodSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleWoodProductSearch()}
            className="max-w-xs"
          />
          <Button onClick={handleWoodProductSearch} disabled={woodSearchLoading} size="sm">
            {woodSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
            검색
          </Button>
        </div>
        {woodSearchResults.length > 0 && (
          <ul className="mt-3 border-t pt-3 space-y-1 max-h-48 overflow-y-auto">
            {woodSearchResults.map((item) => (
              <li key={`${item.productId}-${item.categoryId}`}>
                <button
                  type="button"
                  onClick={() => handleWoodSearchResultClick(item)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-sm flex flex-col gap-0.5"
                >
                  <span className="font-medium">{item.productName}</span>
                  <span className="text-gray-500 text-xs">
                    {[item.companyName, item.categoryName, item.size].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

    <div className="grid lg:grid-cols-3 gap-6">
      {/* 좌측: 카테고리 및 제품 선택 */}
      <Card className="lg:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 shadow-xl shadow-indigo-500/5">
        <h3 className="mb-8 flex items-center gap-3 text-2xl font-bold">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-gray-900 via-indigo-700 to-gray-900 bg-clip-text text-transparent">
            목재 자재 선택
          </span>
        </h3>

        <div className="space-y-6">
          {/* 카테고리 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>메인 카테고리</Label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSubCategory("");
                  setProducts([]);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                <option value="">카테고리 선택</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 세부 카테고리 선택 */}
            {selectedCategory && (
              <div className="space-y-2">
                <Label>세부 카테고리</Label>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => {
                    setSelectedSubCategory(e.target.value);
                    setProducts([]);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={!selectedCategory || isLoading}
                >
                  <option value="">세부 카테고리 선택</option>
                  {subCategories.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id.toString()}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 검색 */}
          {products.length > 0 && (
            <div className="space-y-2">
              <Label>제품 검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="제품명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50 border-gray-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 제품 목록 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className={`p-4 border transition-all cursor-pointer ${
                      selectedProduct === product.id.toString()
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-200 hover:border-indigo-300 bg-white"
                    }`}
                    onClick={() => setSelectedProduct(product.id.toString())}
                  >
                    <div className="space-y-2">
                      {product.companyName && (
                        <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">{product.companyName}</p>
                      )}
                      <h4 className="font-semibold text-lg">{product.name}</h4>
                      {(product.size || product.description) && (
                        <p className="text-sm text-gray-600">
                          {[product.size, product.description].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-indigo-700 font-bold text-lg">
                          {product.basePrice?.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : selectedCategory ? (
            <div className="text-center py-20 text-gray-400">
              <p>제품이 없습니다.</p>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p>카테고리를 선택해주세요.</p>
            </div>
          )}

          {/* 수량 및 마진 입력 */}
          {selectedProduct && (
            <>
              {/* 회사 마진 입력 */}
              <div className="space-y-2 p-4 bg-indigo-50 rounded-xl">
                <Label className="text-base font-semibold text-blue-900">회사 마진 설정</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="예: 10 (10% 마진)"
                    value={margin}
                    onChange={(e) => {
                      const value = e.target.value;
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
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 h-12 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl font-semibold"
                  onClick={handleCalculate}
                  disabled={isLoading || !selectedProduct}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Calculator className="w-4 h-4 mr-2" />
                  )}
                  견적 산출하기
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 우측: 예상 견적서 및 장바구니 */}
      <div className="space-y-6">
        {/* 현재 계산된 견적 */}
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50/50 sticky top-4 rounded-3xl shadow-xl shadow-indigo-500/5">
          <CardHeader className="pb-4 border-b border-gray-200">
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
                  제품을 선택하고
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
                    <div className="text-xs text-gray-500">
                      {result.categoryName}
                      {result.subCategoryName && ` > ${result.subCategoryName}`}
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>단가</span>
                    <span>{result.unitPrice.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>수량</span>
                    <span>{result.quantity}개</span>
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-gray-400 mt-4 space-y-2">
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
                className="flex-1 bg-gradient-to-r from-pastel-600 to-pastel-700 hover:from-pastel-700 hover:to-pastel-800 text-black shadow-lg shadow-pastel-600/30 hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl font-semibold"
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
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
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
                                    <div className="text-xs text-gray-500 mt-1">
                                      {entry.item.categoryName}
                                      {entry.item.subCategoryName && ` > ${entry.item.subCategoryName}`}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="font-medium text-base">{entry.item.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {entry.item.category}
                                    {entry.item.subCategory !== entry.item.category && ` > ${entry.item.subCategory}`}
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
                                {entry.item.margin && entry.item.marginAmount && (
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
                </ScrollArea>

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
                  onClick={clearCart}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  장바구니 비우기
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => generatePDF()}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF로 변환
                </Button>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-pastel-600 to-pastel-700 hover:from-pastel-700 hover:to-pastel-800 text-white shadow-lg shadow-pastel-600/30 hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl font-semibold h-12"
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
