# iOS Widget Setup Instructions

## Automatic Setup (Recommended)

위젯 파일들이 이미 생성되어 있습니다. Xcode에서 프로젝트에 추가만 하면 됩니다.

## Xcode에서 위젯 타겟 추가하기

1. **Xcode 열기**
   ```bash
   npx cap open ios
   ```

2. **Widget Extension 타겟 추가**
   - File → New → Target
   - "Widget Extension" 선택
   - Product Name: `VocaWidget`
   - Language: Swift
   - "Include Configuration Intent" 체크 해제
   - Finish 클릭

3. **기존 파일로 교체**
   - Xcode가 자동 생성한 파일들을 삭제
   - 이 디렉토리의 파일들을 타겟에 추가:
     - `VocaWidget.swift`
     - `Info.plist`

4. **Bundle Identifier 확인**
   - 프로젝트 설정 → VocaWidget 타겟
   - Bundle Identifier: `kr.ysw.voca.VocaWidget`

5. **API 엔드포인트**
   - 이미 설정됨: `https://voca.ysw.kr/api/widget/today-word`
   - 로컬 테스트 시에만 IP로 변경 필요

6. **빌드 및 실행**
   - 타겟을 "VocaWidget" 선택
   - 시뮬레이터 또는 실제 기기 선택
   - Run (⌘R)

## 위젯 기능

- **오늘의 단어**: 매일 자정에 새로운 단어 표시
- **두 가지 크기**: Small, Medium 지원
- **다크 테마**: 그라데이션 배경
- **레벨 표시**: 단어 난이도 표시
- **발음 기호**: IPA 표기법
- **품사**: noun, verb 등 표시

## 위젯 테스트

1. 홈 화면 길게 누르기
2. 왼쪽 상단 "+" 버튼
3. "Voca Widget" 검색
4. 원하는 크기 선택 (Small 또는 Medium)
5. "Add Widget" 클릭

## API 연동 확인

위젯이 제대로 작동하지 않으면:
- Console 앱에서 로그 확인
- API 엔드포인트가 올바른지 확인
- 네트워크 권한 확인 (Info.plist의 NSAppTransportSecurity)
