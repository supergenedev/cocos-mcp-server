"use strict";
/// <reference path="../types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetAdvancedToolsTest = void 0;
exports.runAssetAdvancedToolsTests = runAssetAdvancedToolsTests;
const asset_advanced_tools_1 = require("../tools/asset-advanced-tools");
/**
 * Asset Advanced Tools 테스트 클래스
 */
class AssetAdvancedToolsTest {
    constructor() {
        this.assetTools = new asset_advanced_tools_1.AssetAdvancedTools();
    }
    async runAllTests() {
        console.log('=== Asset Advanced Tools 테스트 시작 ===\n');
        try {
            // 테스트 1: 도구 목록 확인
            await this.testGetTools();
            // 테스트 2: save_asset_meta
            await this.testSaveAssetMeta();
            // 테스트 3: generate_available_url
            await this.testGenerateAvailableUrl();
            // 테스트 4: query_asset_db_ready
            await this.testQueryAssetDbReady();
            // 테스트 5: open_asset_external
            await this.testOpenAssetExternal();
            // 테스트 6: batch_import_assets
            await this.testBatchImportAssets();
            // 테스트 7: batch_delete_assets
            await this.testBatchDeleteAssets();
            // 테스트 8: validate_asset_references
            await this.testValidateAssetReferences();
            // 테스트 9: get_asset_dependencies
            await this.testGetAssetDependencies();
            // 테스트 10: get_unused_assets
            await this.testGetUnusedAssets();
            // 테스트 11: compress_textures
            await this.testCompressTextures();
            // 테스트 12: export_asset_manifest
            await this.testExportAssetManifest();
            console.log('\n=== 모든 테스트 완료 ===');
        }
        catch (error) {
            console.error('테스트 중 오류 발생:', error);
        }
    }
    async testGetTools() {
        console.log('테스트 1: 도구 목록 확인');
        try {
            const tools = this.assetTools.getTools();
            console.log(`  ✓ 도구 개수: ${tools.length}`);
            const expectedTools = [
                'save_asset_meta',
                'generate_available_url',
                'query_asset_db_ready',
                'open_asset_external',
                'batch_import_assets',
                'batch_delete_assets',
                'validate_asset_references',
                'get_asset_dependencies',
                'get_unused_assets',
                'compress_textures',
                'export_asset_manifest'
            ];
            expectedTools.forEach(toolName => {
                const found = tools.find(t => t.name === toolName);
                if (found) {
                    console.log(`  ✓ ${toolName}: ${found.description}`);
                }
                else {
                    console.log(`  ✗ ${toolName}: 찾을 수 없음`);
                }
            });
        }
        catch (error) {
            console.error(`  ✗ 오류: ${error.message}`);
        }
        console.log('');
    }
    async testSaveAssetMeta() {
        var _a, _b, _c, _d;
        console.log('테스트 2: save_asset_meta');
        // 테스트 2.1: URL로 메타 저장
        console.log('  2.1: URL로 메타 저장 테스트');
        try {
            const result = await this.assetTools.execute('save_asset_meta', {
                urlOrUUID: 'db://assets/test.png',
                content: JSON.stringify({ test: 'meta' })
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_a = result.data) === null || _a === void 0 ? void 0 : _a.message) || '메타 저장됨'}`);
                console.log(`      UUID: ${(_b = result.data) === null || _b === void 0 ? void 0 : _b.uuid}`);
                console.log(`      URL: ${(_c = result.data) === null || _c === void 0 ? void 0 : _c.url}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 2.2: UUID로 메타 저장
        console.log('  2.2: UUID로 메타 저장 테스트');
        try {
            const result = await this.assetTools.execute('save_asset_meta', {
                urlOrUUID: '12345678-1234-1234-1234-123456789012',
                content: JSON.stringify({ test: 'meta' })
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_d = result.data) === null || _d === void 0 ? void 0 : _d.message) || '메타 저장됨'}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 2.3: 잘못된 URL/UUID
        console.log('  2.3: 잘못된 URL/UUID 테스트');
        try {
            const result = await this.assetTools.execute('save_asset_meta', {
                urlOrUUID: 'invalid-url',
                content: JSON.stringify({ test: 'meta' })
            });
            if (!result.success) {
                console.log(`    ✓ 예상된 실패: ${result.error}`);
            }
            else {
                console.log(`    ✗ 예상과 다름: 성공했지만 실패해야 함`);
            }
        }
        catch (error) {
            console.log(`    ✓ 예상된 오류: ${error.message}`);
        }
        console.log('');
    }
    async testGenerateAvailableUrl() {
        var _a, _b, _c, _d, _e, _f, _g;
        console.log('테스트 3: generate_available_url');
        // 테스트 3.1: 사용 가능한 URL 생성
        console.log('  3.1: 사용 가능한 URL 생성 테스트');
        try {
            const result = await this.assetTools.execute('generate_available_url', {
                url: 'db://assets/new-file.png'
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_a = result.data) === null || _a === void 0 ? void 0 : _a.message) || 'URL 생성됨'}`);
                console.log(`      원본 URL: ${(_b = result.data) === null || _b === void 0 ? void 0 : _b.originalUrl}`);
                console.log(`      사용 가능한 URL: ${(_c = result.data) === null || _c === void 0 ? void 0 : _c.availableUrl}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 3.2: 이미 존재하는 URL (중복 체크)
        console.log('  3.2: 이미 존재하는 URL 테스트');
        try {
            const result = await this.assetTools.execute('generate_available_url', {
                url: 'db://assets/existing-file.png'
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_d = result.data) === null || _d === void 0 ? void 0 : _d.message) || 'URL 생성됨'}`);
                if (((_e = result.data) === null || _e === void 0 ? void 0 : _e.originalUrl) !== ((_f = result.data) === null || _f === void 0 ? void 0 : _f.availableUrl)) {
                    console.log(`      새로운 URL 생성됨: ${(_g = result.data) === null || _g === void 0 ? void 0 : _g.availableUrl}`);
                }
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        console.log('');
    }
    async testQueryAssetDbReady() {
        var _a, _b;
        console.log('테스트 4: query_asset_db_ready');
        try {
            const result = await this.assetTools.execute('query_asset_db_ready', {});
            if (result.success) {
                console.log(`  ✓ 성공: ${((_a = result.data) === null || _a === void 0 ? void 0 : _a.message) || 'DB 상태 확인됨'}`);
                console.log(`    준비 상태: ${((_b = result.data) === null || _b === void 0 ? void 0 : _b.ready) ? '준비됨' : '준비 안됨'}`);
            }
            else {
                console.log(`  ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`  ✗ 오류: ${error.message}`);
        }
        console.log('');
    }
    async testOpenAssetExternal() {
        console.log('테스트 5: open_asset_external');
        // 테스트 5.1: URL로 열기
        console.log('  5.1: URL로 자산 열기 테스트');
        try {
            const result = await this.assetTools.execute('open_asset_external', {
                urlOrUUID: 'db://assets/test.png'
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${result.message || '자산 위치 표시됨'}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 5.2: UUID로 열기
        console.log('  5.2: UUID로 자산 열기 테스트');
        try {
            const result = await this.assetTools.execute('open_asset_external', {
                urlOrUUID: '12345678-1234-1234-1234-123456789012'
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${result.message || '자산 위치 표시됨'}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        console.log('');
    }
    async testBatchImportAssets() {
        var _a, _b, _c, _d, _e;
        console.log('테스트 6: batch_import_assets');
        // 테스트 6.1: 기본 배치 가져오기
        console.log('  6.1: 기본 배치 가져오기 테스트');
        try {
            const result = await this.assetTools.execute('batch_import_assets', {
                sourceDirectory: '/tmp/test-assets',
                targetDirectory: 'db://assets/imported',
                fileFilter: ['.png', '.jpg'],
                recursive: false,
                overwrite: false
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_a = result.data) === null || _a === void 0 ? void 0 : _a.message) || '가져오기 완료'}`);
                console.log(`      전체 파일: ${(_b = result.data) === null || _b === void 0 ? void 0 : _b.totalFiles}`);
                console.log(`      성공: ${(_c = result.data) === null || _c === void 0 ? void 0 : _c.successCount}`);
                console.log(`      실패: ${(_d = result.data) === null || _d === void 0 ? void 0 : _d.errorCount}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 6.2: 존재하지 않는 디렉토리
        console.log('  6.2: 존재하지 않는 디렉토리 테스트');
        try {
            const result = await this.assetTools.execute('batch_import_assets', {
                sourceDirectory: '/nonexistent/directory',
                targetDirectory: 'db://assets/imported'
            });
            if (!result.success) {
                console.log(`    ✓ 예상된 실패: ${result.error}`);
            }
            else {
                console.log(`    ✗ 예상과 다름: 성공했지만 실패해야 함`);
            }
        }
        catch (error) {
            console.log(`    ✓ 예상된 오류: ${error.message}`);
        }
        // 테스트 6.3: 재귀 가져오기
        console.log('  6.3: 재귀 가져오기 테스트');
        try {
            const result = await this.assetTools.execute('batch_import_assets', {
                sourceDirectory: '/tmp/test-assets',
                targetDirectory: 'db://assets/imported',
                recursive: true,
                fileFilter: ['.png']
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_e = result.data) === null || _e === void 0 ? void 0 : _e.message) || '재귀 가져오기 완료'}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        console.log('');
    }
    async testBatchDeleteAssets() {
        var _a, _b, _c;
        console.log('테스트 7: batch_delete_assets');
        // 테스트 7.1: 기본 배치 삭제
        console.log('  7.1: 기본 배치 삭제 테스트');
        try {
            const result = await this.assetTools.execute('batch_delete_assets', {
                urls: [
                    'db://assets/test1.png',
                    'db://assets/test2.png',
                    'db://assets/test3.png'
                ]
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_a = result.data) === null || _a === void 0 ? void 0 : _a.message) || '삭제 완료'}`);
                console.log(`      전체 자산: ${(_b = result.data) === null || _b === void 0 ? void 0 : _b.totalAssets}`);
                console.log(`      성공: ${(_c = result.data) === null || _c === void 0 ? void 0 : _c.successCount}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 7.2: 빈 배열
        console.log('  7.2: 빈 배열 테스트');
        try {
            const result = await this.assetTools.execute('batch_delete_assets', {
                urls: []
            });
            if (result.success) {
                console.log(`    ✓ 성공: 빈 배열 처리됨`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        console.log('');
    }
    async testValidateAssetReferences() {
        var _a, _b, _c, _d, _e, _f;
        console.log('테스트 8: validate_asset_references');
        // 테스트 8.1: 기본 검증
        console.log('  8.1: 기본 검증 테스트');
        try {
            const result = await this.assetTools.execute('validate_asset_references', {
                directory: 'db://assets'
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_a = result.data) === null || _a === void 0 ? void 0 : _a.message) || '검증 완료'}`);
                console.log(`      전체 자산: ${(_b = result.data) === null || _b === void 0 ? void 0 : _b.totalAssets}`);
                console.log(`      유효한 참조: ${(_c = result.data) === null || _c === void 0 ? void 0 : _c.validReferences}`);
                console.log(`      깨진 참조: ${(_d = result.data) === null || _d === void 0 ? void 0 : _d.brokenReferences}`);
                if (((_e = result.data) === null || _e === void 0 ? void 0 : _e.brokenAssets) && result.data.brokenAssets.length > 0) {
                    console.log(`      깨진 자산 목록:`);
                    result.data.brokenAssets.slice(0, 3).forEach((asset) => {
                        console.log(`        - ${asset.name}: ${asset.error}`);
                    });
                }
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 8.2: 특정 디렉토리 검증
        console.log('  8.2: 특정 디렉토리 검증 테스트');
        try {
            const result = await this.assetTools.execute('validate_asset_references', {
                directory: 'db://assets/textures'
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_f = result.data) === null || _f === void 0 ? void 0 : _f.message) || '검증 완료'}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 8.3: 기본값 사용 (directory 없음)
        console.log('  8.3: 기본값 사용 테스트');
        try {
            const result = await this.assetTools.execute('validate_asset_references', {});
            if (result.success) {
                console.log(`    ✓ 성공: 기본 디렉토리로 검증됨`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        console.log('');
    }
    async testGetAssetDependencies() {
        console.log('테스트 9: get_asset_dependencies');
        try {
            const result = await this.assetTools.execute('get_asset_dependencies', {
                urlOrUUID: 'db://assets/test.prefab',
                direction: 'dependencies'
            });
            // 이 도구는 현재 구현되지 않았으므로 실패가 예상됨
            if (!result.success) {
                console.log(`  ✓ 예상된 실패: ${result.error}`);
            }
            else {
                console.log(`  ✗ 예상과 다름: 성공했지만 실패해야 함`);
            }
        }
        catch (error) {
            console.log(`  ✓ 예상된 오류: ${error.message}`);
        }
        console.log('');
    }
    async testGetUnusedAssets() {
        console.log('테스트 10: get_unused_assets');
        try {
            const result = await this.assetTools.execute('get_unused_assets', {
                directory: 'db://assets',
                excludeDirectories: ['db://assets/excluded']
            });
            // 이 도구는 현재 구현되지 않았으므로 실패가 예상됨
            if (!result.success) {
                console.log(`  ✓ 예상된 실패: ${result.error}`);
            }
            else {
                console.log(`  ✗ 예상과 다름: 성공했지만 실패해야 함`);
            }
        }
        catch (error) {
            console.log(`  ✓ 예상된 오류: ${error.message}`);
        }
        console.log('');
    }
    async testCompressTextures() {
        console.log('테스트 11: compress_textures');
        try {
            const result = await this.assetTools.execute('compress_textures', {
                directory: 'db://assets/textures',
                format: 'auto',
                quality: 0.8
            });
            // 이 도구는 현재 구현되지 않았으므로 실패가 예상됨
            if (!result.success) {
                console.log(`  ✓ 예상된 실패: ${result.error}`);
            }
            else {
                console.log(`  ✗ 예상과 다름: 성공했지만 실패해야 함`);
            }
        }
        catch (error) {
            console.log(`  ✓ 예상된 오류: ${error.message}`);
        }
        console.log('');
    }
    async testExportAssetManifest() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        console.log('테스트 12: export_asset_manifest');
        // 테스트 12.1: JSON 형식으로 내보내기
        console.log('  12.1: JSON 형식으로 내보내기 테스트');
        try {
            const result = await this.assetTools.execute('export_asset_manifest', {
                directory: 'db://assets',
                format: 'json',
                includeMetadata: true
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_a = result.data) === null || _a === void 0 ? void 0 : _a.message) || '매니페스트 내보내기 완료'}`);
                console.log(`      자산 개수: ${(_b = result.data) === null || _b === void 0 ? void 0 : _b.assetCount}`);
                console.log(`      형식: ${(_c = result.data) === null || _c === void 0 ? void 0 : _c.format}`);
                console.log(`      메타데이터 포함: ${(_d = result.data) === null || _d === void 0 ? void 0 : _d.includeMetadata}`);
                if ((_e = result.data) === null || _e === void 0 ? void 0 : _e.manifest) {
                    const manifestLength = result.data.manifest.length;
                    console.log(`      매니페스트 길이: ${manifestLength} 문자`);
                }
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 12.2: CSV 형식으로 내보내기
        console.log('  12.2: CSV 형식으로 내보내기 테스트');
        try {
            const result = await this.assetTools.execute('export_asset_manifest', {
                directory: 'db://assets',
                format: 'csv',
                includeMetadata: false
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_f = result.data) === null || _f === void 0 ? void 0 : _f.message) || 'CSV 내보내기 완료'}`);
                console.log(`      형식: ${(_g = result.data) === null || _g === void 0 ? void 0 : _g.format}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 12.3: XML 형식으로 내보내기
        console.log('  12.3: XML 형식으로 내보내기 테스트');
        try {
            const result = await this.assetTools.execute('export_asset_manifest', {
                directory: 'db://assets',
                format: 'xml',
                includeMetadata: true
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_h = result.data) === null || _h === void 0 ? void 0 : _h.message) || 'XML 내보내기 완료'}`);
                console.log(`      형식: ${(_j = result.data) === null || _j === void 0 ? void 0 : _j.format}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 12.4: 특정 디렉토리만 내보내기
        console.log('  12.4: 특정 디렉토리만 내보내기 테스트');
        try {
            const result = await this.assetTools.execute('export_asset_manifest', {
                directory: 'db://assets/textures',
                format: 'json'
            });
            if (result.success) {
                console.log(`    ✓ 성공: ${((_k = result.data) === null || _k === void 0 ? void 0 : _k.message) || '디렉토리 내보내기 완료'}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        // 테스트 12.5: 빈 디렉토리
        console.log('  12.5: 빈 디렉토리 테스트');
        try {
            const result = await this.assetTools.execute('export_asset_manifest', {
                directory: 'db://assets/empty',
                format: 'json'
            });
            if (result.success) {
                console.log(`    ✓ 성공: 빈 디렉토리 처리됨`);
                console.log(`      자산 개수: ${(_l = result.data) === null || _l === void 0 ? void 0 : _l.assetCount}`);
            }
            else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        }
        catch (error) {
            console.log(`    ✗ 오류: ${error.message}`);
        }
        console.log('');
    }
}
exports.AssetAdvancedToolsTest = AssetAdvancedToolsTest;
// 테스트 실행 함수
async function runAssetAdvancedToolsTests() {
    const tester = new AssetAdvancedToolsTest();
    await tester.runAllTests();
}
// 직접 실행 시
if (require.main === module) {
    runAssetAdvancedToolsTests().catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtYWR2YW5jZWQtdG9vbHMtdGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90ZXN0L2Fzc2V0LWFkdmFuY2VkLXRvb2xzLXRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFnRDs7O0FBc2xCaEQsZ0VBR0M7QUF2bEJELHdFQUFtRTtBQUVuRTs7R0FFRztBQUNILE1BQWEsc0JBQXNCO0lBRy9CO1FBQ0ksSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLHlDQUFrQixFQUFFLENBQUM7SUFDL0MsQ0FBQztJQUVELEtBQUssQ0FBQyxXQUFXO1FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBRXJELElBQUksQ0FBQztZQUNELGtCQUFrQjtZQUNsQixNQUFNLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUUxQix5QkFBeUI7WUFDekIsTUFBTSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUUvQixnQ0FBZ0M7WUFDaEMsTUFBTSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUV0Qyw4QkFBOEI7WUFDOUIsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUVuQyw2QkFBNkI7WUFDN0IsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUVuQyw2QkFBNkI7WUFDN0IsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUVuQyw2QkFBNkI7WUFDN0IsTUFBTSxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztZQUVuQyxtQ0FBbUM7WUFDbkMsTUFBTSxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztZQUV6QyxnQ0FBZ0M7WUFDaEMsTUFBTSxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztZQUV0Qyw0QkFBNEI7WUFDNUIsTUFBTSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUVqQyw0QkFBNEI7WUFDNUIsTUFBTSxJQUFJ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LElBQUksS0FBSyxNQUFNLEVBQUUsQ0FBQztJQUMxQiwwQkFBMEIsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBlcy9lZGl0b3ItMnguZC50c1wiIC8+XG5cbmltcG9ydCB7IEFzc2V0QWR2YW5jZWRUb29scyB9IGZyb20gJy4uL3Rvb2xzL2Fzc2V0LWFkdmFuY2VkLXRvb2xzJztcblxuLyoqXG4gKiBBc3NldCBBZHZhbmNlZCBUb29scyDthYzsiqTtirgg7YG0656Y7IqkXG4gKi9cbmV4cG9ydCBjbGFzcyBBc3NldEFkdmFuY2VkVG9vbHNUZXN0IHtcbiAgICBwcml2YXRlIGFzc2V0VG9vbHM6IEFzc2V0QWR2YW5jZWRUb29scztcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmFzc2V0VG9vbHMgPSBuZXcgQXNzZXRBZHZhbmNlZFRvb2xzKCk7XG4gICAgfVxuXG4gICAgYXN5bmMgcnVuQWxsVGVzdHMoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCc9PT0gQXNzZXQgQWR2YW5jZWQgVG9vbHMg7YWM7Iqk7Yq4IOyLnOyekSA9PT1cXG4nKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g7YWM7Iqk7Yq4IDE6IOuPhOq1rCDrqqnroZ0g7ZmV7J24XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnRlc3RHZXRUb29scygpO1xuXG4gICAgICAgICAgICAvLyDthYzsiqTtirggMjogc2F2ZV9hc3NldF9tZXRhXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnRlc3RTYXZlQXNzZXRNZXRhKCk7XG5cbiAgICAgICAgICAgIC8vIO2FjOyKpO2KuCAzOiBnZW5lcmF0ZV9hdmFpbGFibGVfdXJsXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnRlc3RHZW5lcmF0ZUF2YWlsYWJsZVVybCgpO1xuXG4gICAgICAgICAgICAvLyDthYzsiqTtirggNDogcXVlcnlfYXNzZXRfZGJfcmVhZHlcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGVzdFF1ZXJ5QXNzZXREYlJlYWR5KCk7XG5cbiAgICAgICAgICAgIC8vIO2FjOyKpO2KuCA1OiBvcGVuX2Fzc2V0X2V4dGVybmFsXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnRlc3RPcGVuQXNzZXRFeHRlcm5hbCgpO1xuXG4gICAgICAgICAgICAvLyDthYzsiqTtirggNjogYmF0Y2hfaW1wb3J0X2Fzc2V0c1xuICAgICAgICAgICAgYXdhaXQgdGhpcy50ZXN0QmF0Y2hJbXBvcnRBc3NldHMoKTtcblxuICAgICAgICAgICAgLy8g7YWM7Iqk7Yq4IDc6IGJhdGNoX2RlbGV0ZV9hc3NldHNcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGVzdEJhdGNoRGVsZXRlQXNzZXRzKCk7XG5cbiAgICAgICAgICAgIC8vIO2FjOyKpO2KuCA4OiB2YWxpZGF0ZV9hc3NldF9yZWZlcmVuY2VzXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnRlc3RWYWxpZGF0ZUFzc2V0UmVmZXJlbmNlcygpO1xuXG4gICAgICAgICAgICAvLyDthYzsiqTtirggOTogZ2V0X2Fzc2V0X2RlcGVuZGVuY2llc1xuICAgICAgICAgICAgYXdhaXQgdGhpcy50ZXN0R2V0QXNzZXREZXBlbmRlbmNpZXMoKTtcblxuICAgICAgICAgICAgLy8g7YWM7Iqk7Yq4IDEwOiBnZXRfdW51c2VkX2Fzc2V0c1xuICAgICAgICAgICAgYXdhaXQgdGhpcy50ZXN0R2V0VW51c2VkQXNzZXRzKCk7XG5cbiAgICAgICAgICAgIC8vIO2FjOyKpO2KuCAxMTogY29tcHJlc3NfdGV4dHVyZXNcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGVzdENvbXByZXNzVGV4dHVyZXMoKTtcblxuICAgICAgICAgICAgLy8g7YWM7Iqk7Yq4IDEyOiBleHBvcnRfYXNzZXRfbWFuaWZlc3RcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGVzdEV4cG9ydEFzc2V0TWFuaWZlc3QoKTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1xcbj09PSDrqqjrk6Ag7YWM7Iqk7Yq4IOyZhOujjCA9PT0nKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+2FjOyKpO2KuCDspJEg7Jik66WYIOuwnOyDnTonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RHZXRUb29scygpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+2FjOyKpO2KuCAxOiDrj4Tqtawg66qp66GdIO2ZleyduCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdG9vbHMgPSB0aGlzLmFzc2V0VG9vbHMuZ2V0VG9vbHMoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyDrj4Tqtawg6rCc7IiYOiAke3Rvb2xzLmxlbmd0aH1gKTtcblxuICAgICAgICAgICAgY29uc3QgZXhwZWN0ZWRUb29scyA9IFtcbiAgICAgICAgICAgICAgICAnc2F2ZV9hc3NldF9tZXRhJyxcbiAgICAgICAgICAgICAgICAnZ2VuZXJhdGVfYXZhaWxhYmxlX3VybCcsXG4gICAgICAgICAgICAgICAgJ3F1ZXJ5X2Fzc2V0X2RiX3JlYWR5JyxcbiAgICAgICAgICAgICAgICAnb3Blbl9hc3NldF9leHRlcm5hbCcsXG4gICAgICAgICAgICAgICAgJ2JhdGNoX2ltcG9ydF9hc3NldHMnLFxuICAgICAgICAgICAgICAgICdiYXRjaF9kZWxldGVfYXNzZXRzJyxcbiAgICAgICAgICAgICAgICAndmFsaWRhdGVfYXNzZXRfcmVmZXJlbmNlcycsXG4gICAgICAgICAgICAgICAgJ2dldF9hc3NldF9kZXBlbmRlbmNpZXMnLFxuICAgICAgICAgICAgICAgICdnZXRfdW51c2VkX2Fzc2V0cycsXG4gICAgICAgICAgICAgICAgJ2NvbXByZXNzX3RleHR1cmVzJyxcbiAgICAgICAgICAgICAgICAnZXhwb3J0X2Fzc2V0X21hbmlmZXN0J1xuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgZXhwZWN0ZWRUb29scy5mb3JFYWNoKHRvb2xOYW1lID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IHRvb2xzLmZpbmQodCA9PiB0Lm5hbWUgPT09IHRvb2xOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTICR7dG9vbE5hbWV9OiAke2ZvdW5kLmRlc2NyaXB0aW9ufWApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKclyAke3Rvb2xOYW1lfTog7LC+7J2EIOyImCDsl4bsnYxgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgdGVzdFNhdmVBc3NldE1ldGEoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfthYzsiqTtirggMjogc2F2ZV9hc3NldF9tZXRhJyk7XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDIuMTogVVJM66GcIOuplO2DgCDsoIDsnqVcbiAgICAgICAgY29uc29sZS5sb2coJyAgMi4xOiBVUkzroZwg66mU7YOAIOyggOyepSDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdzYXZlX2Fzc2V0X21ldGEnLCB7XG4gICAgICAgICAgICAgICAgdXJsT3JVVUlEOiAnZGI6Ly9hc3NldHMvdGVzdC5wbmcnLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEpTT04uc3RyaW5naWZ5KHsgdGVzdDogJ21ldGEnIH0pXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICfrqZTtg4Ag7KCA7J6l65CoJ31gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAgVVVJRDogJHtyZXN1bHQuZGF0YT8udXVpZH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAgVVJMOiAke3Jlc3VsdC5kYXRhPy51cmx9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDIuMjogVVVJROuhnCDrqZTtg4Ag7KCA7J6lXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDIuMjogVVVJROuhnCDrqZTtg4Ag7KCA7J6lIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ3NhdmVfYXNzZXRfbWV0YScsIHtcbiAgICAgICAgICAgICAgICB1cmxPclVVSUQ6ICcxMjM0NTY3OC0xMjM0LTEyMzQtMTIzNC0xMjM0NTY3ODkwMTInLFxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IEpTT04uc3RyaW5naWZ5KHsgdGVzdDogJ21ldGEnIH0pXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICfrqZTtg4Ag7KCA7J6l65CoJ31gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDthYzsiqTtirggMi4zOiDsnpjrqrvrkJwgVVJML1VVSURcbiAgICAgICAgY29uc29sZS5sb2coJyAgMi4zOiDsnpjrqrvrkJwgVVJML1VVSUQg7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnc2F2ZV9hc3NldF9tZXRhJywge1xuICAgICAgICAgICAgICAgIHVybE9yVVVJRDogJ2ludmFsaWQtdXJsJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBKU09OLnN0cmluZ2lmeSh7IHRlc3Q6ICdtZXRhJyB9KVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDsmIjsg4HrkJwg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7JiI7IOB6rO8IOuLpOumhDog7ISx6rO17ZaI7KeA66eMIOyLpO2MqO2VtOyVvCDtlahgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7JiI7IOB65CcIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgdGVzdEdlbmVyYXRlQXZhaWxhYmxlVXJsKCkge1xuICAgICAgICBjb25zb2xlLmxvZygn7YWM7Iqk7Yq4IDM6IGdlbmVyYXRlX2F2YWlsYWJsZV91cmwnKTtcblxuICAgICAgICAvLyDthYzsiqTtirggMy4xOiDsgqzsmqkg6rCA64ql7ZWcIFVSTCDsg53shLFcbiAgICAgICAgY29uc29sZS5sb2coJyAgMy4xOiDsgqzsmqkg6rCA64ql7ZWcIFVSTCDsg53shLEg7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnZ2VuZXJhdGVfYXZhaWxhYmxlX3VybCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICdkYjovL2Fzc2V0cy9uZXctZmlsZS5wbmcnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICdVUkwg7IOd7ISx65CoJ31gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg7JuQ67O4IFVSTDogJHtyZXN1bHQuZGF0YT8ub3JpZ2luYWxVcmx9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOyCrOyaqSDqsIDriqXtlZwgVVJMOiAke3Jlc3VsdC5kYXRhPy5hdmFpbGFibGVVcmx9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDMuMjog7J2066+4IOyhtOyerO2VmOuKlCBVUkwgKOykkeuztSDssrTtgawpXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDMuMjog7J2066+4IOyhtOyerO2VmOuKlCBVUkwg7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnZ2VuZXJhdGVfYXZhaWxhYmxlX3VybCcsIHtcbiAgICAgICAgICAgICAgICB1cmw6ICdkYjovL2Fzc2V0cy9leGlzdGluZy1maWxlLnBuZydcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDshLHqs7U6ICR7cmVzdWx0LmRhdGE/Lm1lc3NhZ2UgfHwgJ1VSTCDsg53shLHrkKgnfWApO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YT8ub3JpZ2luYWxVcmwgIT09IHJlc3VsdC5kYXRhPy5hdmFpbGFibGVVcmwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOyDiOuhnOyatCBVUkwg7IOd7ISx65CoOiAke3Jlc3VsdC5kYXRhPy5hdmFpbGFibGVVcmx9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RRdWVyeUFzc2V0RGJSZWFkeSgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+2FjOyKpO2KuCA0OiBxdWVyeV9hc3NldF9kYl9yZWFkeScpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgncXVlcnlfYXNzZXRfZGJfcmVhZHknLCB7fSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyDshLHqs7U6ICR7cmVzdWx0LmRhdGE/Lm1lc3NhZ2UgfHwgJ0RCIOyDge2DnCDtmZXsnbjrkKgnfWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg7KSA67mEIOyDge2DnDogJHtyZXN1bHQuZGF0YT8ucmVhZHkgPyAn7KSA67mE65CoJyA6ICfspIDruYQg7JWI65CoJ31gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RPcGVuQXNzZXRFeHRlcm5hbCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+2FjOyKpO2KuCA1OiBvcGVuX2Fzc2V0X2V4dGVybmFsJyk7XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDUuMTogVVJM66GcIOyXtOq4sFxuICAgICAgICBjb25zb2xlLmxvZygnICA1LjE6IFVSTOuhnCDsnpDsgrAg7Je06riwIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ29wZW5fYXNzZXRfZXh0ZXJuYWwnLCB7XG4gICAgICAgICAgICAgICAgdXJsT3JVVUlEOiAnZGI6Ly9hc3NldHMvdGVzdC5wbmcnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5tZXNzYWdlIHx8ICfsnpDsgrAg7JyE7LmYIO2RnOyLnOuQqCd9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDUuMjogVVVJROuhnCDsl7TquLBcbiAgICAgICAgY29uc29sZS5sb2coJyAgNS4yOiBVVUlE66GcIOyekOyCsCDsl7TquLAg7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnb3Blbl9hc3NldF9leHRlcm5hbCcsIHtcbiAgICAgICAgICAgICAgICB1cmxPclVVSUQ6ICcxMjM0NTY3OC0xMjM0LTEyMzQtMTIzNC0xMjM0NTY3ODkwMTInXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5tZXNzYWdlIHx8ICfsnpDsgrAg7JyE7LmYIO2RnOyLnOuQqCd9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgdGVzdEJhdGNoSW1wb3J0QXNzZXRzKCkge1xuICAgICAgICBjb25zb2xlLmxvZygn7YWM7Iqk7Yq4IDY6IGJhdGNoX2ltcG9ydF9hc3NldHMnKTtcblxuICAgICAgICAvLyDthYzsiqTtirggNi4xOiDquLDrs7gg67Cw7LmYIOqwgOyguOyYpOq4sFxuICAgICAgICBjb25zb2xlLmxvZygnICA2LjE6IOq4sOuzuCDrsLDsuZgg6rCA7KC47Jik6riwIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ2JhdGNoX2ltcG9ydF9hc3NldHMnLCB7XG4gICAgICAgICAgICAgICAgc291cmNlRGlyZWN0b3J5OiAnL3RtcC90ZXN0LWFzc2V0cycsXG4gICAgICAgICAgICAgICAgdGFyZ2V0RGlyZWN0b3J5OiAnZGI6Ly9hc3NldHMvaW1wb3J0ZWQnLFxuICAgICAgICAgICAgICAgIGZpbGVGaWx0ZXI6IFsnLnBuZycsICcuanBnJ10sXG4gICAgICAgICAgICAgICAgcmVjdXJzaXZlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBvdmVyd3JpdGU6IGZhbHNlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICfqsIDsoLjsmKTquLAg7JmE66OMJ31gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg7KCE7LK0IO2MjOydvDogJHtyZXN1bHQuZGF0YT8udG90YWxGaWxlc31gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5zdWNjZXNzQ291bnR9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOyLpO2MqDogJHtyZXN1bHQuZGF0YT8uZXJyb3JDb3VudH1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDthYzsiqTtirggNi4yOiDsobTsnqztlZjsp4Ag7JWK64qUIOuUlOugie2GoOumrFxuICAgICAgICBjb25zb2xlLmxvZygnICA2LjI6IOyhtOyerO2VmOyngCDslYrripQg65SU66CJ7Yag66asIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ2JhdGNoX2ltcG9ydF9hc3NldHMnLCB7XG4gICAgICAgICAgICAgICAgc291cmNlRGlyZWN0b3J5OiAnL25vbmV4aXN0ZW50L2RpcmVjdG9yeScsXG4gICAgICAgICAgICAgICAgdGFyZ2V0RGlyZWN0b3J5OiAnZGI6Ly9hc3NldHMvaW1wb3J0ZWQnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyYiOyDgeuQnCDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmIjsg4Hqs7wg64uk66aEOiDshLHqs7Xtlojsp4Drp4wg7Iuk7Yyo7ZW07JW8IO2VqGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDsmIjsg4HrkJwg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDthYzsiqTtirggNi4zOiDsnqzqt4Ag6rCA7KC47Jik6riwXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDYuMzog7J6s6reAIOqwgOyguOyYpOq4sCDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdiYXRjaF9pbXBvcnRfYXNzZXRzJywge1xuICAgICAgICAgICAgICAgIHNvdXJjZURpcmVjdG9yeTogJy90bXAvdGVzdC1hc3NldHMnLFxuICAgICAgICAgICAgICAgIHRhcmdldERpcmVjdG9yeTogJ2RiOi8vYXNzZXRzL2ltcG9ydGVkJyxcbiAgICAgICAgICAgICAgICByZWN1cnNpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgZmlsZUZpbHRlcjogWycucG5nJ11cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDshLHqs7U6ICR7cmVzdWx0LmRhdGE/Lm1lc3NhZ2UgfHwgJ+yerOq3gCDqsIDsoLjsmKTquLAg7JmE66OMJ31gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0ZXN0QmF0Y2hEZWxldGVBc3NldHMoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfthYzsiqTtirggNzogYmF0Y2hfZGVsZXRlX2Fzc2V0cycpO1xuXG4gICAgICAgIC8vIO2FjOyKpO2KuCA3LjE6IOq4sOuzuCDrsLDsuZgg7IKt7KCcXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDcuMTog6riw67O4IOuwsOy5mCDsgq3soJwg7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnYmF0Y2hfZGVsZXRlX2Fzc2V0cycsIHtcbiAgICAgICAgICAgICAgICB1cmxzOiBbXG4gICAgICAgICAgICAgICAgICAgICdkYjovL2Fzc2V0cy90ZXN0MS5wbmcnLFxuICAgICAgICAgICAgICAgICAgICAnZGI6Ly9hc3NldHMvdGVzdDIucG5nJyxcbiAgICAgICAgICAgICAgICAgICAgJ2RiOi8vYXNzZXRzL3Rlc3QzLnBuZydcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICfsgq3soJwg7JmE66OMJ31gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg7KCE7LK0IOyekOyCsDogJHtyZXN1bHQuZGF0YT8udG90YWxBc3NldHN9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOyEseqztTogJHtyZXN1bHQuZGF0YT8uc3VjY2Vzc0NvdW50fWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIO2FjOyKpO2KuCA3LjI6IOu5iCDrsLDsl7RcbiAgICAgICAgY29uc29sZS5sb2coJyAgNy4yOiDruYgg67Cw7Je0IO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ2JhdGNoX2RlbGV0ZV9hc3NldHMnLCB7XG4gICAgICAgICAgICAgICAgdXJsczogW11cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDshLHqs7U6IOu5iCDrsLDsl7Qg7LKY66as65CoYCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgdGVzdFZhbGlkYXRlQXNzZXRSZWZlcmVuY2VzKCkge1xuICAgICAgICBjb25zb2xlLmxvZygn7YWM7Iqk7Yq4IDg6IHZhbGlkYXRlX2Fzc2V0X3JlZmVyZW5jZXMnKTtcblxuICAgICAgICAvLyDthYzsiqTtirggOC4xOiDquLDrs7gg6rKA7KadXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDguMTog6riw67O4IOqygOymnSDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCd2YWxpZGF0ZV9hc3NldF9yZWZlcmVuY2VzJywge1xuICAgICAgICAgICAgICAgIGRpcmVjdG9yeTogJ2RiOi8vYXNzZXRzJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTogJHtyZXN1bHQuZGF0YT8ubWVzc2FnZSB8fCAn6rKA7KadIOyZhOujjCd9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOyghOyytCDsnpDsgrA6ICR7cmVzdWx0LmRhdGE/LnRvdGFsQXNzZXRzfWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDsnKDtmqjtlZwg7LC47KGwOiAke3Jlc3VsdC5kYXRhPy52YWxpZFJlZmVyZW5jZXN9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOq5qOynhCDssLjsobA6ICR7cmVzdWx0LmRhdGE/LmJyb2tlblJlZmVyZW5jZXN9YCk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRhdGE/LmJyb2tlbkFzc2V0cyAmJiByZXN1bHQuZGF0YS5icm9rZW5Bc3NldHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg6rmo7KeEIOyekOyCsCDrqqnroZ06YCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5kYXRhLmJyb2tlbkFzc2V0cy5zbGljZSgwLCAzKS5mb3JFYWNoKChhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAgICAtICR7YXNzZXQubmFtZX06ICR7YXNzZXQuZXJyb3J9YCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDthYzsiqTtirggOC4yOiDtirnsoJUg65SU66CJ7Yag66asIOqygOymnVxuICAgICAgICBjb25zb2xlLmxvZygnICA4LjI6IO2KueyglSDrlJTroInthqDrpqwg6rKA7KadIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ3ZhbGlkYXRlX2Fzc2V0X3JlZmVyZW5jZXMnLCB7XG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5OiAnZGI6Ly9hc3NldHMvdGV4dHVyZXMnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICfqsoDspp0g7JmE66OMJ31gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDthYzsiqTtirggOC4zOiDquLDrs7jqsJIg7IKs7JqpIChkaXJlY3Rvcnkg7JeG7J2MKVxuICAgICAgICBjb25zb2xlLmxvZygnICA4LjM6IOq4sOuzuOqwkiDsgqzsmqkg7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgndmFsaWRhdGVfYXNzZXRfcmVmZXJlbmNlcycsIHt9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiDquLDrs7gg65SU66CJ7Yag66as66GcIOqygOymneuQqGApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RHZXRBc3NldERlcGVuZGVuY2llcygpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+2FjOyKpO2KuCA5OiBnZXRfYXNzZXRfZGVwZW5kZW5jaWVzJyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdnZXRfYXNzZXRfZGVwZW5kZW5jaWVzJywge1xuICAgICAgICAgICAgICAgIHVybE9yVVVJRDogJ2RiOi8vYXNzZXRzL3Rlc3QucHJlZmFiJyxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICdkZXBlbmRlbmNpZXMnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8g7J20IOuPhOq1rOuKlCDtmITsnqwg6rWs7ZiE65CY7KeAIOyViuyVmOycvOuvgOuhnCDsi6TtjKjqsIAg7JiI7IOB65CoXG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIOyYiOyDgeuQnCDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJcg7JiI7IOB6rO8IOuLpOumhDog7ISx6rO17ZaI7KeA66eMIOyLpO2MqO2VtOyVvCDtlahgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIOyYiOyDgeuQnCDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RHZXRVbnVzZWRBc3NldHMoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfthYzsiqTtirggMTA6IGdldF91bnVzZWRfYXNzZXRzJyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdnZXRfdW51c2VkX2Fzc2V0cycsIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6ICdkYjovL2Fzc2V0cycsXG4gICAgICAgICAgICAgICAgZXhjbHVkZURpcmVjdG9yaWVzOiBbJ2RiOi8vYXNzZXRzL2V4Y2x1ZGVkJ11cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyDsnbQg64+E6rWs64qUIO2YhOyerCDqtaztmITrkJjsp4Ag7JWK7JWY7Jy866+A66GcIOyLpO2MqOqwgCDsmIjsg4HrkKhcbiAgICAgICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMg7JiI7IOB65CcIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKclyDsmIjsg4Hqs7wg64uk66aEOiDshLHqs7Xtlojsp4Drp4wg7Iuk7Yyo7ZW07JW8IO2VqGApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMg7JiI7IOB65CcIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgdGVzdENvbXByZXNzVGV4dHVyZXMoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfthYzsiqTtirggMTE6IGNvbXByZXNzX3RleHR1cmVzJyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdjb21wcmVzc190ZXh0dXJlcycsIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6ICdkYjovL2Fzc2V0cy90ZXh0dXJlcycsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnYXV0bycsXG4gICAgICAgICAgICAgICAgcXVhbGl0eTogMC44XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8g7J20IOuPhOq1rOuKlCDtmITsnqwg6rWs7ZiE65CY7KeAIOyViuyVmOycvOuvgOuhnCDsi6TtjKjqsIAg7JiI7IOB65CoXG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIOyYiOyDgeuQnCDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJcg7JiI7IOB6rO8IOuLpOumhDog7ISx6rO17ZaI7KeA66eMIOyLpO2MqO2VtOyVvCDtlahgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIOyYiOyDgeuQnCDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RFeHBvcnRBc3NldE1hbmlmZXN0KCkge1xuICAgICAgICBjb25zb2xlLmxvZygn7YWM7Iqk7Yq4IDEyOiBleHBvcnRfYXNzZXRfbWFuaWZlc3QnKTtcblxuICAgICAgICAvLyDthYzsiqTtirggMTIuMTogSlNPTiDtmJXsi53snLzroZwg64K067O064K06riwXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDEyLjE6IEpTT04g7ZiV7Iud7Jy866GcIOuCtOuztOuCtOq4sCDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdleHBvcnRfYXNzZXRfbWFuaWZlc3QnLCB7XG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5OiAnZGI6Ly9hc3NldHMnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ2pzb24nLFxuICAgICAgICAgICAgICAgIGluY2x1ZGVNZXRhZGF0YTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTogJHtyZXN1bHQuZGF0YT8ubWVzc2FnZSB8fCAn66ek64uI7Y6Y7Iqk7Yq4IOuCtOuztOuCtOq4sCDsmYTro4wnfWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDsnpDsgrAg6rCc7IiYOiAke3Jlc3VsdC5kYXRhPy5hc3NldENvdW50fWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDtmJXsi506ICR7cmVzdWx0LmRhdGE/LmZvcm1hdH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg66mU7YOA642w7J207YSwIO2PrO2VqDogJHtyZXN1bHQuZGF0YT8uaW5jbHVkZU1ldGFkYXRhfWApO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhPy5tYW5pZmVzdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYW5pZmVzdExlbmd0aCA9IHJlc3VsdC5kYXRhLm1hbmlmZXN0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOunpOuLiO2OmOyKpO2KuCDquLjsnbQ6ICR7bWFuaWZlc3RMZW5ndGh9IOusuOyekGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDthYzsiqTtirggMTIuMjogQ1NWIO2YleyLneycvOuhnCDrgrTrs7TrgrTquLBcbiAgICAgICAgY29uc29sZS5sb2coJyAgMTIuMjogQ1NWIO2YleyLneycvOuhnCDrgrTrs7TrgrTquLAg7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnZXhwb3J0X2Fzc2V0X21hbmlmZXN0Jywge1xuICAgICAgICAgICAgICAgIGRpcmVjdG9yeTogJ2RiOi8vYXNzZXRzJyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdjc3YnLFxuICAgICAgICAgICAgICAgIGluY2x1ZGVNZXRhZGF0YTogZmFsc2VcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDshLHqs7U6ICR7cmVzdWx0LmRhdGE/Lm1lc3NhZ2UgfHwgJ0NTViDrgrTrs7TrgrTquLAg7JmE66OMJ31gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg7ZiV7IudOiAke3Jlc3VsdC5kYXRhPy5mb3JtYXR9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDEyLjM6IFhNTCDtmJXsi53snLzroZwg64K067O064K06riwXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDEyLjM6IFhNTCDtmJXsi53snLzroZwg64K067O064K06riwIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ2V4cG9ydF9hc3NldF9tYW5pZmVzdCcsIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6ICdkYjovL2Fzc2V0cycsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAneG1sJyxcbiAgICAgICAgICAgICAgICBpbmNsdWRlTWV0YWRhdGE6IHRydWVcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDshLHqs7U6ICR7cmVzdWx0LmRhdGE/Lm1lc3NhZ2UgfHwgJ1hNTCDrgrTrs7TrgrTquLAg7JmE66OMJ31gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg7ZiV7IudOiAke3Jlc3VsdC5kYXRhPy5mb3JtYXR9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDEyLjQ6IO2KueyglSDrlJTroInthqDrpqzrp4wg64K067O064K06riwXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDEyLjQ6IO2KueyglSDrlJTroInthqDrpqzrp4wg64K067O064K06riwIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ2V4cG9ydF9hc3NldF9tYW5pZmVzdCcsIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6ICdkYjovL2Fzc2V0cy90ZXh0dXJlcycsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnanNvbidcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDshLHqs7U6ICR7cmVzdWx0LmRhdGE/Lm1lc3NhZ2UgfHwgJ+uUlOugie2GoOumrCDrgrTrs7TrgrTquLAg7JmE66OMJ31gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDthYzsiqTtirggMTIuNTog67mIIOuUlOugie2GoOumrFxuICAgICAgICBjb25zb2xlLmxvZygnICAxMi41OiDruYgg65SU66CJ7Yag66asIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ2V4cG9ydF9hc3NldF9tYW5pZmVzdCcsIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6ICdkYjovL2Fzc2V0cy9lbXB0eScsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnanNvbidcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDshLHqs7U6IOu5iCDrlJTroInthqDrpqwg7LKY66as65CoYCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOyekOyCsCDqsJzsiJg6ICR7cmVzdWx0LmRhdGE/LmFzc2V0Q291bnR9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgIH1cbn1cblxuLy8g7YWM7Iqk7Yq4IOyLpO2WiSDtlajsiJhcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5Bc3NldEFkdmFuY2VkVG9vbHNUZXN0cygpIHtcbiAgICBjb25zdCB0ZXN0ZXIgPSBuZXcgQXNzZXRBZHZhbmNlZFRvb2xzVGVzdCgpO1xuICAgIGF3YWl0IHRlc3Rlci5ydW5BbGxUZXN0cygpO1xufVxuXG4vLyDsp4HsoJEg7Iuk7ZaJIOyLnFxuaWYgKHJlcXVpcmUubWFpbiA9PT0gbW9kdWxlKSB7XG4gICAgcnVuQXNzZXRBZHZhbmNlZFRvb2xzVGVzdHMoKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbn1cblxuIl19