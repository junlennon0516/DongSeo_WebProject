import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { Plus, Loader2, Package } from "lucide-react";
import {
  fetchCategories,
  fetchSubCategories,
  type Category,
} from "../../api/estimateApi";
import {
  fetchAdminCompanies,
  createAdminCompany,
  createAdminCategory,
  createAdminProduct,
  type CompanyDto,
  type AdminProductCreateRequest,
} from "../../api/adminApi";

export function ProductManage() {
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [noAccess, setNoAccess] = useState(false);

  // 추가 폼 (선택 or 직접 입력)
  const [companyId, setCompanyId] = useState<string>("");
  const [companyDisplay, setCompanyDisplay] = useState("");
  const [mainCategoryId, setMainCategoryId] = useState<string>("");
  const [mainCategoryDisplay, setMainCategoryDisplay] = useState("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [subCategoryDisplay, setSubCategoryDisplay] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");  // 목재 합판 규격 (예: 1220 × 2440mm)
  const [basePrice, setBasePrice] = useState("");
  const [specName, setSpecName] = useState("");
  const [typeName, setTypeName] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchAdminCompanies()
      .then(setCompanies)
      .catch((e) => {
        if (e.message === "권한이 없습니다.") setNoAccess(true);
        else toast.error(e.message);
      });
  }, []);

  useEffect(() => {
    if (!companyId) {
      setMainCategories([]);
      setMainCategoryId("");
      setMainCategoryDisplay("");
      setSubCategoryId("");
      setSubCategoryDisplay("");
      setSubCategories([]);
      return;
    }
    fetchCategories(Number(companyId))
      .then(setMainCategories)
      .catch(() => setMainCategories([]));
    setMainCategoryId("");
    setMainCategoryDisplay("");
    setSubCategoryId("");
    setSubCategoryDisplay("");
    setSubCategories([]);
  }, [companyId]);

  useEffect(() => {
    if (!mainCategoryId) {
      setSubCategories([]);
      setSubCategoryId("");
      setSubCategoryDisplay("");
      return;
    }
    fetchSubCategories(Number(mainCategoryId))
      .then(setSubCategories)
      .catch(() => setSubCategories([]));
    setSubCategoryId("");
    setSubCategoryDisplay("");
  }, [mainCategoryId]);

  const handleAdd = async () => {
    const companyText = (companyDisplay || "").trim();
    const mainText = (mainCategoryDisplay || "").trim();
    if (!companyText && !companyId) {
      toast.error("회사를 선택하거나 입력해주세요.");
      return;
    }
    if (!mainText && !mainCategoryId) {
      toast.error("메인 카테고리를 선택하거나 입력해주세요.");
      return;
    }
    if (!name.trim()) {
      toast.error("제품 이름을 입력해주세요.");
      return;
    }
    setAddLoading(true);
    try {
      let resolvedCompanyId: number;
      if (companyId) {
        resolvedCompanyId = Number(companyId);
      } else {
        const created = await createAdminCompany({ name: companyText });
        resolvedCompanyId = created.id;
        setCompanies((prev) => [...prev, { id: created.id, name: created.name, code: created.code }]);
      }

      let resolvedMainCategoryId: number;
      if (mainCategoryId) {
        resolvedMainCategoryId = Number(mainCategoryId);
      } else {
        const created = await createAdminCategory({
          companyId: resolvedCompanyId,
          name: mainText,
          parentId: null,
        });
        resolvedMainCategoryId = created.id;
        setMainCategories((prev) => [...prev, { id: created.id, name: created.name, code: created.code }]);
      }

      let resolvedCategoryId: number;
      const subText = (subCategoryDisplay || "").trim();
      if (subCategoryId) {
        resolvedCategoryId = Number(subCategoryId);
      } else if (subText) {
        const created = await createAdminCategory({
          companyId: resolvedCompanyId,
          name: subText,
          parentId: resolvedMainCategoryId,
        });
        resolvedCategoryId = created.id;
        setSubCategories((prev) => [...prev, { id: created.id, name: created.name, code: created.code }]);
      } else {
        resolvedCategoryId = resolvedMainCategoryId;
      }

      const body: AdminProductCreateRequest = {
        companyId: resolvedCompanyId,
        categoryId: resolvedCategoryId,
        name: name.trim(),
      };
      if (description.trim()) body.description = description.trim();
      if (size.trim()) body.size = size.trim();
      if (basePrice.trim() && !isNaN(Number(basePrice))) body.basePrice = Number(basePrice);
      if (specName.trim() && variantPrice.trim() && !isNaN(Number(variantPrice))) {
        body.specName = specName.trim();
        body.typeName = typeName.trim() || "";
        body.variantPrice = Number(variantPrice);
      }
      await createAdminProduct(body);
      toast.success("제품이 추가되었습니다.");
      setName("");
      setDescription("");
      setSize("");
      setBasePrice("");
      setSpecName("");
      setTypeName("");
      setVariantPrice("");
    } catch (e: any) {
      toast.error(e.message || "추가 실패");
    } finally {
      setAddLoading(false);
    }
  };

  if (noAccess) {
    return (
      <section id="admin-products" className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8">
            <p className="text-center text-gray-600">제품 관리는 직원/관리자 계정으로 로그인한 경우에만 이용할 수 있습니다.</p>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="admin-products" className="py-16 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-700 to-gray-900 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Package className="w-8 h-8 text-indigo-600" />
            제품 관리 (가구·목재 등)
          </h2>
          <p className="text-gray-600 mt-2">제품 추가</p>
        </div>

        {/* 추가 */}
        <Card className="mb-8 p-6 rounded-2xl shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              제품 추가
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>회사 (선택 또는 직접 입력)</Label>
                <div className="relative">
                  <Input
                    value={companyDisplay}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCompanyDisplay(v);
                      const c = companies.find((x) => x.name === v);
                      setCompanyId(c ? String(c.id) : "");
                    }}
                    placeholder="회사명 선택 또는 직접 입력"
                    className="w-full bg-white"
                    list="company-list"
                  />
                  <datalist id="company-list">
                    {companies.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-2">
                <Label>메인 카테고리 (선택 또는 직접 입력)</Label>
                <div className="relative">
                  <Input
                    value={mainCategoryDisplay}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMainCategoryDisplay(v);
                      const c = mainCategories.find((x) => x.name === v);
                      setMainCategoryId(c ? String(c.id) : "");
                    }}
                    placeholder="메인 카테고리 선택 또는 직접 입력"
                    className="w-full bg-white"
                    list="main-cat-list"
                    disabled={!companyId && !companyDisplay.trim()}
                  />
                  <datalist id="main-cat-list">
                    {mainCategories.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>
              {(mainCategoryId || mainCategoryDisplay.trim()) && (
                <div className="space-y-2 md:col-span-2">
                  <Label>세부 카테고리 (선택 또는 직접 입력)</Label>
                  <div className="relative max-w-md">
                    <Input
                      value={subCategoryDisplay}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSubCategoryDisplay(v);
                        const c = subCategories.find((x) => x.name === v);
                        setSubCategoryId(c ? String(c.id) : "");
                      }}
                      placeholder="세부 카테고리 선택 또는 직접 입력 (비워두면 메인만 사용)"
                      className="w-full bg-white"
                      list="sub-cat-list"
                    />
                    <datalist id="sub-cat-list">
                      {subCategories.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>이름 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="제품명" className="max-w-md" />
            </div>
            <div className="space-y-2">
              <Label>규격/비고 (선택)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="예: 110바, PVC" className="max-w-md" />
            </div>
            <div className="space-y-2">
              <Label>규격 size (목재 합판 등, 선택)</Label>
              <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="예: 1220 × 2440mm" className="max-w-md" />
            </div>
            <div className="space-y-2">
              <Label>기본 가격 (선택)</Label>
              <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="숫자만" className="max-w-[200px]" />
            </div>
            <div className="pt-2 border-t space-y-2">
              <Label className="text-sm text-gray-500">규격별 가격 추가 (선택)</Label>
              <div className="flex flex-wrap gap-2 items-end">
                <Input value={specName} onChange={(e) => setSpecName(e.target.value)} placeholder="규격명" className="w-28" />
                <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="타입" className="w-28" />
                <Input type="number" value={variantPrice} onChange={(e) => setVariantPrice(e.target.value)} placeholder="가격" className="w-24" />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={addLoading} className="mt-4">
              {addLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              추가
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
