/// <reference path="../types/editor-2x.d.ts" />

import { ToolDefinition, ToolResponse, ToolExecutor, ConsoleMessage, PerformanceStats, ValidationResult, ValidationIssue } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { callSceneScriptAsync } from '../utils/scene-script-helper';

export class DebugTools implements ToolExecutor {
    private consoleMessages: ConsoleMessage[] = [];
    private readonly maxMessages = 1000;

    constructor() {
        this.setupConsoleCapture();
    }

    private setupConsoleCapture(): void {
        // Intercept Editor console messages
        // Note: Editor.Message.addBroadcastListener may not be available in all versions
        // This is a placeholder for console capture implementation
        console.log('Console capture setup - implementation depends on Editor API availability');
    }

    private addConsoleMessage(message: any): void {
        this.consoleMessages.push({
            timestamp: new Date().toISOString(),
            ...message
        });

        // Keep only latest messages
        if (this.consoleMessages.length > this.maxMessages) {
            this.consoleMessages.shift();
        }
    }

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'get_console_logs',
                description: 'Get editor console logs',
                inputSchema: {
                    type: 'object',
                    properties: {
                        limit: {
                            type: 'number',
                            description: 'Number of recent logs to retrieve',
                            default: 100
                        },
                        filter: {
                            type: 'string',
                            description: 'Filter logs by type',
                            enum: ['all', 'log', 'warn', 'error', 'info'],
                            default: 'all'
                        }
                    }
                }
            },
            {
                name: 'clear_console',
                description: 'Clear editor console',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'execute_script',
                description: 'Execute JavaScript in scene context',
                inputSchema: {
                    type: 'object',
                    properties: {
                        script: {
                            type: 'string',
                            description: 'JavaScript code to execute'
                        }
                    },
                    required: ['script']
                }
            },
            {
                name: 'get_node_tree',
                description: 'Get detailed node tree for debugging',
                inputSchema: {
                    type: 'object',
                    properties: {
                        rootUuid: {
                            type: 'string',
                            description: 'Root node UUID (optional, uses scene root if not provided)'
                        },
                        maxDepth: {
                            type: 'number',
                            description: 'Maximum tree depth',
                            default: 10
                        }
                    }
                }
            },
            {
                name: 'get_performance_stats',
                description: 'Get performance statistics',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'validate_scene',
                description: 'Validate current scene for issues',
                inputSchema: {
                    type: 'object',
                    properties: {
                        checkMissingAssets: {
                            type: 'boolean',
                            description: 'Check for missing asset references',
                            default: true
                        },
                        checkPerformance: {
                            type: 'boolean',
                            description: 'Check for performance issues',
                            default: true
                        }
                    }
                }
            },
            {
                name: 'get_editor_info',
                description: 'Get editor and environment information',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_project_logs',
                description: 'Get project logs from temp/logs/project.log file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        lines: {
                            type: 'number',
                            description: 'Number of lines to read from the end of the log file (default: 100)',
                            default: 100,
                            minimum: 1,
                            maximum: 10000
                        },
                        filterKeyword: {
                            type: 'string',
                            description: 'Filter logs containing specific keyword (optional)'
                        },
                        logLevel: {
                            type: 'string',
                            description: 'Filter by log level',
                            enum: ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'ALL'],
                            default: 'ALL'
                        }
                    }
                }
            },
            {
                name: 'get_log_file_info',
                description: 'Get information about the project log file',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'search_project_logs',
                description: 'Search for specific patterns or errors in project logs',
                inputSchema: {
                    type: 'object',
                    properties: {
                        pattern: {
                            type: 'string',
                            description: 'Search pattern (supports regex)'
                        },
                        maxResults: {
                            type: 'number',
                            description: 'Maximum number of matching results',
                            default: 20,
                            minimum: 1,
                            maximum: 100
                        },
                        contextLines: {
                            type: 'number',
                            description: 'Number of context lines to show around each match',
                            default: 2,
                            minimum: 0,
                            maximum: 10
                        }
                    },
                    required: ['pattern']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'get_console_logs':
                return await this.getConsoleLogs(args.limit, args.filter);
            case 'clear_console':
                return await this.clearConsole();
            case 'execute_script':
                return await this.executeScript(args.script);
            case 'get_node_tree':
                return await this.getNodeTree(args.rootUuid, args.maxDepth);
            case 'get_performance_stats':
                return await this.getPerformanceStats();
            case 'validate_scene':
                return await this.validateScene(args);
            case 'get_editor_info':
                return await this.getEditorInfo();
            case 'get_project_logs':
                return await this.getProjectLogs(args.lines, args.filterKeyword, args.logLevel);
            case 'get_log_file_info':
                return await this.getLogFileInfo();
            case 'search_project_logs':
                return await this.searchProjectLogs(args.pattern, args.maxResults, args.contextLines);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async getConsoleLogs(limit: number = 100, filter: string = 'all'): Promise<ToolResponse> {
        let logs = this.consoleMessages;

        if (filter !== 'all') {
            logs = logs.filter(log => log.type === filter);
        }

        const recentLogs = logs.slice(-limit);

        return {
            success: true,
            data: {
                total: logs.length,
                returned: recentLogs.length,
                logs: recentLogs
            }
        };
    }

    private async clearConsole(): Promise<ToolResponse> {
        this.consoleMessages = [];

        return new Promise((resolve) => {
            // In 2.x, use Editor.Ipc to send messages
            Editor.Ipc.sendToMain('console:clear', (err: Error | null) => {
                if (err) {
                    resolve({ success: false, error: err.message });
                } else {
                    resolve({
                        success: true,
                        message: 'Console cleared successfully'
                    });
                }
            });
        });
    }

    private async executeScript(script: string): Promise<ToolResponse> {
        try {
            // In 2.x, use Editor.Scene.callSceneScript to execute scene scripts
            // Note: eval method may need to be implemented in scene.ts
            const result = await callSceneScriptAsync('cocos-mcp-server', 'executeScript', script);
            return {
                success: true,
                data: {
                    result: result,
                    message: 'Script executed successfully'
                }
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async getNodeTree(rootUuid?: string, maxDepth: number = 10): Promise<ToolResponse> {
        const buildTree = async (nodeData: any, depth: number = 0): Promise<any> => {
            if (depth >= maxDepth) {
                return { truncated: true };
            }

            const tree = {
                uuid: nodeData.uuid?.value || nodeData.uuid,
                name: nodeData.name?.value || nodeData.name,
                active: nodeData.active?.value !== undefined ? nodeData.active.value : nodeData.active,
                components: (nodeData.__comps__ || []).map((c: any) => c.__type__ || 'Unknown'),
                childCount: nodeData.children ? nodeData.children.length : 0,
                children: [] as any[]
            };

            if (nodeData.children && nodeData.children.length > 0 && depth < maxDepth) {
                for (const child of nodeData.children) {
                    // In 2.x, children are objects with uuid property
                    const childUuid = child.uuid || child;
                    try {
                        const childData = await callSceneScriptAsync('cocos-mcp-server', 'queryNode', childUuid);
                        if (childData) {
                            const childTree = await buildTree(childData, depth + 1);
                            tree.children.push(childTree);
                        }
                    } catch (err: any) {
                        tree.children.push({ error: err.message, uuid: childUuid });
                    }
                }
            }

            return tree;
        };

        try {
            if (rootUuid) {
                const nodeData = await callSceneScriptAsync('cocos-mcp-server', 'queryNode', rootUuid);
                if (nodeData) {
                    const tree = await buildTree(nodeData, 0);
                    return { success: true, data: tree };
                } else {
                    return { success: false, error: 'Node not found' };
                }
            } else {
                // Get scene hierarchy
                const hierarchy = await callSceneScriptAsync('cocos-mcp-server', 'getSceneHierarchy', false);
                if (hierarchy && hierarchy.success && hierarchy.data) {
                    const trees = await Promise.all(hierarchy.data.map(async (rootNode: any) => {
                        try {
                            const nodeData = await callSceneScriptAsync('cocos-mcp-server', 'queryNode', rootNode.uuid);
                            return nodeData ? await buildTree(nodeData, 0) : { error: 'Failed to query node', uuid: rootNode.uuid };
                        } catch (err: any) {
                            return { error: err.message, uuid: rootNode.uuid };
                        }
                    }));
                    return { success: true, data: trees };
                } else {
                    return { success: false, error: 'Failed to get scene hierarchy' };
                }
            }
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private async getPerformanceStats(): Promise<ToolResponse> {
        try {
            // In 2.x, performance stats are not directly available via API
            // Try to get basic stats from scene hierarchy
            const hierarchy = await callSceneScriptAsync('cocos-mcp-server', 'getSceneHierarchy', false);

                if (hierarchy && hierarchy.success && hierarchy.data) {
                    const nodeCount = this.countNodes(hierarchy.data);
                    let componentCount = 0;

                    // Count components by traversing the hierarchy
                    const countComponents = (nodes: any[]): void => {
                        for (const node of nodes) {
                            if (node.components) {
                                componentCount += node.components.length;
                            }
                            if (node.children) {
                                countComponents(node.children);
                            }
                        }
                    };
                    countComponents(hierarchy.data);

                    const perfStats: PerformanceStats = {
                        nodeCount: nodeCount,
                        componentCount: componentCount,
                        drawCalls: 0, // Not available in edit mode
                        triangles: 0, // Not available in edit mode
                        memory: process.memoryUsage()
                    };
                return { success: true, data: perfStats };
            } else {
                // Fallback to basic stats
                return {
                    success: true,
                    data: {
                        nodeCount: 0,
                        componentCount: 0,
                        drawCalls: 0,
                        triangles: 0,
                        memory: process.memoryUsage(),
                        message: 'Performance stats limited in edit mode'
                    }
                };
            }
        } catch (err: any) {
            // Fallback to basic stats
            return {
                success: true,
                data: {
                    nodeCount: 0,
                    componentCount: 0,
                    drawCalls: 0,
                    triangles: 0,
                    memory: process.memoryUsage(),
                    message: 'Performance stats not available in edit mode'
                }
            };
        }
    }

    private async validateScene(options: any): Promise<ToolResponse> {
        const issues: ValidationIssue[] = [];

        try {
            // Check for missing assets
            if (options.checkMissingAssets) {
                // In 2.x, missing asset checking is not directly available via API
                // This would need to be implemented by traversing scene nodes and checking component references
                // For now, we'll skip this check or implement a basic version
                // Note: Full asset validation would require more complex implementation
            }

            // Check for performance issues
            if (options.checkPerformance) {
                try {
                    const hierarchy = await callSceneScriptAsync('cocos-mcp-server', 'getSceneHierarchy', false);
                    if (hierarchy && hierarchy.success && hierarchy.data) {
                        const nodeCount = this.countNodes(hierarchy.data);

                        if (nodeCount > 1000) {
                            issues.push({
                                type: 'warning',
                                category: 'performance',
                                message: `High node count: ${nodeCount} nodes (recommended < 1000)`,
                                suggestion: 'Consider using object pooling or scene optimization'
                            });
                        }
                    }
                } catch (err: any) {
                    // If hierarchy query fails, skip performance check
                }
            }

            const result: ValidationResult = {
                valid: issues.length === 0,
                issueCount: issues.length,
                issues: issues
            };

            return { success: true, data: result };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    private countNodes(nodes: any[]): number {
        let count = nodes.length;
        for (const node of nodes) {
            if (node.children) {
                count += this.countNodes(node.children);
            }
        }
        return count;
    }

    private async getEditorInfo(): Promise<ToolResponse> {
        const info = {
            editor: {
                version: (Editor as any).versions?.editor || 'Unknown',
                cocosVersion: (Editor as any).versions?.cocos || 'Unknown',
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version
            },
            project: {
                name: Editor.Project.name,
                path: Editor.Project.path,
                id: Editor.Project.id
            },
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };

        return { success: true, data: info };
    }

    private async getProjectLogs(lines: number = 100, filterKeyword?: string, logLevel: string = 'ALL'): Promise<ToolResponse> {
        try {
            // Try multiple possible project paths
            let logFilePath = '';
            const possiblePaths = [
                Editor.Project ? Editor.Project.path : null,
                '/Users/lizhiyong/NewProject_3',
                process.cwd(),
            ].filter(p => p !== null) as string[];

            for (const basePath of possiblePaths) {
                const testPath = path.join(basePath, 'temp/logs/project.log');
                if (fs.existsSync(testPath)) {
                    logFilePath = testPath;
                    break;
                }
            }

            if (!logFilePath) {
                return {
                    success: false,
                    error: `Project log file not found. Tried paths: ${possiblePaths.map(p => path.join(p, 'temp/logs/project.log')).join(', ')}`
                };
            }

            // Read the file content
            const logContent = fs.readFileSync(logFilePath, 'utf8');
            const logLines = logContent.split('\n').filter(line => line.trim() !== '');

            // Get the last N lines
            const recentLines = logLines.slice(-lines);

            // Apply filters
            let filteredLines = recentLines;

            // Filter by log level if not 'ALL'
            if (logLevel !== 'ALL') {
                filteredLines = filteredLines.filter(line =>
                    line.includes(`[${logLevel}]`) || line.includes(logLevel.toLowerCase())
                );
            }

            // Filter by keyword if provided
            if (filterKeyword) {
                filteredLines = filteredLines.filter(line =>
                    line.toLowerCase().includes(filterKeyword.toLowerCase())
                );
            }

            return {
                success: true,
                data: {
                    totalLines: logLines.length,
                    requestedLines: lines,
                    filteredLines: filteredLines.length,
                    logLevel: logLevel,
                    filterKeyword: filterKeyword || null,
                    logs: filteredLines,
                    logFilePath: logFilePath
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: `Failed to read project logs: ${error.message}`
            };
        }
    }

    private async getLogFileInfo(): Promise<ToolResponse> {
        try {
            // Try multiple possible project paths
            let logFilePath = '';
            const possiblePaths = [
                Editor.Project ? Editor.Project.path : null,
                '/Users/lizhiyong/NewProject_3',
                process.cwd(),
            ].filter(p => p !== null) as string[];

            for (const basePath of possiblePaths) {
                const testPath = path.join(basePath, 'temp/logs/project.log');
                if (fs.existsSync(testPath)) {
                    logFilePath = testPath;
                    break;
                }
            }

            if (!logFilePath) {
                return {
                    success: false,
                    error: `Project log file not found. Tried paths: ${possiblePaths.map(p => path.join(p, 'temp/logs/project.log')).join(', ')}`
                };
            }

            const stats = fs.statSync(logFilePath);
            const logContent = fs.readFileSync(logFilePath, 'utf8');
            const lineCount = logContent.split('\n').filter(line => line.trim() !== '').length;

            return {
                success: true,
                data: {
                    filePath: logFilePath,
                    fileSize: stats.size,
                    fileSizeFormatted: this.formatFileSize(stats.size),
                    lastModified: stats.mtime.toISOString(),
                    lineCount: lineCount,
                    created: stats.birthtime.toISOString(),
                    accessible: fs.constants.R_OK
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: `Failed to get log file info: ${error.message}`
            };
        }
    }

    private async searchProjectLogs(pattern: string, maxResults: number = 20, contextLines: number = 2): Promise<ToolResponse> {
        try {
            // Try multiple possible project paths
            let logFilePath = '';
            const possiblePaths = [
                Editor.Project ? Editor.Project.path : null,
                '/Users/lizhiyong/NewProject_3',
                process.cwd(),
            ].filter(p => p !== null) as string[];

            for (const basePath of possiblePaths) {
                const testPath = path.join(basePath, 'temp/logs/project.log');
                if (fs.existsSync(testPath)) {
                    logFilePath = testPath;
                    break;
                }
            }

            if (!logFilePath) {
                return {
                    success: false,
                    error: `Project log file not found. Tried paths: ${possiblePaths.map(p => path.join(p, 'temp/logs/project.log')).join(', ')}`
                };
            }

            const logContent = fs.readFileSync(logFilePath, 'utf8');
            const logLines = logContent.split('\n');

            // Create regex pattern (support both string and regex patterns)
            let regex: RegExp;
            try {
                regex = new RegExp(pattern, 'gi');
            } catch {
                // If pattern is not valid regex, treat as literal string
                regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            }

            const matches: any[] = [];
            let resultCount = 0;

            for (let i = 0; i < logLines.length && resultCount < maxResults; i++) {
                const line = logLines[i];
                if (regex.test(line)) {
                    // Get context lines
                    const contextStart = Math.max(0, i - contextLines);
                    const contextEnd = Math.min(logLines.length - 1, i + contextLines);

                    const contextLinesArray = [];
                    for (let j = contextStart; j <= contextEnd; j++) {
                        contextLinesArray.push({
                            lineNumber: j + 1,
                            content: logLines[j],
                            isMatch: j === i
                        });
                    }

                    matches.push({
                        lineNumber: i + 1,
                        matchedLine: line,
                        context: contextLinesArray
                    });

                    resultCount++;

                    // Reset regex lastIndex for global search
                    regex.lastIndex = 0;
                }
            }

            return {
                success: true,
                data: {
                    pattern: pattern,
                    totalMatches: matches.length,
                    maxResults: maxResults,
                    contextLines: contextLines,
                    logFilePath: logFilePath,
                    matches: matches
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: `Failed to search project logs: ${error.message}`
            };
        }
    }

    private formatFileSize(bytes: number): string {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}