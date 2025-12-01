# Asset Advanced Tools 테스트 가이드

## 테스트 실행 방법

### 방법 1: Cocos Creator 에디터 내에서 실행 (권장)

Cocos Creator 에디터의 **Console** 패널에서 직접 실행할 수 있습니다.

#### 1단계: 프로젝트 빌드
```bash
npm run build
```

#### 2단계: Cocos Creator 에디터에서 실행
1. Cocos Creator 에디터를 열고 프로젝트를 로드합니다
2. **Console** 패널을 엽니다 (메뉴: `开发者 > 控制台` 또는 `Developer > Console`)
3. 다음 코드를 입력하고 실행합니다:

```javascript
// 테스트 모듈 로드
const testModule = require('./extensions/cocos-mcp-server/dist/test/asset-advanced-tools-test.js');
const { runAssetAdvancedToolsTests } = testModule;

// 테스트 실행
runAssetAdvancedToolsTests();
```

또는 간단하게:
```javascript
require('./extensions/cocos-mcp-server/dist/test/asset-advanced-tools-test.js').runAssetAdvancedToolsTests();
```

### 방법 2: Node.js로 직접 실행

#### 1단계: 프로젝트 빌드
```bash
npm run build
```

#### 2단계: 테스트 실행
```bash
node dist/test/asset-advanced-tools-test.js
```

**주의**: 이 방법은 Cocos Creator 에디터 API(`Editor.assetdb`)에 접근할 수 없으므로, 실제로는 Cocos Creator 에디터 내에서 실행해야 합니다.

### 방법 3: 다른 테스트와 통합

`manual-test.ts`에 통합하여 함께 실행할 수 있습니다:

```typescript
// manual-test.ts에 추가
import { runAssetAdvancedToolsTests } from './asset-advanced-tools-test';

export async function runAllTests() {
    console.log('Starting MCP Server Tools Test...\n');

    await testSceneTools();
    await testAssetTools();
    await testProjectTools();
    await runAssetAdvancedToolsTests(); // 추가

    console.log('\n=== All tests completed ===');
}
```

그리고 Cocos Creator 콘솔에서:
```javascript
require('./extensions/cocos-mcp-server/dist/test/manual-test.js').runAllTests();
```

## 테스트 내용

### 실행되는 테스트 목록

1. **도구 목록 확인** - 모든 도구가 올바르게 등록되었는지 확인
2. **save_asset_meta** - 자산 메타 정보 저장 (URL/UUID 변환 포함)
3. **generate_available_url** - 사용 가능한 URL 생성
4. **query_asset_db_ready** - Asset DB 준비 상태 확인
5. **open_asset_external** - 외부 프로그램으로 자산 열기
6. **batch_import_assets** - 배치 자산 가져오기
7. **batch_delete_assets** - 배치 자산 삭제
8. **validate_asset_references** - 자산 참조 검증
9. **get_asset_dependencies** - 자산 의존성 조회 (미구현 확인)
10. **get_unused_assets** - 미사용 자산 찾기 (미구현 확인)
11. **compress_textures** - 텍스처 압축 (미구현 확인)
12. **export_asset_manifest** - 자산 매니페스트 내보내기 (JSON/CSV/XML)

## 테스트 결과 해석

### 성공 표시
- `✓` - 테스트 성공
- `✓ 예상된 실패` - 미구현 기능의 경우, 실패가 정상입니다

### 실패 표시
- `✗` - 테스트 실패
- `✗ 예상과 다름` - 예상과 다른 결과

### 로그 예시
```
테스트 2: save_asset_meta
  2.1: URL로 메타 저장 테스트
    ✓ 성공: 메타 저장됨
      UUID: 12345678-1234-1234-1234-123456789012
      URL: db://assets/test.png
```

## 문제 해결

### "Editor is not defined" 오류
- Cocos Creator 에디터 내에서 실행해야 합니다
- Node.js로 직접 실행하면 이 오류가 발생합니다

### "Cannot find module" 오류
- 먼저 `npm run build`로 프로젝트를 빌드하세요
- 경로가 올바른지 확인하세요

### 테스트가 실패하는 경우
- 실제 자산이 프로젝트에 존재하는지 확인하세요
- 일부 테스트는 실제 자산이 필요할 수 있습니다
- 콘솔 로그를 확인하여 상세한 오류 메시지를 확인하세요

## 개별 테스트 실행

특정 테스트만 실행하려면:

```javascript
const { AssetAdvancedToolsTest } = require('./extensions/cocos-mcp-server/dist/test/asset-advanced-tools-test.js');
const tester = new AssetAdvancedToolsTest();

// 특정 테스트만 실행
tester.testSaveAssetMeta();
tester.testExportAssetManifest();
```

## 테스트 커스터마이징

테스트 파일을 수정하여:
- 테스트할 자산 경로 변경
- 추가 테스트 케이스 추가
- 테스트 데이터 커스터마이징

`source/test/asset-advanced-tools-test.ts` 파일을 수정한 후 다시 빌드하세요.

