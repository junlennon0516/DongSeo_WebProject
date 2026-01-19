# SQL 파일을 Git에서 제거하는 방법

## 작업 단계

### 1단계: .gitignore에 추가 (완료됨)
SQL 파일이 `.gitignore`에 추가되었습니다.

### 2단계: Git 추적에서 제거
```bash
git rm --cached Back-End/src/main/resources/*.sql
```

### 3단계: 변경사항 커밋
```bash
git add .gitignore
git commit -m "Remove SQL files from Git tracking"
```

### 4단계: 원격 저장소에 푸시
```bash
git push origin main
```
