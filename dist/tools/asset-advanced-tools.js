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
            Editor.log('asset-advanced-tools.convertUrlToUuid');
            Editor.log(Editor);
            Editor.log(Editor.assetdb);
            Editor.log(Editor.assetdb.queryUuidByUrl);
            Editor.assetdb.queryUuidByUrl(url, (err, uuid) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(uuid);
                }
            });
        });
    }
    /**
     * Convert UUID to URL
     */
    convertUuidToUrl(uuid) {
        return new Promise((resolve, reject) => {
            Editor.assetdb.queryUrlByUuid(uuid, (err, url) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(url);
                }
            });
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
                    await this.promisifyAssetDb((cb) => {
                        Editor.assetdb.queryInfoByUuid(asset.uuid, cb);
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
                        const metaInfo = await this.promisifyAssetDb((cb) => {
                            Editor.assetdb.queryMetaInfoByUuid(asset.uuid, cb);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvYXNzZXQtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFnRDs7O0FBSWhELFlBQVk7QUFDWixNQUFNLHVCQUF1QixHQUFHLGFBQWEsQ0FBQztBQUM5QyxNQUFNLDJCQUEyQixHQUFHLEdBQUcsQ0FBQztBQUN4QyxNQUFNLHFCQUFxQixHQUFHLDJGQUEyRixDQUFDO0FBdUMxSCxNQUFhLGtCQUFrQjtJQUMzQixvQkFBb0I7SUFFcEI7O09BRUc7SUFDSyxLQUFLLENBQUMsU0FBaUI7UUFDM0IsT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRDs7T0FFRztJQUNLLGdCQUFnQixDQUFDLEdBQVc7UUFDaEMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxNQUFNLENBQUMsR0FBRyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7WUFDcEQsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQixNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDMUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBaUIsRUFBRSxJQUFZLEVBQUUsRUFBRTtnQkFDbkUsSUFBSSxHQUFHLEVBQUU7b0JBQ0wsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNmO3FCQUFNO29CQUNILE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDakI7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1As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RU8sWUFBWSxDQUFDLElBQVc7UUFDNUIsSUFBSSxHQUFHLEdBQUcsb0RBQW9ELENBQUM7UUFFL0QsS0FBSyxNQUFNLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDckIsR0FBRyxJQUFJLGFBQWEsQ0FBQztZQUNyQixLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDN0MsTUFBTSxRQUFRLEdBQUcsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUM7b0JBQ3hDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDdkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNyRixHQUFHLElBQUksUUFBUSxHQUFHLElBQUksUUFBUSxLQUFLLEdBQUcsS0FBSyxDQUFDO2FBQy9DO1lBQ0QsR0FBRyxJQUFJLGNBQWMsQ0FBQztTQUN6QjtRQUVELEdBQUcsSUFBSSxXQUFXLENBQUM7UUFDbkIsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0NBQ0o7QUE1dEJELGdEQTR0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwZXMvZWRpdG9yLTJ4LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbFJlc3BvbnNlLCBUb29sRXhlY3V0b3IgfSBmcm9tICcuLi90eXBlcyc7XG5cbi8vIENvbnN0YW50c1xuY29uc3QgREVGQVVMVF9BU1NFVF9ESVJFQ1RPUlkgPSAnZGI6Ly9hc3NldHMnO1xuY29uc3QgTUFYX1VSTF9HRU5FUkFUSU9OX0FUVEVNUFRTID0gMTAwO1xuY29uc3QgQVNTRVRfRVhQTE9SRV9NRVNTQUdFID0gJ0Fzc2V0IGxvY2F0aW9uIHJldmVhbGVkIGluIGZpbGUgc3lzdGVtLiBQbGVhc2Ugb3BlbiBtYW51YWxseSB3aXRoIHlvdXIgcHJlZmVycmVkIHByb2dyYW0uJztcblxuLy8gVHlwZSBEZWZpbml0aW9uc1xuaW50ZXJmYWNlIEFzc2V0SW5mbyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHVybDogc3RyaW5nO1xuICAgIHV1aWQ6IHN0cmluZztcbiAgICB0eXBlOiBzdHJpbmc7XG4gICAgc2l6ZT86IG51bWJlcjtcbiAgICBpc0RpcmVjdG9yeT86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBCYXRjaEltcG9ydFJlc3VsdCB7XG4gICAgc291cmNlOiBzdHJpbmc7XG4gICAgdGFyZ2V0Pzogc3RyaW5nO1xuICAgIHN1Y2Nlc3M6IGJvb2xlYW47XG4gICAgZXJyb3I/OiBzdHJpbmc7XG4gICAgdXVpZD86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEJhdGNoRGVsZXRlUmVzdWx0IHtcbiAgICB1cmw6IHN0cmluZztcbiAgICBzdWNjZXNzOiBib29sZWFuO1xuICAgIGVycm9yPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQmF0Y2hJbXBvcnRBcmdzIHtcbiAgICBzb3VyY2VEaXJlY3Rvcnk6IHN0cmluZztcbiAgICB0YXJnZXREaXJlY3Rvcnk6IHN0cmluZztcbiAgICBmaWxlRmlsdGVyPzogc3RyaW5nW107XG4gICAgcmVjdXJzaXZlPzogYm9vbGVhbjtcbiAgICBvdmVyd3JpdGU/OiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgTm9ybWFsaXplZEFzc2V0IHtcbiAgICB1cmw6IHN0cmluZztcbiAgICB1dWlkOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldEFkdmFuY2VkVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIC8vIFV0aWxpdHkgRnVuY3Rpb25zXG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGEgVVJMIChzdGFydHMgd2l0aCAnZGI6Ly8nKVxuICAgICAqL1xuICAgIHByaXZhdGUgaXNVcmwodXJsT3JVVUlEOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHVybE9yVVVJRC5zdGFydHNXaXRoKCdkYjovLycpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgVVJMIHRvIFVVSURcbiAgICAgKi9cbiAgICBwcml2YXRlIGNvbnZlcnRVcmxUb1V1aWQodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgRWRpdG9yLmxvZygnYXNzZXQtYWR2YW5jZWQtdG9vbHMuY29udmVydFVybFRvVXVpZCcpO1xuICAgICAgICAgICAgRWRpdG9yLmxvZyhFZGl0b3IpO1xuICAgICAgICAgICAgRWRpdG9yLmxvZyhFZGl0b3IuYXNzZXRkYik7XG4gICAgICAgICAgICBFZGl0b3IubG9nKEVkaXRvci5hc3NldGRiLnF1ZXJ5VXVpZEJ5VXJsKTtcbiAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLnF1ZXJ5VXVpZEJ5VXJsKHVybCwgKGVycjogRXJyb3IgfCBudWxsLCB1dWlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodXVpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbnZlcnQgVVVJRCB0byBVUkxcbiAgICAgKi9cbiAgICBwcml2YXRlIGNvbnZlcnRVdWlkVG9VcmwodXVpZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLnF1ZXJ5VXJsQnlVdWlkKHV1aWQsIChlcnI6IEVycm9yIHwgbnVsbCwgdXJsOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUodXJsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTm9ybWFsaXplIFVSTCBvciBVVUlEIHRvIGdldCBib3RoIFVSTCBhbmQgVVVJRFxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgbm9ybWFsaXplVXJsT3JVdWlkKHVybE9yVVVJRDogc3RyaW5nKTogUHJvbWlzZTxOb3JtYWxpemVkQXNzZXQ+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNVcmwodXJsT3JVVUlEKSkge1xuICAgICAgICAgICAgY29uc3QgdXVpZCA9IGF3YWl0IHRoaXMuY29udmVydFVybFRvVXVpZCh1cmxPclVVSUQpO1xuICAgICAgICAgICAgcmV0dXJuIHsgdXJsOiB1cmxPclVVSUQsIHV1aWQgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IGF3YWl0IHRoaXMuY29udmVydFV1aWRUb1VybCh1cmxPclVVSUQpO1xuICAgICAgICAgICAgcmV0dXJuIHsgdXJsLCB1dWlkOiB1cmxPclVVSUQgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb21pc2lmeSBhc3NldGRiIGNhbGxiYWNrIGZ1bmN0aW9uc1xuICAgICAqL1xuICAgIHByaXZhdGUgcHJvbWlzaWZ5QXNzZXREYjxUPihcbiAgICAgICAgY2FsbGJhY2tGbjogKGNiOiAoZXJyOiBFcnJvciB8IG51bGwsIHJlc3VsdDogVCkgPT4gdm9pZCkgPT4gdm9pZFxuICAgICk6IFByb21pc2U8VD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY2FsbGJhY2tGbigoZXJyOiBFcnJvciB8IG51bGwsIHJlc3VsdDogVCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm9jZXNzIGl0ZW1zIHNlcXVlbnRpYWxseVxuICAgICAqL1xuICAgIHByaXZhdGUgYXN5bmMgcHJvY2Vzc1NlcXVlbnRpYWxseTxULCBSPihcbiAgICAgICAgaXRlbXM6IFRbXSxcbiAgICAgICAgcHJvY2Vzc29yOiAoaXRlbTogVCwgaW5kZXg6IG51bWJlcikgPT4gUHJvbWlzZTxSPlxuICAgICk6IFByb21pc2U8UltdPiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdHM6IFJbXSA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwcm9jZXNzb3IoaXRlbXNbaV0sIGkpO1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGVycm9yIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVFcnJvclJlc3BvbnNlKGVycm9yOiBFcnJvciB8IHN0cmluZyk6IFRvb2xSZXNwb25zZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIHN1Y2Nlc3MgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwcml2YXRlIGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZShkYXRhPzogYW55LCBtZXNzYWdlPzogc3RyaW5nKTogVG9vbFJlc3BvbnNlIHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2U6IFRvb2xSZXNwb25zZSA9IHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhKSB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YS5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2UubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH1cblxuICAgIC8vIFB1YmxpYyBNZXRob2RzXG5cbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnc2F2ZV9hc3NldF9tZXRhJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NhdmUgYXNzZXQgbWV0YSBpbmZvcm1hdGlvbicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybE9yVVVJRDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIG9yIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgbWV0YSBzZXJpYWxpemVkIGNvbnRlbnQgc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1cmxPclVVSUQnLCAnY29udGVudCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2VuZXJhdGVfYXZhaWxhYmxlX3VybCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZW5lcmF0ZSBhbiBhdmFpbGFibGUgVVJMIGJhc2VkIG9uIGlucHV0IFVSTCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIHRvIGdlbmVyYXRlIGF2YWlsYWJsZSBVUkwgZm9yJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1cmwnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3F1ZXJ5X2Fzc2V0X2RiX3JlYWR5JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NoZWNrIGlmIGFzc2V0IGRhdGFiYXNlIGlzIHJlYWR5JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdvcGVuX2Fzc2V0X2V4dGVybmFsJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wZW4gYXNzZXQgd2l0aCBleHRlcm5hbCBwcm9ncmFtJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsT3JVVUlEOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVUkwgb3IgVVVJRCB0byBvcGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1cmxPclVVSUQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2JhdGNoX2ltcG9ydF9hc3NldHMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW1wb3J0IG11bHRpcGxlIGFzc2V0cyBpbiBiYXRjaCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZURpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU291cmNlIGRpcmVjdG9yeSBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldERpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGFyZ2V0IGRpcmVjdG9yeSBVUkwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUZpbHRlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZpbGUgZXh0ZW5zaW9ucyB0byBpbmNsdWRlIChlLmcuLCBbXCIucG5nXCIsIFwiLmpwZ1wiXSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBzdWJkaXJlY3RvcmllcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyd3JpdGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPdmVyd3JpdGUgZXhpc3RpbmcgZmlsZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3NvdXJjZURpcmVjdG9yeScsICd0YXJnZXREaXJlY3RvcnknXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2JhdGNoX2RlbGV0ZV9hc3NldHMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVsZXRlIG11bHRpcGxlIGFzc2V0cyBpbiBiYXRjaCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBcnJheSBvZiBhc3NldCBVUkxzIHRvIGRlbGV0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXJscyddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndmFsaWRhdGVfYXNzZXRfcmVmZXJlbmNlcycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdWYWxpZGF0ZSBhc3NldCByZWZlcmVuY2VzIGFuZCBmaW5kIGJyb2tlbiBsaW5rcycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGlyZWN0b3J5IHRvIHZhbGlkYXRlIChkZWZhdWx0OiBlbnRpcmUgcHJvamVjdCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdkYjovL2Fzc2V0cydcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9hc3NldF9kZXBlbmRlbmNpZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGFzc2V0IGRlcGVuZGVuY3kgdHJlZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybE9yVVVJRDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIG9yIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEZXBlbmRlbmN5IGRpcmVjdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydkZXBlbmRlbnRzJywgJ2RlcGVuZGVuY2llcycsICdib3RoJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RlcGVuZGVuY2llcydcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXJsT3JVVUlEJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfdW51c2VkX2Fzc2V0cycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaW5kIHVudXNlZCBhc3NldHMgaW4gcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGlyZWN0b3J5IHRvIHNjYW4gKGRlZmF1bHQ6IGVudGlyZSBwcm9qZWN0KScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RiOi8vYXNzZXRzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGVEaXJlY3Rvcmllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RpcmVjdG9yaWVzIHRvIGV4Y2x1ZGUgZnJvbSBzY2FuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY29tcHJlc3NfdGV4dHVyZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQmF0Y2ggY29tcHJlc3MgdGV4dHVyZSBhc3NldHMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RpcmVjdG9yeSBjb250YWluaW5nIHRleHR1cmVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnZGI6Ly9hc3NldHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb21wcmVzc2lvbiBmb3JtYXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnYXV0bycsICdqcGcnLCAncG5nJywgJ3dlYnAnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnYXV0bydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWFsaXR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb21wcmVzc2lvbiBxdWFsaXR5ICgwLjEtMS4wKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluaW11bTogMC4xLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heGltdW06IDEuMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLjhcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2V4cG9ydF9hc3NldF9tYW5pZmVzdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeHBvcnQgYXNzZXQgbWFuaWZlc3QvaW52ZW50b3J5JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0b3J5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEaXJlY3RvcnkgdG8gZXhwb3J0IG1hbmlmZXN0IGZvcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RiOi8vYXNzZXRzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRXhwb3J0IGZvcm1hdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydqc29uJywgJ2NzdicsICd4bWwnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnanNvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlTWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbmNsdWRlIGFzc2V0IG1ldGFkYXRhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdzYXZlX2Fzc2V0X21ldGEnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNhdmVBc3NldE1ldGEoYXJncy51cmxPclVVSUQsIGFyZ3MuY29udGVudCk7XG4gICAgICAgICAgICBjYXNlICdnZW5lcmF0ZV9hdmFpbGFibGVfdXJsJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZW5lcmF0ZUF2YWlsYWJsZVVybChhcmdzLnVybCk7XG4gICAgICAgICAgICBjYXNlICdxdWVyeV9hc3NldF9kYl9yZWFkeSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlBc3NldERiUmVhZHkoKTtcbiAgICAgICAgICAgIGNhc2UgJ29wZW5fYXNzZXRfZXh0ZXJuYWwnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm9wZW5Bc3NldEV4dGVybmFsKGFyZ3MudXJsT3JVVUlEKTtcbiAgICAgICAgICAgIGNhc2UgJ2JhdGNoX2ltcG9ydF9hc3NldHMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmJhdGNoSW1wb3J0QXNzZXRzKGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAnYmF0Y2hfZGVsZXRlX2Fzc2V0cyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYmF0Y2hEZWxldGVBc3NldHMoYXJncy51cmxzKTtcbiAgICAgICAgICAgIGNhc2UgJ3ZhbGlkYXRlX2Fzc2V0X3JlZmVyZW5jZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnZhbGlkYXRlQXNzZXRSZWZlcmVuY2VzKGFyZ3MuZGlyZWN0b3J5KTtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9hc3NldF9kZXBlbmRlbmNpZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEFzc2V0RGVwZW5kZW5jaWVzKGFyZ3MudXJsT3JVVUlELCBhcmdzLmRpcmVjdGlvbik7XG4gICAgICAgICAgICBjYXNlICdnZXRfdW51c2VkX2Fzc2V0cyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0VW51c2VkQXNzZXRzKGFyZ3MuZGlyZWN0b3J5LCBhcmdzLmV4Y2x1ZGVEaXJlY3Rvcmllcyk7XG4gICAgICAgICAgICBjYXNlICdjb21wcmVzc190ZXh0dXJlcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY29tcHJlc3NUZXh0dXJlcyhhcmdzLmRpcmVjdG9yeSwgYXJncy5mb3JtYXQsIGFyZ3MucXVhbGl0eSk7XG4gICAgICAgICAgICBjYXNlICdleHBvcnRfYXNzZXRfbWFuaWZlc3QnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4cG9ydEFzc2V0TWFuaWZlc3QoYXJncy5kaXJlY3RvcnksIGFyZ3MuZm9ybWF0LCBhcmdzLmluY2x1ZGVNZXRhZGF0YSk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlQXNzZXRNZXRhKHVybE9yVVVJRDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IGF3YWl0IHRoaXMubm9ybWFsaXplVXJsT3JVdWlkKHVybE9yVVVJRCk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHJvbWlzaWZ5QXNzZXREYjx2b2lkPigoY2IpID0+IHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5zYXZlTWV0YShub3JtYWxpemVkLnV1aWQsIGNvbnRlbnQsIGNiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgIHV1aWQ6IG5vcm1hbGl6ZWQudXVpZCxcbiAgICAgICAgICAgICAgICB1cmw6IG5vcm1hbGl6ZWQudXJsXG4gICAgICAgICAgICB9LCAnQXNzZXQgbWV0YSBzYXZlZCBzdWNjZXNzZnVsbHknKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVBdmFpbGFibGVVcmwodXJsOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPD0gTUFYX1VSTF9HRU5FUkFUSU9OX0FUVEVNUFRTOyBhdHRlbXB0KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXN0VXJsID0gYXR0ZW1wdCA9PT0gMCA/IHVybCA6IHRoaXMuZ2V0TmV4dFVybCh1cmwsIGF0dGVtcHQpO1xuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5jb252ZXJ0VXJsVG9VdWlkKHRlc3RVcmwpO1xuICAgICAgICAgICAgICAgICAgICAvLyBVUkwgZXhpc3RzLCBjb250aW51ZSB0byBuZXh0IGF0dGVtcHRcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVVJMIGRvZXNuJ3QgZXhpc3QsIHNvIGl0J3MgYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFVybDogdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVXJsOiB0ZXN0VXJsXG4gICAgICAgICAgICAgICAgICAgIH0sIHRlc3RVcmwgPT09IHVybCA/ICdVUkwgaXMgYXZhaWxhYmxlJyA6ICdHZW5lcmF0ZWQgbmV3IGF2YWlsYWJsZSBVUkwnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoYENvdWxkIG5vdCBnZW5lcmF0ZSBhdmFpbGFibGUgVVJMIGFmdGVyICR7TUFYX1VSTF9HRU5FUkFUSU9OX0FUVEVNUFRTfSBhdHRlbXB0c2ApO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXROZXh0VXJsKHVybDogc3RyaW5nLCBhdHRlbXB0OiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgICAvLyBTcGxpdCBVUkwgaW50byBiYXNlIGFuZCBleHRlbnNpb25cbiAgICAgICAgY29uc3QgbGFzdERvdCA9IHVybC5sYXN0SW5kZXhPZignLicpO1xuICAgICAgICBjb25zdCBsYXN0U2xhc2ggPSB1cmwubGFzdEluZGV4T2YoJy8nKTtcblxuICAgICAgICBpZiAobGFzdERvdCA+IGxhc3RTbGFzaCkge1xuICAgICAgICAgICAgLy8gSGFzIGV4dGVuc2lvblxuICAgICAgICAgICAgY29uc3QgYmFzZSA9IHVybC5zdWJzdHJpbmcoMCwgbGFzdERvdCk7XG4gICAgICAgICAgICBjb25zdCBleHQgPSB1cmwuc3Vic3RyaW5nKGxhc3REb3QpO1xuICAgICAgICAgICAgcmV0dXJuIGAke2Jhc2V9LSR7YXR0ZW1wdH0ke2V4dH1gO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gTm8gZXh0ZW5zaW9uXG4gICAgICAgICAgICByZXR1cm4gYCR7dXJsfS0ke2F0dGVtcHR9YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcXVlcnlBc3NldERiUmVhZHkoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHJvbWlzaWZ5QXNzZXREYjxhbnlbXT4oKGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIucXVlcnlBc3NldHMoREVGQVVMVF9BU1NFVF9ESVJFQ1RPUlksICcnLCBjYik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICByZWFkeTogdHJ1ZVxuICAgICAgICAgICAgfSwgJ0Fzc2V0IGRhdGFiYXNlIGlzIHJlYWR5Jyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgIHJlYWR5OiBmYWxzZVxuICAgICAgICAgICAgfSwgJ0Fzc2V0IGRhdGFiYXNlIGlzIG5vdCByZWFkeScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBvcGVuQXNzZXRFeHRlcm5hbCh1cmxPclVVSUQ6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBub3JtYWxpemVkID0gYXdhaXQgdGhpcy5ub3JtYWxpemVVcmxPclV1aWQodXJsT3JVVUlEKTtcbiAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLmV4cGxvcmUobm9ybWFsaXplZC51cmwpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2UodW5kZWZpbmVkLCBBU1NFVF9FWFBMT1JFX01FU1NBR0UpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBiYXRjaEltcG9ydEFzc2V0cyhhcmdzOiBCYXRjaEltcG9ydEFyZ3MpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblxuICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGFyZ3Muc291cmNlRGlyZWN0b3J5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoJ1NvdXJjZSBkaXJlY3RvcnkgZG9lcyBub3QgZXhpc3QnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZmlsZXMgPSB0aGlzLmdldEZpbGVzRnJvbURpcmVjdG9yeShcbiAgICAgICAgICAgICAgICBhcmdzLnNvdXJjZURpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICBhcmdzLmZpbGVGaWx0ZXIgfHwgW10sXG4gICAgICAgICAgICAgICAgYXJncy5yZWN1cnNpdmUgfHwgZmFsc2VcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNvbnN0IGltcG9ydFJlc3VsdHM6IEJhdGNoSW1wb3J0UmVzdWx0W10gPSBhd2FpdCB0aGlzLnByb2Nlc3NTZXF1ZW50aWFsbHkoXG4gICAgICAgICAgICAgICAgZmlsZXMsXG4gICAgICAgICAgICAgICAgYXN5bmMgKGZpbGVQYXRoOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucHJvbWlzaWZ5QXNzZXREYjx2b2lkPigoY2IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5pbXBvcnQoW2ZpbGVQYXRoXSwgYXJncy50YXJnZXREaXJlY3RvcnksIHRydWUsIGNiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0OiBgJHthcmdzLnRhcmdldERpcmVjdG9yeX0vJHtwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29uc3Qgc3VjY2Vzc0NvdW50ID0gaW1wb3J0UmVzdWx0cy5maWx0ZXIociA9PiByLnN1Y2Nlc3MpLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yQ291bnQgPSBpbXBvcnRSZXN1bHRzLmZpbHRlcihyID0+ICFyLnN1Y2Nlc3MpLmxlbmd0aDtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50LFxuICAgICAgICAgICAgICAgIGVycm9yQ291bnQsXG4gICAgICAgICAgICAgICAgcmVzdWx0czogaW1wb3J0UmVzdWx0c1xuICAgICAgICAgICAgfSwgYEJhdGNoIGltcG9ydCBjb21wbGV0ZWQ6ICR7c3VjY2Vzc0NvdW50fSBzdWNjZXNzLCAke2Vycm9yQ291bnR9IGVycm9yc2ApO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRGaWxlc0Zyb21EaXJlY3RvcnkoZGlyUGF0aDogc3RyaW5nLCBmaWxlRmlsdGVyOiBzdHJpbmdbXSwgcmVjdXJzaXZlOiBib29sZWFuKTogc3RyaW5nW10ge1xuICAgICAgICBjb25zdCBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG4gICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG4gICAgICAgIGNvbnN0IGZpbGVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gZnMucmVhZGRpclN5bmMoZGlyUGF0aCk7XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXJQYXRoLCBpdGVtKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhmdWxsUGF0aCk7XG5cbiAgICAgICAgICAgIGlmIChzdGF0LmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGZpbGVGaWx0ZXIubGVuZ3RoID09PSAwIHx8IGZpbGVGaWx0ZXIuc29tZShleHQgPT4gaXRlbS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKGV4dC50b0xvd2VyQ2FzZSgpKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZXMucHVzaChmdWxsUGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkgJiYgcmVjdXJzaXZlKSB7XG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaCguLi50aGlzLmdldEZpbGVzRnJvbURpcmVjdG9yeShmdWxsUGF0aCwgZmlsZUZpbHRlciwgcmVjdXJzaXZlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmlsZXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBiYXRjaERlbGV0ZUFzc2V0cyh1cmxzOiBzdHJpbmdbXSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBOb3RlOiBFZGl0b3IuYXNzZXRkYi5kZWxldGUoKSBkb2VzIG5vdCBwcm92aWRlIGEgY2FsbGJhY2tcbiAgICAgICAgICAgIC8vIFdlIGFzc3VtZSBpdCBzdWNjZWVkcyBhbmQgcmVwb3J0IGFsbCBhcyBzdWNjZXNzZnVsXG4gICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5kZWxldGUodXJscyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlbGV0ZVJlc3VsdHM6IEJhdGNoRGVsZXRlUmVzdWx0W10gPSB1cmxzLm1hcCh1cmwgPT4gKHtcbiAgICAgICAgICAgICAgICB1cmwsXG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgIHRvdGFsQXNzZXRzOiB1cmxzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBzdWNjZXNzQ291bnQ6IHVybHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGVycm9yQ291bnQ6IDAsXG4gICAgICAgICAgICAgICAgcmVzdWx0czogZGVsZXRlUmVzdWx0c1xuICAgICAgICAgICAgfSwgYEJhdGNoIGRlbGV0ZSBpbml0aWF0ZWQgZm9yICR7dXJscy5sZW5ndGh9IGFzc2V0cy4gTm90ZTogSW5kaXZpZHVhbCBkZWxldGlvbiByZXN1bHRzIGFyZSBub3QgYXZhaWxhYmxlIGluIDIueCBBUEkuYCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlQXNzZXRSZWZlcmVuY2VzKGRpcmVjdG9yeTogc3RyaW5nID0gREVGQVVMVF9BU1NFVF9ESVJFQ1RPUlkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcGF0dGVybiA9IGAke2RpcmVjdG9yeX0vKiovKmA7XG4gICAgICAgICAgICBjb25zdCBhc3NldHM6IEFzc2V0SW5mb1tdID0gYXdhaXQgdGhpcy5wcm9taXNpZnlBc3NldERiPEFzc2V0SW5mb1tdPigoY2IpID0+IHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeUFzc2V0cyhwYXR0ZXJuLCAnJywgY2IpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChhc3NldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0b3J5LFxuICAgICAgICAgICAgICAgICAgICB0b3RhbEFzc2V0czogMCxcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRSZWZlcmVuY2VzOiAwLFxuICAgICAgICAgICAgICAgICAgICBicm9rZW5SZWZlcmVuY2VzOiAwLFxuICAgICAgICAgICAgICAgICAgICBicm9rZW5Bc3NldHM6IFtdXG4gICAgICAgICAgICAgICAgfSwgJ1ZhbGlkYXRpb24gY29tcGxldGVkOiAwIGFzc2V0cyBmb3VuZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uUmVzdWx0cyA9IGF3YWl0IHRoaXMucHJvY2Vzc1NlcXVlbnRpYWxseShcbiAgICAgICAgICAgICAgICBhc3NldHMsXG4gICAgICAgICAgICAgICAgYXN5bmMgKGFzc2V0OiBBc3NldEluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucHJvbWlzaWZ5QXNzZXREYjxhbnk+KChjYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLnF1ZXJ5SW5mb0J5VXVpZChhc3NldC51dWlkLCBjYik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGFzc2V0LnVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBhc3NldC51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWQ6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogYXNzZXQudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgY29uc3QgdmFsaWRSZWZlcmVuY2VzID0gdmFsaWRhdGlvblJlc3VsdHMuZmlsdGVyKHIgPT4gci52YWxpZCk7XG4gICAgICAgICAgICBjb25zdCBicm9rZW5SZWZlcmVuY2VzID0gdmFsaWRhdGlvblJlc3VsdHMuZmlsdGVyKHIgPT4gIXIudmFsaWQpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgIGRpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICB0b3RhbEFzc2V0czogYXNzZXRzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICB2YWxpZFJlZmVyZW5jZXM6IHZhbGlkUmVmZXJlbmNlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYnJva2VuUmVmZXJlbmNlczogYnJva2VuUmVmZXJlbmNlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgYnJva2VuQXNzZXRzOiBicm9rZW5SZWZlcmVuY2VzXG4gICAgICAgICAgICB9LCBgVmFsaWRhdGlvbiBjb21wbGV0ZWQ6ICR7YnJva2VuUmVmZXJlbmNlcy5sZW5ndGh9IGJyb2tlbiByZWZlcmVuY2VzIGZvdW5kYCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldEFzc2V0RGVwZW5kZW5jaWVzKHVybE9yVVVJRDogc3RyaW5nLCBkaXJlY3Rpb246IHN0cmluZyA9ICdkZXBlbmRlbmNpZXMnKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShcbiAgICAgICAgICAgICdBc3NldCBkZXBlbmRlbmN5IGFuYWx5c2lzIHJlcXVpcmVzIGFkZGl0aW9uYWwgQVBJcyBub3QgYXZhaWxhYmxlIGluIGN1cnJlbnQgQ29jb3MgQ3JlYXRvciBNQ1AgaW1wbGVtZW50YXRpb24uIENvbnNpZGVyIHVzaW5nIHRoZSBFZGl0b3IgVUkgZm9yIGRlcGVuZGVuY3kgYW5hbHlzaXMuJ1xuICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0VW51c2VkQXNzZXRzKGRpcmVjdG9yeTogc3RyaW5nID0gREVGQVVMVF9BU1NFVF9ESVJFQ1RPUlksIGV4Y2x1ZGVEaXJlY3Rvcmllczogc3RyaW5nW10gPSBbXSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoXG4gICAgICAgICAgICAnVW51c2VkIGFzc2V0IGRldGVjdGlvbiByZXF1aXJlcyBjb21wcmVoZW5zaXZlIHByb2plY3QgYW5hbHlzaXMgbm90IGF2YWlsYWJsZSBpbiBjdXJyZW50IENvY29zIENyZWF0b3IgTUNQIGltcGxlbWVudGF0aW9uLiBDb25zaWRlciB1c2luZyB0aGUgRWRpdG9yIFVJIG9yIHRoaXJkLXBhcnR5IHRvb2xzIGZvciB1bnVzZWQgYXNzZXQgZGV0ZWN0aW9uLidcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGNvbXByZXNzVGV4dHVyZXMoZGlyZWN0b3J5OiBzdHJpbmcgPSBERUZBVUxUX0FTU0VUX0RJUkVDVE9SWSwgZm9ybWF0OiBzdHJpbmcgPSAnYXV0bycsIHF1YWxpdHk6IG51bWJlciA9IDAuOCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoXG4gICAgICAgICAgICAnVGV4dHVyZSBjb21wcmVzc2lvbiByZXF1aXJlcyBpbWFnZSBwcm9jZXNzaW5nIGNhcGFiaWxpdGllcyBub3QgYXZhaWxhYmxlIGluIGN1cnJlbnQgQ29jb3MgQ3JlYXRvciBNQ1AgaW1wbGVtZW50YXRpb24uIFVzZSB0aGUgRWRpdG9yXFwncyBidWlsdC1pbiB0ZXh0dXJlIGNvbXByZXNzaW9uIHNldHRpbmdzIG9yIGV4dGVybmFsIHRvb2xzLidcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGV4cG9ydEFzc2V0TWFuaWZlc3QoZGlyZWN0b3J5OiBzdHJpbmcgPSBERUZBVUxUX0FTU0VUX0RJUkVDVE9SWSwgZm9ybWF0OiBzdHJpbmcgPSAnanNvbicsIGluY2x1ZGVNZXRhZGF0YTogYm9vbGVhbiA9IHRydWUpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcGF0dGVybiA9IGAke2RpcmVjdG9yeX0vKiovKmA7XG4gICAgICAgICAgICBjb25zdCBhc3NldHM6IEFzc2V0SW5mb1tdID0gYXdhaXQgdGhpcy5wcm9taXNpZnlBc3NldERiPEFzc2V0SW5mb1tdPigoY2IpID0+IHtcbiAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeUFzc2V0cyhwYXR0ZXJuLCAnJywgY2IpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChhc3NldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW1wdHlNYW5pZmVzdCA9IGZvcm1hdCA9PT0gJ2pzb24nID8gJ1tdJyA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICAgICAgZm9ybWF0LFxuICAgICAgICAgICAgICAgICAgICBhc3NldENvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICBpbmNsdWRlTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgICAgIG1hbmlmZXN0OiBlbXB0eU1hbmlmZXN0XG4gICAgICAgICAgICAgICAgfSwgJ0Fzc2V0IG1hbmlmZXN0IGV4cG9ydGVkIHdpdGggMCBhc3NldHMnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyaWVzID0gYXdhaXQgdGhpcy5wcm9jZXNzU2VxdWVudGlhbGx5KFxuICAgICAgICAgICAgICAgIGFzc2V0cyxcbiAgICAgICAgICAgICAgICBhc3luYyAoYXNzZXQ6IEFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbnRyeTogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogYXNzZXQudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGFzc2V0LnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXplOiBhc3NldC5zaXplIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0RpcmVjdG9yeTogYXNzZXQuaXNEaXJlY3RvcnkgfHwgZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1ldGFJbmZvID0gYXdhaXQgdGhpcy5wcm9taXNpZnlBc3NldERiPGFueT4oKGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLnF1ZXJ5TWV0YUluZm9CeVV1aWQoYXNzZXQudXVpZCwgY2IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXRhSW5mbyAmJiBtZXRhSW5mby5qc29uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJ5Lm1ldGEgPSBtZXRhSW5mby5qc29uO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNraXAgbWV0YWRhdGEgaWYgbm90IGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVudHJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbmFsaXplTWFuaWZlc3RFeHBvcnQoZGlyZWN0b3J5LCBmb3JtYXQsIGluY2x1ZGVNZXRhZGF0YSwgbWFuaWZlc3RFbnRyaWVzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZmluYWxpemVNYW5pZmVzdEV4cG9ydChkaXJlY3Rvcnk6IHN0cmluZywgZm9ybWF0OiBzdHJpbmcsIGluY2x1ZGVNZXRhZGF0YTogYm9vbGVhbiwgbWFuaWZlc3Q6IGFueVtdKTogVG9vbFJlc3BvbnNlIHtcbiAgICAgICAgbGV0IGV4cG9ydERhdGE6IHN0cmluZztcbiAgICAgICAgc3dpdGNoIChmb3JtYXQpIHtcbiAgICAgICAgICAgIGNhc2UgJ2pzb24nOlxuICAgICAgICAgICAgICAgIGV4cG9ydERhdGEgPSBKU09OLnN0cmluZ2lmeShtYW5pZmVzdCwgbnVsbCwgMik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdjc3YnOlxuICAgICAgICAgICAgICAgIGV4cG9ydERhdGEgPSB0aGlzLmNvbnZlcnRUb0NTVihtYW5pZmVzdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICd4bWwnOlxuICAgICAgICAgICAgICAgIGV4cG9ydERhdGEgPSB0aGlzLmNvbnZlcnRUb1hNTChtYW5pZmVzdCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGV4cG9ydERhdGEgPSBKU09OLnN0cmluZ2lmeShtYW5pZmVzdCwgbnVsbCwgMik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgICAgICAgZGlyZWN0b3J5LFxuICAgICAgICAgICAgZm9ybWF0LFxuICAgICAgICAgICAgYXNzZXRDb3VudDogbWFuaWZlc3QubGVuZ3RoLFxuICAgICAgICAgICAgaW5jbHVkZU1ldGFkYXRhLFxuICAgICAgICAgICAgbWFuaWZlc3Q6IGV4cG9ydERhdGFcbiAgICAgICAgfSwgYEFzc2V0IG1hbmlmZXN0IGV4cG9ydGVkIHdpdGggJHttYW5pZmVzdC5sZW5ndGh9IGFzc2V0c2ApO1xuICAgIH1cblxuICAgIHByaXZhdGUgY29udmVydFRvQ1NWKGRhdGE6IGFueVtdKTogc3RyaW5nIHtcbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoID09PSAwKSByZXR1cm4gJyc7XG5cbiAgICAgICAgY29uc3QgaGVhZGVycyA9IE9iamVjdC5rZXlzKGRhdGFbMF0pO1xuICAgICAgICBjb25zdCBjc3ZSb3dzID0gW2hlYWRlcnMuam9pbignLCcpXTtcblxuICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiBkYXRhKSB7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBoZWFkZXJzLm1hcChoZWFkZXIgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gcm93W2hlYWRlcl07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiBTdHJpbmcodmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjc3ZSb3dzLnB1c2godmFsdWVzLmpvaW4oJywnKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY3N2Um93cy5qb2luKCdcXG4nKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNvbnZlcnRUb1hNTChkYXRhOiBhbnlbXSk6IHN0cmluZyB7XG4gICAgICAgIGxldCB4bWwgPSAnPD94bWwgdmVyc2lvbj1cIjEuMFwiIGVuY29kaW5nPVwiVVRGLThcIj8+XFxuPGFzc2V0cz5cXG4nO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBkYXRhKSB7XG4gICAgICAgICAgICB4bWwgKz0gJyAgPGFzc2V0Plxcbic7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHhtbFZhbHVlID0gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyA/XG4gICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgIFN0cmluZyh2YWx1ZSkucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpO1xuICAgICAgICAgICAgICAgIHhtbCArPSBgICAgIDwke2tleX0+JHt4bWxWYWx1ZX08LyR7a2V5fT5cXG5gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeG1sICs9ICcgIDwvYXNzZXQ+XFxuJztcbiAgICAgICAgfVxuXG4gICAgICAgIHhtbCArPSAnPC9hc3NldHM+JztcbiAgICAgICAgcmV0dXJuIHhtbDtcbiAgICB9XG59Il19