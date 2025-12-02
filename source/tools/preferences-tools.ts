/// <reference path="../types/editor-2x.d.ts" />

import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export class PreferencesTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'open_preferences_settings',
                description: 'Open preferences settings panel',
                inputSchema: {
                    type: 'object',
                    properties: {
                        tab: {
                            type: 'string',
                            description: 'Preferences tab to open (optional)',
                            enum: ['general', 'external-tools', 'data-editor', 'laboratory', 'extensions']
                        },
                        args: {
                            type: 'array',
                            description: 'Additional arguments to pass to the tab'
                        }
                    }
                }
            },
            {
                name: 'query_preferences_config',
                description: 'Query preferences configuration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Plugin or category name',
                            default: 'general'
                        },
                        path: {
                            type: 'string',
                            description: 'Configuration path (optional)'
                        },
                        type: {
                            type: 'string',
                            description: 'Configuration type',
                            enum: ['default', 'global', 'local'],
                            default: 'global'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'set_preferences_config',
                description: 'Set preferences configuration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Plugin name'
                        },
                        path: {
                            type: 'string',
                            description: 'Configuration path'
                        },
                        value: {
                            description: 'Configuration value'
                        },
                        type: {
                            type: 'string',
                            description: 'Configuration type',
                            enum: ['default', 'global', 'local'],
                            default: 'global'
                        }
                    },
                    required: ['name', 'path', 'value']
                }
            },
            {
                name: 'get_all_preferences',
                description: 'Get all available preferences categories',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'reset_preferences',
                description: 'Reset preferences to default values',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Specific preference category to reset (optional)'
                        },
                        type: {
                            type: 'string',
                            description: 'Configuration type to reset',
                            enum: ['global', 'local'],
                            default: 'global'
                        }
                    }
                }
            },
            {
                name: 'export_preferences',
                description: 'Export current preferences configuration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        exportPath: {
                            type: 'string',
                            description: 'Path to export preferences file (optional)'
                        }
                    }
                }
            },
            {
                name: 'import_preferences',
                description: 'Import preferences configuration from file',
                inputSchema: {
                    type: 'object',
                    properties: {
                        importPath: {
                            type: 'string',
                            description: 'Path to import preferences file from'
                        }
                    },
                    required: ['importPath']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'open_preferences_settings':
                return await this.openPreferencesSettings(args.tab, args.args);
            case 'query_preferences_config':
                return await this.queryPreferencesConfig(args.name, args.path, args.type);
            case 'set_preferences_config':
                return await this.setPreferencesConfig(args.name, args.path, args.value, args.type);
            case 'get_all_preferences':
                return await this.getAllPreferences();
            case 'reset_preferences':
                return await this.resetPreferences(args.name, args.type);
            case 'export_preferences':
                return await this.exportPreferences(args.exportPath);
            case 'import_preferences':
                return await this.importPreferences(args.importPath);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async openPreferencesSettings(tab?: string, args?: any[]): Promise<ToolResponse> {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }

    private async queryPreferencesConfig(name: string, path?: string, type: string = 'global'): Promise<ToolResponse> {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }

    private async setPreferencesConfig(name: string, path: string, value: any, type: string = 'global'): Promise<ToolResponse> {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }

    private async getAllPreferences(): Promise<ToolResponse> {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }

    private async resetPreferences(name?: string, type: string = 'global'): Promise<ToolResponse> {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }

    private async exportPreferences(exportPath?: string): Promise<ToolResponse> {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }

    private async importPreferences(importPath: string): Promise<ToolResponse> {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }
}