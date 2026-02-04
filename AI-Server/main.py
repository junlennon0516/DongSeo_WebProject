from pathlib import Path
from google import genai
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os
import pymysql
from pymysql.cursors import DictCursor
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# .env 파일 로드 (ex.py 방식 참고)
load_dotenv(Path(__file__).resolve().parent / ".env")

# ==========================================
# FastAPI 앱 초기화
# ==========================================
app = FastAPI(title="AI Server", description="동서인테리어 AI 상담 서버")

# CORS 설정 (프론트엔드에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용하도록 수정 권장
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. 출력 데이터 구조 정의 (Pydantic)
# ==========================================
class OrderItem(BaseModel):
    product_id: int = Field(description="Database ID of the product")
    company_id: int = Field(description="Company ID (for Backend estimate API)", default=1)
    product_name: str = Field(description="Name of the product")
    width: Optional[int] = Field(description="Width in mm (도어/창호용)", default=0)
    height: Optional[int] = Field(description="Height in mm (도어/창호용)", default=0)
    quantity: int = Field(description="Quantity", default=1)
    unit_price: int = Field(description="Unit price per item", default=0)
    total_price: int = Field(description="Total price (unit_price * quantity)", default=0)
    description: Optional[str] = Field(description="Original user text for this item")

class OrderList(BaseModel):
    items: List[OrderItem]
    total_amount: int = Field(description="Total amount of all items", default=0)

# ==========================================
# API 요청/응답 모델
# ==========================================
class AnalyzeRequest(BaseModel):
    text: str = Field(description="사용자의 자연어 요청")

class ChatMessage(BaseModel):
    role: str = Field(description="메시지 역할: 'user' 또는 'assistant'")
    content: str = Field(description="메시지 내용")

class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(description="대화 히스토리")
    model: Optional[str] = Field(default="gemini-2.5-flash-lite", description="사용할 모델명")
    temperature: Optional[float] = Field(default=0.7, description="창의성 수준 (0.0 ~ 1.0)")
    estimateData: Optional[dict] = Field(default=None, description="견적 분석 결과 데이터 (있는 경우)")

class ChatResponse(BaseModel):
    role: str = Field(default="assistant")
    content: str = Field(description="AI 응답 내용")

# ==========================================
# 2. DB 연결 설정
# ==========================================
def get_db_connection():
    """MySQL 데이터베이스 연결 반환"""
    return pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", "5776"),
        database=os.getenv("DB_NAME", "dongseo"),
        charset="utf8mb4",
        cursorclass=DictCursor
    )

