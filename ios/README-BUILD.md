# iOS App Store 빌드 자동화

## 🚀 빠른 시작

### 1. IPA 파일 생성 (자동)

```bash
cd ios
./build-appstore.sh
```

이 스크립트는:
- ✅ 이전 빌드 정리
- ✅ CocoaPods 설치
- ✅ Archive 생성
- ✅ IPA 파일 export

완료되면 `ios/App/build/ipa/App.ipa` 파일이 생성됩니다.

### 2-A. Transporter 앱으로 업로드 (수동)

1. Transporter 앱 실행
2. `ios/App/build/ipa/App.ipa` 파일을 드래그
3. "Deliver" 버튼 클릭

### 2-B. 커맨드라인으로 업로드 (자동)

```bash
cd ios
./upload-appstore.sh
```

실행하면:
- Apple ID (이메일) 입력
- App-specific password 입력 필요

#### App-specific password 생성 방법:

1. https://appleid.apple.com 접속
2. 로그인
3. "Security" → "App-Specific Passwords"
4. "+" 버튼으로 새 암호 생성
5. 생성된 암호를 복사해서 사용

---

## 📋 전체 프로세스

```bash
# 1. IPA 생성
cd ios
./build-appstore.sh

# 2. 업로드 (자동화)
./upload-appstore.sh

# 또는 Transporter 앱 사용
open -a Transporter
```

---

## ⚠️ 문제 해결

### "Archive failed" 에러
- Xcode에서 수동으로 Product → Clean Build Folder
- `rm -rf ~/Library/Developer/Xcode/DerivedData`
- 다시 시도

### "No valid provisioning profile" 에러
- Xcode에서 App 프로젝트 열기
- Signing & Capabilities 확인
- "Automatically manage signing" 체크 확인
- Team 선택 확인

### Upload 실패
- App-specific password 재확인
- Apple ID가 App Store Connect에 접근 권한이 있는지 확인
- https://appstoreconnect.apple.com 에서 멤버십 확인

---

## 📁 생성되는 파일들

```
ios/App/build/
├── App.xcarchive          # Xcode archive
└── ipa/
    ├── App.ipa            # 업로드용 IPA 파일 ⭐
    ├── DistributionSummary.plist
    ├── ExportOptions.plist
    └── Packaging.log
```

---

## 💡 팁

- `xcpretty`가 설치되어 있으면 더 깔끔한 출력을 볼 수 있습니다:
  ```bash
  gem install xcpretty
  ```

- IPA 파일 크기 확인:
  ```bash
  du -h ios/App/build/ipa/App.ipa
  ```

- App Store Connect에서 처리 상태 확인:
  https://appstoreconnect.apple.com → TestFlight
