from pathlib import Path

from google import genai
from dotenv import load_dotenv

# 스크립트 파일과 같은 폴더의 .env 로드 (실행 위치와 무관)
load_dotenv(Path(__file__).resolve().parent / ".env")

# 자동으로 환경 변수(GOOGLE_API_KEY)를 찾음
client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash-lite",
    contents="인테리어 견적서 작성 방법 알려줘.",
)

print(response.text)