# ==========================================
# 3. DB 검색 함수 (회사·규격·종류 조건 반영)
# ==========================================
def search_products_in_db(user_text: str) -> str:
    """
    사용자 입력에서 키워드를 추출하여 DB에서 제품 검색.
    제품명(name), 회사(company), 규격(size), 카테고리(종류)에서 검색하며,
    company_id를 포함해 Backend 견적 API 호출에 사용할 수 있게 반환.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        keywords = [k.strip() for k in user_text.split() if len(k.strip()) > 1]
        
        base_select = """
            SELECT 
                p.id,
                p.company_id,
                p.name,
                p.base_price,
                p.size,
                c.name as category_name,
                comp.name as company_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN companies comp ON p.company_id = comp.id
        """
        
        if not keywords:
            cursor.execute(base_select + " ORDER BY p.id LIMIT 50")
        else:
            conditions = []
            params = []
            for kw in keywords:
                conditions.append(
                    "(p.name LIKE %s OR comp.name LIKE %s OR p.size LIKE %s "
                    "OR c.name LIKE %s OR (p.description IS NOT NULL AND p.description LIKE %s))"
                )
                like_val = f"%{kw}%"
                params.extend([like_val, like_val, like_val, like_val, like_val])
            where_clause = " AND ".join(conditions)
            cursor.execute(
                base_select + " WHERE " + where_clause + " ORDER BY p.id LIMIT 50",
                params
            )
        
        products = cursor.fetchall()
        cursor.close()
        conn.close()
        
        if not products:
            return "[검색 결과 없음]"
        
        result_lines = []
        for p in products:
            size_str = f", 규격: {p['size']}" if p.get('size') else ""
            result_lines.append(
                f"[ID: {p['id']}] company_id: {p['company_id']} | {p['name']} | "
                f"기본가격: {p['base_price'] or 0:,}원 | 카테고리: {p['category_name']} | "
                f"회사: {p['company_name']}{size_str}"
            )
        return "\n".join(result_lines)
        
    except Exception as e:
        print(f"DB 검색 오류: {e}")
        return "[검색 결과 없음]"

# ==========================================
# 3-2. Backend 견적 계산 API 호출 (계산은 Backend에서 수행)
# ==========================================
def get_backend_base_url() -> str:
    """Backend API 기본 URL (.env BACKEND_URL 또는 기본값)"""
    return os.getenv("BACKEND_URL", "http://localhost:8080").rstrip("/")

def call_backend_estimate(
    company_id: int,
    product_id: int,
    quantity: int,
    width: Optional[int] = None,
    height: Optional[int] = None,
    spec_name: Optional[str] = None,
    type_name: Optional[str] = None,
    option_ids: Optional[List[int]] = None,
) -> Optional[dict]:
    """
    Backend POST /api/estimates/calculate 호출하여 견적 계산.
    성공 시 { productName, unitPrice, optionPrice, quantity, totalPrice } 반환.
    """
    url = f"{get_backend_base_url()}/api/estimates/calculate"
    payload = {
        "companyId": company_id,
        "productId": product_id,
        "quantity": quantity,
    }
    if width is not None and width > 0:
        payload["width"] = width
    if height is not None and height > 0:
        payload["height"] = height
    if spec_name:
        payload["specName"] = spec_name
    if type_name:
        payload["typeName"] = type_name
    if option_ids:
        payload["optionIds"] = option_ids
    try:
        r = requests.post(url, json=payload, timeout=10)
        if r.status_code == 200:
            return r.json()
        return None
    except Exception as e:
        print(f"Backend 견적 API 호출 실패: {e}")
        return None

def get_product_price(product_id: int, width: Optional[int] = None, height: Optional[int] = None) -> int:
    """
    제품의 가격을 계산
    1. price_matrix에서 크기별 가격 확인
    2. product_variants에서 규격별 가격 확인
    3. 없으면 base_price 반환
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. price_matrix에서 크기별 가격 확인
        if width and height:
            query = """
                SELECT price 
                FROM price_matrix 
                WHERE product_id = %s 
                  AND max_width >= %s 
                  AND max_height >= %s
                ORDER BY max_width ASC, max_height ASC
                LIMIT 1
            """
            cursor.execute(query, (product_id, width, height))
            matrix_price = cursor.fetchone()
            if matrix_price:
                cursor.close()
                conn.close()
                return matrix_price['price']
        
        # 2. product_variants에서 가격 확인 (규격별)
        query = """
            SELECT price 
            FROM product_variants 
            WHERE product_id = %s
            LIMIT 1
        """
        cursor.execute(query, (product_id,))
        variant_price = cursor.fetchone()
        if variant_price:
            cursor.close()
            conn.close()
            return variant_price['price']
        
        # 3. base_price 반환
        query = "SELECT base_price FROM products WHERE id = %s"
        cursor.execute(query, (product_id,))
        product = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if product:
            return product['base_price'] or 0
        
        return 0
        
    except Exception as e:
        print(f"가격 조회 오류 (product_id={product_id}): {e}")
        return 0

# ==========================================
# 4. LLM 클라이언트 초기화 (ex.py 방식 참고)
# ==========================================
client = genai.Client()

# ==========================================
# 5. 프롬프트 템플릿 (프롬프트 엔지니어링: 회사·규격·종류 조건 매칭)
# ==========================================
def build_system_prompt(context: str) -> str:
    """
    시스템 프롬프트: 가구/목재 등 조건(회사, 규격, 종류)을 입력받아
    DB 제품 목록에서 맞는 항목을 찾고, Backend에서 계산하도록 항목만 추출.
    """
    return f"""너는 가구·목재·도어 등 건축 자재 견적을 위한 **데이터 추출 전문가**야.

[가능한 제품 목록] (각 줄: ID, company_id, 제품명, 가격, 카테고리, 회사, 규격)
{context}

[너의 역할]
1. 사용자 요청에서 **회사(업체명)**, **규격(size, 예: 4*8*11.5, 3*6*9.5)**, **종류(합판/MDF/석고보드/도어 등)**, **수량**을 추출해.
2. 위 목록에서 그 조건에 맞는 제품을 **정확히 하나씩** 골라 매칭해. 회사명·규격·제품명이 일치하는 것을 골라.
3. 목재/합판/석고보드처럼 크기(가로세로)가 없으면 width, height는 0으로 둬.
4. 도어/문틀/창호처럼 "900 x 2100" 등 크기가 있으면 mm 단위로 width, height에 넣어.
5. **반드시** 각 항목에 목록에 나온 **company_id**를 그대로 넣어. (Backend 견적 계산에 필요)
6. unit_price와 total_price는 0으로 설정해. (Backend에서 계산함)
7. 응답은 **반드시 아래 JSON 형식만** 출력해. 다른 설명·마크다운 없이 순수 JSON만.

[출력 형식]
{{
  "items": [
    {{
      "product_id": 123,
      "company_id": 2,
      "product_name": "합판 (4*8*11.5)",
      "width": 0,
      "height": 0,
      "quantity": 10,
      "unit_price": 0,
      "total_price": 0,
      "description": "원우드 합판 4*8*11.5 10장"
    }}
  ]
}}
"""

