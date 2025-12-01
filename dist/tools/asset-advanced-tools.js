"use strict";
/// <reference path="../types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetAdvancedTools = void 0;
class AssetAdvancedTools {
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
        return new Promise((resolve) => {
            // Check if urlOrUUID is a URL or UUID
            const isUrl = urlOrUUID.startsWith('db://');
            if (isUrl) {
                // Convert URL to UUID first
                Editor.assetdb.queryUuidByUrl(urlOrUUID, (err, uuid) => {
                    if (err) {
                        resolve({ success: false, error: err.message });
                        return;
                    }
                    // Save meta with UUID
                    Editor.assetdb.saveMeta(uuid, content, (saveErr) => {
                        if (saveErr) {
                            resolve({ success: false, error: saveErr.message });
                            return;
                        }
                        resolve({
                            success: true,
                            data: {
                                uuid: uuid,
                                url: urlOrUUID,
                                message: 'Asset meta saved successfully'
                            }
                        });
                    });
                });
            }
            else {
                // Direct UUID, save meta
                Editor.assetdb.saveMeta(urlOrUUID, content, (err) => {
                    if (err) {
                        resolve({ success: false, error: err.message });
                        return;
                    }
                    // Get URL for response
                    Editor.assetdb.queryUrlByUuid(urlOrUUID, (urlErr, url) => {
                        resolve({
                            success: true,
                            data: {
                                uuid: urlOrUUID,
                                url: url || urlOrUUID,
                                message: 'Asset meta saved successfully'
                            }
                        });
                    });
                });
            }
        });
    }
    async generateAvailableUrl(url) {
        return new Promise((resolve) => {
            // Try to find an available URL by checking if it exists
            const checkUrl = (testUrl, attempt) => {
                if (attempt > 100) {
                    resolve({
                        success: false,
                        error: 'Could not generate available URL after 100 attempts'
                    });
                    return;
                }
                Editor.assetdb.queryUuidByUrl(testUrl, (err, uuid) => {
                    if (err) {
                        // URL doesn't exist, so it's available
                        resolve({
                            success: true,
                            data: {
                                originalUrl: url,
                                availableUrl: testUrl,
                                message: testUrl === url ?
                                    'URL is available' :
                                    'Generated new available URL'
                            }
                        });
                    }
                    else {
                        // URL exists, try next one
                        const nextUrl = this.getNextUrl(url, attempt);
                        checkUrl(nextUrl, attempt + 1);
                    }
                });
            };
            checkUrl(url, 0);
        });
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
        return new Promise((resolve) => {
            // Test if asset database is ready by performing a simple query
            Editor.assetdb.queryAssets('db://assets', '', (err, results) => {
                if (err) {
                    resolve({
                        success: true,
                        data: {
                            ready: false,
                            message: 'Asset database is not ready'
                        }
                    });
                }
                else {
                    resolve({
                        success: true,
                        data: {
                            ready: true,
                            message: 'Asset database is ready'
                        }
                    });
                }
            });
        });
    }
    async openAssetExternal(urlOrUUID) {
        return new Promise((resolve) => {
            // Check if urlOrUUID is a URL or UUID
            const isUrl = urlOrUUID.startsWith('db://');
            if (isUrl) {
                // Direct URL, use explore
                Editor.assetdb.explore(urlOrUUID);
                resolve({
                    success: true,
                    message: 'Asset location revealed in file system. Please open manually with your preferred program.'
                });
            }
            else {
                // Convert UUID to URL first
                Editor.assetdb.queryUrlByUuid(urlOrUUID, (err, url) => {
                    if (err) {
                        resolve({ success: false, error: err.message });
                        return;
                    }
                    Editor.assetdb.explore(url);
                    resolve({
                        success: true,
                        message: 'Asset location revealed in file system. Please open manually with your preferred program.'
                    });
                });
            }
        });
    }
    async batchImportAssets(args) {
        return new Promise(async (resolve) => {
            try {
                const fs = require('fs');
                const path = require('path');
                if (!fs.existsSync(args.sourceDirectory)) {
                    resolve({ success: false, error: 'Source directory does not exist' });
                    return;
                }
                const files = this.getFilesFromDirectory(args.sourceDirectory, args.fileFilter || [], args.recursive || false);
                const importResults = [];
                let successCount = 0;
                let errorCount = 0;
                // Import files sequentially
                const importFile = (index) => {
                    if (index >= files.length) {
                        // All files processed
                        resolve({
                            success: true,
                            data: {
                                totalFiles: files.length,
                                successCount: successCount,
                                errorCount: errorCount,
                                results: importResults,
                                message: `Batch import completed: ${successCount} success, ${errorCount} errors`
                            }
                        });
                        return;
                    }
                    const filePath = files[index];
                    const fileName = path.basename(filePath);
                    Editor.assetdb.import([filePath], args.targetDirectory, true, (err) => {
                        if (err) {
                            importResults.push({
                                source: filePath,
                                success: false,
                                error: err.message
                            });
                            errorCount++;
                        }
                        else {
                            importResults.push({
                                source: filePath,
                                target: `${args.targetDirectory}/${fileName}`,
                                success: true
                            });
                            successCount++;
                        }
                        // Process next file
                        importFile(index + 1);
                    });
                };
                importFile(0);
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
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
        return new Promise((resolve) => {
            try {
                // Note: Editor.assetdb.delete() does not provide a callback
                // We assume it succeeds and report all as successful
                Editor.assetdb.delete(urls);
                const deleteResults = urls.map(url => ({
                    url: url,
                    success: true
                }));
                resolve({
                    success: true,
                    data: {
                        totalAssets: urls.length,
                        successCount: urls.length,
                        errorCount: 0,
                        results: deleteResults,
                        message: `Batch delete initiated for ${urls.length} assets. Note: Individual deletion results are not available in 2.x API.`
                    }
                });
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async validateAssetReferences(directory = 'db://assets') {
        return new Promise((resolve) => {
            // Get all assets in directory
            const pattern = `${directory}/**/*`;
            Editor.assetdb.queryAssets(pattern, '', (err, assets) => {
                if (err) {
                    resolve({ success: false, error: err.message });
                    return;
                }
                const brokenReferences = [];
                const validReferences = [];
                let processedCount = 0;
                if (assets.length === 0) {
                    resolve({
                        success: true,
                        data: {
                            directory: directory,
                            totalAssets: 0,
                            validReferences: 0,
                            brokenReferences: 0,
                            brokenAssets: [],
                            message: 'Validation completed: 0 assets found'
                        }
                    });
                    return;
                }
                // Validate each asset
                assets.forEach((asset) => {
                    Editor.assetdb.queryInfoByUuid(asset.uuid, (infoErr, info) => {
                        if (infoErr) {
                            brokenReferences.push({
                                url: asset.url,
                                uuid: asset.uuid,
                                name: asset.name,
                                error: infoErr.message
                            });
                        }
                        else {
                            validReferences.push({
                                url: asset.url,
                                uuid: asset.uuid,
                                name: asset.name
                            });
                        }
                        processedCount++;
                        // Check if all assets have been processed
                        if (processedCount === assets.length) {
                            resolve({
                                success: true,
                                data: {
                                    directory: directory,
                                    totalAssets: assets.length,
                                    validReferences: validReferences.length,
                                    brokenReferences: brokenReferences.length,
                                    brokenAssets: brokenReferences,
                                    message: `Validation completed: ${brokenReferences.length} broken references found`
                                }
                            });
                        }
                    });
                });
            });
        });
    }
    async getAssetDependencies(urlOrUUID, direction = 'dependencies') {
        return new Promise((resolve) => {
            // Note: This would require scene analysis or additional APIs not available in current documentation
            resolve({
                success: false,
                error: 'Asset dependency analysis requires additional APIs not available in current Cocos Creator MCP implementation. Consider using the Editor UI for dependency analysis.'
            });
        });
    }
    async getUnusedAssets(directory = 'db://assets', excludeDirectories = []) {
        return new Promise((resolve) => {
            // Note: This would require comprehensive project analysis
            resolve({
                success: false,
                error: 'Unused asset detection requires comprehensive project analysis not available in current Cocos Creator MCP implementation. Consider using the Editor UI or third-party tools for unused asset detection.'
            });
        });
    }
    async compressTextures(directory = 'db://assets', format = 'auto', quality = 0.8) {
        return new Promise((resolve) => {
            // Note: Texture compression would require image processing APIs
            resolve({
                success: false,
                error: 'Texture compression requires image processing capabilities not available in current Cocos Creator MCP implementation. Use the Editor\'s built-in texture compression settings or external tools.'
            });
        });
    }
    async exportAssetManifest(directory = 'db://assets', format = 'json', includeMetadata = true) {
        return new Promise((resolve) => {
            const pattern = `${directory}/**/*`;
            Editor.assetdb.queryAssets(pattern, '', (err, assets) => {
                if (err) {
                    resolve({ success: false, error: err.message });
                    return;
                }
                const manifest = [];
                let processedCount = 0;
                if (assets.length === 0) {
                    resolve({
                        success: true,
                        data: {
                            directory: directory,
                            format: format,
                            assetCount: 0,
                            includeMetadata: includeMetadata,
                            manifest: format === 'json' ? '[]' : '',
                            message: 'Asset manifest exported with 0 assets'
                        }
                    });
                    return;
                }
                // Process each asset
                assets.forEach((asset) => {
                    const manifestEntry = {
                        name: asset.name,
                        url: asset.url,
                        uuid: asset.uuid,
                        type: asset.type,
                        size: asset.size || 0,
                        isDirectory: asset.isDirectory || false
                    };
                    if (includeMetadata) {
                        // Try to get metadata
                        Editor.assetdb.queryMetaInfoByUuid(asset.uuid, (metaErr, info) => {
                            if (!metaErr && info && info.json) {
                                manifestEntry.meta = info.json;
                            }
                            manifest.push(manifestEntry);
                            processedCount++;
                            // Check if all assets have been processed
                            if (processedCount === assets.length) {
                                this.finalizeManifestExport(resolve, directory, format, includeMetadata, manifest);
                            }
                        });
                    }
                    else {
                        manifest.push(manifestEntry);
                        processedCount++;
                        // Check if all assets have been processed
                        if (processedCount === assets.length) {
                            this.finalizeManifestExport(resolve, directory, format, includeMetadata, manifest);
                        }
                    }
                });
            });
        });
    }
    finalizeManifestExport(resolve, directory, format, includeMetadata, manifest) {
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
        resolve({
            success: true,
            data: {
                directory: directory,
                format: format,
                assetCount: manifest.length,
                includeMetadata: includeMetadata,
                manifest: exportData,
                message: `Asset manifest exported with ${manifest.length} assets`
            }
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXQtYWR2YW5jZWQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvYXNzZXQtYWR2YW5jZWQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFnRDs7O0FBSWhELE1BQWEsa0JBQWtCO0lBQzNCLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLGlCQUFpQjtnQkFDdkIsV0FBVyxFQUFFLDZCQUE2QjtnQkFDMUMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixTQUFTLEVBQUU7NEJBQ1AsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLG1CQUFtQjt5QkFDbkM7d0JBQ0QsT0FBTyxFQUFFOzRCQUNMLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxzQ0FBc0M7eUJBQ3REO3FCQUNKO29CQUNELFFBQVEsRUFBRSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUM7aUJBQ3JDO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsd0JBQXdCO2dCQUM5QixXQUFXLEVBQUUsOENBQThDO2dCQUMzRCxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLEdBQUcsRUFBRTs0QkFDRCxJQUFJLEVBQUUsUUFBUTs0QkFDZCxXQUFXLEVBQUUseUNBQXlDO3lCQUN6RDtxQkFDSjtvQkFDRCxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUM7aUJBQ3BCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUsc0JBQXNCO2dCQUM1QixXQUFXLEVBQUUsa0NBQWtDO2dCQUMvQyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFLEVBQUU7aUJBQ2pCO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUscUJBQXFCO2dCQUMzQixXQUFXLEVBQUUsa0NBQWtDO2dCQUMvQyxX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R0FBRyxDQUFDO0lBQ2YsQ0FBQztDQUNKO0FBcHZCRCxnREFvdkJDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGVzL2VkaXRvci0yeC5kLnRzXCIgLz5cblxuaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xSZXNwb25zZSwgVG9vbEV4ZWN1dG9yIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5leHBvcnQgY2xhc3MgQXNzZXRBZHZhbmNlZFRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnc2F2ZV9hc3NldF9tZXRhJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NhdmUgYXNzZXQgbWV0YSBpbmZvcm1hdGlvbicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybE9yVVVJRDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIG9yIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgbWV0YSBzZXJpYWxpemVkIGNvbnRlbnQgc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1cmxPclVVSUQnLCAnY29udGVudCddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2VuZXJhdGVfYXZhaWxhYmxlX3VybCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZW5lcmF0ZSBhbiBhdmFpbGFibGUgVVJMIGJhc2VkIG9uIGlucHV0IFVSTCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIHRvIGdlbmVyYXRlIGF2YWlsYWJsZSBVUkwgZm9yJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1cmwnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3F1ZXJ5X2Fzc2V0X2RiX3JlYWR5JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NoZWNrIGlmIGFzc2V0IGRhdGFiYXNlIGlzIHJlYWR5JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdvcGVuX2Fzc2V0X2V4dGVybmFsJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wZW4gYXNzZXQgd2l0aCBleHRlcm5hbCBwcm9ncmFtJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsT3JVVUlEOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBc3NldCBVUkwgb3IgVVVJRCB0byBvcGVuJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyd1cmxPclVVSUQnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2JhdGNoX2ltcG9ydF9hc3NldHMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW1wb3J0IG11bHRpcGxlIGFzc2V0cyBpbiBiYXRjaCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZURpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU291cmNlIGRpcmVjdG9yeSBwYXRoJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldERpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVGFyZ2V0IGRpcmVjdG9yeSBVUkwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZUZpbHRlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZpbGUgZXh0ZW5zaW9ucyB0byBpbmNsdWRlIChlLmcuLCBbXCIucG5nXCIsIFwiLmpwZ1wiXSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnSW5jbHVkZSBzdWJkaXJlY3RvcmllcycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVyd3JpdGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPdmVyd3JpdGUgZXhpc3RpbmcgZmlsZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3NvdXJjZURpcmVjdG9yeScsICd0YXJnZXREaXJlY3RvcnknXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2JhdGNoX2RlbGV0ZV9hc3NldHMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVsZXRlIG11bHRpcGxlIGFzc2V0cyBpbiBiYXRjaCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBcnJheSBvZiBhc3NldCBVUkxzIHRvIGRlbGV0ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXJscyddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndmFsaWRhdGVfYXNzZXRfcmVmZXJlbmNlcycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdWYWxpZGF0ZSBhc3NldCByZWZlcmVuY2VzIGFuZCBmaW5kIGJyb2tlbiBsaW5rcycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGlyZWN0b3J5IHRvIHZhbGlkYXRlIChkZWZhdWx0OiBlbnRpcmUgcHJvamVjdCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdkYjovL2Fzc2V0cydcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9hc3NldF9kZXBlbmRlbmNpZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGFzc2V0IGRlcGVuZGVuY3kgdHJlZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybE9yVVVJRDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQXNzZXQgVVJMIG9yIFVVSUQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEZXBlbmRlbmN5IGRpcmVjdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydkZXBlbmRlbnRzJywgJ2RlcGVuZGVuY2llcycsICdib3RoJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RlcGVuZGVuY2llcydcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsndXJsT3JVVUlEJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfdW51c2VkX2Fzc2V0cycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGaW5kIHVudXNlZCBhc3NldHMgaW4gcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdG9yeToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGlyZWN0b3J5IHRvIHNjYW4gKGRlZmF1bHQ6IGVudGlyZSBwcm9qZWN0KScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RiOi8vYXNzZXRzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2x1ZGVEaXJlY3Rvcmllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RpcmVjdG9yaWVzIHRvIGV4Y2x1ZGUgZnJvbSBzY2FuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiBbXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY29tcHJlc3NfdGV4dHVyZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQmF0Y2ggY29tcHJlc3MgdGV4dHVyZSBhc3NldHMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0RpcmVjdG9yeSBjb250YWluaW5nIHRleHR1cmVzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnZGI6Ly9hc3NldHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb21wcmVzc2lvbiBmb3JtYXQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnYXV0bycsICdqcGcnLCAncG5nJywgJ3dlYnAnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnYXV0bydcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWFsaXR5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb21wcmVzc2lvbiBxdWFsaXR5ICgwLjEtMS4wKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWluaW11bTogMC4xLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heGltdW06IDEuMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLjhcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2V4cG9ydF9hc3NldF9tYW5pZmVzdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeHBvcnQgYXNzZXQgbWFuaWZlc3QvaW52ZW50b3J5JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0b3J5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdEaXJlY3RvcnkgdG8gZXhwb3J0IG1hbmlmZXN0IGZvcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2RiOi8vYXNzZXRzJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRXhwb3J0IGZvcm1hdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW51bTogWydqc29uJywgJ2NzdicsICd4bWwnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnanNvbidcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlTWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbmNsdWRlIGFzc2V0IG1ldGFkYXRhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdzYXZlX2Fzc2V0X21ldGEnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnNhdmVBc3NldE1ldGEoYXJncy51cmxPclVVSUQsIGFyZ3MuY29udGVudCk7XG4gICAgICAgICAgICBjYXNlICdnZW5lcmF0ZV9hdmFpbGFibGVfdXJsJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZW5lcmF0ZUF2YWlsYWJsZVVybChhcmdzLnVybCk7XG4gICAgICAgICAgICBjYXNlICdxdWVyeV9hc3NldF9kYl9yZWFkeSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlBc3NldERiUmVhZHkoKTtcbiAgICAgICAgICAgIGNhc2UgJ29wZW5fYXNzZXRfZXh0ZXJuYWwnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm9wZW5Bc3NldEV4dGVybmFsKGFyZ3MudXJsT3JVVUlEKTtcbiAgICAgICAgICAgIGNhc2UgJ2JhdGNoX2ltcG9ydF9hc3NldHMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmJhdGNoSW1wb3J0QXNzZXRzKGFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAnYmF0Y2hfZGVsZXRlX2Fzc2V0cyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuYmF0Y2hEZWxldGVBc3NldHMoYXJncy51cmxzKTtcbiAgICAgICAgICAgIGNhc2UgJ3ZhbGlkYXRlX2Fzc2V0X3JlZmVyZW5jZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnZhbGlkYXRlQXNzZXRSZWZlcmVuY2VzKGFyZ3MuZGlyZWN0b3J5KTtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9hc3NldF9kZXBlbmRlbmNpZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEFzc2V0RGVwZW5kZW5jaWVzKGFyZ3MudXJsT3JVVUlELCBhcmdzLmRpcmVjdGlvbik7XG4gICAgICAgICAgICBjYXNlICdnZXRfdW51c2VkX2Fzc2V0cyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0VW51c2VkQXNzZXRzKGFyZ3MuZGlyZWN0b3J5LCBhcmdzLmV4Y2x1ZGVEaXJlY3Rvcmllcyk7XG4gICAgICAgICAgICBjYXNlICdjb21wcmVzc190ZXh0dXJlcyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuY29tcHJlc3NUZXh0dXJlcyhhcmdzLmRpcmVjdG9yeSwgYXJncy5mb3JtYXQsIGFyZ3MucXVhbGl0eSk7XG4gICAgICAgICAgICBjYXNlICdleHBvcnRfYXNzZXRfbWFuaWZlc3QnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4cG9ydEFzc2V0TWFuaWZlc3QoYXJncy5kaXJlY3RvcnksIGFyZ3MuZm9ybWF0LCBhcmdzLmluY2x1ZGVNZXRhZGF0YSk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biB0b29sOiAke3Rvb2xOYW1lfWApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzYXZlQXNzZXRNZXRhKHVybE9yVVVJRDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHVybE9yVVVJRCBpcyBhIFVSTCBvciBVVUlEXG4gICAgICAgICAgICBjb25zdCBpc1VybCA9IHVybE9yVVVJRC5zdGFydHNXaXRoKCdkYjovLycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaXNVcmwpIHtcbiAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IFVSTCB0byBVVUlEIGZpcnN0XG4gICAgICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIucXVlcnlVdWlkQnlVcmwodXJsT3JVVUlELCAoZXJyOiBFcnJvciB8IG51bGwsIHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgLy8gU2F2ZSBtZXRhIHdpdGggVVVJRFxuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5zYXZlTWV0YSh1dWlkLCBjb250ZW50LCAoc2F2ZUVycjogRXJyb3IgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2F2ZUVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IHNhdmVFcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1dWlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHVybE9yVVVJRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0Fzc2V0IG1ldGEgc2F2ZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gRGlyZWN0IFVVSUQsIHNhdmUgbWV0YVxuICAgICAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLnNhdmVNZXRhKHVybE9yVVVJRCwgY29udGVudCwgKGVycjogRXJyb3IgfCBudWxsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAvLyBHZXQgVVJMIGZvciByZXNwb25zZVxuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeVVybEJ5VXVpZCh1cmxPclVVSUQsICh1cmxFcnI6IEVycm9yIHwgbnVsbCwgdXJsOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dWlkOiB1cmxPclVVSUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdXJsIHx8IHVybE9yVVVJRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0Fzc2V0IG1ldGEgc2F2ZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZW5lcmF0ZUF2YWlsYWJsZVVybCh1cmw6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8gVHJ5IHRvIGZpbmQgYW4gYXZhaWxhYmxlIFVSTCBieSBjaGVja2luZyBpZiBpdCBleGlzdHNcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrVXJsID0gKHRlc3RVcmw6IHN0cmluZywgYXR0ZW1wdDogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGF0dGVtcHQgPiAxMDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiAnQ291bGQgbm90IGdlbmVyYXRlIGF2YWlsYWJsZSBVUkwgYWZ0ZXIgMTAwIGF0dGVtcHRzJ1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeVV1aWRCeVVybCh0ZXN0VXJsLCAoZXJyOiBFcnJvciB8IG51bGwsIHV1aWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBVUkwgZG9lc24ndCBleGlzdCwgc28gaXQncyBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbFVybDogdXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVVcmw6IHRlc3RVcmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IHRlc3RVcmwgPT09IHVybCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnVVJMIGlzIGF2YWlsYWJsZScgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0dlbmVyYXRlZCBuZXcgYXZhaWxhYmxlIFVSTCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVSTCBleGlzdHMsIHRyeSBuZXh0IG9uZVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbmV4dFVybCA9IHRoaXMuZ2V0TmV4dFVybCh1cmwsIGF0dGVtcHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tVcmwobmV4dFVybCwgYXR0ZW1wdCArIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjaGVja1VybCh1cmwsIDApO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcHJpdmF0ZSBnZXROZXh0VXJsKHVybDogc3RyaW5nLCBhdHRlbXB0OiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgICAvLyBTcGxpdCBVUkwgaW50byBiYXNlIGFuZCBleHRlbnNpb25cbiAgICAgICAgY29uc3QgbGFzdERvdCA9IHVybC5sYXN0SW5kZXhPZignLicpO1xuICAgICAgICBjb25zdCBsYXN0U2xhc2ggPSB1cmwubGFzdEluZGV4T2YoJy8nKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChsYXN0RG90ID4gbGFzdFNsYXNoKSB7XG4gICAgICAgICAgICAvLyBIYXMgZXh0ZW5zaW9uXG4gICAgICAgICAgICBjb25zdCBiYXNlID0gdXJsLnN1YnN0cmluZygwLCBsYXN0RG90KTtcbiAgICAgICAgICAgIGNvbnN0IGV4dCA9IHVybC5zdWJzdHJpbmcobGFzdERvdCk7XG4gICAgICAgICAgICByZXR1cm4gYCR7YmFzZX0tJHthdHRlbXB0fSR7ZXh0fWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBObyBleHRlbnNpb25cbiAgICAgICAgICAgIHJldHVybiBgJHt1cmx9LSR7YXR0ZW1wdH1gO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeUFzc2V0RGJSZWFkeSgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIFRlc3QgaWYgYXNzZXQgZGF0YWJhc2UgaXMgcmVhZHkgYnkgcGVyZm9ybWluZyBhIHNpbXBsZSBxdWVyeVxuICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIucXVlcnlBc3NldHMoJ2RiOi8vYXNzZXRzJywgJycsIChlcnI6IEVycm9yIHwgbnVsbCwgcmVzdWx0czogYW55W10pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFkeTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0Fzc2V0IGRhdGFiYXNlIGlzIG5vdCByZWFkeSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlYWR5OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdBc3NldCBkYXRhYmFzZSBpcyByZWFkeSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgb3BlbkFzc2V0RXh0ZXJuYWwodXJsT3JVVUlEOiBzdHJpbmcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHVybE9yVVVJRCBpcyBhIFVSTCBvciBVVUlEXG4gICAgICAgICAgICBjb25zdCBpc1VybCA9IHVybE9yVVVJRC5zdGFydHNXaXRoKCdkYjovLycpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoaXNVcmwpIHtcbiAgICAgICAgICAgICAgICAvLyBEaXJlY3QgVVJMLCB1c2UgZXhwbG9yZVxuICAgICAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLmV4cGxvcmUodXJsT3JVVUlEKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0Fzc2V0IGxvY2F0aW9uIHJldmVhbGVkIGluIGZpbGUgc3lzdGVtLiBQbGVhc2Ugb3BlbiBtYW51YWxseSB3aXRoIHlvdXIgcHJlZmVycmVkIHByb2dyYW0uJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBDb252ZXJ0IFVVSUQgdG8gVVJMIGZpcnN0XG4gICAgICAgICAgICAgICAgRWRpdG9yLmFzc2V0ZGIucXVlcnlVcmxCeVV1aWQodXJsT3JVVUlELCAoZXJyOiBFcnJvciB8IG51bGwsIHVybDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5leHBsb3JlKHVybCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdBc3NldCBsb2NhdGlvbiByZXZlYWxlZCBpbiBmaWxlIHN5c3RlbS4gUGxlYXNlIG9wZW4gbWFudWFsbHkgd2l0aCB5b3VyIHByZWZlcnJlZCBwcm9ncmFtLidcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYmF0Y2hJbXBvcnRBc3NldHMoYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGFyZ3Muc291cmNlRGlyZWN0b3J5KSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiAnU291cmNlIGRpcmVjdG9yeSBkb2VzIG5vdCBleGlzdCcgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlcyA9IHRoaXMuZ2V0RmlsZXNGcm9tRGlyZWN0b3J5KFxuICAgICAgICAgICAgICAgICAgICBhcmdzLnNvdXJjZURpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWxlRmlsdGVyIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLnJlY3Vyc2l2ZSB8fCBmYWxzZVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBpbXBvcnRSZXN1bHRzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgICAgIGxldCBzdWNjZXNzQ291bnQgPSAwO1xuICAgICAgICAgICAgICAgIGxldCBlcnJvckNvdW50ID0gMDtcblxuICAgICAgICAgICAgICAgIC8vIEltcG9ydCBmaWxlcyBzZXF1ZW50aWFsbHlcbiAgICAgICAgICAgICAgICBjb25zdCBpbXBvcnRGaWxlID0gKGluZGV4OiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IGZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxsIGZpbGVzIHByb2Nlc3NlZFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50OiBzdWNjZXNzQ291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ291bnQ6IGVycm9yQ291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHM6IGltcG9ydFJlc3VsdHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBCYXRjaCBpbXBvcnQgY29tcGxldGVkOiAke3N1Y2Nlc3NDb3VudH0gc3VjY2VzcywgJHtlcnJvckNvdW50fSBlcnJvcnNgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGZpbGVzW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKTtcblxuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5pbXBvcnQoW2ZpbGVQYXRoXSwgYXJncy50YXJnZXREaXJlY3RvcnksIHRydWUsIChlcnI6IEVycm9yIHwgbnVsbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydFJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvckNvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltcG9ydFJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogYCR7YXJncy50YXJnZXREaXJlY3Rvcnl9LyR7ZmlsZU5hbWV9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQcm9jZXNzIG5leHQgZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0RmlsZShpbmRleCArIDEpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaW1wb3J0RmlsZSgwKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7IHN1Y2Nlc3M6IGZhbHNlLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0RmlsZXNGcm9tRGlyZWN0b3J5KGRpclBhdGg6IHN0cmluZywgZmlsZUZpbHRlcjogc3RyaW5nW10sIHJlY3Vyc2l2ZTogYm9vbGVhbik6IHN0cmluZ1tdIHtcbiAgICAgICAgY29uc3QgZnMgPSByZXF1aXJlKCdmcycpO1xuICAgICAgICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuICAgICAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBjb25zdCBpdGVtcyA9IGZzLnJlYWRkaXJTeW5jKGRpclBhdGgpO1xuXG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyUGF0aCwgaXRlbSk7XG4gICAgICAgICAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMoZnVsbFBhdGgpO1xuXG4gICAgICAgICAgICBpZiAoc3RhdC5pc0ZpbGUoKSkge1xuICAgICAgICAgICAgICAgIGlmIChmaWxlRmlsdGVyLmxlbmd0aCA9PT0gMCB8fCBmaWxlRmlsdGVyLnNvbWUoZXh0ID0+IGl0ZW0udG9Mb3dlckNhc2UoKS5lbmRzV2l0aChleHQudG9Mb3dlckNhc2UoKSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goZnVsbFBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpICYmIHJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goLi4udGhpcy5nZXRGaWxlc0Zyb21EaXJlY3RvcnkoZnVsbFBhdGgsIGZpbGVGaWx0ZXIsIHJlY3Vyc2l2ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbGVzO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYmF0Y2hEZWxldGVBc3NldHModXJsczogc3RyaW5nW10pOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gTm90ZTogRWRpdG9yLmFzc2V0ZGIuZGVsZXRlKCkgZG9lcyBub3QgcHJvdmlkZSBhIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgLy8gV2UgYXNzdW1lIGl0IHN1Y2NlZWRzIGFuZCByZXBvcnQgYWxsIGFzIHN1Y2Nlc3NmdWxcbiAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5kZWxldGUodXJscyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgZGVsZXRlUmVzdWx0czogYW55W10gPSB1cmxzLm1hcCh1cmwgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWVcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxBc3NldHM6IHVybHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50OiB1cmxzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yQ291bnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzOiBkZWxldGVSZXN1bHRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEJhdGNoIGRlbGV0ZSBpbml0aWF0ZWQgZm9yICR7dXJscy5sZW5ndGh9IGFzc2V0cy4gTm90ZTogSW5kaXZpZHVhbCBkZWxldGlvbiByZXN1bHRzIGFyZSBub3QgYXZhaWxhYmxlIGluIDIueCBBUEkuYFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHZhbGlkYXRlQXNzZXRSZWZlcmVuY2VzKGRpcmVjdG9yeTogc3RyaW5nID0gJ2RiOi8vYXNzZXRzJyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8gR2V0IGFsbCBhc3NldHMgaW4gZGlyZWN0b3J5XG4gICAgICAgICAgICBjb25zdCBwYXR0ZXJuID0gYCR7ZGlyZWN0b3J5fS8qKi8qYDtcbiAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLnF1ZXJ5QXNzZXRzKHBhdHRlcm4sICcnLCAoZXJyOiBFcnJvciB8IG51bGwsIGFzc2V0czogYW55W10pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgYnJva2VuUmVmZXJlbmNlczogYW55W10gPSBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWxpZFJlZmVyZW5jZXM6IGFueVtdID0gW107XG4gICAgICAgICAgICAgICAgbGV0IHByb2Nlc3NlZENvdW50ID0gMDtcblxuICAgICAgICAgICAgICAgIGlmIChhc3NldHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6IGRpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbEFzc2V0czogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZFJlZmVyZW5jZXM6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJva2VuUmVmZXJlbmNlczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicm9rZW5Bc3NldHM6IFtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdWYWxpZGF0aW9uIGNvbXBsZXRlZDogMCBhc3NldHMgZm91bmQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gVmFsaWRhdGUgZWFjaCBhc3NldFxuICAgICAgICAgICAgICAgIGFzc2V0cy5mb3JFYWNoKChhc3NldDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5hc3NldGRiLnF1ZXJ5SW5mb0J5VXVpZChhc3NldC51dWlkLCAoaW5mb0VycjogRXJyb3IgfCBudWxsLCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmZvRXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJva2VuUmVmZXJlbmNlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBhc3NldC51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV1aWQ6IGFzc2V0LnV1aWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFzc2V0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBpbmZvRXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRSZWZlcmVuY2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGFzc2V0LnVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRDb3VudCsrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBpZiBhbGwgYXNzZXRzIGhhdmUgYmVlbiBwcm9jZXNzZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9jZXNzZWRDb3VudCA9PT0gYXNzZXRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6IGRpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvdGFsQXNzZXRzOiBhc3NldHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRSZWZlcmVuY2VzOiB2YWxpZFJlZmVyZW5jZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJva2VuUmVmZXJlbmNlczogYnJva2VuUmVmZXJlbmNlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicm9rZW5Bc3NldHM6IGJyb2tlblJlZmVyZW5jZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBgVmFsaWRhdGlvbiBjb21wbGV0ZWQ6ICR7YnJva2VuUmVmZXJlbmNlcy5sZW5ndGh9IGJyb2tlbiByZWZlcmVuY2VzIGZvdW5kYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZ2V0QXNzZXREZXBlbmRlbmNpZXModXJsT3JVVUlEOiBzdHJpbmcsIGRpcmVjdGlvbjogc3RyaW5nID0gJ2RlcGVuZGVuY2llcycpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIE5vdGU6IFRoaXMgd291bGQgcmVxdWlyZSBzY2VuZSBhbmFseXNpcyBvciBhZGRpdGlvbmFsIEFQSXMgbm90IGF2YWlsYWJsZSBpbiBjdXJyZW50IGRvY3VtZW50YXRpb25cbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiAnQXNzZXQgZGVwZW5kZW5jeSBhbmFseXNpcyByZXF1aXJlcyBhZGRpdGlvbmFsIEFQSXMgbm90IGF2YWlsYWJsZSBpbiBjdXJyZW50IENvY29zIENyZWF0b3IgTUNQIGltcGxlbWVudGF0aW9uLiBDb25zaWRlciB1c2luZyB0aGUgRWRpdG9yIFVJIGZvciBkZXBlbmRlbmN5IGFuYWx5c2lzLidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldFVudXNlZEFzc2V0cyhkaXJlY3Rvcnk6IHN0cmluZyA9ICdkYjovL2Fzc2V0cycsIGV4Y2x1ZGVEaXJlY3Rvcmllczogc3RyaW5nW10gPSBbXSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgLy8gTm90ZTogVGhpcyB3b3VsZCByZXF1aXJlIGNvbXByZWhlbnNpdmUgcHJvamVjdCBhbmFseXNpc1xuICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgZXJyb3I6ICdVbnVzZWQgYXNzZXQgZGV0ZWN0aW9uIHJlcXVpcmVzIGNvbXByZWhlbnNpdmUgcHJvamVjdCBhbmFseXNpcyBub3QgYXZhaWxhYmxlIGluIGN1cnJlbnQgQ29jb3MgQ3JlYXRvciBNQ1AgaW1wbGVtZW50YXRpb24uIENvbnNpZGVyIHVzaW5nIHRoZSBFZGl0b3IgVUkgb3IgdGhpcmQtcGFydHkgdG9vbHMgZm9yIHVudXNlZCBhc3NldCBkZXRlY3Rpb24uJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY29tcHJlc3NUZXh0dXJlcyhkaXJlY3Rvcnk6IHN0cmluZyA9ICdkYjovL2Fzc2V0cycsIGZvcm1hdDogc3RyaW5nID0gJ2F1dG8nLCBxdWFsaXR5OiBudW1iZXIgPSAwLjgpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIC8vIE5vdGU6IFRleHR1cmUgY29tcHJlc3Npb24gd291bGQgcmVxdWlyZSBpbWFnZSBwcm9jZXNzaW5nIEFQSXNcbiAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGVycm9yOiAnVGV4dHVyZSBjb21wcmVzc2lvbiByZXF1aXJlcyBpbWFnZSBwcm9jZXNzaW5nIGNhcGFiaWxpdGllcyBub3QgYXZhaWxhYmxlIGluIGN1cnJlbnQgQ29jb3MgQ3JlYXRvciBNQ1AgaW1wbGVtZW50YXRpb24uIFVzZSB0aGUgRWRpdG9yXFwncyBidWlsdC1pbiB0ZXh0dXJlIGNvbXByZXNzaW9uIHNldHRpbmdzIG9yIGV4dGVybmFsIHRvb2xzLidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGV4cG9ydEFzc2V0TWFuaWZlc3QoZGlyZWN0b3J5OiBzdHJpbmcgPSAnZGI6Ly9hc3NldHMnLCBmb3JtYXQ6IHN0cmluZyA9ICdqc29uJywgaW5jbHVkZU1ldGFkYXRhOiBib29sZWFuID0gdHJ1ZSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGF0dGVybiA9IGAke2RpcmVjdG9yeX0vKiovKmA7XG4gICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeUFzc2V0cyhwYXR0ZXJuLCAnJywgKGVycjogRXJyb3IgfCBudWxsLCBhc3NldHM6IGFueVtdKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IG1hbmlmZXN0OiBhbnlbXSA9IFtdO1xuICAgICAgICAgICAgICAgIGxldCBwcm9jZXNzZWRDb3VudCA9IDA7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXNzZXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0b3J5OiBkaXJlY3RvcnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0OiBmb3JtYXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXNzZXRDb3VudDogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlTWV0YWRhdGE6IGluY2x1ZGVNZXRhZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYW5pZmVzdDogZm9ybWF0ID09PSAnanNvbicgPyAnW10nIDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0Fzc2V0IG1hbmlmZXN0IGV4cG9ydGVkIHdpdGggMCBhc3NldHMnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gUHJvY2VzcyBlYWNoIGFzc2V0XG4gICAgICAgICAgICAgICAgYXNzZXRzLmZvckVhY2goKGFzc2V0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyeTogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXNzZXQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogYXNzZXQudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXVpZDogYXNzZXQudXVpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGFzc2V0LnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAoYXNzZXQgYXMgYW55KS5zaXplIHx8IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0RpcmVjdG9yeTogYXNzZXQuaXNEaXJlY3RvcnkgfHwgZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5jbHVkZU1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUcnkgdG8gZ2V0IG1ldGFkYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuYXNzZXRkYi5xdWVyeU1ldGFJbmZvQnlVdWlkKGFzc2V0LnV1aWQsIChtZXRhRXJyOiBFcnJvciB8IG51bGwsIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbWV0YUVyciAmJiBpbmZvICYmIGluZm8uanNvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYW5pZmVzdEVudHJ5Lm1ldGEgPSBpbmZvLmpzb247XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFuaWZlc3QucHVzaChtYW5pZmVzdEVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzZWRDb3VudCsrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGFzc2V0cyBoYXZlIGJlZW4gcHJvY2Vzc2VkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb2Nlc3NlZENvdW50ID09PSBhc3NldHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmluYWxpemVNYW5pZmVzdEV4cG9ydChyZXNvbHZlLCBkaXJlY3RvcnksIGZvcm1hdCwgaW5jbHVkZU1ldGFkYXRhLCBtYW5pZmVzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYW5pZmVzdC5wdXNoKG1hbmlmZXN0RW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkQ291bnQrKztcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgYWxsIGFzc2V0cyBoYXZlIGJlZW4gcHJvY2Vzc2VkXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvY2Vzc2VkQ291bnQgPT09IGFzc2V0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmFsaXplTWFuaWZlc3RFeHBvcnQocmVzb2x2ZSwgZGlyZWN0b3J5LCBmb3JtYXQsIGluY2x1ZGVNZXRhZGF0YSwgbWFuaWZlc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmaW5hbGl6ZU1hbmlmZXN0RXhwb3J0KHJlc29sdmU6IGFueSwgZGlyZWN0b3J5OiBzdHJpbmcsIGZvcm1hdDogc3RyaW5nLCBpbmNsdWRlTWV0YWRhdGE6IGJvb2xlYW4sIG1hbmlmZXN0OiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBsZXQgZXhwb3J0RGF0YTogc3RyaW5nO1xuICAgICAgICBzd2l0Y2ggKGZvcm1hdCkge1xuICAgICAgICAgICAgY2FzZSAnanNvbic6XG4gICAgICAgICAgICAgICAgZXhwb3J0RGF0YSA9IEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0LCBudWxsLCAyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2Nzdic6XG4gICAgICAgICAgICAgICAgZXhwb3J0RGF0YSA9IHRoaXMuY29udmVydFRvQ1NWKG1hbmlmZXN0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3htbCc6XG4gICAgICAgICAgICAgICAgZXhwb3J0RGF0YSA9IHRoaXMuY29udmVydFRvWE1MKG1hbmlmZXN0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgZXhwb3J0RGF0YSA9IEpTT04uc3RyaW5naWZ5KG1hbmlmZXN0LCBudWxsLCAyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rvcnk6IGRpcmVjdG9yeSxcbiAgICAgICAgICAgICAgICBmb3JtYXQ6IGZvcm1hdCxcbiAgICAgICAgICAgICAgICBhc3NldENvdW50OiBtYW5pZmVzdC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgaW5jbHVkZU1ldGFkYXRhOiBpbmNsdWRlTWV0YWRhdGEsXG4gICAgICAgICAgICAgICAgbWFuaWZlc3Q6IGV4cG9ydERhdGEsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYEFzc2V0IG1hbmlmZXN0IGV4cG9ydGVkIHdpdGggJHttYW5pZmVzdC5sZW5ndGh9IGFzc2V0c2BcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb252ZXJ0VG9DU1YoZGF0YTogYW55W10pOiBzdHJpbmcge1xuICAgICAgICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHJldHVybiAnJztcblxuICAgICAgICBjb25zdCBoZWFkZXJzID0gT2JqZWN0LmtleXMoZGF0YVswXSk7XG4gICAgICAgIGNvbnN0IGNzdlJvd3MgPSBbaGVhZGVycy5qb2luKCcsJyldO1xuXG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIGRhdGEpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlcyA9IGhlYWRlcnMubWFwKGhlYWRlciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSByb3dbaGVhZGVyXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyA/IEpTT04uc3RyaW5naWZ5KHZhbHVlKSA6IFN0cmluZyh2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNzdlJvd3MucHVzaCh2YWx1ZXMuam9pbignLCcpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjc3ZSb3dzLmpvaW4oJ1xcbicpO1xuICAgIH1cblxuICAgIHByaXZhdGUgY29udmVydFRvWE1MKGRhdGE6IGFueVtdKTogc3RyaW5nIHtcbiAgICAgICAgbGV0IHhtbCA9ICc8P3htbCB2ZXJzaW9uPVwiMS4wXCIgZW5jb2Rpbmc9XCJVVEYtOFwiPz5cXG48YXNzZXRzPlxcbic7XG5cbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGRhdGEpIHtcbiAgICAgICAgICAgIHhtbCArPSAnICA8YXNzZXQ+XFxuJztcbiAgICAgICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeG1sVmFsdWUgPSB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID9cbiAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgU3RyaW5nKHZhbHVlKS5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG4gICAgICAgICAgICAgICAgeG1sICs9IGAgICAgPCR7a2V5fT4ke3htbFZhbHVlfTwvJHtrZXl9PlxcbmA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4bWwgKz0gJyAgPC9hc3NldD5cXG4nO1xuICAgICAgICB9XG5cbiAgICAgICAgeG1sICs9ICc8L2Fzc2V0cz4nO1xuICAgICAgICByZXR1cm4geG1sO1xuICAgIH1cbn0iXX0=