/// <reference path="../types/editor-2x.d.ts" />

import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

// Constants
const DEFAULT_ASSET_DIRECTORY = 'db://assets';
const MAX_URL_GENERATION_ATTEMPTS = 100;
const ASSET_EXPLORE_MESSAGE = 'Asset location revealed in file system. Please open manually with your preferred program.';

// Type Definitions
interface AssetInfo {
    name: string;
    url: string;
    uuid: string;
    type: string;
    size?: number;
    isDirectory?: boolean;
}

interface BatchImportResult {
    source: string;
    target?: string;
    success: boolean;
    error?: string;
    uuid?: string;
}

interface BatchDeleteResult {
    url: string;
    success: boolean;
    error?: string;
}

interface BatchImportArgs {
    sourceDirectory: string;
    targetDirectory: string;
    fileFilter?: string[];
    recursive?: boolean;
    overwrite?: boolean;
}

interface NormalizedAsset {
    url: string;
    uuid: string;
}

export class AssetAdvancedTools implements ToolExecutor {
    // Utility Functions

    /**
     * Check if the given string is a URL (starts with 'db://')
     */
    private isUrl(urlOrUUID: string): boolean {
        return urlOrUUID.startsWith('db://');
    }

    /**
     * Convert URL to UUID
     */
    private convertUrlToUuid(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            Editor.assetdb.queryUuidByUrl(url, (err: Error | null, uuid: string) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(uuid);
                }
            });
        });
    }

    /**
     * Convert UUID to URL
     */
    private convertUuidToUrl(uuid: string): Promise<string> {
        return new Promise((resolve, reject) => {
            Editor.assetdb.queryUrlByUuid(uuid, (err: Error | null, url: string) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(url);
                }
            });
        });
    }

    /**
     * Normalize URL or UUID to get both URL and UUID
     */
    private async normalizeUrlOrUuid(urlOrUUID: string): Promise<NormalizedAsset> {
        if (this.isUrl(urlOrUUID)) {
            const uuid = await this.convertUrlToUuid(urlOrUUID);
            return { url: urlOrUUID, uuid };
        } else {
            const url = await this.convertUuidToUrl(urlOrUUID);
            return { url, uuid: urlOrUUID };
        }
    }

    /**
     * Promisify assetdb callback functions
     */
    private promisifyAssetDb<T>(
        callbackFn: (cb: (err: Error | null, result: T) => void) => void
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            callbackFn((err: Error | null, result: T) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * Process items sequentially
     */
    private async processSequentially<T, R>(
        items: T[],
        processor: (item: T, index: number) => Promise<R>
    ): Promise<R[]> {
        const results: R[] = [];
        for (let i = 0; i < items.length; i++) {
            const result = await processor(items[i], i);
            results.push(result);
        }
        return results;
    }

    /**
     * Create error response
     */
    private createErrorResponse(error: Error | string): ToolResponse {
        return {
            success: false,
            error: error instanceof Error ? error.message : error
        };
    }

    /**
     * Create success response
     */
    private createSuccessResponse(data?: any, message?: string): ToolResponse {
        const response: ToolResponse = {
            success: true
        };
        if (data !== undefined) {
            response.data = data;
        }
        if (message) {
            if (response.data) {
                response.data.message = message;
            } else {
                response.message = message;
            }
        }
        return response;
    }

    // Public Methods

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'save_asset_meta',
                description: 'Save asset meta information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        urlOrUUID: {
                            type: 'string',
                            description: 'Asset URL or UUID'
                        },
                        content: {
                            type: 'string',
                            description: 'Asset meta serialized content string'
                        }
                    },
                    required: ['urlOrUUID', 'content']
                }
            },
            {
                name: 'generate_available_url',
                description: 'Generate an available URL based on input URL',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                            description: 'Asset URL to generate available URL for'
                        }
                    },
                    required: ['url']
                }
            },
            {
                name: 'query_asset_db_ready',
                description: 'Check if asset database is ready',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'open_asset_external',
                description: 'Open asset with external program',
                inputSchema: {
                    type: 'object',
                    properties: {
                        urlOrUUID: {
                            type: 'string',
                            description: 'Asset URL or UUID to open'
                        }
                    },
                    required: ['urlOrUUID']
                }
            },
            {
                name: 'batch_import_assets',
                description: 'Import multiple assets in batch',
                inputSchema: {
                    type: 'object',
                    properties: {
                        sourceDirectory: {
                            type: 'string',
                            description: 'Source directory path'
                        },
                        targetDirectory: {
                            type: 'string',
                            description: 'Target directory URL'
                        },
                        fileFilter: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'File extensions to include (e.g., [".png", ".jpg"])',
                            default: []
                        },
                        recursive: {
                            type: 'boolean',
                            description: 'Include subdirectories',
                            default: false
                        },
                        overwrite: {
                            type: 'boolean',
                            description: 'Overwrite existing files',
                            default: false
                        }
                    },
                    required: ['sourceDirectory', 'targetDirectory']
                }
            },
            {
                name: 'batch_delete_assets',
                description: 'Delete multiple assets in batch',
                inputSchema: {
                    type: 'object',
                    properties: {
                        urls: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of asset URLs to delete'
                        }
                    },
                    required: ['urls']
                }
            },
            {
                name: 'validate_asset_references',
                description: 'Validate asset references and find broken links',
                inputSchema: {
                    type: 'object',
                    properties: {
                        directory: {
                            type: 'string',
                            description: 'Directory to validate (default: entire project)',
                            default: 'db://assets'
                        }
                    }
                }
            },
            {
                name: 'get_asset_dependencies',
                description: 'Get asset dependency tree',
                inputSchema: {
                    type: 'object',
                    properties: {
                        urlOrUUID: {
                            type: 'string',
                            description: 'Asset URL or UUID'
                        },
                        direction: {
                            type: 'string',
                            description: 'Dependency direction',
                            enum: ['dependents', 'dependencies', 'both'],
                            default: 'dependencies'
                        }
                    },
                    required: ['urlOrUUID']
                }
            },
            {
                name: 'get_unused_assets',
                description: 'Find unused assets in project',
                inputSchema: {
                    type: 'object',
                    properties: {
                        directory: {
                            type: 'string',
                            description: 'Directory to scan (default: entire project)',
                            default: 'db://assets'
                        },
                        excludeDirectories: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Directories to exclude from scan',
                            default: []
                        }
                    }
                }
            },
            {
                name: 'compress_textures',
                description: 'Batch compress texture assets',
                inputSchema: {
                    type: 'object',
                    properties: {
                        directory: {
                            type: 'string',
                            description: 'Directory containing textures',
                            default: 'db://assets'
                        },
                        format: {
                            type: 'string',
                            description: 'Compression format',
                            enum: ['auto', 'jpg', 'png', 'webp'],
                            default: 'auto'
                        },
                        quality: {
                            type: 'number',
                            description: 'Compression quality (0.1-1.0)',
                            minimum: 0.1,
                            maximum: 1.0,
                            default: 0.8
                        }
                    }
                }
            },
            {
                name: 'export_asset_manifest',
                description: 'Export asset manifest/inventory',
                inputSchema: {
                    type: 'object',
                    properties: {
                        directory: {
                            type: 'string',
                            description: 'Directory to export manifest for',
                            default: 'db://assets'
                        },
                        format: {
                            type: 'string',
                            description: 'Export format',
                            enum: ['json', 'csv', 'xml'],
                            default: 'json'
                        },
                        includeMetadata: {
                            type: 'boolean',
                            description: 'Include asset metadata',
                            default: true
                        }
                    }
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'save_asset_meta':
                return await this.saveAssetMeta(args.urlOrUUID, args.content);
            case 'generate_available_url':
                return await this.generateAvailableUrl(args.url);
            case 'query_asset_db_ready':
                return await this.queryAssetDbReady();
            case 'open_asset_external':
                return await this.openAssetExternal(args.urlOrUUID);
            case 'batch_import_assets':
                return await this.batchImportAssets(args);
            case 'batch_delete_assets':
                return await this.batchDeleteAssets(args.urls);
            case 'validate_asset_references':
                return await this.validateAssetReferences(args.directory);
            case 'get_asset_dependencies':
                return await this.getAssetDependencies(args.urlOrUUID, args.direction);
            case 'get_unused_assets':
                return await this.getUnusedAssets(args.directory, args.excludeDirectories);
            case 'compress_textures':
                return await this.compressTextures(args.directory, args.format, args.quality);
            case 'export_asset_manifest':
                return await this.exportAssetManifest(args.directory, args.format, args.includeMetadata);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async saveAssetMeta(urlOrUUID: string, content: string): Promise<ToolResponse> {
        try {
            const normalized = await this.normalizeUrlOrUuid(urlOrUUID);

            await this.promisifyAssetDb<void>((cb) => {
                Editor.assetdb.saveMeta(normalized.uuid, content, cb);
            });

            return this.createSuccessResponse({
                uuid: normalized.uuid,
                url: normalized.url
            }, 'Asset meta saved successfully');
        } catch (err: any) {
            return this.createErrorResponse(err);
        }
    }

    private async generateAvailableUrl(url: string): Promise<ToolResponse> {
        try {
            for (let attempt = 0; attempt <= MAX_URL_GENERATION_ATTEMPTS; attempt++) {
                const testUrl = attempt === 0 ? url : this.getNextUrl(url, attempt);

                try {
                    await this.convertUrlToUuid(testUrl);
                    // URL exists, continue to next attempt
                } catch (err) {
                    // URL doesn't exist, so it's available
                    return this.createSuccessResponse({
                        originalUrl: url,
                        availableUrl: testUrl
                    }, testUrl === url ? 'URL is available' : 'Generated new available URL');
                }
            }

            return this.createErrorResponse(`Could not generate available URL after ${MAX_URL_GENERATION_ATTEMPTS} attempts`);
        } catch (err: any) {
            return this.createErrorResponse(err);
        }
    }

    private getNextUrl(url: string, attempt: number): string {
        // Split URL into base and extension
        const lastDot = url.lastIndexOf('.');
        const lastSlash = url.lastIndexOf('/');

        if (lastDot > lastSlash) {
            // Has extension
            const base = url.substring(0, lastDot);
            const ext = url.substring(lastDot);
            return `${base}-${attempt}${ext}`;
        } else {
            // No extension
            return `${url}-${attempt}`;
        }
    }

    private async queryAssetDbReady(): Promise<ToolResponse> {
        try {
            await this.promisifyAssetDb<any[]>((cb) => {
                Editor.assetdb.queryAssets(DEFAULT_ASSET_DIRECTORY, '', cb);
            });

            return this.createSuccessResponse({
                ready: true
            }, 'Asset database is ready');
        } catch (err: any) {
            return this.createSuccessResponse({
                ready: false
            }, 'Asset database is not ready');
        }
    }

    private async openAssetExternal(urlOrUUID: string): Promise<ToolResponse> {
        try {
            const normalized = await this.normalizeUrlOrUuid(urlOrUUID);
            Editor.assetdb.explore(normalized.url);

            return this.createSuccessResponse(undefined, ASSET_EXPLORE_MESSAGE);
        } catch (err: any) {
            return this.createErrorResponse(err);
        }
    }

    private async batchImportAssets(args: BatchImportArgs): Promise<ToolResponse> {
        try {
            const fs = require('fs');
            const path = require('path');

            if (!fs.existsSync(args.sourceDirectory)) {
                return this.createErrorResponse('Source directory does not exist');
            }

            const files = this.getFilesFromDirectory(
                args.sourceDirectory,
                args.fileFilter || [],
                args.recursive || false
            );

            const importResults: BatchImportResult[] = await this.processSequentially(
                files,
                async (filePath: string, index: number) => {
                    try {
                        await this.promisifyAssetDb<void>((cb) => {
                            Editor.assetdb.import([filePath], args.targetDirectory, true, cb);
                        });

                        return {
                            source: filePath,
                            target: `${args.targetDirectory}/${path.basename(filePath)}`,
                            success: true
                        };
                    } catch (err: any) {
                        return {
                            source: filePath,
                            success: false,
                            error: err.message
                        };
                    }
                }
            );

            const successCount = importResults.filter(r => r.success).length;
            const errorCount = importResults.filter(r => !r.success).length;

            return this.createSuccessResponse({
                totalFiles: files.length,
                successCount,
                errorCount,
                results: importResults
            }, `Batch import completed: ${successCount} success, ${errorCount} errors`);
        } catch (err: any) {
            return this.createErrorResponse(err);
        }
    }

    private getFilesFromDirectory(dirPath: string, fileFilter: string[], recursive: boolean): string[] {
        const fs = require('fs');
        const path = require('path');
        const files: string[] = [];

        const items = fs.readdirSync(dirPath);

        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);

            if (stat.isFile()) {
                if (fileFilter.length === 0 || fileFilter.some(ext => item.toLowerCase().endsWith(ext.toLowerCase()))) {
                    files.push(fullPath);
                }
            } else if (stat.isDirectory() && recursive) {
                files.push(...this.getFilesFromDirectory(fullPath, fileFilter, recursive));
            }
        }

        return files;
    }

    private async batchDeleteAssets(urls: string[]): Promise<ToolResponse> {
        try {
            // Note: Editor.assetdb.delete() does not provide a callback
            // We assume it succeeds and report all as successful
            Editor.assetdb.delete(urls);

            const deleteResults: BatchDeleteResult[] = urls.map(url => ({
                url,
                success: true
            }));

            return this.createSuccessResponse({
                totalAssets: urls.length,
                successCount: urls.length,
                errorCount: 0,
                results: deleteResults
            }, `Batch delete initiated for ${urls.length} assets. Note: Individual deletion results are not available in 2.x API.`);
        } catch (err: any) {
            return this.createErrorResponse(err);
        }
    }

    private async validateAssetReferences(directory: string = DEFAULT_ASSET_DIRECTORY): Promise<ToolResponse> {
        try {
            const pattern = `${directory}/**/*`;
            const assets: AssetInfo[] = await this.promisifyAssetDb<AssetInfo[]>((cb) => {
                Editor.assetdb.queryAssets(pattern, '', cb);
            });

            if (assets.length === 0) {
                return this.createSuccessResponse({
                    directory,
                    totalAssets: 0,
                    validReferences: 0,
                    brokenReferences: 0,
                    brokenAssets: []
                }, 'Validation completed: 0 assets found');
            }

            const validationResults = await this.processSequentially(
                assets,
                async (asset: AssetInfo) => {
                    try {
                        await this.promisifyAssetDb<any>((cb) => {
                            Editor.assetdb.queryInfoByUuid(asset.uuid, cb);
                        });

                        return {
                            url: asset.url,
                            uuid: asset.uuid,
                            name: asset.name,
                            valid: true
                        };
                    } catch (err: any) {
                        return {
                            url: asset.url,
                            uuid: asset.uuid,
                            name: asset.name,
                            valid: false,
                            error: err.message
                        };
                    }
                }
            );

            const validReferences = validationResults.filter(r => r.valid);
            const brokenReferences = validationResults.filter(r => !r.valid);

            return this.createSuccessResponse({
                directory,
                totalAssets: assets.length,
                validReferences: validReferences.length,
                brokenReferences: brokenReferences.length,
                brokenAssets: brokenReferences
            }, `Validation completed: ${brokenReferences.length} broken references found`);
        } catch (err: any) {
            return this.createErrorResponse(err);
        }
    }

    private async getAssetDependencies(urlOrUUID: string, direction: string = 'dependencies'): Promise<ToolResponse> {
        return this.createErrorResponse(
            'Asset dependency analysis requires additional APIs not available in current Cocos Creator MCP implementation. Consider using the Editor UI for dependency analysis.'
        );
    }

    private async getUnusedAssets(directory: string = DEFAULT_ASSET_DIRECTORY, excludeDirectories: string[] = []): Promise<ToolResponse> {
        return this.createErrorResponse(
            'Unused asset detection requires comprehensive project analysis not available in current Cocos Creator MCP implementation. Consider using the Editor UI or third-party tools for unused asset detection.'
        );
    }

    private async compressTextures(directory: string = DEFAULT_ASSET_DIRECTORY, format: string = 'auto', quality: number = 0.8): Promise<ToolResponse> {
        return this.createErrorResponse(
            'Texture compression requires image processing capabilities not available in current Cocos Creator MCP implementation. Use the Editor\'s built-in texture compression settings or external tools.'
        );
    }

    private async exportAssetManifest(directory: string = DEFAULT_ASSET_DIRECTORY, format: string = 'json', includeMetadata: boolean = true): Promise<ToolResponse> {
        try {
            const pattern = `${directory}/**/*`;
            const assets: AssetInfo[] = await this.promisifyAssetDb<AssetInfo[]>((cb) => {
                Editor.assetdb.queryAssets(pattern, '', cb);
            });

            if (assets.length === 0) {
                const emptyManifest = format === 'json' ? '[]' : '';
                return this.createSuccessResponse({
                    directory,
                    format,
                    assetCount: 0,
                    includeMetadata,
                    manifest: emptyManifest
                }, 'Asset manifest exported with 0 assets');
            }

            const manifestEntries = await this.processSequentially(
                assets,
                async (asset: AssetInfo) => {
                    const entry: any = {
                        name: asset.name,
                        url: asset.url,
                        uuid: asset.uuid,
                        type: asset.type,
                        size: asset.size || 0,
                        isDirectory: asset.isDirectory || false
                    };

                    if (includeMetadata) {
                        try {
                            const metaInfo = await this.promisifyAssetDb<any>((cb) => {
                                Editor.assetdb.queryMetaInfoByUuid(asset.uuid, cb);
                            });
                            if (metaInfo && metaInfo.json) {
                                entry.meta = metaInfo.json;
                            }
                        } catch (err) {
                            // Skip metadata if not available
                        }
                    }

                    return entry;
                }
            );

            return this.finalizeManifestExport(directory, format, includeMetadata, manifestEntries);
        } catch (err: any) {
            return this.createErrorResponse(err);
        }
    }

    private finalizeManifestExport(directory: string, format: string, includeMetadata: boolean, manifest: any[]): ToolResponse {
        let exportData: string;
        switch (format) {
            case 'json':
                exportData = JSON.stringify(manifest, null, 2);
                break;
            case 'csv':
                exportData = this.convertToCSV(manifest);
                break;
            case 'xml':
                exportData = this.convertToXML(manifest);
                break;
            default:
                exportData = JSON.stringify(manifest, null, 2);
        }

        return this.createSuccessResponse({
            directory,
            format,
            assetCount: manifest.length,
            includeMetadata,
            manifest: exportData
        }, `Asset manifest exported with ${manifest.length} assets`);
    }

    private convertToCSV(data: any[]): string {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                return typeof value === 'object' ? JSON.stringify(value) : String(value);
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }

    private convertToXML(data: any[]): string {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<assets>\n';

        for (const item of data) {
            xml += '  <asset>\n';
            for (const [key, value] of Object.entries(item)) {
                const xmlValue = typeof value === 'object' ?
                    JSON.stringify(value) :
                    String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                xml += `    <${key}>${xmlValue}</${key}>\n`;
            }
            xml += '  </asset>\n';
        }

        xml += '</assets>';
        return xml;
    }
}