def build_user_prompt(user_input: str) -> str:
    """
    사용자 프롬프트 생성 함수
    필요시 사용자 입력 전처리나 포맷팅을 여기서 할 수 있습니다.
    """
    return user_input

# ==========================================
# 6. LLM 호출 함수
# ==========================================
def call_llm(system_prompt: str, user_prompt: str, model: str = "gemini-2.5-flash-lite", temperature: float = 0.0) -> str:
    """
    Google Gemini API를 직접 호출하는 함수
    
    Args:
        system_prompt: 시스템 프롬프트
        user_prompt: 사용자 입력
        model: 사용할 모델명 (기본값: gemini-2.5-flash-lite)
        temperature: 창의성 수준 (0.0 ~ 1.0, 기본값: 0.0)
    
    Returns:
        LLM 응답 텍스트
    """
    try:
        response = client.models.generate_content(
            model=model,
            contents=[
                {"role": "user", "parts": [{"text": f"{system_prompt}\n\n사용자 요청: {user_prompt}"}]}
            ],
            config={
                "temperature": temperature,
            }
        )
        return response.text
    except Exception as e:
        raise Exception(f"LLM 호출 실패: {str(e)}")

# ==========================================
# 7. JSON 파싱 및 검증
# ==========================================
def parse_llm_response(response_text: str) -> OrderList:
    """
    LLM 응답을 파싱하여 OrderList 객체로 변환
    
    Args:
        response_text: LLM이 반환한 텍스트
    
    Returns:
        OrderList 객체
    """
    # JSON 코드 블록 제거 (```json ... ``` 형태)
    text = response_text.strip()
    if text.startswith("```json"):
        text = text[7:]  # ```json 제거
    if text.startswith("```"):
        text = text[3:]  # ``` 제거
    if text.endswith("```"):
        text = text[:-3]  # ``` 제거
    text = text.strip()
    
    try:
        data = json.loads(text)
        return OrderList(**data)
    except json.JSONDecodeError as e:
        raise Exception(f"JSON 파싱 실패: {str(e)}\n응답 텍스트: {response_text}")
    except Exception as e:
        raise Exception(f"데이터 검증 실패: {str(e)}")

# ==========================================
# 8. 메인 처리 함수 (API 엔드포인트에서 호출될 함수)
# ==========================================
def process_user_query(
    user_text: str,
    model: str = "gemini-2.5-flash-lite",
    temperature: float = 0.0
) -> dict:
    """
    사용자 쿼리를 처리하여 주문 항목 리스트와 가격을 반환
    
    Args:
        user_text: 사용자 입력 텍스트
        model: 사용할 모델명
        temperature: 창의성 수준
    
    Returns:
        JSON 형식의 주문 항목 리스트와 총 가격
    """
    # 1. 관련 제품 검색 (Context 확보)
    context_data = search_products_in_db(user_text)
    
    # 2. 프롬프트 생성
    system_prompt = build_system_prompt(context_data)
    user_prompt = build_user_prompt(user_text)
    
    # 3. LLM 호출
    llm_response = call_llm(system_prompt, user_prompt, model, temperature)
    
    # 4. 응답 파싱 및 검증
    result = parse_llm_response(llm_response)
    
    # 5. 가격 계산: Backend API 우선 호출, 실패 시 DB 직접 조회
    total_amount = 0
    for item in result.items:
        company_id = getattr(item, "company_id", None) or 1
        resp = call_backend_estimate(
            company_id=company_id,
            product_id=item.product_id,
            quantity=item.quantity,
            width=item.width if item.width else None,
            height=item.height if item.height else None,
        )
        if resp and "unitPrice" in resp and "totalPrice" in resp:
            item.unit_price = resp.get("unitPrice", 0)
            item.total_price = resp.get("totalPrice", 0)
        else:
            unit_price = get_product_price(item.product_id, item.width, item.height)
            item.unit_price = unit_price
            item.total_price = unit_price * item.quantity
        total_amount += item.total_price
    
    result.total_amount = total_amount
    
    # 6. JSON으로 변환하여 반환
    return result.model_dump()

