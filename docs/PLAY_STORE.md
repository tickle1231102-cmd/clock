# Cozy Time — Google Play 등록 가이드

앱 ID: `com.cozytime1231.studio`  
앱 이름: **Cozy Time**  
개인정보 처리방침: https://clock-bice-xi.vercel.app/privacy.html

코드 쪽(Capacitor Android, 브랜딩, 처리방침)은 준비되어 있습니다. 아래는 **직접** 진행할 단계입니다.

---

## A. Android Studio에서 서명된 AAB 만들기

### 1. 준비

1. [Android Studio](https://developer.android.com/studio) 설치
2. 프로젝트 폴더에서:

```bash
npm run cap:sync
npm run cap:open
```

### 2. 업로드 키스토어 생성 (최초 1회)

Android Studio:

1. **Build → Generate Signed App Bundle / APK…**
2. **Android App Bundle** 선택
3. **Create new…** 으로 keystore 생성  
   - 예: `cozy-time-upload.jks` (프로젝트 밖 + 백업 권장)  
   - Alias 예: `cozytime`  
   - 비밀번호를 안전한 곳에 보관 (**분실 시 업데이트 불가**)

### 3. AAB 내보내기

1. 같은 창에서 release 빌드 선택
2. 생성된 `.aab` 파일 위치 확인 (보통 `android/app/release/`)
3. Play Console에 이 파일을 업로드

버전을 올릴 때마다 `android/app/build.gradle`의 `versionCode`(+1)와 `versionName`을 올린 뒤 다시 AAB를 만듭니다.

---

## B. Play Console — 스토어 등록

1. [Google Play Console](https://play.google.com/console) → **앱 만들기**
2. 이름: **Cozy Time**
3. 앱 / 게임: **앱**, 무료/유료: 선택
4. **Play App Signing** 동의 (권장)

### 스토어 등록 정보 (필수 항목)

| 항목 | 안내 |
|------|------|
| 짧은 설명 | 80자 이내. 예: Cozy fullscreen clock with scenic themes, pomodoro & calendar |
| 긴 설명 | 기능 나열(시계, 테마, 포모도로, 스톱워치, 캘린더, 언어) |
| 앱 아이콘 | 512×512 PNG (`public/icons/icon-512.png` 사용 가능) |
| 그래픽 이미지 | 1024×500 배너 |
| 스크린샷 | 스마트폰 최소 2장 (가로 시계 화면 추천) |
| 개인정보처리방침 | `https://clock-bice-xi.vercel.app/privacy.html` |
| 카테고리 | Tools 또는 Lifestyle |
| 연락 이메일 | 본인 이메일 |

### Data safety

- 계정 없음, 서버 수집 없음 → 대부분 **수집하지 않음**
- 설정은 **기기 내 저장**만
- 위치: Skylight용으로 쓰는 경우 “대략적 위치, 앱 기능용, 공유 안 함”으로 명시

### 콘텐츠 등급

설문 완료 (폭력·유해 콘텐츠 없음).

---

## C. 테스트와 출시

1. **내부 테스트**: 본인 계정으로 AAB 업로드 → 설치해 전체화면·가로·테마·포모도로 확인
2. **비공개 테스트** (2023-11-13 이후 개인 계정 + 프로덕션 미경험 시):
   - 테스터 **12명**이 초대 링크로 가입·설치
   - **연속 14일** 유지 (여유 있게 15–20명 초대)
   - 이후 Dashboard에서 **프로덕션 액세스 신청**
3. **프로덕션**: AAB 업로드 → 국가 선택 → 심사 → 게시

이미 다른 앱을 출시한 계정이면 비공개 14일을 건너뛸 수 있습니다.

---

## D. 스토어 앱 업데이트

웹만 Vercel에 올려도 **스토어 앱은 안 바뀝니다.**

```bash
# 코드 수정 후
npm run cap:sync
npm run cap:open
# Android Studio에서 versionCode +1 → 새 AAB → Play Console 업로드
```
