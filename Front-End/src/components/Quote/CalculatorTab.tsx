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
import { Calculator, ShoppingCart, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchCategories,
  fetchProducts,
  fetchOptions,
  calculateEstimate,
  type Category,
  type Product,
  type Option,
  type EstimateResponse,
} from "../../api/estimateApi";

const COMPANY_ID = 1; // 쉐누

export function CalculatorTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [specName, setSpecName] = useState<string>("");
  const [typeName, setTypeName] = useState<string>("일반형 3방");
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [result, setResult] = useState<EstimateResponse | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    loadCategories();
  }, []);

  // 카테고리 선택 시 제품 및 옵션 로드
  useEffect(() => {
    if (selectedCategory) {
      loadProducts(parseInt(selectedCategory));
      loadOptions(parseInt(selectedCategory));
    } else {
      setProducts([]);
      setOptions([]);
    }
  }, [selectedCategory]);

  // 카테고리 변경 시 리셋
  useEffect(() => {
    setSelectedProduct("");
    setSelectedOptions([]);
    setResult(null);
    setWidth("");
    setHeight("");
    setSpecName("");
    setTypeName("일반형 3방");
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      setIsLoadingData(true);
      const data = await fetchCategories(COMPANY_ID);
      console.log("로드된 카테고리 데이터:", data);
      console.log("카테고리 개수:", data.length);
      if (data && data.length > 0) {
        setCategories(data);
        console.log("카테고리 상태 업데이트 완료");
      } else {
        console.warn("카테고리 데이터가 비어있습니다.");
        toast.warning("카테고리 데이터가 없습니다.");
      }
    } catch (error: any) {
      console.error("카테고리 로드 실패:", error);
      const errorMessage = error.message || "카테고리를 불러오는데 실패했습니다.";
      toast.error(errorMessage);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadProducts = async (categoryId: number) => {
    try {
      setIsLoadingData(true);
      const data = await fetchProducts(categoryId);
      setProducts(data);
    } catch (error: any) {
      console.error("제품 로드 실패:", error);
      const errorMessage = error.message || "제품을 불러오는데 실패했습니다.";
      toast.error(errorMessage);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadOptions = async (categoryId: number) => {
    try {
      setIsLoadingData(true);
      const data = await fetchOptions(categoryId, COMPANY_ID);
      setOptions(data);
    } catch (error: any) {
      console.error("옵션 로드 실패:", error);
      const errorMessage = error.message || "옵션을 불러오는데 실패했습니다.";
      toast.error(errorMessage);
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

  const handleCalculate = async () => {
    if (!selectedProduct) {
      toast.error("제품을 선택해주세요.");
      return;
    }

    const selectedCategoryObj = categories.find(
      (c) => c.id.toString() === selectedCategory
    );
    const categoryCode = selectedCategoryObj?.code;

    setIsLoading(true);

    try {
      const request = {
        companyId: COMPANY_ID,
        productId: parseInt(selectedProduct),
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
            }
          : {}),
      };

      const response = await calculateEstimate(request);
      setResult(response);
      toast.success("견적이 계산되었습니다.");
    } catch (error: any) {
      console.error("견적 계산 오류:", error);
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
      <Card className="lg:col-span-2 p-6">
        <h3 className="mb-6 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-600" />
          상세 견적 계산기 - 쉐누
        </h3>

        <div className="space-y-6">
          {/* Category Select */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select
                onValueChange={setSelectedCategory}
                value={selectedCategory}
                disabled={isLoadingData}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {categories.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      {isLoadingData ? "로딩 중..." : "카테고리가 없습니다"}
                    </div>
                  ) : (
                    categories.map((category) => {
                      console.log("카테고리 렌더링:", category);
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
            <div className="space-y-2">
              <Label>제품명</Label>
              <Select
                onValueChange={setSelectedProduct}
                value={selectedProduct}
                disabled={!selectedCategory || isLoadingData}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="제품명 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3연동 중문: 가로/세로 입력 */}
          {categoryCode === "INTERLOCK" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>가로 폭 (mm)</Label>
                <Input
                  type="number"
                  placeholder="예: 1200"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>세로 높이 (mm)</Label>
                <Input
                  type="number"
                  placeholder="예: 2100"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 문틀: 규격 선택 */}
          {categoryCode === "FRAME" && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
              <Label>문틀 규격 (바 두께)</Label>
              <Select onValueChange={setSpecName} value={specName}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="규격 선택" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="110바">110바</SelectItem>
                  <SelectItem value="130바">130바</SelectItem>
                  <SelectItem value="140바">140바</SelectItem>
                  <SelectItem value="155바">155바</SelectItem>
                  <SelectItem value="175바">175바</SelectItem>
                  <SelectItem value="195바">195바</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2">
                <Label>타입</Label>
                <Select onValueChange={setTypeName} value={typeName}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="타입 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="일반형 3방">일반형 3방</SelectItem>
                    <SelectItem value="일반형 4방">일반형 4방</SelectItem>
                    <SelectItem value="가스켓 3방">가스켓 3방</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* 옵션 선택 */}
          {selectedCategory && options.length > 0 && (
            <div className="space-y-3">
              <Label>추가 옵션</Label>
              <div className="grid grid-cols-2 gap-3">
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50"
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
                      {opt.name} {opt.addPrice > 0 && `(+${opt.addPrice.toLocaleString()}원)`}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 수량 및 계산 버튼 */}
          <div className="flex items-end gap-4">
            <div className="space-y-2 w-24">
              <Label>수량</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-10"
              onClick={handleCalculate}
              disabled={isLoading || !selectedProduct || isLoadingData}
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
        <Card className="p-6 border-blue-200 bg-blue-50/50 sticky top-4">
          <CardHeader className="pb-4 border-b border-blue-100">
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
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
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
                  <div className="flex justify-between text-gray-600">
                    <span>기본 단가</span>
                    <span>{result.unitPrice.toLocaleString()}원</span>
                  </div>
                  {result.optionPrice > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>추가 옵션 합계</span>
                      <span>+ {result.optionPrice.toLocaleString()}원</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>수량</span>
                    <span>{result.quantity}개</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-200 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">
                      총 예상 금액
                    </span>
                    <span className="text-2xl font-bold text-blue-700">
                      {result.totalPrice.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
          {result && (
            <CardFooter className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setResult(null)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                초기화
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
