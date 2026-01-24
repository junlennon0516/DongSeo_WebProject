# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# Spring Boot에서 보낼 데이터 형식 정의 (DTO 역할)
class UserRequest(BaseModel):
    text: str  # 예: "ABS 도어 5개랑 3연동 중문 1300 사이즈 견적 내줘"

# AI가 분석해서 돌려줄 데이터 형식 정의
class ExtractedItem(BaseModel):
    product_name: str
    spec: str
    quantity: int
    options: List[str] = []

@app.post("/analyze")
async def analyze_estimate(request: UserRequest):
    print(f"Spring Boot로부터 받은 요청: {request.text}")
    
    # --- 여기에서 나중에 LLM(ChatGPT)을 호출할 예정입니다 ---
    # 지금은 테스트를 위해 가짜(Dummy) 데이터를 리턴합니다.
    
    dummy_result = [
        ExtractedItem(product_name="ABS 민자 도어", spec="기본", quantity=5, options=["문틀포함"]),
        ExtractedItem(product_name="목재 3연동 중문", spec="1300*2100", quantity=1, options=["망입유리"])
    ]
    
    return {"items": dummy_result}

# 터미널 실행 명령어: uvicorn main:app --reload --port 8000