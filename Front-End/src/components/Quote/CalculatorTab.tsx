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
  fetchSubCategories,
  fetchProducts,
  fetchOptions,
  fetchVariants,
  calculateEstimate,
  type Category,
  type Product,
  type Option,
  type ProductVariant,
  type EstimateResponse,
} from "../../api/estimateApi";

const COMPANY_ID = 1; // 쉐누

export function CalculatorTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
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
      console.log("로드된 메인 카테고리 데이터:", data);
      console.log("메인 카테고리 개수:", data.length);
      if (data && data.length > 0) {
        setCategories(data);
        console.log("메인 카테고리 상태 업데이트 완료");
      } else {
        console.warn("메인 카테고리 데이터가 비어있습니다.");
        toast.warning("메인 카테고리 데이터가 없습니다.");
      }
    } catch (error: any) {
      console.error("메인 카테고리 로드 실패:", error);
      const errorMessage = error.message || "메인 카테고리를 불러오는데 실패했습니다.";
      toast.error(errorMessage);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadSubCategories = async (parentId: number) => {
    try {
      setIsLoadingData(true);
      console.log("세부 카테고리 로드 시작 - parentId:", parentId);
      const data = await fetchSubCategories(parentId);
      console.log("로드된 세부 카테고리 데이터:", data);
      console.log("세부 카테고리 개수:", data.length);
      if (data && data.length > 0) {
        setSubCategories(data);
        console.log("세부 카테고리 상태 업데이트 완료");
      } else {
        console.warn("세부 카테고리 데이터가 비어있습니다. 메인 카테고리로 제품 로드 시도");
        setSubCategories([]);
        // 세부 카테고리가 없으면 메인 카테고리로 제품 로드
        loadProducts(parentId);
      }
    } catch (error: any) {
      console.error("세부 카테고리 로드 실패:", error);
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
      console.log("제품 로드 시작 - categoryId:", categoryId);
      const data = await fetchProducts(categoryId);
      console.log("로드된 제품 데이터:", data);
      console.log("제품 개수:", data.length);
      if (data && data.length > 0) {
        // 중복 제거: id 기준으로 중복 제거
        const uniqueProducts = Array.from(
          new Map(data.map((product) => [product.id, product])).values()
        );
        console.log("중복 제거 후 제품 개수:", uniqueProducts.length);
        setProducts(uniqueProducts);
        console.log("제품 상태 업데이트 완료");
      } else {
        console.warn("제품 데이터가 비어있습니다.");
        setProducts([]);
        toast.warning("해당 카테고리에 등록된 제품이 없습니다.");
      }
    } catch (error: any) {
      console.error("제품 로드 실패:", error);
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
      console.log("옵션 로드 시작 - productId:", productId, "companyId:", COMPANY_ID);
      const data = await fetchOptions(productId, COMPANY_ID);
      console.log("로드된 옵션 데이터:", data);
      console.log("옵션 개수:", data.length);
      if (data && data.length > 0) {
        setOptions(data);
        console.log("옵션 상태 업데이트 완료");
      } else {
        console.warn("옵션 데이터가 비어있습니다.");
        setOptions([]);
        // 옵션이 없어도 경고는 표시하지 않음 (옵션이 없는 제품도 있을 수 있음)
      }
    } catch (error: any) {
      console.error("옵션 로드 실패:", error);
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
      console.log("Variants 로드 시작 - productId:", productId);
      const data = await fetchVariants(productId);
      console.log("로드된 variants 데이터:", data);
      console.log("Variants 개수:", data.length);
      if (data && data.length > 0) {
        setVariants(data);
        console.log("Variants 상태 업데이트 완료");
      } else {
        console.warn("Variants 데이터가 비어있습니다.");
        setVariants([]);
      }
    } catch (error: any) {
      console.error("Variants 로드 실패:", error);
      // Variants가 없어도 경고는 표시하지 않음 (variants가 없는 제품도 있을 수 있음)
      setVariants([]);
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

    setIsLoading(true);

    try {
      const selectedProductObj = products.find(
        (p) => p.id.toString() === selectedProduct
      );
      const isWoodFrame = selectedProductObj?.name?.includes("목재문틀");
      
      // 간살 목창호인 경우 타입 선택 시 제품이 자동 선택되므로, 제품이 없으면 타입으로 찾기
      let productIdToUse = selectedProduct ? parseInt(selectedProduct) : null;
      if (isGansalWindow && !productIdToUse && typeName) {
        const matchedProduct = products.find((p) => 
          p.name?.includes(typeName)
        );
        if (matchedProduct) {
          productIdToUse = matchedProduct.id;
        }
      }
      
      if (!productIdToUse) {
        toast.error("제품을 찾을 수 없습니다.");
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
              // 목재문틀인 경우 가로/세로도 전달
              ...(isWoodFrame && width && height
                ? {
                    width: parseInt(width),
                    height: parseInt(height),
                  }
                : {}),
            }
          : {}),
        ...((categoryCode === "MOLDING" || categoryCode === "FILM") && specName && typeName
          ? {
              specName: specName,
              typeName: typeName,
            }
          : {}),
        ...(categoryCode === "WINDOW" && width && typeName
          ? {
              width: parseInt(width),
              height: height ? parseInt(height) : undefined,
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
          {/* 메인 카테고리 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>메인 카테고리</Label>
              <Select
                onValueChange={setSelectedCategory}
                value={selectedCategory}
                disabled={isLoadingData}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="메인 카테고리 선택" />
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
            {/* 세부 카테고리 선택 (세부 카테고리가 있는 경우) */}
            {selectedCategory && subCategories.length > 0 && (
              <div className="space-y-2">
                <Label>세부 카테고리</Label>
                <Select
                  onValueChange={setSelectedSubCategory}
                  value={selectedSubCategory}
                  disabled={!selectedCategory || isLoadingData}
                >
                  <SelectTrigger className="bg-white">
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
                  <SelectTrigger className="bg-white">
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
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.description || product.name}
                          </SelectItem>
                        ))
                      )}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}

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
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>가로 폭 (mm)</Label>
                      <Input
                        type="number"
                        placeholder="예: 900"
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
                  <div className="space-y-2">
                    <Label>규격</Label>
                    <Select onValueChange={setSpecName} value={specName}>
                      <SelectTrigger className="bg-white">
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
                      <SelectTrigger className="bg-white">
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
            
            // PVC 발포문틀, 슬림문틀인 경우: 기존 UI
            return (
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
                    <SelectItem value="210바">210바</SelectItem>
                    <SelectItem value="230바">230바</SelectItem>
                    {/* 슬림문틀인 경우 245바 제외 */}
                    {!isSlimFrame && <SelectItem value="245바">245바</SelectItem>}
                  </SelectContent>
                </Select>
                {/* 슬림문틀인 경우 타입 선택 UI 숨김 */}
                {!isSlimFrame && (
                  <div className="mt-2">
                    <Label>타입</Label>
                    <Select onValueChange={setTypeName} value={typeName}>
                      <SelectTrigger className="bg-white">
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
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>타입 (type_name)</Label>
                <Select onValueChange={(value) => {
                  setTypeName(value);
                  // 타입 변경 시 규격 초기화
                  const firstSpec = variants.find(v => v.typeName === value)?.specName;
                  setSpecName(firstSpec || "");
                }} value={typeName}>
                  <SelectTrigger className="bg-white">
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
                    <SelectTrigger className="bg-white">
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
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
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
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>타입</Label>
                    <Select 
                      onValueChange={(value) => {
                        setTypeName(value);
                        // 간살 목창호인 경우 타입 선택 시 해당 타입의 제품 자동 선택
                        if (isGansalWindow && products.length > 0) {
                          const matchedProduct = products.find((p) => 
                            p.name?.includes(value)
                          );
                          if (matchedProduct) {
                            setSelectedProduct(matchedProduct.id.toString());
                          }
                        }
                      }} 
                      value={typeName}
                    >
                      <SelectTrigger className="bg-white">
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
                </div>
              );
            }
            return null;
          })()}

          {/* 필름: 규격 선택 시 타입 자동 결정 */}
          {categoryCode === "FILM" && selectedProduct && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
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
                  <SelectTrigger className="bg-white">
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
                <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                  <div className="text-sm text-gray-700">
                    <div className="font-medium mb-1">선택된 정보:</div>
                    <div>규격: <span className="font-semibold">{specName}</span></div>
                    <div>타입: <span className="font-semibold">{typeName}</span></div>
                    {variants.find(v => v.specName === specName && v.typeName === typeName) && (
                      <div className="mt-1 text-blue-600">
                        단가: {variants.find(v => v.specName === specName && v.typeName === typeName)?.price.toLocaleString()}원
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 옵션 선택 (간살 목창호 제외) */}
          {(() => {
            const subCategoryObj = subCategories.find(
              (sc) => sc.id.toString() === selectedSubCategory
            );
            const isGansalWindow = subCategoryObj?.name === "간살 목창호";
            
            // 간살 목창호는 옵션 표시 안 함
            if (isGansalWindow) {
              return false;
            }
            
            return selectedProduct && options.length > 0;
          })() && (
            <div className="space-y-3">
              <Label>추가 옵션</Label>
              <div className="grid grid-cols-2 gap-3">
                {options
                  .sort((a, b) => a.id - b.id) // id 순서로 정렬
                  .map((opt) => (
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
              disabled={(() => {
                const subCategoryObj = subCategories.find(
                  (sc) => sc.id.toString() === selectedSubCategory
                );
                const isGansalWindow = subCategoryObj?.name === "간살 목창호";
                
                if (isLoading || isLoadingData) return true;
                if (isGansalWindow) {
                  // 간살 목창호는 타입과 가로폭이 필수
                  return !typeName || !width;
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
                  {result.optionPrice !== 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>추가 옵션 합계</span>
                      <span>
                        {result.optionPrice > 0 ? '+' : ''} {result.optionPrice.toLocaleString()}원
                      </span>
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
