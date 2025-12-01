/// <reference path="../types/editor-2x.d.ts" />

import { AssetAdvancedTools } from '../tools/asset-advanced-tools';

/**
 * Asset Advanced Tools 테스트 클래스
 */
export class AssetAdvancedToolsTest {
    private assetTools: AssetAdvancedTools;

    constructor() {
        this.assetTools = new AssetAdvancedTools();
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
        } catch (error) {
            console.error('테스트 중 오류 발생:', error);
        }
    }

    private async testGetTools() {
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
                } else {
                    console.log(`  ✗ ${toolName}: 찾을 수 없음`);
                }
            });
        } catch (error: any) {
            console.error(`  ✗ 오류: ${error.message}`);
        }
        console.log('');
    }

    private async testSaveAssetMeta() {
        console.log('테스트 2: save_asset_meta');

        // 테스트 2.1: URL로 메타 저장
        console.log('  2.1: URL로 메타 저장 테스트');
        try {
            const result = await this.assetTools.execute('save_asset_meta', {
                urlOrUUID: 'db://assets/test.png',
                content: JSON.stringify({ test: 'meta' })
            });

            if (result.success) {
                console.log(`    ✓ 성공: ${result.data?.message || '메타 저장됨'}`);
                console.log(`      UUID: ${result.data?.uuid}`);
                console.log(`      URL: ${result.data?.url}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
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
                console.log(`    ✓ 성공: ${result.data?.message || '메타 저장됨'}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
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
            } else {
                console.log(`    ✗ 예상과 다름: 성공했지만 실패해야 함`);
            }
        } catch (error: any) {
            console.log(`    ✓ 예상된 오류: ${error.message}`);
        }

        console.log('');
    }

    private async testGenerateAvailableUrl() {
        console.log('테스트 3: generate_available_url');

        // 테스트 3.1: 사용 가능한 URL 생성
        console.log('  3.1: 사용 가능한 URL 생성 테스트');
        try {
            const result = await this.assetTools.execute('generate_available_url', {
                url: 'db://assets/new-file.png'
            });

            if (result.success) {
                console.log(`    ✓ 성공: ${result.data?.message || 'URL 생성됨'}`);
                console.log(`      원본 URL: ${result.data?.originalUrl}`);
                console.log(`      사용 가능한 URL: ${result.data?.availableUrl}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.log(`    ✗ 오류: ${error.message}`);
        }

        // 테스트 3.2: 이미 존재하는 URL (중복 체크)
        console.log('  3.2: 이미 존재하는 URL 테스트');
        try {
            const result = await this.assetTools.execute('generate_available_url', {
                url: 'db://assets/existing-file.png'
            });

            if (result.success) {
                console.log(`    ✓ 성공: ${result.data?.message || 'URL 생성됨'}`);
                if (result.data?.originalUrl !== result.data?.availableUrl) {
                    console.log(`      새로운 URL 생성됨: ${result.data?.availableUrl}`);
                }
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.log(`    ✗ 오류: ${error.message}`);
        }

        console.log('');
    }

    private async testQueryAssetDbReady() {
        console.log('테스트 4: query_asset_db_ready');

        try {
            const result = await this.assetTools.execute('query_asset_db_ready', {});

            if (result.success) {
                console.log(`  ✓ 성공: ${result.data?.message || 'DB 상태 확인됨'}`);
                console.log(`    준비 상태: ${result.data?.ready ? '준비됨' : '준비 안됨'}`);
            } else {
                console.log(`  ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.log(`  ✗ 오류: ${error.message}`);
        }

        console.log('');
    }

    private async testOpenAssetExternal() {
        console.log('테스트 5: open_asset_external');

        // 테스트 5.1: URL로 열기
        console.log('  5.1: URL로 자산 열기 테스트');
        try {
            const result = await this.assetTools.execute('open_asset_external', {
                urlOrUUID: 'db://assets/test.png'
            });

            if (result.success) {
                console.log(`    ✓ 성공: ${result.message || '자산 위치 표시됨'}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
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
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.log(`    ✗ 오류: ${error.message}`);
        }

        console.log('');
    }

    private async testBatchImportAssets() {
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
                console.log(`    ✓ 성공: ${result.data?.message || '가져오기 완료'}`);
                console.log(`      전체 파일: ${result.data?.totalFiles}`);
                console.log(`      성공: ${result.data?.successCount}`);
                console.log(`      실패: ${result.data?.errorCount}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
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
            } else {
                console.log(`    ✗ 예상과 다름: 성공했지만 실패해야 함`);
            }
        } catch (error: any) {
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
                console.log(`    ✓ 성공: ${result.data?.message || '재귀 가져오기 완료'}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.log(`    ✗ 오류: ${error.message}`);
        }

        console.log('');
    }

    private async testBatchDeleteAssets() {
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
                console.log(`    ✓ 성공: ${result.data?.message || '삭제 완료'}`);
                console.log(`      전체 자산: ${result.data?.totalAssets}`);
                console.log(`      성공: ${result.data?.successCount}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
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
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.log(`    ✗ 오류: ${error.message}`);
        }

        console.log('');
    }

    private async testValidateAssetReferences() {
        console.log('테스트 8: validate_asset_references');

        // 테스트 8.1: 기본 검증
        console.log('  8.1: 기본 검증 테스트');
        try {
            const result = await this.assetTools.execute('validate_asset_references', {
                directory: 'db://assets'
            });

            if (result.success) {
                console.log(`    ✓ 성공: ${result.data?.message || '검증 완료'}`);
                console.log(`      전체 자산: ${result.data?.totalAssets}`);
                console.log(`      유효한 참조: ${result.data?.validReferences}`);
                console.log(`      깨진 참조: ${result.data?.brokenReferences}`);

                if (result.data?.brokenAssets && result.data.brokenAssets.length > 0) {
                    console.log(`      깨진 자산 목록:`);
                    result.data.brokenAssets.slice(0, 3).forEach((asset: any) => {
                        console.log(`        - ${asset.name}: ${asset.error}`);
                    });
                }
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.log(`    ✗ 오류: ${error.message}`);
        }

        // 테스트 8.2: 특정 디렉토리 검증
        console.log('  8.2: 특정 디렉토리 검증 테스트');
        try {
            const result = await this.assetTools.execute('validate_asset_references', {
                directory: 'db://assets/textures'
            });

            if (result.success) {
                console.log(`    ✓ 성공: ${result.data?.message || '검증 완료'}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.log(`    ✗ 오류: ${error.message}`);
        }

        // 테스트 8.3: 기본값 사용 (directory 없음)
        console.log('  8.3: 기본값 사용 테스트');
        try {
            const result = await this.assetTools.execute('validate_asset_references', {});

            if (result.success) {
                console.log(`    ✓ 성공: 기본 디렉토리로 검증됨`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.log(`    ✗ 오류: ${error.message}`);
        }

        console.log('');
    }

    private async testGetAssetDependencies() {
        console.log('테스트 9: get_asset_dependencies');

        try {
            const result = await this.assetTools.execute('get_asset_dependencies', {
                urlOrUUID: 'db://assets/test.prefab',
                direction: 'dependencies'
            });

            // 이 도구는 현재 구현되지 않았으므로 실패가 예상됨
            if (!result.success) {
                console.log(`  ✓ 예상된 실패: ${result.error}`);
            } else {
                console.log(`  ✗ 예상과 다름: 성공했지만 실패해야 함`);
            }
        } catch (error: any) {
            console.log(`  ✓ 예상된 오류: ${error.message}`);
        }

        console.log('');
    }

    private async testGetUnusedAssets() {
        console.log('테스트 10: get_unused_assets');

        try {
            const result = await this.assetTools.execute('get_unused_assets', {
                directory: 'db://assets',
                excludeDirectories: ['db://assets/excluded']
            });

            // 이 도구는 현재 구현되지 않았으므로 실패가 예상됨
            if (!result.success) {
                console.log(`  ✓ 예상된 실패: ${result.error}`);
            } else {
                console.log(`  ✗ 예상과 다름: 성공했지만 실패해야 함`);
            }
        } catch (error: any) {
            console.log(`  ✓ 예상된 오류: ${error.message}`);
        }

        console.log('');
    }

    private async testCompressTextures() {
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
            } else {
                console.log(`  ✗ 예상과 다름: 성공했지만 실패해야 함`);
            }
        } catch (error: any) {
            console.log(`  ✓ 예상된 오류: ${error.message}`);
        }

        console.log('');
    }

    private async testExportAssetManifest() {
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
                console.log(`    ✓ 성공: ${result.data?.message || '매니페스트 내보내기 완료'}`);
                console.log(`      자산 개수: ${result.data?.assetCount}`);
                console.log(`      형식: ${result.data?.format}`);
                console.log(`      메타데이터 포함: ${result.data?.includeMetadata}`);

                if (result.data?.manifest) {
                    const manifestLength = result.data.manifest.length;
                    console.log(`      매니페스트 길이: ${manifestLength} 문자`);
                }
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
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
                console.log(`    ✓ 성공: ${result.data?.message || 'CSV 내보내기 완료'}`);
                console.log(`      형식: ${result.data?.format}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
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
                console.log(`    ✓ 성공: ${result.data?.message || 'XML 내보내기 완료'}`);
                console.log(`      형식: ${result.data?.format}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
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
                console.log(`    ✓ 성공: ${result.data?.message || '디렉토리 내보내기 완료'}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
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
                console.log(`      자산 개수: ${result.data?.assetCount}`);
            } else {
                console.log(`    ✗ 실패: ${result.error}`);
            }
        } catch (error: any) {
            console.log(`    ✗ 오류: ${error.message}`);
        }

        console.log('');
    }
}

// 테스트 실행 함수
export async function runAssetAdvancedToolsTests() {
    const tester = new AssetAdvancedToolsTest();
    await tester.runAllTests();
}

// 직접 실행 시
if (require.main === module) {
    runAssetAdvancedToolsTests().catch(console.error);
}

