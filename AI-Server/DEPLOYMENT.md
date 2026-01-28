# AI-Server 배포 가이드

## 📋 개요

AI-Server는 Python FastAPI 기반 서버로, EC2에 배포하여 운영합니다.
- **포트**: 8000
- **프레임워크**: FastAPI + Uvicorn
- **LLM**: Google Gemini API

## 🚀 배포 전 준비사항

### 1. EC2 서버 접속
```bash
ssh -i your-key.pem ubuntu@54.66.24.197
```

### 2. Python 3.9+ 설치 확인
```bash
python3 --version
# Python 3.9 이상이어야 함
```

Python이 없거나 버전이 낮으면:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3.9 python3.9-venv python3-pip -y
```

### 3. 프로젝트 파일 업로드

#### 방법 1: Git 사용 (권장)
```bash
# EC2에서 프로젝트 클론
cd /home/ubuntu
git clone <your-repo-url>
cd DongSeo_WebProject/AI-Server
```

#### 방법 2: SCP로 파일 전송
```bash
# 로컬에서 실행
scp -i your-key.pem -r AI-Server ubuntu@54.66.24.197:/home/ubuntu/
```

## 📦 배포 단계

### 1. 가상환경 생성 및 활성화
```bash
cd /home/ubuntu/DongSeo_WebProject/AI-Server
python3 -m venv venv
source venv/bin/activate
```

### 2. 패키지 설치
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일 생성:
```bash
nano .env
```

다음 내용 추가:
```env
# Google Gemini API 키
GOOGLE_API_KEY=your_google_api_key_here

# 데이터베이스 연결 정보 (Back-End와 동일한 DB 사용)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=dongseo
```

**중요**: `.env` 파일은 Git에 커밋하지 마세요!

### 4. 서버 실행 테스트

먼저 수동으로 실행하여 테스트:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

다른 터미널에서 테스트:
```bash
curl http://localhost:8000/
# {"status":"ok","message":"AI Server is running"}

curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"안녕하세요"}],"model":"gemini-2.5-flash-lite"}'
```

정상 작동하면 `Ctrl+C`로 중지합니다.

## 🔄 시스템 서비스로 등록 (systemd)

### 1. systemd 서비스 파일 생성
```bash
sudo nano /etc/systemd/system/ai-server.service
```

다음 내용 추가:
```ini
[Unit]
Description=AI Server (FastAPI)
After=network.target mysql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/DongSeo_WebProject/AI-Server
Environment="PATH=/home/ubuntu/DongSeo_WebProject/AI-Server/venv/bin"
ExecStart=/home/ubuntu/DongSeo_WebProject/AI-Server/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. 서비스 활성화 및 시작
```bash
# systemd 재로드
sudo systemctl daemon-reload

# 서비스 시작
sudo systemctl start ai-server

# 부팅 시 자동 시작 설정
sudo systemctl enable ai-server

# 상태 확인
sudo systemctl status ai-server
```

### 3. 로그 확인
```bash
# 실시간 로그 확인
sudo journalctl -u ai-server -f

# 최근 로그 확인
sudo journalctl -u ai-server -n 50
```

## 🔒 보안 설정

### 1. EC2 보안 그룹 설정

AWS 콘솔에서 EC2 인스턴스의 보안 그룹에 다음 규칙 추가:
- **인바운드 규칙**: 포트 8000, 소스는 Vercel IP 또는 0.0.0.0/0 (프로덕션에서는 특정 IP만 허용 권장)

### 2. 방화벽 설정 (UFW)
```bash
# UFW 활성화
sudo ufw enable

# 포트 8000 허용
sudo ufw allow 8000/tcp

# 상태 확인
sudo ufw status
```

## 🔍 문제 해결

### 서비스가 시작되지 않는 경우
```bash
# 서비스 상태 확인
sudo systemctl status ai-server

# 에러 로그 확인
sudo journalctl -u ai-server -n 100

# 수동 실행하여 에러 확인
cd /home/ubuntu/DongSeo_WebProject/AI-Server
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 포트가 이미 사용 중인 경우
```bash
# 포트 8000 사용 중인 프로세스 확인
sudo lsof -i :8000

# 프로세스 종료
sudo kill -9 <PID>
```

### 데이터베이스 연결 오류
- `.env` 파일의 DB 정보 확인
- MySQL 서버가 실행 중인지 확인: `sudo systemctl status mysql`
- 방화벽에서 MySQL 포트(3306) 허용 확인

### API 키 오류
- `.env` 파일에 `GOOGLE_API_KEY`가 올바르게 설정되었는지 확인
- Google Cloud Console에서 API 키가 활성화되어 있는지 확인

## 📝 업데이트 방법

### 코드 업데이트 후 재배포
```bash
# 1. 코드 업데이트 (Git 사용 시)
cd /home/ubuntu/DongSeo_WebProject/AI-Server
git pull

# 2. 가상환경 활성화
source venv/bin/activate

# 3. 패키지 업데이트 (필요 시)
pip install -r requirements.txt --upgrade

# 4. 서비스 재시작
sudo systemctl restart ai-server

# 5. 상태 확인
sudo systemctl status ai-server
```

## 🌐 프록시 설정 (Vercel)

Vercel의 `vercel.json`에 이미 설정되어 있습니다:
```json
{
  "rewrites": [
    {
      "source": "/ai-api/:path*",
      "destination": "http://54.66.24.197:8000/:path*"
    }
  ]
}
```

프론트엔드에서 `/ai-api/chat`으로 요청하면 자동으로 EC2의 8000 포트로 프록시됩니다.

## ✅ 배포 체크리스트

- [ ] Python 3.9+ 설치 확인
- [ ] 프로젝트 파일 업로드 완료
- [ ] 가상환경 생성 및 패키지 설치 완료
- [ ] `.env` 파일 생성 및 API 키 설정
- [ ] 수동 실행 테스트 성공
- [ ] systemd 서비스 등록 및 시작
- [ ] EC2 보안 그룹에서 포트 8000 허용
- [ ] 방화벽 설정 완료
- [ ] Vercel rewrites 설정 확인
- [ ] 프론트엔드에서 API 호출 테스트

## 📞 참고

- **서버 주소**: `http://54.66.24.197:8000`
- **API 문서**: `http://54.66.24.197:8000/docs` (Swagger UI)
- **헬스 체크**: `http://54.66.24.197:8000/`

## 🔄 백엔드와의 통합

AI-Server는 Back-End와 동일한 MySQL 데이터베이스를 사용합니다.
- 제품 정보 조회
- 가격 계산
- 견적 데이터 저장 (필요 시)

Back-End의 `application.yml`에서 설정한 DB 정보와 동일하게 `.env`에 설정하세요.
