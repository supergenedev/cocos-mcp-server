"use strict";
/// <reference path="../types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetAdvancedTools = void 0;
// Constants
const DEFAULT_ASSET_DIRECTORY = 'db://assets';
const MAX_URL_GENERATION_ATTEMPTS = 100;
const ASSET_EXPLORE_MESSAGE = 'Asset location revealed in file system. Please open manually with your preferred program.';
class AssetAdvancedTools {
    // Utility Functions
    /**
     * Check if the given string is a URL (starts with 'db://')
     */
    isUrl(urlOrUUID) {
        return urlOrUUID.startsWith('db://');
    }
    /**
     * Convert URL to UUID
     */
    convertUrlToUuid(url) {
        return new Promise((resolve, reject) => {
            const uuid = Editor.assetdb.urlToUuid(url);
            if (uuid === undefined) {
                reject(new Error(`UUID not found for URL: ${url}`));
            }
            else {
                resolve(uuid);
            }
        });
    }
    /**
     * Convert UUID to URL
     */
    convertUuidToUrl(uuid) {
        return new Promise((resolve, reject) => {
            const url = Editor.assetdb.uuidToUrl(uuid);
            if (url === undefined) {
                reject(new Error(`URL not found for UUID: ${uuid}`));
            }
            else {
                resolve(url);
            }
        });
    }
    /**
     * Normalize URL or UUID to get both URL and UUID
     */
    async normalizeUrlOrUuid(urlOrUUID) {
        if (this.isUrl(urlOrUUID)) {
            const uuid = await this.convertUrlToUuid(urlOrUUID);
            return { url: urlOrUUID, uuid };
        }
        else {
            const url = await this.convertUuidToUrl(urlOrUUID);
            return { url, uuid: urlOrUUID };
        }
    }
    /**
     * Promisify assetdb callback functions
     */
    promisifyAssetDb(callbackFn) {
        return new Promise((resolve, reject) => {
            callbackFn((err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }
    /**
     * Process items sequentially
     */
    async processSequentially(items, processor) {
        const results = [];
        for (let i = 0; i < items.length; i++) {
            const result = await processor(items[i], i);
            results.push(result);
        }
        return results;
    }
    /**
     * Create error response
     */
    createErrorResponse(error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : error
        };
    }
    /**
     * Create success response
     */
    createSuccessResponse(data, message) {
        const response = {
            success: true
        };
        if (data !== undefined) {
            response.data = data;
        }
        if (message) {
            if (response.data) {
                response.data.message = message;
            }
            else {
                response.message = message;
            }
        }
        return response;
    }
    // Public Methods
    getTools() {
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
    async execute(toolName, args) {
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
    async saveAssetMeta(urlOrUUID, content) {
        try {
            const normalized = await this.normalizeUrlOrUuid(urlOrUUID);
            await this.promisifyAssetDb((cb) => {
                Editor.assetdb.saveMeta(normalized.uuid, content, cb);
            });
            return this.createSuccessResponse({
                uuid: normalized.uuid,
                url: normalized.url
            }, 'Asset meta saved successfully');
        }
        catch (err) {
            return this.createErrorResponse(err);
        }
    }
    async generateAvailableUrl(url) {
        try {
            for (let attempt = 0; attempt <= MAX_URL_GENERATION_ATTEMPTS; attempt++) {
                const testUrl = attempt === 0 ? url : this.getNextUrl(url, attempt);
                try {
                    await this.convertUrlToUuid(testUrl);
                    // URL exists, continue to next attempt
                }
                catch (err) {
                    // URL doesn't exist, so it's available
                    return this.createSuccessResponse({
                        originalUrl: url,
                        availableUrl: testUrl
                    }, testUrl === url ? 'URL is available' : 'Generated new available URL');
                }
            }
            return this.createErrorResponse(`Could not generate available URL after ${MAX_URL_GENERATION_ATTEMPTS} attempts`);
        }
        catch (err) {
            return this.createErrorResponse(err);
        }
    }
    getNextUrl(url, attempt) {
        // Split URL into base and extension
        const lastDot = url.lastIndexOf('.');
        const lastSlash = url.lastIndexOf('/');
        if (lastDot > lastSlash) {
            // Has extension
            const base = url.substring(0, lastDot);
            const ext = url.substring(lastDot);
            return `${base}-${attempt}${ext}`;
        }
        else {
            // No extension
            return `${url}-${attempt}`;
        }
    }
    async queryAssetDbReady() {
        try {
            await this.promisifyAssetDb((cb) => {
                Editor.assetdb.queryAssets(DEFAULT_ASSET_DIRECTORY, '', cb);
            });
            return this.createSuccessResponse({
                ready: true
            }, 'Asset database is ready');
        }
        catch (err) {
            return this.createSuccessResponse({
                ready: false
            }, 'Asset database is not ready');
        }
    }
    async openAssetExternal(urlOrUUID) {
        try {
            const normalized = await this.normalizeUrlOrUuid(urlOrUUID);
            Editor.assetdb.explore(normalized.url);
            return this.createSuccessResponse(undefined, ASSET_EXPLORE_MESSAGE);
        }
        catch (err) {
            return this.createErrorResponse(err);
        }
    }
    async batchImportAssets(args) {
        try {
            const fs = require('fs');
            const path = require('path');
            if (!fs.existsSync(args.sourceDirectory)) {
                return this.createErrorResponse('Source directory does not exist');
            }
            const files = this.getFilesFromDirectory(args.sourceDirectory, args.fileFilter || [], args.recursive || false);
            const importResults = await this.processSequentially(files, async (filePath, index) => {
                try {
                    await this.promisifyAssetDb((cb) => {
                        Editor.assetdb.import([filePath], args.targetDirectory, true, cb);
                    });
                    return {
                        source: filePath,
                        target: `${args.targetDirectory}/${path.basename(filePath)}`,
                        success: true
                    };
                }
                catch (err) {
                    return {
                        source: filePath,
                        success: false,
                        error: err.message
                    };
                }
            });
            const successCount = importResults.filter(r => r.success).length;
            const errorCount = importResults.filter(r => !r.success).length;
            return this.createSuccessResponse({
                totalFiles: files.length,
                successCount,
                errorCount,
                results: importResults
            }, `Batch import completed: ${successCount} success, ${errorCount} errors`);
        }
        catch (err) {
            return this.createErrorResponse(err);
        }
    }
    getFilesFromDirectory(dirPath, fileFilter, recursive) {
        const fs = require('fs');
        const path = require('path');
        const files = [];
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
                if (fileFilter.length === 0 || fileFilter.some(ext => item.toLowerCase().endsWith(ext.toLowerCase()))) {
                    files.push(fullPath);
                }
            }
            else if (stat.isDirectory() && recursive) {
                files.push(...this.getFilesFromDirectory(fullPath, fileFilter, recursive));
            }
        }
        return files;
    }
    async batchDeleteAssets(urls) {
        try {
            // Note: Editor.assetdb.delete() does not provide a callback
            // We assume it succeeds and report all as successful
            Editor.assetdb.delete(urls);
            const deleteResults = urls.map(url => ({
                url,
                success: true
            }));
            return this.createSuccessResponse({
                totalAssets: urls.length,
                successCount: urls.length,
                errorCount: 0,
                results: deleteResults
            }, `Batch delete initiated for ${urls.length} assets. Note: Individual deletion results are not available in 2.x API.`);
        }
        catch (err) {
            return this.createErrorResponse(err);
        }
    }
    async validateAssetReferences(directory = DEFAULT_ASSET_DIRECTORY) {
        try {
            const pattern = `${directory}/**/*`;
            const assets = await this.promisifyAssetDb((cb) => {
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
            const validationResults = await this.processSequentially(assets, async (asset) => {
                try {
                    await new Promise((resolve, reject) => {
                        Editor.Ipc.sendToMain("asset-db:query-info-by-uuid", asset.uuid, (err, info) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(info);
                            }
                        });
                    });
                    return {
                        url: asset.url,
                        uuid: asset.uuid,
                        name: asset.name,
                        valid: true
                    };
                }
                catch (err) {
                    return {
                        url: asset.url,
                        uuid: asset.uuid,
                        name: asset.name,
                        valid: false,
                        error: err.message
                    };
                }
            });
            const validReferences = validationResults.filter(r => r.valid);
            const brokenReferences = validationResults.filter(r => !r.valid);
            return this.createSuccessResponse({
                directory,
                totalAssets: assets.length,
                validReferences: validReferences.length,
                brokenReferences: brokenReferences.length,
                brokenAssets: brokenReferences
            }, `Validation completed: ${brokenReferences.length} broken references found`);
        }
        catch (err) {
            return this.createErrorResponse(err);
        }
    }
    async getAssetDependencies(urlOrUUID, direction = 'dependencies') {
        return this.createErrorResponse('Asset dependency analysis requires additional APIs not available in current Cocos Creator MCP implementation. Consider using the Editor UI for dependency analysis.');
    }
    async getUnusedAssets(directory = DEFAULT_ASSET_DIRECTORY, excludeDirectories = []) {
        return this.createErrorResponse('Unused asset detection requires comprehensive project analysis not available in current Cocos Creator MCP implementation. Consider using the Editor UI or third-party tools for unused asset detection.');
    }
    async compressTextures(directory = DEFAULT_ASSET_DIRECTORY, format = 'auto', quality = 0.8) {
        return this.createErrorResponse('Texture compression requires image processing capabilities not available in current Cocos Creator MCP implementation. Use the Editor\'s built-in texture compression settings or external tools.');
    }
    async exportAssetManifest(directory = DEFAULT_ASSET_DIRECTORY, format = 'json', includeMetadata = true) {
        try {
            const pattern = `${directory}/**/*`;
            const assets = await this.promisifyAssetDb((cb) => {
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
            const manifestEntries = await this.processSequentially(assets, async (asset) => {
                const entry = {
                    name: asset.name,
                    url: asset.url,
                    uuid: asset.uuid,
                    type: asset.type,
                    size: asset.size || 0,
                    isDirectory: asset.isDirectory || false
                };
                if (includeMetadata) {
                    try {
                        const metaInfo = await new Promise((resolve, reject) => {
                            Editor.Ipc.sendToMain("asset-db:query-meta-info-by-uuid", asset.uuid, (err, info) => {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve(info);
                                }
                            });
                        });
                        if (metaInfo && metaInfo.json) {
                            entry.meta = metaInfo.json;
                        }
                    }
                    catch (err) {
                        // Skip metadata if not available
                    }
                }
                return entry;
            });
            return this.finalizeManifestExport(directory, format, includeMetadata, manifestEntries);
        }
        catch (err) {
            return this.createErrorResponse(err);
        }
    }
    finalizeManifestExport(directory, format, includeMetadata, manifest) {
        let exportData;
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
    convertToCSV(data) {
        if (data.length === 0)
            return '';
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
    convertToXML(data) {
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
exports.AssetAdvancedTools = AssetAdvancedTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvYXNzZXQtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFnRDs7O0FBSWhELFlBQVk7QUFDWixNQUFNLHVCQUF1QixHQUFHLGFBQWEsQ0FBQztBQUM5QyxNQUFNLDJCQUEyQixHQUFHLEdBQUcsQ0FBQztBQUN4QyxNQUFNLHFCQUFxQixHQUFHLDJGQUEyRixDQUFDO0FBdUMxSCxNQUFhLGtCQUFrQjtJQUMzQixvQkFBb0I7SUFFcEI7O09BRUc7SUFDSyxLQUFLLENBQUMsU0FBaUI7UUFDM0IsT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRDs7T0FFRztJQUNLLGdCQUFnQixDQUFDLEdBQVc7UUFDaEMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMzQyxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUU7Z0JBQ3BCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQywyQkFBMkIsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQ3ZEO2lCQUFNO2dCQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNqQjtRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVEOztPQUVHO0lBQ0ssZ0JBQWdCLENBQUMsSUFBWTtRQUNqQyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25DLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLElBQUksR0FBRyxLQUFLLFNBQVMs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O1lBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDbEM7UUFFRCxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVPLFlBQVksQ0FBQyxJQUFXO1FBQzVCLElBQUksR0FBRyxHQUFHLG9EQUFvRCxDQUFDO1FBRS9ELEtBQUssTUFBTSxJQUFJLElBQUksSUFBSSxFQUFFO1lBQ3JCLEdBQUcsSUFBSSxhQUFhLENBQUM7WUFDckIsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzdDLE1BQU0sUUFBUSxHQUFHLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDO29CQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQ3ZCLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDckYsR0FBRyxJQUFJLFFBQVEsR0FBRyxJQUFJLFFBQVEsS0FBSyxHQUFHLEtBQUssQ0FBQzthQUMvQztZQUNELEdBQUcsSUFBSSxjQUFjLENBQUM7U0FDekI7UUFFRCxHQUFHLElBQUksV0FBVyxDQUFDO1FBQ25CLE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztDQUNKO0FBbHVCRCxnREFrdUJDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGVzL2VkaXRvci0yeC5kLnRzXCIgLz5cblxuaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xSZXNwb25zZSwgVG9vbEV4ZWN1dG9yIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG4vLyBDb25zdGFudHNcbmNvbnN0IERFRkFVTFRfQVNTRVRfRElSRUNUT1JZID0gJ2RiOi8vYXNzZXRzJztcbmNvbnN0IE1BWF9VUkxfR0VORVJBVElPTl9BVFRFTVBUUyA9IDEwMDtcbmNvbnN0IEFTU0VUX0VYUExPUkVfTUVTU0FHRSA9ICdBc3NldCBsb2NhdGlvbiByZXZlYWxlZCBpbiBmaWxlIHN5c3RlbS4gUGxlYXNlIG9wZW4gbWFudWFsbHkgd2l0aCB5b3VyIHByZWZlcnJlZCBwcm9ncmFtLic7XG5cbi8vIFR5cGUgRGVmaW5pdGlvbnNcbmludGVyZmFjZSBBc3NldEluZm8ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICB1cmw6IHN0cmluZztcbiAgICB1dWlkOiBzdHJpbmc7XG4gICAgdHlwZTogc3RyaW5nO1xuICAgIHNpemU/OiBudW1iZXI7XG4gICAgaXNEaXJlY3Rvcnk/OiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgQmF0Y2hJbXBvcnRSZXN1bHQge1xuICAgIHNvdXJjZTogc3RyaW5nO1xuICAgIHRhcmdldD86IHN0cmluZztcbiAgICBzdWNjZXNzOiBib29sZWFuO1xuICAgIGVycm9yPzogc3RyaW5nO1xuICAgIHV1aWQ/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBCYXRjaERlbGV0ZVJlc3VsdCB7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgc3VjY2VzczogYm9vbGVhbjtcbiAgICBlcnJvcj86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEJhdGNoSW1wb3J0QXJncyB7XG4gICAgc291cmNlRGlyZWN0b3J5OiBzdHJpbmc7XG4gICAgdGFyZ2V0RGlyZWN0b3J5OiBzdHJpbmc7XG4gICAgZmlsZUZpbHRlcj86IHN0cmluZ1tdO1xuICAgIHJlY3Vyc2l2ZT86IGJvb2xlYW47XG4gICAgb3ZlcndyaXRlPzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIE5vcm1hbGl6ZWRBc3NldCB7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgdXVpZDogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQXNzZXRBZHZhbmNlZFRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICAvLyBVdGlsaXR5IEZ1bmN0aW9uc1xuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBhIFVSTCAoc3RhcnRzIHdpdGggJ2RiOi8vJylcbiAgICAgKi9cbiAgICBwcml2YXRlIGlzVXJsKHVybE9yVVVJRDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB1cmxPclVVSUQuc3RhcnRzV2l0aCgnZGI6Ly8nKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IFVSTCB0byBVVUlEXG4gICAgICovXG4gICAgcHJpdmF0ZSBjb252ZXJ0VXJsVG9VdWlkKHVybDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBFZGl0b3IuYXNzZXRkYi51cmxUb1V1aWQodXJsKTtcbiAgICAgICAgICAgIGlmICh1dWlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGBVVUlEIG5vdCBmb3VuZCBmb3IgVVJMOiAke3VybH1gKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodXVpZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgVVVJRCB0byBVUkxcbiAgICAgKi9cbiAgICBwcml2YXRlIGNvbnZlcnRVdWlkVG9VcmwodXVpZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IEVkaXRvci5hc3NldGRiLnV1aWRUb1VybCh1dWlkKTtcbiAgICAgICAgICAgIGlmICh1cmwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYFVSTCBub3QgZm91bmQgZm9yIFVVSUQ6ICR7dXVpZH1gKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTm9ybWFsaXplIFVSTCBvciBVVUlEIHRvIGdldCBib3RoIFVSTCBhbmQgVVVJRFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgbm9ybWFsaXplVXJsT3JVdWlkKHVybE9yVVVJRDogc3RyaW5nKTogUHJvbWlzZTxOb3JtYWxpemVkQXNzZXQ+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNVcmwodXJsT3JVVUlEKSkge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IHRoaXMuY29udmVydFVybFRvVXVpZCh1cmxPclVVSUQpO1xuICAgICAgICAgICAgcmV0dXJuIHsgdXJsOiB1cmxPclVVSUQsIHV1aWQgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IGF3YWl0IHRoaXMuY29udmVydFV1aWRUb1VybCh1cmxPclVVSUQpO1xuICAgICAgICAgICAgcmV0dXJuIHsgdXJsLCB1dWlkOiB1cmxPclVVSUQgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb21pc2lmeSBhc3NldGRiIGNhbGxiYWNrIGZ1bmN0aW9uc1xuICAgICAqL1xuICAgIHByaXZhdGUgcHJvbWlzaWZ5QXNzZXREYjxUPihcbiAgICAgICAgY2FsbGJhY2tGbjogKGNiOiAoZXJyOiBFcnJvciB8IG51bGwsIHJlc3VsdDogVCkgPT4gdm9pZCkgPT4gdm9pZFxuICAgICk6IFByb21pc2U8VD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2tGbigoZXJyOiBFcnJvciB8IG51bGwsIHJlc3VsdDogVCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm9jZXNzIGl0ZW1zIHNlcXVlbnRpYWxseVxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgcHJvY2Vzc1NlcXVlbnRpYWxseTxULCBSPihcbiAgICAgICAgaXRlbXM6IFRbXSxcbiAgICAgICAgcHJvY2Vzc29yOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlcikgPT4gUHJvbWlzZTxSPlxuICAgICk6IFByb21pc2U8UltdPiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHM6IFJbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwcm9jZXNzb3IoaXRlbXNbaV0sIGkpO1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGVycm9yIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVFcnJvclJlc3BvbnNlKGVycm9yOiBFcnJvciB8IHN0cmluZyk6IFRvb2xSZXNwb25zZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHN1Y2Nlc3MgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwcml2YXRlIGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZShkYXRhPzogYW55LCBtZXNzYWdlPzogc3RyaW5nKTogVG9vbFJlc3BvbnNlIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2U6IFRvb2xSZXNwb25zZSA9IHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH1cblxuICAgIC8vIFB1YmxpYyBNZXRob2RzXG5cbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnc2F2ZV9hc3NldF9tZXRhJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NhdmUgYXNzZXQgbWV0YSBpbmZvcm1hdGlvbicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybE9yVVVJRDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIG9yIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgbWV0YSBzZXJpYWxpemVkIGNvbnRlbnQgc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1cmxPclVVSUQnLCAnY29udGVudCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2VuZXJhdGVfYXZhaWxhYmxlX3VybCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZW5lcmF0ZSBhbiBhdmFpbGFibGUgVVJMIGJhc2VkIG9uIGlucHV0IFVSTCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIHRvIGdlbmVyYXRlIGF2YWlsYWJsZSBVUkwgZm9yJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1cmwnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3F1ZXJ5X2Fzc2V0X2RiX3JlYWR5JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NoZWNrIGlmIGFzc2V0IGRhdGFiYXNlIGlzIHJlYWR5JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdvcGVuX2Fzc2V0X2V4dGVybmFsJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wZW4gYXNzZXQgd2l0aCBleHRlcm5hbCBwcm9ncmFtJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsT3JVVUlEOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVUkwgb3IgVVVJRCB0byBvcGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1cmxPclVVSUQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2JhdGNoX2ltcG9ydF9hc3NldHMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW1wb3J0IG11bHRpcGxlIGFzc2V0cyBpbiBiYXRjaCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZURpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU291cmNlIGRpcmVjdG9yeSBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldERpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGFyZ2V0IGRpcmVjdG9yeSBVUkwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUZpbHRlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZpbGUgZXh0ZW5zaW9ucyB0byBpbmNsdWRlIChlLmcuLCBbXCIucG5nXCIsIFwiLmpwZ1wiXSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBzdWJkaXJlY3RvcmllcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyd3JpdGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPdmVyd3JpdGUgZXhpc3RpbmcgZmlsZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3NvdXJjZURpcmVjdG9yeScsICd0YXJnZXREaXJlY3RvcnknXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2JhdGNoX2RlbGV0ZV9hc3NldHMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVsZXRlIG11bHRpcGxlIGFzc2V0cyBpbiBiYXRjaCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBcnJheSBvZiBhc3NldCBVUkxzIHRvIGRlbGV0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXJscyddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndmFsaWRhdGVfYXNzZXRfcmVmZXJlbmNlcycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdWYWxpZGF0ZSBhc3NldCByZWZlcmVuY2VzIGFuZCBmaW5kIGJyb2tlbiBsaW5rcycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGlyZWN0b3J5IHRvIHZhbGlkYXRlIChkZWZhdWx0OiBlbnRpcmUgcHJvamVjdCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdkYjovL2Fzc2V0cydcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9hc3NldF9kZXBlbmRlbmNpZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGFzc2V0IGRlcGVuZGVuY3kgdHJlZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybE9yVVVJRDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIG9yIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEZXBlbmRlbmN5IGRpcmVjdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydkZXBlbmRlbnRzJywgJ2RlcGVuZGVuY2llcycsICdib3RoJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RlcGVuZGVuY2llcydcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXJsT3JVVUlEJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfdW51c2VkX2Fzc2V0cycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaW5kIHVudXNlZCBhc3NldHMgaW4gcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGlyZWN0b3J5IHRvIHNjYW4gKGRlZmF1bHQ6IGVudGlyZSBwcm9qZWN0KScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RiOi8vYXNzZXRzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGVEaXJlY3Rvcmllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RpcmVjdG9yaWVzIHRvIGV4Y2x1ZGUgZnJvbSBzY2FuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY29tcHJlc3NfdGV4dHVyZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQmF0Y2ggY29tcHJlc3MgdGV4dHVyZSBhc3NldHMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RpcmVjdG9yeSBjb250YWluaW5nIHRleHR1cmVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnZGI6Ly9hc3NldHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb21wcmVzc2lvbiBmb3JtYXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnYXV0bycsICdqcGcnLCAncG5nJywgJ3dlYnAnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnYXV0bydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWFsaXR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb21wcmVzc2lvbiBxdWFsaXR5ICgwLjEtMS4wKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluaW11bTogMC4xLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heGltdW06IDEuMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLjhcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2V4cG9ydF9hc3NldF9tYW5pZmVzdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeHBvcnQgYXNzZXQgbWFuaWZlc3QvaW52ZW50b3J5JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0b3J5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEaXJlY3RvcnkgdG8gZXhwb3J0IG1hbmlmZXN0IGZvcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RiOi8vYXNzZXRzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRXhwb3J0IGZvcm1hdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydqc29uJywgJ2NzdicsICd4bWwnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnanNvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlTWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbmNsdWRlIGFzc2V0IG1ldGFkYXRhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdzYXZlX2Fzc2V0X21ldGEnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNhdmVBc3NldE1ldGEoYXJncy51cmxPclVVSUQsIGFyZ3MuY29udGVudCk7XG4gICAgICAgICAgICBjYXNlICdnZW5lcmF0ZV9hdmFpbGFibGVfdXJsJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZW5lcmF0ZUF2YWlsYWJsZVVybChhcmdzLnVybCk7XG4gICAgICAgICAgICBjYXNlICdxdWVyeV9hc3NldF9kYl9yZWFkeSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlBc3NldERiUmVhZHkoKTtcbiAgICAgICAgICAgIGNhc2UgJ29wZW5fYXNzZXRfZXh0ZXJuYWwnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm9wZW5Bc3NldEV4dGVybmFsKGFyZ3MudXJsT3JVVUlEKTtcbiAgICAgICAgICAgIGNhc2UgJ2JhdGNoX2ltcG9ydF9hc3NldHMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmJhdGNoSW1wb3J0QXNzZXRzKGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAnYmF0Y2hfZGVsZXRlX2Fzc2V0cyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYmF0Y2hEZWxldGVBc3NldHMoYXJncy51cmxzKTtcbiAgICAgICAgICAgIGNhc2UgJ3ZhbGlkYXRlX2Fzc2V0X3JlZmVyZW5jZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnZhbGlkYXRlQXNzZXRSZWZlcmVuY2VzKGFyZ3MuZGlyZWN0b3J5KTtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9hc3NldF9kZXBlbmRlbmNpZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEFzc2V0RGVwZW5kZW5jaWVzKGFyZ3MudXJsT3JVVUlELCBhcmdzLmRpcmVjdGlvbik7XG4gICAgICAgICAgICBjYXNlICdnZXRfdW51c2VkX2Fzc2V0cyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0VW51c2VkQXNzZXRzKGFyZ3MuZGlyZWN0b3J5LCBhcmdzLmV4Y2x1ZGVEaXJlY3Rvcmllcyk7XG4gICAgICAgICAgICBjYXNlICdjb21wcmVzc190ZXh0dXJlcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY29tcHJlc3NUZXh0dXJlcyhhcmdzLmRpcmVjdG9yeSwgYXJncy5mb3JtYXQsIGFyZ3MucXVhbGl0eSk7XG4gICAgICAgICAgICBjYXNlICdleHBvcnRfYXNzZXRfbWFuaWZlc3QnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4cG9ydEFzc2V0TWFuaWZlc3QoYXJncy5kaXJlY3RvcnksIGFyZ3MuZm9ybWF0LCBhcmdzLmluY2x1ZGVNZXRhZGF0YSk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlQXNzZXRNZXRhKHVybE9yVVVJRDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IGF3YWl0IHRoaXMubm9ybWFsaXplVXJsT3JVdWlkKHVybE9yVVVJRCk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHJvbWlzaWZ5QXNzZXREYjx2b2lkPigoY2IpID0+IHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5zYXZlTWV0YShub3JtYWxpemVkLnV1aWQsIGNvbnRlbnQsIGNiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgIHV1aWQ6IG5vcm1hbGl6ZWQudXVpZCxcbiAgICAgICAgICAgICAgICB1cmw6IG5vcm1hbGl6ZWQudXJsXG4gICAgICAgICAgICB9LCAnQXNzZXQgbWV0YSBzYXZlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVBdmFpbGFibGVVcmwodXJsOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPD0gTUFYX1VSTF9HRU5FUkFUSU9OX0FUVEVNUFRTOyBhdHRlbXB0KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXN0VXJsID0gYXR0ZW1wdCA9PT0gMCA/IHVybCA6IHRoaXMuZ2V0TmV4dFVybCh1cmwsIGF0dGVtcHQpO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5jb252ZXJ0VXJsVG9VdWlkKHRlc3RVcmwpO1xuICAgICAgICAgICAgICAgICAgICAvLyBVUkwgZXhpc3RzLCBjb250aW51ZSB0byBuZXh0IGF0dGVtcHRcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVVJMIGRvZXNuJ3QgZXhpc3QsIHNvIGl0J3MgYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFVybDogdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVXJsOiB0ZXN0VXJsXG4gICAgICAgICAgICAgICAgICAgIH0sIHRlc3RVcmwgPT09IHVybCA/ICdVUkwgaXMgYXZhaWxhYmxlJyA6ICdHZW5lcmF0ZWQgbmV3IGF2YWlsYWJsZSBVUkwnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoYENvdWxkIG5vdCBnZW5lcmF0ZSBhdmFpbGFibGUgVVJMIGFmdGVyICR7TUFYX1VSTF9HRU5FUkFUSU9OX0FUVEVNUFRTfSBhdHRlbXB0c2ApO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXROZXh0VXJsKHVybDogc3RyaW5nLCBhdHRlbXB0OiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgICAvLyBTcGxpdCBVUkwgaW50byBiYXNlIGFuZCBleHRlbnNpb25cbiAgICAgICAgY29uc3QgbGFzdERvdCA9IHVybC5sYXN0SW5kZXhPZignLicpO1xuICAgICAgICBjb25zdCBsYXN0U2xhc2ggPSB1cmwubGFzdEluZGV4T2YoJy8nKTtcblxuICAgICAgICBpZiAobGFzdERvdCA+IGxhc3RTbGFzaCkge1xuICAgICAgICAgICAgLy8gSGFzIGV4dGVuc2lvblxuICAgICAgICAgICAgY29uc3QgYmFzZSA9IHVybC5zdWJzdHJpbmcoMCwgbGFzdERvdCk7XG4gICAgICAgICAgICBjb25zdCBleHQgPSB1cmwuc3Vic3RyaW5nKGxhc3REb3QpO1xuICAgICAgICAgICAgcmV0dXJuIGAke2Jhc2V9LSR7YXR0ZW1wdH0ke2V4dH1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTm8gZXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gYCR7dXJsfS0ke2F0dGVtcHR9YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcXVlcnlBc3NldERiUmVhZHkoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHJvbWlzaWZ5QXNzZXREYjxhbnlbXT4oKGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIucXVlcnlBc3NldHMoREVGQVVMVF9BU1NFVF9ESVJFQ1RPUlksICcnLCBjYik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICByZWFkeTogdHJ1ZVxuICAgICAgICAgICAgfSwgJ0Fzc2V0IGRhdGFiYXNlIGlzIHJlYWR5Jyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgIHJlYWR5OiBmYWxzZVxuICAgICAgICAgICAgfSwgJ0Fzc2V0IGRhdGFiYXNlIGlzIG5vdCByZWFkeScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBvcGVuQXNzZXRFeHRlcm5hbCh1cmxPclVVSUQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBub3JtYWxpemVkID0gYXdhaXQgdGhpcy5ub3JtYWxpemVVcmxPclV1aWQodXJsT3JVVUlEKTtcbiAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLmV4cGxvcmUobm9ybWFsaXplZC51cmwpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2UodW5kZWZpbmVkLCBBU1NFVF9FWFBMT1JFX01FU1NBR0UpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBiYXRjaEltcG9ydEFzc2V0cyhhcmdzOiBCYXRjaEltcG9ydEFyZ3MpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGFyZ3Muc291cmNlRGlyZWN0b3J5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoJ1NvdXJjZSBkaXJlY3RvcnkgZG9lcyBub3QgZXhpc3QnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZmlsZXMgPSB0aGlzLmdldEZpbGVzRnJvbURpcmVjdG9yeShcbiAgICAgICAgICAgICAgICBhcmdzLnNvdXJjZURpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICBhcmdzLmZpbGVGaWx0ZXIgfHwgW10sXG4gICAgICAgICAgICAgICAgYXJncy5yZWN1cnNpdmUgfHwgZmFsc2VcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNvbnN0IGltcG9ydFJlc3VsdHM6IEJhdGNoSW1wb3J0UmVzdWx0W10gPSBhd2FpdCB0aGlzLnByb2Nlc3NTZXF1ZW50aWFsbHkoXG4gICAgICAgICAgICAgICAgZmlsZXMsXG4gICAgICAgICAgICAgICAgYXN5bmMgKGZpbGVQYXRoOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucHJvbWlzaWZ5QXNzZXREYjx2b2lkPigoY2IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5pbXBvcnQoW2ZpbGVQYXRoXSwgYXJncy50YXJnZXREaXJlY3RvcnksIHRydWUsIGNiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBgJHthcmdzLnRhcmdldERpcmVjdG9yeX0vJHtwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29uc3Qgc3VjY2Vzc0NvdW50ID0gaW1wb3J0UmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MpLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yQ291bnQgPSBpbXBvcnRSZXN1bHRzLmZpbHRlcihyID0+ICFyLnN1Y2Nlc3MpLmxlbmd0aDtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50LFxuICAgICAgICAgICAgICAgIGVycm9yQ291bnQsXG4gICAgICAgICAgICAgICAgcmVzdWx0czogaW1wb3J0UmVzdWx0c1xuICAgICAgICAgICAgfSwgYEJhdGNoIGltcG9ydCBjb21wbGV0ZWQ6ICR7c3VjY2Vzc0NvdW50fSBzdWNjZXNzLCAke2Vycm9yQ291bnR9IGVycm9yc2ApO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRGaWxlc0Zyb21EaXJlY3RvcnkoZGlyUGF0aDogc3RyaW5nLCBmaWxlRmlsdGVyOiBzdHJpbmdbXSwgcmVjdXJzaXZlOiBib29sZWFuKTogc3RyaW5nW10ge1xuICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG4gICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG4gICAgICAgIGNvbnN0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gZnMucmVhZGRpclN5bmMoZGlyUGF0aCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXJQYXRoLCBpdGVtKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhmdWxsUGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChzdGF0LmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZpbGVGaWx0ZXIubGVuZ3RoID09PSAwIHx8IGZpbGVGaWx0ZXIuc29tZShleHQgPT4gaXRlbS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKGV4dC50b0xvd2VyQ2FzZSgpKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkgJiYgcmVjdXJzaXZlKSB7XG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaCguLi50aGlzLmdldEZpbGVzRnJvbURpcmVjdG9yeShmdWxsUGF0aCwgZmlsZUZpbHRlciwgcmVjdXJzaXZlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsZXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBiYXRjaERlbGV0ZUFzc2V0cyh1cmxzOiBzdHJpbmdbXSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBOb3RlOiBFZGl0b3IuYXNzZXRkYi5kZWxldGUoKSBkb2VzIG5vdCBwcm92aWRlIGEgY2FsbGJhY2tcbiAgICAgICAgICAgIC8vIFdlIGFzc3VtZSBpdCBzdWNjZWVkcyBhbmQgcmVwb3J0IGFsbCBhcyBzdWNjZXNzZnVsXG4gICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5kZWxldGUodXJscyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlbGV0ZVJlc3VsdHM6IEJhdGNoRGVsZXRlUmVzdWx0W10gPSB1cmxzLm1hcCh1cmwgPT4gKHtcbiAgICAgICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgIHRvdGFsQXNzZXRzOiB1cmxzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBzdWNjZXNzQ291bnQ6IHVybHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGVycm9yQ291bnQ6IDAsXG4gICAgICAgICAgICAgICAgcmVzdWx0czogZGVsZXRlUmVzdWx0c1xuICAgICAgICAgICAgfSwgYEJhdGNoIGRlbGV0ZSBpbml0aWF0ZWQgZm9yICR7dXJscy5sZW5ndGh9IGFzc2V0cy4gTm90ZTogSW5kaXZpZHVhbCBkZWxldGlvbiByZXN1bHRzIGFyZSBub3QgYXZhaWxhYmxlIGluIDIueCBBUEkuYCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlQXNzZXRSZWZlcmVuY2VzKGRpcmVjdG9yeTogc3RyaW5nID0gREVGQVVMVF9BU1NFVF9ESVJFQ1RPUlkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcGF0dGVybiA9IGAke2RpcmVjdG9yeX0vKiovKmA7XG4gICAgICAgICAgICBjb25zdCBhc3NldHM6IEFzc2V0SW5mb1tdID0gYXdhaXQgdGhpcy5wcm9taXNpZnlBc3NldERiPEFzc2V0SW5mb1tdPigoY2IpID0+IHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeUFzc2V0cyhwYXR0ZXJuLCAnJywgY2IpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChhc3NldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0b3J5LFxuICAgICAgICAgICAgICAgICAgICB0b3RhbEFzc2V0czogMCxcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRSZWZlcmVuY2VzOiAwLFxuICAgICAgICAgICAgICAgICAgICBicm9rZW5SZWZlcmVuY2VzOiAwLFxuICAgICAgICAgICAgICAgICAgICBicm9rZW5Bc3NldHM6IFtdXG4gICAgICAgICAgICAgICAgfSwgJ1ZhbGlkYXRpb24gY29tcGxldGVkOiAwIGFzc2V0cyBmb3VuZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uUmVzdWx0cyA9IGF3YWl0IHRoaXMucHJvY2Vzc1NlcXVlbnRpYWxseShcbiAgICAgICAgICAgICAgICBhc3NldHMsXG4gICAgICAgICAgICAgICAgYXN5bmMgKGFzc2V0OiBBc3NldEluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5JcGMuc2VuZFRvTWFpbihcImFzc2V0LWRiOnF1ZXJ5LWluZm8tYnktdXVpZFwiLCBhc3NldC51dWlkLCAoZXJyOiBFcnJvciB8IG51bGwsIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoaW5mbyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogYXNzZXQudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBhc3NldC51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhc3NldC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb25zdCB2YWxpZFJlZmVyZW5jZXMgPSB2YWxpZGF0aW9uUmVzdWx0cy5maWx0ZXIociA9PiByLnZhbGlkKTtcbiAgICAgICAgICAgIGNvbnN0IGJyb2tlblJlZmVyZW5jZXMgPSB2YWxpZGF0aW9uUmVzdWx0cy5maWx0ZXIociA9PiAhci52YWxpZCk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5LFxuICAgICAgICAgICAgICAgIHRvdGFsQXNzZXRzOiBhc3NldHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHZhbGlkUmVmZXJlbmNlczogdmFsaWRSZWZlcmVuY2VzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBicm9rZW5SZWZlcmVuY2VzOiBicm9rZW5SZWZlcmVuY2VzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBicm9rZW5Bc3NldHM6IGJyb2tlblJlZmVyZW5jZXNcbiAgICAgICAgICAgIH0sIGBWYWxpZGF0aW9uIGNvbXBsZXRlZDogJHticm9rZW5SZWZlcmVuY2VzLmxlbmd0aH0gYnJva2VuIHJlZmVyZW5jZXMgZm91bmRgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0QXNzZXREZXBlbmRlbmNpZXModXJsT3JVVUlEOiBzdHJpbmcsIGRpcmVjdGlvbjogc3RyaW5nID0gJ2RlcGVuZGVuY2llcycpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKFxuICAgICAgICAgICAgJ0Fzc2V0IGRlcGVuZGVuY3kgYW5hbHlzaXMgcmVxdWlyZXMgYWRkaXRpb25hbCBBUElzIG5vdCBhdmFpbGFibGUgaW4gY3VycmVudCBDb2NvcyBDcmVhdG9yIE1DUCBpbXBsZW1lbnRhdGlvbi4gQ29uc2lkZXIgdXNpbmcgdGhlIEVkaXRvciBVSSBmb3IgZGVwZW5kZW5jeSBhbmFseXNpcy4nXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRVbnVzZWRBc3NldHMoZGlyZWN0b3J5OiBzdHJpbmcgPSBERUZBVUxUX0FTU0VUX0RJUkVDVE9SWSwgZXhjbHVkZURpcmVjdG9yaWVzOiBzdHJpbmdbXSA9IFtdKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShcbiAgICAgICAgICAgICdVbnVzZWQgYXNzZXQgZGV0ZWN0aW9uIHJlcXVpcmVzIGNvbXByZWhlbnNpdmUgcHJvamVjdCBhbmFseXNpcyBub3QgYXZhaWxhYmxlIGluIGN1cnJlbnQgQ29jb3MgQ3JlYXRvciBNQ1AgaW1wbGVtZW50YXRpb24uIENvbnNpZGVyIHVzaW5nIHRoZSBFZGl0b3IgVUkgb3IgdGhpcmQtcGFydHkgdG9vbHMgZm9yIHVudXNlZCBhc3NldCBkZXRlY3Rpb24uJ1xuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY29tcHJlc3NUZXh0dXJlcyhkaXJlY3Rvcnk6IHN0cmluZyA9IERFRkFVTFRfQVNTRVRfRElSRUNUT1JZLCBmb3JtYXQ6IHN0cmluZyA9ICdhdXRvJywgcXVhbGl0eTogbnVtYmVyID0gMC44KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShcbiAgICAgICAgICAgICdUZXh0dXJlIGNvbXByZXNzaW9uIHJlcXVpcmVzIGltYWdlIHByb2Nlc3NpbmcgY2FwYWJpbGl0aWVzIG5vdCBhdmFpbGFibGUgaW4gY3VycmVudCBDb2NvcyBDcmVhdG9yIE1DUCBpbXBsZW1lbnRhdGlvbi4gVXNlIHRoZSBFZGl0b3JcXCdzIGJ1aWx0LWluIHRleHR1cmUgY29tcHJlc3Npb24gc2V0dGluZ3Mgb3IgZXh0ZXJuYWwgdG9vbHMuJ1xuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZXhwb3J0QXNzZXRNYW5pZmVzdChkaXJlY3Rvcnk6IHN0cmluZyA9IERFRkFVTFRfQVNTRVRfRElSRUNUT1JZLCBmb3JtYXQ6IHN0cmluZyA9ICdqc29uJywgaW5jbHVkZU1ldGFkYXRhOiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwYXR0ZXJuID0gYCR7ZGlyZWN0b3J5fS8qKi8qYDtcbiAgICAgICAgICAgIGNvbnN0IGFzc2V0czogQXNzZXRJbmZvW10gPSBhd2FpdCB0aGlzLnByb21pc2lmeUFzc2V0RGI8QXNzZXRJbmZvW10+KChjYikgPT4ge1xuICAgICAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLnF1ZXJ5QXNzZXRzKHBhdHRlcm4sICcnLCBjYik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKGFzc2V0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbXB0eU1hbmlmZXN0ID0gZm9ybWF0ID09PSAnanNvbicgPyAnW10nIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0b3J5LFxuICAgICAgICAgICAgICAgICAgICBmb3JtYXQsXG4gICAgICAgICAgICAgICAgICAgIGFzc2V0Q291bnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIGluY2x1ZGVNZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgbWFuaWZlc3Q6IGVtcHR5TWFuaWZlc3RcbiAgICAgICAgICAgICAgICB9LCAnQXNzZXQgbWFuaWZlc3QgZXhwb3J0ZWQgd2l0aCAwIGFzc2V0cycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtYW5pZmVzdEVudHJpZXMgPSBhd2FpdCB0aGlzLnByb2Nlc3NTZXF1ZW50aWFsbHkoXG4gICAgICAgICAgICAgICAgYXNzZXRzLFxuICAgICAgICAgICAgICAgIGFzeW5jIChhc3NldDogQXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVudHJ5OiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhc3NldC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBhc3NldC51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBhc3NldC51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogYXNzZXQudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IGFzc2V0LnNpemUgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRGlyZWN0b3J5OiBhc3NldC5pc0RpcmVjdG9yeSB8fCBmYWxzZVxuICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmNsdWRlTWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbWV0YUluZm8gPSBhd2FpdCBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLklwYy5zZW5kVG9NYWluKFwiYXNzZXQtZGI6cXVlcnktbWV0YS1pbmZvLWJ5LXV1aWRcIiwgYXNzZXQudXVpZCwgKGVycjogRXJyb3IgfCBudWxsLCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShpbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1ldGFJbmZvICYmIG1ldGFJbmZvLmpzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW50cnkubWV0YSA9IG1ldGFJbmZvLmpzb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2tpcCBtZXRhZGF0YSBpZiBub3QgYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW50cnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmluYWxpemVNYW5pZmVzdEV4cG9ydChkaXJlY3RvcnksIGZvcm1hdCwgaW5jbHVkZU1ldGFkYXRhLCBtYW5pZmVzdEVudHJpZXMpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmaW5hbGl6ZU1hbmlmZXN0RXhwb3J0KGRpcmVjdG9yeTogc3RyaW5nLCBmb3JtYXQ6IHN0cmluZywgaW5jbHVkZU1ldGFkYXRhOiBib29sZWFuLCBtYW5pZmVzdDogYW55W10pOiBUb29sUmVzcG9uc2Uge1xuICAgICAgICBsZXQgZXhwb3J0RGF0YTogc3RyaW5nO1xuICAgICAgICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgICAgICAgICAgY2FzZSAnanNvbic6XG4gICAgICAgICAgICAgICAgZXhwb3J0RGF0YSA9IEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0LCBudWxsLCAyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2Nzdic6XG4gICAgICAgICAgICAgICAgZXhwb3J0RGF0YSA9IHRoaXMuY29udmVydFRvQ1NWKG1hbmlmZXN0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3htbCc6XG4gICAgICAgICAgICAgICAgZXhwb3J0RGF0YSA9IHRoaXMuY29udmVydFRvWE1MKG1hbmlmZXN0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgZXhwb3J0RGF0YSA9IEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0LCBudWxsLCAyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSh7XG4gICAgICAgICAgICBkaXJlY3RvcnksXG4gICAgICAgICAgICBmb3JtYXQsXG4gICAgICAgICAgICBhc3NldENvdW50OiBtYW5pZmVzdC5sZW5ndGgsXG4gICAgICAgICAgICBpbmNsdWRlTWV0YWRhdGEsXG4gICAgICAgICAgICBtYW5pZmVzdDogZXhwb3J0RGF0YVxuICAgICAgICB9LCBgQXNzZXQgbWFuaWZlc3QgZXhwb3J0ZWQgd2l0aCAke21hbmlmZXN0Lmxlbmd0aH0gYXNzZXRzYCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb252ZXJ0VG9DU1YoZGF0YTogYW55W10pOiBzdHJpbmcge1xuICAgICAgICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHJldHVybiAnJztcblxuICAgICAgICBjb25zdCBoZWFkZXJzID0gT2JqZWN0LmtleXMoZGF0YVswXSk7XG4gICAgICAgIGNvbnN0IGNzdlJvd3MgPSBbaGVhZGVycy5qb2luKCcsJyldO1xuXG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IGhlYWRlcnMubWFwKGhlYWRlciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSByb3dbaGVhZGVyXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyA/IEpTT04uc3RyaW5naWZ5KHZhbHVlKSA6IFN0cmluZyh2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNzdlJvd3MucHVzaCh2YWx1ZXMuam9pbignLCcpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjc3ZSb3dzLmpvaW4oJ1xcbicpO1xuICAgIH1cblxuICAgIHByaXZhdGUgY29udmVydFRvWE1MKGRhdGE6IGFueVtdKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IHhtbCA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5cXG48YXNzZXRzPlxcbic7XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGRhdGEpIHtcbiAgICAgICAgICAgIHhtbCArPSAnICA8YXNzZXQ+XFxuJztcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeG1sVmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID9cbiAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgU3RyaW5nKHZhbHVlKS5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG4gICAgICAgICAgICAgICAgeG1sICs9IGAgICAgPCR7a2V5fT4ke3htbFZhbHVlfTwvJHtrZXl9PlxcbmA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4bWwgKz0gJyAgPC9hc3NldD5cXG4nO1xuICAgICAgICB9XG5cbiAgICAgICAgeG1sICs9ICc8L2Fzc2V0cz4nO1xuICAgICAgICByZXR1cm4geG1sO1xuICAgIH1cbn0iXX0=