# ==========================================
# 채팅용 프롬프트 생성 함수
# ==========================================
def build_chat_system_prompt(estimate_data: Optional[dict] = None) -> str:
    """
    채팅 상담용 시스템 프롬프트
    
    Args:
        estimate_data: 견적 분석 결과 데이터 (있는 경우)
    """
    base_prompt = """당신은 동서인테리어의 전문 상담사입니다. 창호, 도어, 중문, 가구, 목재(합판/MDF/석고보드 등) 견적 상담을 제공합니다.

친절하고 전문적으로 답변하며, 고객의 요구사항을 정확히 파악하여 적절한 견적을 제시하세요.
견적 요청 시 **회사(업체명)**, **제품 종류**(합판, MDF, 석고보드, 도어 등), **규격**(예: 4*8*11.5, 3*6*9.5), **수량**을 알려주시면 DB에서 맞는 제품을 찾아 Backend에서 계산한 정확한 가격을 안내합니다.
도어/창호는 가로×세로(mm)와 수량을 명확히 안내해주세요.

중요한 원칙:
1. 항상 정확한 가격 정보를 제공하세요.
2. 견적 데이터가 제공되면 반드시 그 정보를 활용하여 답변하세요.
3. 가격은 원화(원) 단위로 표시하고, 천 단위 구분 기호(쉼표)를 사용하세요.
4. 총 견적 금액을 명확히 제시하세요."""
    
    if estimate_data and estimate_data.get("items"):
        items = estimate_data["items"]
        total_amount = estimate_data.get("total_amount", 0)
        
        estimate_info = "\n\n[현재 분석된 견적 정보]\n"
        for item in items:
            product_name = item.get("product_name", "제품")
            width = item.get("width", 0)
            height = item.get("height", 0)
            quantity = item.get("quantity", 1)
            unit_price = item.get("unit_price", 0)
            total_price = item.get("total_price", 0)
            
            size_info = f"{width} x {height}mm" if width and height else "기본 규격"
            estimate_info += f"- {product_name} ({size_info}) × {quantity}개\n"
            estimate_info += f"  단가: {unit_price:,}원, 소계: {total_price:,}원\n"
        
        estimate_info += f"\n총 견적 금액: {total_amount:,}원\n"
        estimate_info += "\n위 견적 정보를 바탕으로 고객에게 친절하고 상세하게 설명해주세요."
        
        return base_prompt + estimate_info
    
    return base_prompt

def call_chat_llm(messages: List[dict], model: str = "gemini-2.5-flash-lite", temperature: float = 0.7, estimate_data: Optional[dict] = None) -> str:
    """
    채팅용 LLM 호출 함수
    
    Args:
        messages: 대화 히스토리 (role, content 포함)
        model: 사용할 모델명
        temperature: 창의성 수준
        estimate_data: 견적 분석 결과 데이터 (있는 경우)
    
    Returns:
        LLM 응답 텍스트
    """
    try:
        # 시스템 프롬프트 생성 (견적 데이터 포함)
        system_prompt = build_chat_system_prompt(estimate_data)
        
        # 시스템 프롬프트를 첫 번째 메시지로 추가
        formatted_messages = [
            {"role": "user", "parts": [{"text": system_prompt}]}
        ]
        
        # 사용자 메시지들을 추가
        for msg in messages:
            if msg["role"] == "user":
                formatted_messages.append({
                    "role": "user",
                    "parts": [{"text": msg["content"]}]
                })
            elif msg["role"] == "assistant":
                formatted_messages.append({
                    "role": "model",
                    "parts": [{"text": msg["content"]}]
                })
        
        response = client.models.generate_content(
            model=model,
            contents=formatted_messages,
            config={
                "temperature": temperature,
            }
        )
        return response.text
    except Exception as e:
        raise Exception(f"LLM 호출 실패: {str(e)}")

# ==========================================
# FastAPI 엔드포인트
# ==========================================
@app.get("/")
async def root():
    """헬스 체크 엔드포인트"""
    return {"status": "ok", "message": "AI Server is running"}

@app.post("/analyze", response_model=dict)
async def analyze_estimate(request: AnalyzeRequest):
    """
    사용자의 자연어 요청을 분석하여 견적 정보를 추출합니다.
    """
    try:
        result = process_user_query(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"견적 분석 실패: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI 채팅 상담 엔드포인트
    대화 히스토리를 받아서 AI 응답을 생성합니다.
    견적 데이터가 제공되면 가격 정보를 포함하여 답변합니다.
    """
    try:
        # 메시지 리스트를 딕셔너리 형태로 변환
        messages_dict = [
            {"role": msg.role, "content": msg.content}
            for msg in request.messages
        ]
        
        # LLM 호출 (견적 데이터 포함)
        response_text = call_chat_llm(
            messages_dict,
            model=request.model,
            temperature=request.temperature,
            estimate_data=request.estimateData
        )
        
        return ChatResponse(
            role="assistant",
            content=response_text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채팅 처리 실패: {str(e)}")

# ==========================================
# 테스트 (로컬 실행용)
# ==========================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)