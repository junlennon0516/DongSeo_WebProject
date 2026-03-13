# 우딘(WOODIN) 데이터

우딘 회사 및 몰딩·문틀·가틀·창틀 제품 데이터를 `data.sql`과 분리해 두었습니다.  
상세 단가표 출처 및 카테고리 구성은 **[WOODIN.md](./WOODIN.md)** 참고.

## 실행 순서

1. **01_woodin_setup.sql** — 우딘 회사 등록 + 몰딩 카테고리 생성 (먼저 실행)
2. **02_woodin_ps_molding.sql** — PS 도장 몰딩
3. **03_woodin_wayne_molding.sql** — 웨인스코팅 몰딩
4. **04_woodin_al_pvc_molding.sql** — AL 라운드 / PVC 몰딩
5. **05_woodin_fire_rapping.sql** — 방염 랩핑 몰딩
6. **06_woodin_rapping.sql** — 일반 랩핑 몰딩
7. **07_woodin_foam_frame.sql** — 발포 문틀 (선도장/페이싱, 비규격·옵션)
8. **08_woodin_slim_frames.sql** — 목재 슬림 문틀(기본형), 발포 슬림 문틀
9. **09_woodin_wood_frame_gird.sql** — 목재 문틀, 공틀, 랩핑 문틀 옵션, 가틀 LVB
10. **10_woodin_frame_window.sql** — 연동 문틀/창틀, 미서기 문틀/창틀, 옵션
11. **11_woodin_colors.sql** — 우딘 색상 데이터
12. **12_woodin_hidden_door.sql** — 도어 - 히든 (히든 문틀, 히든 도어, 옵션, 핸들)
13. **13_woodin_abs_door.sql** — 도어 - ABS (베이직, 라인, 포인트, 알루미늄 엣지, 특대 성형, 네추럴, 프리미엄, PP 베이직)

`data.sql` 실행 후 위 순서대로 실행하면 됩니다. 각 파일은 `INSERT IGNORE`를 사용해 중복 실행해도 안전합니다.

## 한 번에 실행 (MySQL 클라이언트)

```bash
mysql -u 사용자 -p DB명 < 01_woodin_setup.sql
mysql -u 사용자 -p DB명 < 02_woodin_ps_molding.sql
# ... 03 ~ 10 동일
```
