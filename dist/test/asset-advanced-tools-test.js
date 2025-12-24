"use strict";
/// <reference path="../types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAssetAdvancedToolsTests = exports.AssetAdvancedToolsTest = void 0;
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
exports.runAssetAdvancedToolsTests = runAssetAdvancedToolsTests;
// 직접 실행 시
if (require.main === module) {
    runAssetAdvancedToolsTests().catch(console.error);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtYWR2YW5jZWQtdG9vbHMtdGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90ZXN0L2Fzc2V0LWFkdmFuY2VkLXRvb2xzLXRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFnRDs7O0FBRWhELHdFQUFtRTtBQUVuRTs7R0FFRztBQUNILE1BQWEsc0JBQXNCO0lBRy9CO1FBQ0ksSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLHlDQUFrQixFQUFFLENBQUM7SUFDL0MsQ0FBQztJQUVELEtBQUssQ0FBQyxXQUFXO1FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBRXJELElBQUk7WUFDQSxrQkFBa0I7WUFDbEIsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFMUIseUJBQXlCO1lBQ3pCLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFFL0IsZ0NBQWdDO1lBQ2hDLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFFdEMsOEJBQThCO1lBQzlCLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFFbkMsNkJBQTZCO1lBQzdCLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFFbkMsNkJBQTZCO1lBQzdCLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFFbkMsNkJBQTZCO1lBQzdCLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFFbkMsbUNBQW1DO1lBQ25DLE1BQU0sSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7WUFFekMsZ0NBQWdDO1lBQ2hDLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFFdEMsNEJBQTRCO1lBQzVCLE1BQU0sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFFakMsNEJBQTRCO1lBQzVCLE1BQU0sSUFBSSxDQUFDLG9CQUFvQixFQUFFLENB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QUFtQjtRQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDbEMsSUFBSTtZQUNBLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLEVBQUU7Z0JBQ2xFLFNBQVMsRUFBRSxtQkFBbUI7Z0JBQzlCLE1BQU0sRUFBRSxNQUFNO2FBQ2pCLENBQUMsQ0FBQztZQUVILElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2dCQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixNQUFBLE1BQU0sQ0FBQyxJQUFJLDBDQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7YUFDMUQ7aUJBQU07Z0JBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO2FBQzVDO1NBQ0o7UUFBQyxPQUFPLEtBQVUsRUFBRTtZQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7U0FDN0M7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3BCLENBQUM7Q0FDSjtBQTVrQkQsd0RBNGtCQztBQUVELFlBQVk7QUFDTCxLQUFLLFVBQVUsMEJBQTBCO0lBQzVDLE1BQU0sTUFBTSxHQUFHLElBQUksc0JBQXNCLEVBQUUsQ0FBQztJQUM1QyxNQUFNLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUMvQixDQUFDO0FBSEQsZ0VBR0M7QUFFRCxVQUFVO0FBQ1YsSUFBSSxPQUFPLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtJQUN6QiwwQkFBMEIsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDckQiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwZXMvZWRpdG9yLTJ4LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBBc3NldEFkdmFuY2VkVG9vbHMgfSBmcm9tICcuLi90b29scy9hc3NldC1hZHZhbmNlZC10b29scyc7XG5cbi8qKlxuICogQXNzZXQgQWR2YW5jZWQgVG9vbHMg7YWM7Iqk7Yq4IO2BtOuemOyKpFxuICovXG5leHBvcnQgY2xhc3MgQXNzZXRBZHZhbmNlZFRvb2xzVGVzdCB7XG4gICAgcHJpdmF0ZSBhc3NldFRvb2xzOiBBc3NldEFkdmFuY2VkVG9vbHM7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5hc3NldFRvb2xzID0gbmV3IEFzc2V0QWR2YW5jZWRUb29scygpO1xuICAgIH1cblxuICAgIGFzeW5jIHJ1bkFsbFRlc3RzKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnPT09IEFzc2V0IEFkdmFuY2VkIFRvb2xzIO2FjOyKpO2KuCDsi5zsnpEgPT09XFxuJyk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIO2FjOyKpO2KuCAxOiDrj4Tqtawg66qp66GdIO2ZleyduFxuICAgICAgICAgICAgYXdhaXQgdGhpcy50ZXN0R2V0VG9vbHMoKTtcblxuICAgICAgICAgICAgLy8g7YWM7Iqk7Yq4IDI6IHNhdmVfYXNzZXRfbWV0YVxuICAgICAgICAgICAgYXdhaXQgdGhpcy50ZXN0U2F2ZUFzc2V0TWV0YSgpO1xuXG4gICAgICAgICAgICAvLyDthYzsiqTtirggMzogZ2VuZXJhdGVfYXZhaWxhYmxlX3VybFxuICAgICAgICAgICAgYXdhaXQgdGhpcy50ZXN0R2VuZXJhdGVBdmFpbGFibGVVcmwoKTtcblxuICAgICAgICAgICAgLy8g7YWM7Iqk7Yq4IDQ6IHF1ZXJ5X2Fzc2V0X2RiX3JlYWR5XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnRlc3RRdWVyeUFzc2V0RGJSZWFkeSgpO1xuXG4gICAgICAgICAgICAvLyDthYzsiqTtirggNTogb3Blbl9hc3NldF9leHRlcm5hbFxuICAgICAgICAgICAgYXdhaXQgdGhpcy50ZXN0T3BlbkFzc2V0RXh0ZXJuYWwoKTtcblxuICAgICAgICAgICAgLy8g7YWM7Iqk7Yq4IDY6IGJhdGNoX2ltcG9ydF9hc3NldHNcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGVzdEJhdGNoSW1wb3J0QXNzZXRzKCk7XG5cbiAgICAgICAgICAgIC8vIO2FjOyKpO2KuCA3OiBiYXRjaF9kZWxldGVfYXNzZXRzXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnRlc3RCYXRjaERlbGV0ZUFzc2V0cygpO1xuXG4gICAgICAgICAgICAvLyDthYzsiqTtirggODogdmFsaWRhdGVfYXNzZXRfcmVmZXJlbmNlc1xuICAgICAgICAgICAgYXdhaXQgdGhpcy50ZXN0VmFsaWRhdGVBc3NldFJlZmVyZW5jZXMoKTtcblxuICAgICAgICAgICAgLy8g7YWM7Iqk7Yq4IDk6IGdldF9hc3NldF9kZXBlbmRlbmNpZXNcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGVzdEdldEFzc2V0RGVwZW5kZW5jaWVzKCk7XG5cbiAgICAgICAgICAgIC8vIO2FjOyKpO2KuCAxMDogZ2V0X3VudXNlZF9hc3NldHNcbiAgICAgICAgICAgIGF3YWl0IHRoaXMudGVzdEdldFVudXNlZEFzc2V0cygpO1xuXG4gICAgICAgICAgICAvLyDthYzsiqTtirggMTE6IGNvbXByZXNzX3RleHR1cmVzXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnRlc3RDb21wcmVzc1RleHR1cmVzKCk7XG5cbiAgICAgICAgICAgIC8vIO2FjOyKpO2KuCAxMjogZXhwb3J0X2Fzc2V0X21hbmlmZXN0XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnRlc3RFeHBvcnRBc3NldE1hbmlmZXN0KCk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdcXG49PT0g66qo65OgIO2FjOyKpO2KuCDsmYTro4wgPT09Jyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCfthYzsiqTtirgg7KSRIOyYpOulmCDrsJzsg506JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0ZXN0R2V0VG9vbHMoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfthYzsiqTtirggMTog64+E6rWsIOuqqeuhnSDtmZXsnbgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRvb2xzID0gdGhpcy5hc3NldFRvb2xzLmdldFRvb2xzKCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMg64+E6rWsIOqwnOyImDogJHt0b29scy5sZW5ndGh9YCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGV4cGVjdGVkVG9vbHMgPSBbXG4gICAgICAgICAgICAgICAgJ3NhdmVfYXNzZXRfbWV0YScsXG4gICAgICAgICAgICAgICAgJ2dlbmVyYXRlX2F2YWlsYWJsZV91cmwnLFxuICAgICAgICAgICAgICAgICdxdWVyeV9hc3NldF9kYl9yZWFkeScsXG4gICAgICAgICAgICAgICAgJ29wZW5fYXNzZXRfZXh0ZXJuYWwnLFxuICAgICAgICAgICAgICAgICdiYXRjaF9pbXBvcnRfYXNzZXRzJyxcbiAgICAgICAgICAgICAgICAnYmF0Y2hfZGVsZXRlX2Fzc2V0cycsXG4gICAgICAgICAgICAgICAgJ3ZhbGlkYXRlX2Fzc2V0X3JlZmVyZW5jZXMnLFxuICAgICAgICAgICAgICAgICdnZXRfYXNzZXRfZGVwZW5kZW5jaWVzJyxcbiAgICAgICAgICAgICAgICAnZ2V0X3VudXNlZF9hc3NldHMnLFxuICAgICAgICAgICAgICAgICdjb21wcmVzc190ZXh0dXJlcycsXG4gICAgICAgICAgICAgICAgJ2V4cG9ydF9hc3NldF9tYW5pZmVzdCdcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGV4cGVjdGVkVG9vbHMuZm9yRWFjaCh0b29sTmFtZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSB0b29scy5maW5kKHQgPT4gdC5uYW1lID09PSB0b29sTmFtZSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyAke3Rvb2xOYW1lfTogJHtmb3VuZC5kZXNjcmlwdGlvbn1gKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJcgJHt0b29sTmFtZX06IOywvuydhCDsiJgg7JeG7J2MYCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYCAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RTYXZlQXNzZXRNZXRhKCkge1xuICAgICAgICBjb25zb2xlLmxvZygn7YWM7Iqk7Yq4IDI6IHNhdmVfYXNzZXRfbWV0YScpO1xuXG4gICAgICAgIC8vIO2FjOyKpO2KuCAyLjE6IFVSTOuhnCDrqZTtg4Ag7KCA7J6lXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDIuMTogVVJM66GcIOuplO2DgCDsoIDsnqUg7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnc2F2ZV9hc3NldF9tZXRhJywge1xuICAgICAgICAgICAgICAgIHVybE9yVVVJRDogJ2RiOi8vYXNzZXRzL3Rlc3QucG5nJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBKU09OLnN0cmluZ2lmeSh7IHRlc3Q6ICdtZXRhJyB9KVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTogJHtyZXN1bHQuZGF0YT8ubWVzc2FnZSB8fCAn66mU7YOAIOyggOyepeuQqCd9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIFVVSUQ6ICR7cmVzdWx0LmRhdGE/LnV1aWR9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIFVSTDogJHtyZXN1bHQuZGF0YT8udXJsfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIO2FjOyKpO2KuCAyLjI6IFVVSUTroZwg66mU7YOAIOyggOyepVxuICAgICAgICBjb25zb2xlLmxvZygnICAyLjI6IFVVSUTroZwg66mU7YOAIOyggOyepSDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdzYXZlX2Fzc2V0X21ldGEnLCB7XG4gICAgICAgICAgICAgICAgdXJsT3JVVUlEOiAnMTIzNDU2NzgtMTIzNC0xMjM0LTEyMzQtMTIzNDU2Nzg5MDEyJyxcbiAgICAgICAgICAgICAgICBjb250ZW50OiBKU09OLnN0cmluZ2lmeSh7IHRlc3Q6ICdtZXRhJyB9KVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTogJHtyZXN1bHQuZGF0YT8ubWVzc2FnZSB8fCAn66mU7YOAIOyggOyepeuQqCd9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDIuMzog7J6Y66q765CcIFVSTC9VVUlEXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDIuMzog7J6Y66q765CcIFVSTC9VVUlEIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ3NhdmVfYXNzZXRfbWV0YScsIHtcbiAgICAgICAgICAgICAgICB1cmxPclVVSUQ6ICdpbnZhbGlkLXVybCcsXG4gICAgICAgICAgICAgICAgY29udGVudDogSlNPTi5zdHJpbmdpZnkoeyB0ZXN0OiAnbWV0YScgfSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7JiI7IOB65CcIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYiOyDgeqzvCDri6TrpoQ6IOyEseqzte2WiOyngOunjCDsi6TtjKjtlbTslbwg7ZWoYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyYiOyDgeuQnCDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RHZW5lcmF0ZUF2YWlsYWJsZVVybCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+2FjOyKpO2KuCAzOiBnZW5lcmF0ZV9hdmFpbGFibGVfdXJsJyk7XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDMuMTog7IKs7JqpIOqwgOuKpe2VnCBVUkwg7IOd7ISxXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDMuMTog7IKs7JqpIOqwgOuKpe2VnCBVUkwg7IOd7ISxIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ2dlbmVyYXRlX2F2YWlsYWJsZV91cmwnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnZGI6Ly9hc3NldHMvbmV3LWZpbGUucG5nJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTogJHtyZXN1bHQuZGF0YT8ubWVzc2FnZSB8fCAnVVJMIOyDneyEseuQqCd9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOybkOuzuCBVUkw6ICR7cmVzdWx0LmRhdGE/Lm9yaWdpbmFsVXJsfWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDsgqzsmqkg6rCA64ql7ZWcIFVSTDogJHtyZXN1bHQuZGF0YT8uYXZhaWxhYmxlVXJsfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIO2FjOyKpO2KuCAzLjI6IOydtOuvuCDsobTsnqztlZjripQgVVJMICjspJHrs7Ug7LK07YGsKVxuICAgICAgICBjb25zb2xlLmxvZygnICAzLjI6IOydtOuvuCDsobTsnqztlZjripQgVVJMIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ2dlbmVyYXRlX2F2YWlsYWJsZV91cmwnLCB7XG4gICAgICAgICAgICAgICAgdXJsOiAnZGI6Ly9hc3NldHMvZXhpc3RpbmctZmlsZS5wbmcnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICdVUkwg7IOd7ISx65CoJ31gKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRhdGE/Lm9yaWdpbmFsVXJsICE9PSByZXN1bHQuZGF0YT8uYXZhaWxhYmxlVXJsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDsg4jroZzsmrQgVVJMIOyDneyEseuQqDogJHtyZXN1bHQuZGF0YT8uYXZhaWxhYmxlVXJsfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0ZXN0UXVlcnlBc3NldERiUmVhZHkoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfthYzsiqTtirggNDogcXVlcnlfYXNzZXRfZGJfcmVhZHknKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ3F1ZXJ5X2Fzc2V0X2RiX3JlYWR5Jywge30pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICdEQiDsg4Htg5wg7ZmV7J2465CoJ31gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOykgOu5hCDsg4Htg5w6ICR7cmVzdWx0LmRhdGE/LnJlYWR5ID8gJ+ykgOu5hOuQqCcgOiAn7KSA67mEIOyViOuQqCd9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0ZXN0T3BlbkFzc2V0RXh0ZXJuYWwoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfthYzsiqTtirggNTogb3Blbl9hc3NldF9leHRlcm5hbCcpO1xuXG4gICAgICAgIC8vIO2FjOyKpO2KuCA1LjE6IFVSTOuhnCDsl7TquLBcbiAgICAgICAgY29uc29sZS5sb2coJyAgNS4xOiBVUkzroZwg7J6Q7IKwIOyXtOq4sCDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdvcGVuX2Fzc2V0X2V4dGVybmFsJywge1xuICAgICAgICAgICAgICAgIHVybE9yVVVJRDogJ2RiOi8vYXNzZXRzL3Rlc3QucG5nJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTogJHtyZXN1bHQubWVzc2FnZSB8fCAn7J6Q7IKwIOychOy5mCDtkZzsi5zrkKgnfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIO2FjOyKpO2KuCA1LjI6IFVVSUTroZwg7Je06riwXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDUuMjogVVVJROuhnCDsnpDsgrAg7Je06riwIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ29wZW5fYXNzZXRfZXh0ZXJuYWwnLCB7XG4gICAgICAgICAgICAgICAgdXJsT3JVVUlEOiAnMTIzNDU2NzgtMTIzNC0xMjM0LTEyMzQtMTIzNDU2Nzg5MDEyJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTogJHtyZXN1bHQubWVzc2FnZSB8fCAn7J6Q7IKwIOychOy5mCDtkZzsi5zrkKgnfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RCYXRjaEltcG9ydEFzc2V0cygpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+2FjOyKpO2KuCA2OiBiYXRjaF9pbXBvcnRfYXNzZXRzJyk7XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDYuMTog6riw67O4IOuwsOy5mCDqsIDsoLjsmKTquLBcbiAgICAgICAgY29uc29sZS5sb2coJyAgNi4xOiDquLDrs7gg67Cw7LmYIOqwgOyguOyYpOq4sCDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdiYXRjaF9pbXBvcnRfYXNzZXRzJywge1xuICAgICAgICAgICAgICAgIHNvdXJjZURpcmVjdG9yeTogJy90bXAvdGVzdC1hc3NldHMnLFxuICAgICAgICAgICAgICAgIHRhcmdldERpcmVjdG9yeTogJ2RiOi8vYXNzZXRzL2ltcG9ydGVkJyxcbiAgICAgICAgICAgICAgICBmaWxlRmlsdGVyOiBbJy5wbmcnLCAnLmpwZyddLFxuICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgb3ZlcndyaXRlOiBmYWxzZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTogJHtyZXN1bHQuZGF0YT8ubWVzc2FnZSB8fCAn6rCA7KC47Jik6riwIOyZhOujjCd9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOyghOyytCDtjIzsnbw6ICR7cmVzdWx0LmRhdGE/LnRvdGFsRmlsZXN9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOyEseqztTogJHtyZXN1bHQuZGF0YT8uc3VjY2Vzc0NvdW50fWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDsi6TtjKg6ICR7cmVzdWx0LmRhdGE/LmVycm9yQ291bnR9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDYuMjog7KG07J6s7ZWY7KeAIOyViuuKlCDrlJTroInthqDrpqxcbiAgICAgICAgY29uc29sZS5sb2coJyAgNi4yOiDsobTsnqztlZjsp4Ag7JWK64qUIOuUlOugie2GoOumrCDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdiYXRjaF9pbXBvcnRfYXNzZXRzJywge1xuICAgICAgICAgICAgICAgIHNvdXJjZURpcmVjdG9yeTogJy9ub25leGlzdGVudC9kaXJlY3RvcnknLFxuICAgICAgICAgICAgICAgIHRhcmdldERpcmVjdG9yeTogJ2RiOi8vYXNzZXRzL2ltcG9ydGVkJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghcmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDsmIjsg4HrkJwg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7JiI7IOB6rO8IOuLpOumhDog7ISx6rO17ZaI7KeA66eMIOyLpO2MqO2VtOyVvCDtlahgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7JiI7IOB65CcIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDYuMzog7J6s6reAIOqwgOyguOyYpOq4sFxuICAgICAgICBjb25zb2xlLmxvZygnICA2LjM6IOyerOq3gCDqsIDsoLjsmKTquLAg7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnYmF0Y2hfaW1wb3J0X2Fzc2V0cycsIHtcbiAgICAgICAgICAgICAgICBzb3VyY2VEaXJlY3Rvcnk6ICcvdG1wL3Rlc3QtYXNzZXRzJyxcbiAgICAgICAgICAgICAgICB0YXJnZXREaXJlY3Rvcnk6ICdkYjovL2Fzc2V0cy9pbXBvcnRlZCcsXG4gICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGZpbGVGaWx0ZXI6IFsnLnBuZyddXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICfsnqzqt4Ag6rCA7KC47Jik6riwIOyZhOujjCd9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coJycpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgdGVzdEJhdGNoRGVsZXRlQXNzZXRzKCkge1xuICAgICAgICBjb25zb2xlLmxvZygn7YWM7Iqk7Yq4IDc6IGJhdGNoX2RlbGV0ZV9hc3NldHMnKTtcblxuICAgICAgICAvLyDthYzsiqTtirggNy4xOiDquLDrs7gg67Cw7LmYIOyCreygnFxuICAgICAgICBjb25zb2xlLmxvZygnICA3LjE6IOq4sOuzuCDrsLDsuZgg7IKt7KCcIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ2JhdGNoX2RlbGV0ZV9hc3NldHMnLCB7XG4gICAgICAgICAgICAgICAgdXJsczogW1xuICAgICAgICAgICAgICAgICAgICAnZGI6Ly9hc3NldHMvdGVzdDEucG5nJyxcbiAgICAgICAgICAgICAgICAgICAgJ2RiOi8vYXNzZXRzL3Rlc3QyLnBuZycsXG4gICAgICAgICAgICAgICAgICAgICdkYjovL2Fzc2V0cy90ZXN0My5wbmcnXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTogJHtyZXN1bHQuZGF0YT8ubWVzc2FnZSB8fCAn7IKt7KCcIOyZhOujjCd9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOyghOyytCDsnpDsgrA6ICR7cmVzdWx0LmRhdGE/LnRvdGFsQXNzZXRzfWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDshLHqs7U6ICR7cmVzdWx0LmRhdGE/LnN1Y2Nlc3NDb3VudH1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDthYzsiqTtirggNy4yOiDruYgg67Cw7Je0XG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDcuMjog67mIIOuwsOyXtCDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdiYXRjaF9kZWxldGVfYXNzZXRzJywge1xuICAgICAgICAgICAgICAgIHVybHM6IFtdXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiDruYgg67Cw7Je0IOyymOumrOuQqGApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RWYWxpZGF0ZUFzc2V0UmVmZXJlbmNlcygpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+2FjOyKpO2KuCA4OiB2YWxpZGF0ZV9hc3NldF9yZWZlcmVuY2VzJyk7XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDguMTog6riw67O4IOqygOymnVxuICAgICAgICBjb25zb2xlLmxvZygnICA4LjE6IOq4sOuzuCDqsoDspp0g7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgndmFsaWRhdGVfYXNzZXRfcmVmZXJlbmNlcycsIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6ICdkYjovL2Fzc2V0cydcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDshLHqs7U6ICR7cmVzdWx0LmRhdGE/Lm1lc3NhZ2UgfHwgJ+qygOymnSDsmYTro4wnfWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDsoITssrQg7J6Q7IKwOiAke3Jlc3VsdC5kYXRhPy50b3RhbEFzc2V0c31gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg7Jyg7Zqo7ZWcIOywuOyhsDogJHtyZXN1bHQuZGF0YT8udmFsaWRSZWZlcmVuY2VzfWApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDquajsp4Qg7LC47KGwOiAke3Jlc3VsdC5kYXRhPy5icm9rZW5SZWZlcmVuY2VzfWApO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kYXRhPy5icm9rZW5Bc3NldHMgJiYgcmVzdWx0LmRhdGEuYnJva2VuQXNzZXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOq5qOynhCDsnpDsgrAg66qp66GdOmApO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZGF0YS5icm9rZW5Bc3NldHMuc2xpY2UoMCwgMykuZm9yRWFjaCgoYXNzZXQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgICAgLSAke2Fzc2V0Lm5hbWV9OiAke2Fzc2V0LmVycm9yfWApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDguMjog7Yq57KCVIOuUlOugie2GoOumrCDqsoDspp1cbiAgICAgICAgY29uc29sZS5sb2coJyAgOC4yOiDtirnsoJUg65SU66CJ7Yag66asIOqygOymnSDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCd2YWxpZGF0ZV9hc3NldF9yZWZlcmVuY2VzJywge1xuICAgICAgICAgICAgICAgIGRpcmVjdG9yeTogJ2RiOi8vYXNzZXRzL3RleHR1cmVzJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTogJHtyZXN1bHQuZGF0YT8ubWVzc2FnZSB8fCAn6rKA7KadIOyZhOujjCd9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDguMzog6riw67O46rCSIOyCrOyaqSAoZGlyZWN0b3J5IOyXhuydjClcbiAgICAgICAgY29uc29sZS5sb2coJyAgOC4zOiDquLDrs7jqsJIg7IKs7JqpIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ3ZhbGlkYXRlX2Fzc2V0X3JlZmVyZW5jZXMnLCB7fSk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyTIOyEseqztTog6riw67O4IOuUlOugie2GoOumrOuhnCDqsoDspp3rkKhgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJcg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0ZXN0R2V0QXNzZXREZXBlbmRlbmNpZXMoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCfthYzsiqTtirggOTogZ2V0X2Fzc2V0X2RlcGVuZGVuY2llcycpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnZ2V0X2Fzc2V0X2RlcGVuZGVuY2llcycsIHtcbiAgICAgICAgICAgICAgICB1cmxPclVVSUQ6ICdkYjovL2Fzc2V0cy90ZXN0LnByZWZhYicsXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAnZGVwZW5kZW5jaWVzJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIOydtCDrj4TqtazripQg7ZiE7J6sIOq1rO2YhOuQmOyngCDslYrslZjsnLzrr4DroZwg7Iuk7Yyo6rCAIOyYiOyDgeuQqFxuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyDsmIjsg4HrkJwg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyXIOyYiOyDgeqzvCDri6TrpoQ6IOyEseqzte2WiOyngOunjCDsi6TtjKjtlbTslbwg7ZWoYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyDsmIjsg4HrkJwg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0ZXN0R2V0VW51c2VkQXNzZXRzKCkge1xuICAgICAgICBjb25zb2xlLmxvZygn7YWM7Iqk7Yq4IDEwOiBnZXRfdW51c2VkX2Fzc2V0cycpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnZ2V0X3VudXNlZF9hc3NldHMnLCB7XG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5OiAnZGI6Ly9hc3NldHMnLFxuICAgICAgICAgICAgICAgIGV4Y2x1ZGVEaXJlY3RvcmllczogWydkYjovL2Fzc2V0cy9leGNsdWRlZCddXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8g7J20IOuPhOq1rOuKlCDtmITsnqwg6rWs7ZiE65CY7KeAIOyViuyVmOycvOuvgOuhnCDsi6TtjKjqsIAg7JiI7IOB65CoXG4gICAgICAgICAgICBpZiAoIXJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIOyYiOyDgeuQnCDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICDinJcg7JiI7IOB6rO8IOuLpOumhDog7ISx6rO17ZaI7KeA66eMIOyLpO2MqO2VtOyVvCDtlahgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyTIOyYiOyDgeuQnCDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHRlc3RDb21wcmVzc1RleHR1cmVzKCkge1xuICAgICAgICBjb25zb2xlLmxvZygn7YWM7Iqk7Yq4IDExOiBjb21wcmVzc190ZXh0dXJlcycpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnY29tcHJlc3NfdGV4dHVyZXMnLCB7XG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5OiAnZGI6Ly9hc3NldHMvdGV4dHVyZXMnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ2F1dG8nLFxuICAgICAgICAgICAgICAgIHF1YWxpdHk6IDAuOFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIOydtCDrj4TqtazripQg7ZiE7J6sIOq1rO2YhOuQmOyngCDslYrslZjsnLzrr4DroZwg7Iuk7Yyo6rCAIOyYiOyDgeuQqFxuICAgICAgICAgICAgaWYgKCFyZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyDsmIjsg4HrkJwg7Iuk7YyoOiAke3Jlc3VsdC5lcnJvcn1gKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAg4pyXIOyYiOyDgeqzvCDri6TrpoQ6IOyEseqzte2WiOyngOunjCDsi6TtjKjtlbTslbwg7ZWoYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIOKckyDsmIjsg4HrkJwg7Jik66WYOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB0ZXN0RXhwb3J0QXNzZXRNYW5pZmVzdCgpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ+2FjOyKpO2KuCAxMjogZXhwb3J0X2Fzc2V0X21hbmlmZXN0Jyk7XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDEyLjE6IEpTT04g7ZiV7Iud7Jy866GcIOuCtOuztOuCtOq4sFxuICAgICAgICBjb25zb2xlLmxvZygnICAxMi4xOiBKU09OIO2YleyLneycvOuhnCDrgrTrs7TrgrTquLAg7YWM7Iqk7Yq4Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLmFzc2V0VG9vbHMuZXhlY3V0ZSgnZXhwb3J0X2Fzc2V0X21hbmlmZXN0Jywge1xuICAgICAgICAgICAgICAgIGRpcmVjdG9yeTogJ2RiOi8vYXNzZXRzJyxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6ICdqc29uJyxcbiAgICAgICAgICAgICAgICBpbmNsdWRlTWV0YWRhdGE6IHRydWVcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKckyDshLHqs7U6ICR7cmVzdWx0LmRhdGE/Lm1lc3NhZ2UgfHwgJ+unpOuLiO2OmOyKpO2KuCDrgrTrs7TrgrTquLAg7JmE66OMJ31gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg7J6Q7IKwIOqwnOyImDogJHtyZXN1bHQuZGF0YT8uYXNzZXRDb3VudH1gKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgICAg7ZiV7IudOiAke3Jlc3VsdC5kYXRhPy5mb3JtYXR9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIOuplO2DgOuNsOydtO2EsCDtj6ztlag6ICR7cmVzdWx0LmRhdGE/LmluY2x1ZGVNZXRhZGF0YX1gKTtcblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZGF0YT8ubWFuaWZlc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFuaWZlc3RMZW5ndGggPSByZXN1bHQuZGF0YS5tYW5pZmVzdC5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDrp6Tri4jtjpjsiqTtirgg6ri47J20OiAke21hbmlmZXN0TGVuZ3RofSDrrLjsnpBgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDEyLjI6IENTViDtmJXsi53snLzroZwg64K067O064K06riwXG4gICAgICAgIGNvbnNvbGUubG9nKCcgIDEyLjI6IENTViDtmJXsi53snLzroZwg64K067O064K06riwIO2FjOyKpO2KuCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5hc3NldFRvb2xzLmV4ZWN1dGUoJ2V4cG9ydF9hc3NldF9tYW5pZmVzdCcsIHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6ICdkYjovL2Fzc2V0cycsXG4gICAgICAgICAgICAgICAgZm9ybWF0OiAnY3N2JyxcbiAgICAgICAgICAgICAgICBpbmNsdWRlTWV0YWRhdGE6IGZhbHNlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICdDU1Yg64K067O064K06riwIOyZhOujjCd9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIO2YleyLnTogJHtyZXN1bHQuZGF0YT8uZm9ybWF0fWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIO2FjOyKpO2KuCAxMi4zOiBYTUwg7ZiV7Iud7Jy866GcIOuCtOuztOuCtOq4sFxuICAgICAgICBjb25zb2xlLmxvZygnICAxMi4zOiBYTUwg7ZiV7Iud7Jy866GcIOuCtOuztOuCtOq4sCDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdleHBvcnRfYXNzZXRfbWFuaWZlc3QnLCB7XG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5OiAnZGI6Ly9hc3NldHMnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ3htbCcsXG4gICAgICAgICAgICAgICAgaW5jbHVkZU1ldGFkYXRhOiB0cnVlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICdYTUwg64K067O064K06riwIOyZhOujjCd9YCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICAgIO2YleyLnTogJHtyZXN1bHQuZGF0YT8uZm9ybWF0fWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIO2FjOyKpO2KuCAxMi40OiDtirnsoJUg65SU66CJ7Yag66as66eMIOuCtOuztOuCtOq4sFxuICAgICAgICBjb25zb2xlLmxvZygnICAxMi40OiDtirnsoJUg65SU66CJ7Yag66as66eMIOuCtOuztOuCtOq4sCDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdleHBvcnRfYXNzZXRfbWFuaWZlc3QnLCB7XG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5OiAnZGI6Ly9hc3NldHMvdGV4dHVyZXMnLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ2pzb24nXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiAke3Jlc3VsdC5kYXRhPy5tZXNzYWdlIHx8ICfrlJTroInthqDrpqwg64K067O064K06riwIOyZhOujjCd9YCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyLpO2MqDogJHtyZXN1bHQuZXJyb3J9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAg4pyXIOyYpOulmDogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g7YWM7Iqk7Yq4IDEyLjU6IOu5iCDrlJTroInthqDrpqxcbiAgICAgICAgY29uc29sZS5sb2coJyAgMTIuNTog67mIIOuUlOugie2GoOumrCDthYzsiqTtirgnKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuYXNzZXRUb29scy5leGVjdXRlKCdleHBvcnRfYXNzZXRfbWFuaWZlc3QnLCB7XG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5OiAnZGI6Ly9hc3NldHMvZW1wdHknLFxuICAgICAgICAgICAgICAgIGZvcm1hdDogJ2pzb24nXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgICDinJMg7ISx6rO1OiDruYgg65SU66CJ7Yag66asIOyymOumrOuQqGApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgICAgICDsnpDsgrAg6rCc7IiYOiAke3Jlc3VsdC5kYXRhPy5hc3NldENvdW50fWApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsi6TtjKg6ICR7cmVzdWx0LmVycm9yfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgICAgIOKclyDsmKTrpZg6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCcnKTtcbiAgICB9XG59XG5cbi8vIO2FjOyKpO2KuCDsi6Ttlokg7ZWo7IiYXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuQXNzZXRBZHZhbmNlZFRvb2xzVGVzdHMoKSB7XG4gICAgY29uc3QgdGVzdGVyID0gbmV3IEFzc2V0QWR2YW5jZWRUb29sc1Rlc3QoKTtcbiAgICBhd2FpdCB0ZXN0ZXIucnVuQWxsVGVzdHMoKTtcbn1cblxuLy8g7KeB7KCRIOyLpO2WiSDsi5xcbmlmIChyZXF1aXJlLm1haW4gPT09IG1vZHVsZSkge1xuICAgIHJ1bkFzc2V0QWR2YW5jZWRUb29sc1Rlc3RzKCkuY2F0Y2goY29uc29sZS5lcnJvcik7XG59XG5cbiJdfQ==