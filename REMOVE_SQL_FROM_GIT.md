# SQL 파일을 Git에서 제거하는 방법

## ⚠️ 중요: 이미 원격 저장소에 올라간 경우

SQL 파일이 이미 원격 저장소(GitHub 등)에 올라갔다면, 다음 단계를 따라야 합니다:

### 1단계: .gitignore에 추가 (완료됨)
SQL 파일이 `.gitignore`에 추가되었습니다.

### 2단계: Git 추적에서 제거 (로컬)
로컬 저장소에서 SQL 파일을 Git 추적에서 제거하되, 실제 파일은 삭제하지 않습니다:

```bash
# 모든 SQL 파일 추적 중단 (파일은 유지)
git rm --cached Back-End/src/main/resources/*.sql

# 또는 특정 파일만
git rm --cached Back-End/src/main/resources/data.sql
git rm --cached Back-End/src/main/resources/scheme.sql
# ... 기타 SQL 파일들
```

### 3단계: 변경사항 커밋
```bash
git add .gitignore
git commit -m "Remove SQL files from Git tracking (company confidential data)"
```

### 4단계: 원격 저장소에 푸시
```bash
git push origin main
# 또는
git push origin master
```

### 5단계: 히스토리 완전 제거 (선택사항, 주의 필요)

⚠️ **경고**: 이 작업은 히스토리를 재작성하므로 팀원들과 협의가 필요합니다.

#### BFG Repo-Cleaner 사용 (권장)
```bash
# BFG 다운로드: https://rtyley.github.io/bfg-repo-cleaner/

# 1. 저장소 복제
git clone --mirror https://github.com/your-username/your-repo.git

# 2. SQL 파일 제거
java -jar bfg.jar --delete-files "*.sql" your-repo.git

# 3. 히스토리 정리
cd your-repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 4. 강제 푸시 (⚠️ 팀원과 협의 후)
git push --force
```

#### git filter-branch 사용 (대안)
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch Back-End/src/main/resources/*.sql" \
  --prune-empty --tag-name-filter cat -- --all

# 가비지 컬렉션
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now
```

### 6단계: 팀원에게 알림

팀원들이 다음 명령어를 실행하여 로컬 저장소를 갱신해야 합니다:

```bash
# 원격 변경사항 가져오기
git fetch origin

# 로컬 브랜치 재설정 (⚠️ 로컬 변경사항 백업 필요)
git reset --hard origin/main
```

### 7단계: 기밀 데이터 확인

다음 명령어로 히스토리에 민감한 정보가 남아있는지 확인:

```bash
# 저장소에서 특정 텍스트 검색
git log -p --all -S "비밀번호나민감한정보"

# SQL 파일 검색
git log --all --full-history -- "*.sql"
```

## 대안: 데이터 마스킹

SQL 파일을 완전히 제거하지 않고, 기밀 데이터만 제거하고 템플릿으로 교체하는 방법:

1. `data.sql`에서 실제 기밀 데이터 제거
2. 샘플 데이터나 더미 데이터로 교체
3. 실제 데이터는 로컬 환경변수나 별도 보안 저장소에 보관

## 참고

- GitHub에서 이미 노출된 데이터는 완전히 제거하기 어렵습니다
- 가능하면 저장소 접근 권한을 확인하고 불필요한 공개 저장소가 아닌지 확인하세요
- 향후 민감한 정보는 `.gitignore`에 미리 추가하여 예방하세요
