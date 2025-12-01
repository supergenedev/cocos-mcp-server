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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvYXNzZXQtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFnRDs7O0FBSWhELFlBQVk7QUFDWixNQUFNLHVCQUF1QixHQUFHLGFBQWEsQ0FBQztBQUM5QyxNQUFNLDJCQUEyQixHQUFHLEdBQUcsQ0FBQztBQUN4QyxNQUFNLHFCQUFxQixHQUFHLDJGQUEyRixDQUFDO0FBdUMxSCxNQUFhLGtCQUFrQjtJQUMzQixvQkFBb0I7SUFFcEI7O09BRUc7SUFDSyxLQUFLLENBQUMsU0FBaUI7UUFDM0IsT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRDs7T0FFRztJQUNLLGdCQUFnQixDQUFDLEdBQVc7UUFDaEMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFpQixFQUFFLElBQVksRUFBRSxFQUFFO2dCQUNuRSxJQUFJLEdBQUcsRUFBRTtvQkFDTCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ2Y7cUJBQU07b0JBQ0gsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNqQjtZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7O09BRUc7SUFDSyxnQkFBZ0IsQ0FBQyxJQUFZO1FBQ2pDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDbkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBaUIsRUFBRSxHQUFXLEVBQUUsRUFBRTtnQkFDbkUsSUFBSSxHQUFHLEVBQUU7b0JB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QUM3QyxNQUFNLFFBQVEsR0FBRyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQztvQkFDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUN2QixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3JGLEdBQUcsSUFBSSxRQUFRLEdBQUcsSUFBSSxRQUFRLEtBQUssR0FBRyxLQUFLLENBQUM7YUFDL0M7WUFDRCxHQUFHLElBQUksY0FBYyxDQUFDO1NBQ3pCO1FBRUQsR0FBRyxJQUFJLFdBQVcsQ0FBQztRQUNuQixPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7Q0FDSjtBQXh0QkQsZ0RBd3RCQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBlcy9lZGl0b3ItMnguZC50c1wiIC8+XG5cbmltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sUmVzcG9uc2UsIFRvb2xFeGVjdXRvciB9IGZyb20gJy4uL3R5cGVzJztcblxuLy8gQ29uc3RhbnRzXG5jb25zdCBERUZBVUxUX0FTU0VUX0RJUkVDVE9SWSA9ICdkYjovL2Fzc2V0cyc7XG5jb25zdCBNQVhfVVJMX0dFTkVSQVRJT05fQVRURU1QVFMgPSAxMDA7XG5jb25zdCBBU1NFVF9FWFBMT1JFX01FU1NBR0UgPSAnQXNzZXQgbG9jYXRpb24gcmV2ZWFsZWQgaW4gZmlsZSBzeXN0ZW0uIFBsZWFzZSBvcGVuIG1hbnVhbGx5IHdpdGggeW91ciBwcmVmZXJyZWQgcHJvZ3JhbS4nO1xuXG4vLyBUeXBlIERlZmluaXRpb25zXG5pbnRlcmZhY2UgQXNzZXRJbmZvIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgdXVpZDogc3RyaW5nO1xuICAgIHR5cGU6IHN0cmluZztcbiAgICBzaXplPzogbnVtYmVyO1xuICAgIGlzRGlyZWN0b3J5PzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIEJhdGNoSW1wb3J0UmVzdWx0IHtcbiAgICBzb3VyY2U6IHN0cmluZztcbiAgICB0YXJnZXQ/OiBzdHJpbmc7XG4gICAgc3VjY2VzczogYm9vbGVhbjtcbiAgICBlcnJvcj86IHN0cmluZztcbiAgICB1dWlkPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQmF0Y2hEZWxldGVSZXN1bHQge1xuICAgIHVybDogc3RyaW5nO1xuICAgIHN1Y2Nlc3M6IGJvb2xlYW47XG4gICAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBCYXRjaEltcG9ydEFyZ3Mge1xuICAgIHNvdXJjZURpcmVjdG9yeTogc3RyaW5nO1xuICAgIHRhcmdldERpcmVjdG9yeTogc3RyaW5nO1xuICAgIGZpbGVGaWx0ZXI/OiBzdHJpbmdbXTtcbiAgICByZWN1cnNpdmU/OiBib29sZWFuO1xuICAgIG92ZXJ3cml0ZT86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBOb3JtYWxpemVkQXNzZXQge1xuICAgIHVybDogc3RyaW5nO1xuICAgIHV1aWQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0QWR2YW5jZWRUb29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XG4gICAgLy8gVXRpbGl0eSBGdW5jdGlvbnNcblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHRoZSBnaXZlbiBzdHJpbmcgaXMgYSBVUkwgKHN0YXJ0cyB3aXRoICdkYjovLycpXG4gICAgICovXG4gICAgcHJpdmF0ZSBpc1VybCh1cmxPclVVSUQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdXJsT3JVVUlELnN0YXJ0c1dpdGgoJ2RiOi8vJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydCBVUkwgdG8gVVVJRFxuICAgICAqL1xuICAgIHByaXZhdGUgY29udmVydFVybFRvVXVpZCh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeVV1aWRCeVVybCh1cmwsIChlcnI6IEVycm9yIHwgbnVsbCwgdXVpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHV1aWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDb252ZXJ0IFVVSUQgdG8gVVJMXG4gICAgICovXG4gICAgcHJpdmF0ZSBjb252ZXJ0VXVpZFRvVXJsKHV1aWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeVVybEJ5VXVpZCh1dWlkLCAoZXJyOiBFcnJvciB8IG51bGwsIHVybDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVybCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6ZSBVUkwgb3IgVVVJRCB0byBnZXQgYm90aCBVUkwgYW5kIFVVSURcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIG5vcm1hbGl6ZVVybE9yVXVpZCh1cmxPclVVSUQ6IHN0cmluZyk6IFByb21pc2U8Tm9ybWFsaXplZEFzc2V0PiB7XG4gICAgICAgIGlmICh0aGlzLmlzVXJsKHVybE9yVVVJRCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHV1aWQgPSBhd2FpdCB0aGlzLmNvbnZlcnRVcmxUb1V1aWQodXJsT3JVVUlEKTtcbiAgICAgICAgICAgIHJldHVybiB7IHVybDogdXJsT3JVVUlELCB1dWlkIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSBhd2FpdCB0aGlzLmNvbnZlcnRVdWlkVG9VcmwodXJsT3JVVUlEKTtcbiAgICAgICAgICAgIHJldHVybiB7IHVybCwgdXVpZDogdXJsT3JVVUlEIH07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm9taXNpZnkgYXNzZXRkYiBjYWxsYmFjayBmdW5jdGlvbnNcbiAgICAgKi9cbiAgICBwcml2YXRlIHByb21pc2lmeUFzc2V0RGI8VD4oXG4gICAgICAgIGNhbGxiYWNrRm46IChjYjogKGVycjogRXJyb3IgfCBudWxsLCByZXN1bHQ6IFQpID0+IHZvaWQpID0+IHZvaWRcbiAgICApOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrRm4oKGVycjogRXJyb3IgfCBudWxsLCByZXN1bHQ6IFQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvY2VzcyBpdGVtcyBzZXF1ZW50aWFsbHlcbiAgICAgKi9cbiAgICBwcml2YXRlIGFzeW5jIHByb2Nlc3NTZXF1ZW50aWFsbHk8VCwgUj4oXG4gICAgICAgIGl0ZW1zOiBUW10sXG4gICAgICAgIHByb2Nlc3NvcjogKGl0ZW06IFQsIGluZGV4OiBudW1iZXIpID0+IFByb21pc2U8Uj5cbiAgICApOiBQcm9taXNlPFJbXT4ge1xuICAgICAgICBjb25zdCByZXN1bHRzOiBSW10gPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcHJvY2Vzc29yKGl0ZW1zW2ldLCBpKTtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBlcnJvciByZXNwb25zZVxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlRXJyb3JSZXNwb25zZShlcnJvcjogRXJyb3IgfCBzdHJpbmcpOiBUb29sUmVzcG9uc2Uge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvclxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBzdWNjZXNzIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVTdWNjZXNzUmVzcG9uc2UoZGF0YT86IGFueSwgbWVzc2FnZT86IHN0cmluZyk6IFRvb2xSZXNwb25zZSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlOiBUb29sUmVzcG9uc2UgPSB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlXG4gICAgICAgIH07XG4gICAgICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEgPSBkYXRhO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtZXNzYWdlKSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YSkge1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlLmRhdGEubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG5cbiAgICAvLyBQdWJsaWMgTWV0aG9kc1xuXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3NhdmVfYXNzZXRfbWV0YScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTYXZlIGFzc2V0IG1ldGEgaW5mb3JtYXRpb24nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmxPclVVSUQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fzc2V0IFVSTCBvciBVVUlEJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fzc2V0IG1ldGEgc2VyaWFsaXplZCBjb250ZW50IHN0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXJsT3JVVUlEJywgJ2NvbnRlbnQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dlbmVyYXRlX2F2YWlsYWJsZV91cmwnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2VuZXJhdGUgYW4gYXZhaWxhYmxlIFVSTCBiYXNlZCBvbiBpbnB1dCBVUkwnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fzc2V0IFVSTCB0byBnZW5lcmF0ZSBhdmFpbGFibGUgVVJMIGZvcidcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXJsJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdxdWVyeV9hc3NldF9kYl9yZWFkeScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDaGVjayBpZiBhc3NldCBkYXRhYmFzZSBpcyByZWFkeScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnb3Blbl9hc3NldF9leHRlcm5hbCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcGVuIGFzc2V0IHdpdGggZXh0ZXJuYWwgcHJvZ3JhbScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybE9yVVVJRDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIG9yIFVVSUQgdG8gb3BlbidcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXJsT3JVVUlEJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdiYXRjaF9pbXBvcnRfYXNzZXRzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ltcG9ydCBtdWx0aXBsZSBhc3NldHMgaW4gYmF0Y2gnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2VEaXJlY3Rvcnk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NvdXJjZSBkaXJlY3RvcnkgcGF0aCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXREaXJlY3Rvcnk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RhcmdldCBkaXJlY3RvcnkgVVJMJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVGaWx0ZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaWxlIGV4dGVuc2lvbnMgdG8gaW5jbHVkZSAoZS5nLiwgW1wiLnBuZ1wiLCBcIi5qcGdcIl0pJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0luY2x1ZGUgc3ViZGlyZWN0b3JpZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3ZlcndyaXRlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnT3ZlcndyaXRlIGV4aXN0aW5nIGZpbGVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWydzb3VyY2VEaXJlY3RvcnknLCAndGFyZ2V0RGlyZWN0b3J5J11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdiYXRjaF9kZWxldGVfYXNzZXRzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RlbGV0ZSBtdWx0aXBsZSBhc3NldHMgaW4gYmF0Y2gnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmxzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2FycmF5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXJyYXkgb2YgYXNzZXQgVVJMcyB0byBkZWxldGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3VybHMnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3ZhbGlkYXRlX2Fzc2V0X3JlZmVyZW5jZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVmFsaWRhdGUgYXNzZXQgcmVmZXJlbmNlcyBhbmQgZmluZCBicm9rZW4gbGlua3MnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RpcmVjdG9yeSB0byB2YWxpZGF0ZSAoZGVmYXVsdDogZW50aXJlIHByb2plY3QpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnZGI6Ly9hc3NldHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfYXNzZXRfZGVwZW5kZW5jaWVzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBhc3NldCBkZXBlbmRlbmN5IHRyZWUnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmxPclVVSUQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fzc2V0IFVSTCBvciBVVUlEJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVwZW5kZW5jeSBkaXJlY3Rpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnZGVwZW5kZW50cycsICdkZXBlbmRlbmNpZXMnLCAnYm90aCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdkZXBlbmRlbmNpZXMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3VybE9yVVVJRCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X3VudXNlZF9hc3NldHMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmluZCB1bnVzZWQgYXNzZXRzIGluIHByb2plY3QnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RpcmVjdG9yeSB0byBzY2FuIChkZWZhdWx0OiBlbnRpcmUgcHJvamVjdCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdkYjovL2Fzc2V0cydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGNsdWRlRGlyZWN0b3JpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEaXJlY3RvcmllcyB0byBleGNsdWRlIGZyb20gc2NhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogW11cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2NvbXByZXNzX3RleHR1cmVzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0JhdGNoIGNvbXByZXNzIHRleHR1cmUgYXNzZXRzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0b3J5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEaXJlY3RvcnkgY29udGFpbmluZyB0ZXh0dXJlcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RiOi8vYXNzZXRzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcHJlc3Npb24gZm9ybWF0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2F1dG8nLCAnanBnJywgJ3BuZycsICd3ZWJwJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2F1dG8nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcXVhbGl0eToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcHJlc3Npb24gcXVhbGl0eSAoMC4xLTEuMCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmltdW06IDAuMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhpbXVtOiAxLjAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogMC44XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdleHBvcnRfYXNzZXRfbWFuaWZlc3QnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRXhwb3J0IGFzc2V0IG1hbmlmZXN0L2ludmVudG9yeScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGlyZWN0b3J5IHRvIGV4cG9ydCBtYW5pZmVzdCBmb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdkYjovL2Fzc2V0cydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0V4cG9ydCBmb3JtYXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnanNvbicsICdjc3YnLCAneG1sJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2pzb24nXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZU1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBhc3NldCBtZXRhZGF0YScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgc3dpdGNoICh0b29sTmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnc2F2ZV9hc3NldF9tZXRhJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5zYXZlQXNzZXRNZXRhKGFyZ3MudXJsT3JVVUlELCBhcmdzLmNvbnRlbnQpO1xuICAgICAgICAgICAgY2FzZSAnZ2VuZXJhdGVfYXZhaWxhYmxlX3VybCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2VuZXJhdGVBdmFpbGFibGVVcmwoYXJncy51cmwpO1xuICAgICAgICAgICAgY2FzZSAncXVlcnlfYXNzZXRfZGJfcmVhZHknOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnF1ZXJ5QXNzZXREYlJlYWR5KCk7XG4gICAgICAgICAgICBjYXNlICdvcGVuX2Fzc2V0X2V4dGVybmFsJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5vcGVuQXNzZXRFeHRlcm5hbChhcmdzLnVybE9yVVVJRCk7XG4gICAgICAgICAgICBjYXNlICdiYXRjaF9pbXBvcnRfYXNzZXRzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5iYXRjaEltcG9ydEFzc2V0cyhhcmdzKTtcbiAgICAgICAgICAgIGNhc2UgJ2JhdGNoX2RlbGV0ZV9hc3NldHMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmJhdGNoRGVsZXRlQXNzZXRzKGFyZ3MudXJscyk7XG4gICAgICAgICAgICBjYXNlICd2YWxpZGF0ZV9hc3NldF9yZWZlcmVuY2VzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy52YWxpZGF0ZUFzc2V0UmVmZXJlbmNlcyhhcmdzLmRpcmVjdG9yeSk7XG4gICAgICAgICAgICBjYXNlICdnZXRfYXNzZXRfZGVwZW5kZW5jaWVzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRBc3NldERlcGVuZGVuY2llcyhhcmdzLnVybE9yVVVJRCwgYXJncy5kaXJlY3Rpb24pO1xuICAgICAgICAgICAgY2FzZSAnZ2V0X3VudXNlZF9hc3NldHMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldFVudXNlZEFzc2V0cyhhcmdzLmRpcmVjdG9yeSwgYXJncy5leGNsdWRlRGlyZWN0b3JpZXMpO1xuICAgICAgICAgICAgY2FzZSAnY29tcHJlc3NfdGV4dHVyZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNvbXByZXNzVGV4dHVyZXMoYXJncy5kaXJlY3RvcnksIGFyZ3MuZm9ybWF0LCBhcmdzLnF1YWxpdHkpO1xuICAgICAgICAgICAgY2FzZSAnZXhwb3J0X2Fzc2V0X21hbmlmZXN0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5leHBvcnRBc3NldE1hbmlmZXN0KGFyZ3MuZGlyZWN0b3J5LCBhcmdzLmZvcm1hdCwgYXJncy5pbmNsdWRlTWV0YWRhdGEpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgc2F2ZUFzc2V0TWV0YSh1cmxPclVVSUQ6IHN0cmluZywgY29udGVudDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBhd2FpdCB0aGlzLm5vcm1hbGl6ZVVybE9yVXVpZCh1cmxPclVVSUQpO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnByb21pc2lmeUFzc2V0RGI8dm9pZD4oKGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIuc2F2ZU1ldGEobm9ybWFsaXplZC51dWlkLCBjb250ZW50LCBjYik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICB1dWlkOiBub3JtYWxpemVkLnV1aWQsXG4gICAgICAgICAgICAgICAgdXJsOiBub3JtYWxpemVkLnVybFxuICAgICAgICAgICAgfSwgJ0Fzc2V0IG1ldGEgc2F2ZWQgc3VjY2Vzc2Z1bGx5Jyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdlbmVyYXRlQXZhaWxhYmxlVXJsKHVybDogc3RyaW5nKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDw9IE1BWF9VUkxfR0VORVJBVElPTl9BVFRFTVBUUzsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGVzdFVybCA9IGF0dGVtcHQgPT09IDAgPyB1cmwgOiB0aGlzLmdldE5leHRVcmwodXJsLCBhdHRlbXB0KTtcblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuY29udmVydFVybFRvVXVpZCh0ZXN0VXJsKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVVJMIGV4aXN0cywgY29udGludWUgdG8gbmV4dCBhdHRlbXB0XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVSTCBkb2Vzbid0IGV4aXN0LCBzbyBpdCdzIGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxVcmw6IHVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJsZVVybDogdGVzdFVybFxuICAgICAgICAgICAgICAgICAgICB9LCB0ZXN0VXJsID09PSB1cmwgPyAnVVJMIGlzIGF2YWlsYWJsZScgOiAnR2VuZXJhdGVkIG5ldyBhdmFpbGFibGUgVVJMJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKGBDb3VsZCBub3QgZ2VuZXJhdGUgYXZhaWxhYmxlIFVSTCBhZnRlciAke01BWF9VUkxfR0VORVJBVElPTl9BVFRFTVBUU30gYXR0ZW1wdHNgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0TmV4dFVybCh1cmw6IHN0cmluZywgYXR0ZW1wdDogbnVtYmVyKTogc3RyaW5nIHtcbiAgICAgICAgLy8gU3BsaXQgVVJMIGludG8gYmFzZSBhbmQgZXh0ZW5zaW9uXG4gICAgICAgIGNvbnN0IGxhc3REb3QgPSB1cmwubGFzdEluZGV4T2YoJy4nKTtcbiAgICAgICAgY29uc3QgbGFzdFNsYXNoID0gdXJsLmxhc3RJbmRleE9mKCcvJyk7XG5cbiAgICAgICAgaWYgKGxhc3REb3QgPiBsYXN0U2xhc2gpIHtcbiAgICAgICAgICAgIC8vIEhhcyBleHRlbnNpb25cbiAgICAgICAgICAgIGNvbnN0IGJhc2UgPSB1cmwuc3Vic3RyaW5nKDAsIGxhc3REb3QpO1xuICAgICAgICAgICAgY29uc3QgZXh0ID0gdXJsLnN1YnN0cmluZyhsYXN0RG90KTtcbiAgICAgICAgICAgIHJldHVybiBgJHtiYXNlfS0ke2F0dGVtcHR9JHtleHR9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE5vIGV4dGVuc2lvblxuICAgICAgICAgICAgcmV0dXJuIGAke3VybH0tJHthdHRlbXB0fWA7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5QXNzZXREYlJlYWR5KCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnByb21pc2lmeUFzc2V0RGI8YW55W10+KChjYikgPT4ge1xuICAgICAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLnF1ZXJ5QXNzZXRzKERFRkFVTFRfQVNTRVRfRElSRUNUT1JZLCAnJywgY2IpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgcmVhZHk6IHRydWVcbiAgICAgICAgICAgIH0sICdBc3NldCBkYXRhYmFzZSBpcyByZWFkeScpO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICByZWFkeTogZmFsc2VcbiAgICAgICAgICAgIH0sICdBc3NldCBkYXRhYmFzZSBpcyBub3QgcmVhZHknKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgb3BlbkFzc2V0RXh0ZXJuYWwodXJsT3JVVUlEOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IGF3YWl0IHRoaXMubm9ybWFsaXplVXJsT3JVdWlkKHVybE9yVVVJRCk7XG4gICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5leHBsb3JlKG5vcm1hbGl6ZWQudXJsKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHVuZGVmaW5lZCwgQVNTRVRfRVhQTE9SRV9NRVNTQUdFKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYmF0Y2hJbXBvcnRBc3NldHMoYXJnczogQmF0Y2hJbXBvcnRBcmdzKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbiAgICAgICAgICAgIGlmICghZnMuZXhpc3RzU3luYyhhcmdzLnNvdXJjZURpcmVjdG9yeSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKCdTb3VyY2UgZGlyZWN0b3J5IGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGZpbGVzID0gdGhpcy5nZXRGaWxlc0Zyb21EaXJlY3RvcnkoXG4gICAgICAgICAgICAgICAgYXJncy5zb3VyY2VEaXJlY3RvcnksXG4gICAgICAgICAgICAgICAgYXJncy5maWxlRmlsdGVyIHx8IFtdLFxuICAgICAgICAgICAgICAgIGFyZ3MucmVjdXJzaXZlIHx8IGZhbHNlXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBjb25zdCBpbXBvcnRSZXN1bHRzOiBCYXRjaEltcG9ydFJlc3VsdFtdID0gYXdhaXQgdGhpcy5wcm9jZXNzU2VxdWVudGlhbGx5KFxuICAgICAgICAgICAgICAgIGZpbGVzLFxuICAgICAgICAgICAgICAgIGFzeW5jIChmaWxlUGF0aDogc3RyaW5nLCBpbmRleDogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnByb21pc2lmeUFzc2V0RGI8dm9pZD4oKGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIuaW1wb3J0KFtmaWxlUGF0aF0sIGFyZ3MudGFyZ2V0RGlyZWN0b3J5LCB0cnVlLCBjYik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogYCR7YXJncy50YXJnZXREaXJlY3Rvcnl9LyR7cGF0aC5iYXNlbmFtZShmaWxlUGF0aCl9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3NDb3VudCA9IGltcG9ydFJlc3VsdHMuZmlsdGVyKHIgPT4gci5zdWNjZXNzKS5sZW5ndGg7XG4gICAgICAgICAgICBjb25zdCBlcnJvckNvdW50ID0gaW1wb3J0UmVzdWx0cy5maWx0ZXIociA9PiAhci5zdWNjZXNzKS5sZW5ndGg7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICAgICAgICBlcnJvckNvdW50LFxuICAgICAgICAgICAgICAgIHJlc3VsdHM6IGltcG9ydFJlc3VsdHNcbiAgICAgICAgICAgIH0sIGBCYXRjaCBpbXBvcnQgY29tcGxldGVkOiAke3N1Y2Nlc3NDb3VudH0gc3VjY2VzcywgJHtlcnJvckNvdW50fSBlcnJvcnNgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0RmlsZXNGcm9tRGlyZWN0b3J5KGRpclBhdGg6IHN0cmluZywgZmlsZUZpbHRlcjogc3RyaW5nW10sIHJlY3Vyc2l2ZTogYm9vbGVhbik6IHN0cmluZ1tdIHtcbiAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuICAgICAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBjb25zdCBpdGVtcyA9IGZzLnJlYWRkaXJTeW5jKGRpclBhdGgpO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyUGF0aCwgaXRlbSk7XG4gICAgICAgICAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMoZnVsbFBhdGgpO1xuXG4gICAgICAgICAgICBpZiAoc3RhdC5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgICAgIGlmIChmaWxlRmlsdGVyLmxlbmd0aCA9PT0gMCB8fCBmaWxlRmlsdGVyLnNvbWUoZXh0ID0+IGl0ZW0udG9Mb3dlckNhc2UoKS5lbmRzV2l0aChleHQudG9Mb3dlckNhc2UoKSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpICYmIHJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goLi4udGhpcy5nZXRGaWxlc0Zyb21EaXJlY3RvcnkoZnVsbFBhdGgsIGZpbGVGaWx0ZXIsIHJlY3Vyc2l2ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbGVzO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYmF0Y2hEZWxldGVBc3NldHModXJsczogc3RyaW5nW10pOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gTm90ZTogRWRpdG9yLmFzc2V0ZGIuZGVsZXRlKCkgZG9lcyBub3QgcHJvdmlkZSBhIGNhbGxiYWNrXG4gICAgICAgICAgICAvLyBXZSBhc3N1bWUgaXQgc3VjY2VlZHMgYW5kIHJlcG9ydCBhbGwgYXMgc3VjY2Vzc2Z1bFxuICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIuZGVsZXRlKHVybHMpO1xuXG4gICAgICAgICAgICBjb25zdCBkZWxldGVSZXN1bHRzOiBCYXRjaERlbGV0ZVJlc3VsdFtdID0gdXJscy5tYXAodXJsID0+ICh7XG4gICAgICAgICAgICAgICAgdXJsLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWVcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICB0b3RhbEFzc2V0czogdXJscy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50OiB1cmxzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBlcnJvckNvdW50OiAwLFxuICAgICAgICAgICAgICAgIHJlc3VsdHM6IGRlbGV0ZVJlc3VsdHNcbiAgICAgICAgICAgIH0sIGBCYXRjaCBkZWxldGUgaW5pdGlhdGVkIGZvciAke3VybHMubGVuZ3RofSBhc3NldHMuIE5vdGU6IEluZGl2aWR1YWwgZGVsZXRpb24gcmVzdWx0cyBhcmUgbm90IGF2YWlsYWJsZSBpbiAyLnggQVBJLmApO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyB2YWxpZGF0ZUFzc2V0UmVmZXJlbmNlcyhkaXJlY3Rvcnk6IHN0cmluZyA9IERFRkFVTFRfQVNTRVRfRElSRUNUT1JZKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSBgJHtkaXJlY3Rvcnl9LyoqLypgO1xuICAgICAgICAgICAgY29uc3QgYXNzZXRzOiBBc3NldEluZm9bXSA9IGF3YWl0IHRoaXMucHJvbWlzaWZ5QXNzZXREYjxBc3NldEluZm9bXT4oKGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIucXVlcnlBc3NldHMocGF0dGVybiwgJycsIGNiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoYXNzZXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSh7XG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICAgICAgdG90YWxBc3NldHM6IDAsXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkUmVmZXJlbmNlczogMCxcbiAgICAgICAgICAgICAgICAgICAgYnJva2VuUmVmZXJlbmNlczogMCxcbiAgICAgICAgICAgICAgICAgICAgYnJva2VuQXNzZXRzOiBbXVxuICAgICAgICAgICAgICAgIH0sICdWYWxpZGF0aW9uIGNvbXBsZXRlZDogMCBhc3NldHMgZm91bmQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdmFsaWRhdGlvblJlc3VsdHMgPSBhd2FpdCB0aGlzLnByb2Nlc3NTZXF1ZW50aWFsbHkoXG4gICAgICAgICAgICAgICAgYXNzZXRzLFxuICAgICAgICAgICAgICAgIGFzeW5jIChhc3NldDogQXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnByb21pc2lmeUFzc2V0RGI8YW55PigoY2IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeUluZm9CeVV1aWQoYXNzZXQudXVpZCwgY2IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBhc3NldC51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhc3NldC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGFzc2V0LnVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiBhc3NldC51dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBlcnIubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNvbnN0IHZhbGlkUmVmZXJlbmNlcyA9IHZhbGlkYXRpb25SZXN1bHRzLmZpbHRlcihyID0+IHIudmFsaWQpO1xuICAgICAgICAgICAgY29uc3QgYnJva2VuUmVmZXJlbmNlcyA9IHZhbGlkYXRpb25SZXN1bHRzLmZpbHRlcihyID0+ICFyLnZhbGlkKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgICAgICBkaXJlY3RvcnksXG4gICAgICAgICAgICAgICAgdG90YWxBc3NldHM6IGFzc2V0cy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgdmFsaWRSZWZlcmVuY2VzOiB2YWxpZFJlZmVyZW5jZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGJyb2tlblJlZmVyZW5jZXM6IGJyb2tlblJlZmVyZW5jZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGJyb2tlbkFzc2V0czogYnJva2VuUmVmZXJlbmNlc1xuICAgICAgICAgICAgfSwgYFZhbGlkYXRpb24gY29tcGxldGVkOiAke2Jyb2tlblJlZmVyZW5jZXMubGVuZ3RofSBicm9rZW4gcmVmZXJlbmNlcyBmb3VuZGApO1xuICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3JSZXNwb25zZShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBc3NldERlcGVuZGVuY2llcyh1cmxPclVVSUQ6IHN0cmluZywgZGlyZWN0aW9uOiBzdHJpbmcgPSAnZGVwZW5kZW5jaWVzJyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UoXG4gICAgICAgICAgICAnQXNzZXQgZGVwZW5kZW5jeSBhbmFseXNpcyByZXF1aXJlcyBhZGRpdGlvbmFsIEFQSXMgbm90IGF2YWlsYWJsZSBpbiBjdXJyZW50IENvY29zIENyZWF0b3IgTUNQIGltcGxlbWVudGF0aW9uLiBDb25zaWRlciB1c2luZyB0aGUgRWRpdG9yIFVJIGZvciBkZXBlbmRlbmN5IGFuYWx5c2lzLidcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldFVudXNlZEFzc2V0cyhkaXJlY3Rvcnk6IHN0cmluZyA9IERFRkFVTFRfQVNTRVRfRElSRUNUT1JZLCBleGNsdWRlRGlyZWN0b3JpZXM6IHN0cmluZ1tdID0gW10pOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKFxuICAgICAgICAgICAgJ1VudXNlZCBhc3NldCBkZXRlY3Rpb24gcmVxdWlyZXMgY29tcHJlaGVuc2l2ZSBwcm9qZWN0IGFuYWx5c2lzIG5vdCBhdmFpbGFibGUgaW4gY3VycmVudCBDb2NvcyBDcmVhdG9yIE1DUCBpbXBsZW1lbnRhdGlvbi4gQ29uc2lkZXIgdXNpbmcgdGhlIEVkaXRvciBVSSBvciB0aGlyZC1wYXJ0eSB0b29scyBmb3IgdW51c2VkIGFzc2V0IGRldGVjdGlvbi4nXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBjb21wcmVzc1RleHR1cmVzKGRpcmVjdG9yeTogc3RyaW5nID0gREVGQVVMVF9BU1NFVF9ESVJFQ1RPUlksIGZvcm1hdDogc3RyaW5nID0gJ2F1dG8nLCBxdWFsaXR5OiBudW1iZXIgPSAwLjgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKFxuICAgICAgICAgICAgJ1RleHR1cmUgY29tcHJlc3Npb24gcmVxdWlyZXMgaW1hZ2UgcHJvY2Vzc2luZyBjYXBhYmlsaXRpZXMgbm90IGF2YWlsYWJsZSBpbiBjdXJyZW50IENvY29zIENyZWF0b3IgTUNQIGltcGxlbWVudGF0aW9uLiBVc2UgdGhlIEVkaXRvclxcJ3MgYnVpbHQtaW4gdGV4dHVyZSBjb21wcmVzc2lvbiBzZXR0aW5ncyBvciBleHRlcm5hbCB0b29scy4nXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBleHBvcnRBc3NldE1hbmlmZXN0KGRpcmVjdG9yeTogc3RyaW5nID0gREVGQVVMVF9BU1NFVF9ESVJFQ1RPUlksIGZvcm1hdDogc3RyaW5nID0gJ2pzb24nLCBpbmNsdWRlTWV0YWRhdGE6IGJvb2xlYW4gPSB0cnVlKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBhdHRlcm4gPSBgJHtkaXJlY3Rvcnl9LyoqLypgO1xuICAgICAgICAgICAgY29uc3QgYXNzZXRzOiBBc3NldEluZm9bXSA9IGF3YWl0IHRoaXMucHJvbWlzaWZ5QXNzZXREYjxBc3NldEluZm9bXT4oKGNiKSA9PiB7XG4gICAgICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIucXVlcnlBc3NldHMocGF0dGVybiwgJycsIGNiKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoYXNzZXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVtcHR5TWFuaWZlc3QgPSBmb3JtYXQgPT09ICdqc29uJyA/ICdbXScgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVTdWNjZXNzUmVzcG9uc2Uoe1xuICAgICAgICAgICAgICAgICAgICBkaXJlY3RvcnksXG4gICAgICAgICAgICAgICAgICAgIGZvcm1hdCxcbiAgICAgICAgICAgICAgICAgICAgYXNzZXRDb3VudDogMCxcbiAgICAgICAgICAgICAgICAgICAgaW5jbHVkZU1ldGFkYXRhLFxuICAgICAgICAgICAgICAgICAgICBtYW5pZmVzdDogZW1wdHlNYW5pZmVzdFxuICAgICAgICAgICAgICAgIH0sICdBc3NldCBtYW5pZmVzdCBleHBvcnRlZCB3aXRoIDAgYXNzZXRzJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cmllcyA9IGF3YWl0IHRoaXMucHJvY2Vzc1NlcXVlbnRpYWxseShcbiAgICAgICAgICAgICAgICBhc3NldHMsXG4gICAgICAgICAgICAgICAgYXN5bmMgKGFzc2V0OiBBc3NldEluZm8pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW50cnk6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGFzc2V0LnVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBhc3NldC50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogYXNzZXQuc2l6ZSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNEaXJlY3Rvcnk6IGFzc2V0LmlzRGlyZWN0b3J5IHx8IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVNZXRhZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtZXRhSW5mbyA9IGF3YWl0IHRoaXMucHJvbWlzaWZ5QXNzZXREYjxhbnk+KChjYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeU1ldGFJbmZvQnlVdWlkKGFzc2V0LnV1aWQsIGNiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWV0YUluZm8gJiYgbWV0YUluZm8uanNvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnRyeS5tZXRhID0gbWV0YUluZm8uanNvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTa2lwIG1ldGFkYXRhIGlmIG5vdCBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbnRyeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maW5hbGl6ZU1hbmlmZXN0RXhwb3J0KGRpcmVjdG9yeSwgZm9ybWF0LCBpbmNsdWRlTWV0YWRhdGEsIG1hbmlmZXN0RW50cmllcyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGZpbmFsaXplTWFuaWZlc3RFeHBvcnQoZGlyZWN0b3J5OiBzdHJpbmcsIGZvcm1hdDogc3RyaW5nLCBpbmNsdWRlTWV0YWRhdGE6IGJvb2xlYW4sIG1hbmlmZXN0OiBhbnlbXSk6IFRvb2xSZXNwb25zZSB7XG4gICAgICAgIGxldCBleHBvcnREYXRhOiBzdHJpbmc7XG4gICAgICAgIHN3aXRjaCAoZm9ybWF0KSB7XG4gICAgICAgICAgICBjYXNlICdqc29uJzpcbiAgICAgICAgICAgICAgICBleHBvcnREYXRhID0gSlNPTi5zdHJpbmdpZnkobWFuaWZlc3QsIG51bGwsIDIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnY3N2JzpcbiAgICAgICAgICAgICAgICBleHBvcnREYXRhID0gdGhpcy5jb252ZXJ0VG9DU1YobWFuaWZlc3QpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAneG1sJzpcbiAgICAgICAgICAgICAgICBleHBvcnREYXRhID0gdGhpcy5jb252ZXJ0VG9YTUwobWFuaWZlc3QpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBleHBvcnREYXRhID0gSlNPTi5zdHJpbmdpZnkobWFuaWZlc3QsIG51bGwsIDIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHtcbiAgICAgICAgICAgIGRpcmVjdG9yeSxcbiAgICAgICAgICAgIGZvcm1hdCxcbiAgICAgICAgICAgIGFzc2V0Q291bnQ6IG1hbmlmZXN0Lmxlbmd0aCxcbiAgICAgICAgICAgIGluY2x1ZGVNZXRhZGF0YSxcbiAgICAgICAgICAgIG1hbmlmZXN0OiBleHBvcnREYXRhXG4gICAgICAgIH0sIGBBc3NldCBtYW5pZmVzdCBleHBvcnRlZCB3aXRoICR7bWFuaWZlc3QubGVuZ3RofSBhc3NldHNgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNvbnZlcnRUb0NTVihkYXRhOiBhbnlbXSk6IHN0cmluZyB7XG4gICAgICAgIGlmIChkYXRhLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcnO1xuXG4gICAgICAgIGNvbnN0IGhlYWRlcnMgPSBPYmplY3Qua2V5cyhkYXRhWzBdKTtcbiAgICAgICAgY29uc3QgY3N2Um93cyA9IFtoZWFkZXJzLmpvaW4oJywnKV07XG5cbiAgICAgICAgZm9yIChjb25zdCByb3cgb2YgZGF0YSkge1xuICAgICAgICAgICAgY29uc3QgdmFsdWVzID0gaGVhZGVycy5tYXAoaGVhZGVyID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHJvd1toZWFkZXJdO1xuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID8gSlNPTi5zdHJpbmdpZnkodmFsdWUpIDogU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3N2Um93cy5wdXNoKHZhbHVlcy5qb2luKCcsJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNzdlJvd3Muam9pbignXFxuJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb252ZXJ0VG9YTUwoZGF0YTogYW55W10pOiBzdHJpbmcge1xuICAgICAgICBsZXQgeG1sID0gJzw/eG1sIHZlcnNpb249XCIxLjBcIiBlbmNvZGluZz1cIlVURi04XCI/Plxcbjxhc3NldHM+XFxuJztcblxuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YSkge1xuICAgICAgICAgICAgeG1sICs9ICcgIDxhc3NldD5cXG4nO1xuICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoaXRlbSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB4bWxWYWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgP1xuICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICBTdHJpbmcodmFsdWUpLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKTtcbiAgICAgICAgICAgICAgICB4bWwgKz0gYCAgICA8JHtrZXl9PiR7eG1sVmFsdWV9PC8ke2tleX0+XFxuYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHhtbCArPSAnICA8L2Fzc2V0Plxcbic7XG4gICAgICAgIH1cblxuICAgICAgICB4bWwgKz0gJzwvYXNzZXRzPic7XG4gICAgICAgIHJldHVybiB4bWw7XG4gICAgfVxufSJdfQ==