"use strict";
/// <reference path="../types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesTools = void 0;
class PreferencesTools {
    getTools() {
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
    async execute(toolName, args) {
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
    async openPreferencesSettings(tab, args) {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }
    async queryPreferencesConfig(name, path, type = 'global') {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }
    async setPreferencesConfig(name, path, value, type = 'global') {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }
    async getAllPreferences() {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }
    async resetPreferences(name, type = 'global') {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }
    async exportPreferences(exportPath) {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }
    async importPreferences(importPath) {
        return Promise.resolve({
            success: false,
            error: 'Preferences tools are not available in Cocos Creator 2.x'
        });
    }
}
exports.PreferencesTools = PreferencesTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXMtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvcHJlZmVyZW5jZXMtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFnRDs7O0FBSWhELE1BQWEsZ0JBQWdCO0lBQ3pCLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLDJCQUEyQjtnQkFDakMsV0FBVyxFQUFFLGlDQUFpQztnQkFDOUMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixHQUFHLEVBQUU7NEJBQ0QsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLG9DQUFvQzs0QkFDakQsSUFBSSxFQUFFLENBQUMsU0FBUyxFQUFFLGdCQUFnQixFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDO3lCQUNqRjt3QkFDRCxJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLE9BQU87NEJBQ2IsV0FBVyxFQUFFLHlDQUF5Qzt5QkFDekQ7cUJBQ0o7aUJBQ0o7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSwwQkFBMEI7Z0JBQ2hDLFdBQVcsRUFBRSxpQ0FBaUM7Z0JBQzlDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsSUFBSSxFQUFFOzRCQUNGLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSx5QkFBeUI7NEJBQ3RDLE9BQU8sRUFBRSxTQUFTO3lCQUNyQjt3QkFDRCxJQUFJLEVBQUU7NEJBQ0YsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFFLCtCQUErQjt5QkFDL0M7d0JBQ0QsSUFBSSxFQUFFOzRCQUNGLElBQUksRUFBRSxRQUFROzRCQUNkLFdBQVcsRUFBRSxvQkFBb0I7NEJBQ2pDLElBQUksRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsT0FBTyxDQUFDOzRCQUNw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O1lBQ2QsS0FBSyxFQUFFLDBEQUEwRDtTQUNwRSxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sS0FBSyxDQUFDLGlCQUFpQjtRQUMzQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDbkIsT0FBTyxFQUFFLEtBQUs7WUFDZCxLQUFLLEVBQUUsMERBQTBEO1NBQ3BFLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsSUFBYSxFQUFFLE9BQWUsUUFBUTtRQUNqRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDbkIsT0FBTyxFQUFFLEtBQUs7WUFDZCxLQUFLLEVBQUUsMERBQTBEO1NBQ3BFLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxLQUFLLENBQUMsaUJBQWlCLENBQUMsVUFBbUI7UUFDL0MsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ25CLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLDBEQUEwRDtTQUNwRSxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU8sS0FBSyxDQUFDLGlCQUFpQixDQUFDLFVBQWtCO1FBQzlDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNuQixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSwwREFBMEQ7U0FDcEUsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBdk1ELDRDQXVNQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBlcy9lZGl0b3ItMnguZC50c1wiIC8+XG5cbmltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sUmVzcG9uc2UsIFRvb2xFeGVjdXRvciB9IGZyb20gJy4uL3R5cGVzJztcblxuZXhwb3J0IGNsYXNzIFByZWZlcmVuY2VzVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdvcGVuX3ByZWZlcmVuY2VzX3NldHRpbmdzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ09wZW4gcHJlZmVyZW5jZXMgc2V0dGluZ3MgcGFuZWwnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YWI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZlcmVuY2VzIHRhYiB0byBvcGVuIChvcHRpb25hbCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnZ2VuZXJhbCcsICdleHRlcm5hbC10b29scycsICdkYXRhLWVkaXRvcicsICdsYWJvcmF0b3J5JywgJ2V4dGVuc2lvbnMnXVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWRkaXRpb25hbCBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgdGFiJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncXVlcnlfcHJlZmVyZW5jZXNfY29uZmlnJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1F1ZXJ5IHByZWZlcmVuY2VzIGNvbmZpZ3VyYXRpb24nLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQbHVnaW4gb3IgY2F0ZWdvcnkgbmFtZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2dlbmVyYWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29uZmlndXJhdGlvbiBwYXRoIChvcHRpb25hbCknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29uZmlndXJhdGlvbiB0eXBlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2RlZmF1bHQnLCAnZ2xvYmFsJywgJ2xvY2FsJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDogJ2dsb2JhbCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbmFtZSddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnc2V0X3ByZWZlcmVuY2VzX2NvbmZpZycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTZXQgcHJlZmVyZW5jZXMgY29uZmlndXJhdGlvbicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BsdWdpbiBuYW1lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbmZpZ3VyYXRpb24gcGF0aCdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29uZmlndXJhdGlvbiB2YWx1ZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb25maWd1cmF0aW9uIHR5cGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVudW06IFsnZGVmYXVsdCcsICdnbG9iYWwnLCAnbG9jYWwnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAnZ2xvYmFsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogWyduYW1lJywgJ3BhdGgnLCAndmFsdWUnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2dldF9hbGxfcHJlZmVyZW5jZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGFsbCBhdmFpbGFibGUgcHJlZmVyZW5jZXMgY2F0ZWdvcmllcycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncmVzZXRfcHJlZmVyZW5jZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUmVzZXQgcHJlZmVyZW5jZXMgdG8gZGVmYXVsdCB2YWx1ZXMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTcGVjaWZpYyBwcmVmZXJlbmNlIGNhdGVnb3J5IHRvIHJlc2V0IChvcHRpb25hbCknXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29uZmlndXJhdGlvbiB0eXBlIHRvIHJlc2V0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtOiBbJ2dsb2JhbCcsICdsb2NhbCddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6ICdnbG9iYWwnXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdleHBvcnRfcHJlZmVyZW5jZXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRXhwb3J0IGN1cnJlbnQgcHJlZmVyZW5jZXMgY29uZmlndXJhdGlvbicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydFBhdGg6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1BhdGggdG8gZXhwb3J0IHByZWZlcmVuY2VzIGZpbGUgKG9wdGlvbmFsKSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2ltcG9ydF9wcmVmZXJlbmNlcycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdJbXBvcnQgcHJlZmVyZW5jZXMgY29uZmlndXJhdGlvbiBmcm9tIGZpbGUnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbXBvcnRQYXRoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQYXRoIHRvIGltcG9ydCBwcmVmZXJlbmNlcyBmaWxlIGZyb20nXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbJ2ltcG9ydFBhdGgnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ29wZW5fcHJlZmVyZW5jZXNfc2V0dGluZ3MnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLm9wZW5QcmVmZXJlbmNlc1NldHRpbmdzKGFyZ3MudGFiLCBhcmdzLmFyZ3MpO1xuICAgICAgICAgICAgY2FzZSAncXVlcnlfcHJlZmVyZW5jZXNfY29uZmlnJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5xdWVyeVByZWZlcmVuY2VzQ29uZmlnKGFyZ3MubmFtZSwgYXJncy5wYXRoLCBhcmdzLnR5cGUpO1xuICAgICAgICAgICAgY2FzZSAnc2V0X3ByZWZlcmVuY2VzX2NvbmZpZyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuc2V0UHJlZmVyZW5jZXNDb25maWcoYXJncy5uYW1lLCBhcmdzLnBhdGgsIGFyZ3MudmFsdWUsIGFyZ3MudHlwZSk7XG4gICAgICAgICAgICBjYXNlICdnZXRfYWxsX3ByZWZlcmVuY2VzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRBbGxQcmVmZXJlbmNlcygpO1xuICAgICAgICAgICAgY2FzZSAncmVzZXRfcHJlZmVyZW5jZXMnOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0UHJlZmVyZW5jZXMoYXJncy5uYW1lLCBhcmdzLnR5cGUpO1xuICAgICAgICAgICAgY2FzZSAnZXhwb3J0X3ByZWZlcmVuY2VzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5leHBvcnRQcmVmZXJlbmNlcyhhcmdzLmV4cG9ydFBhdGgpO1xuICAgICAgICAgICAgY2FzZSAnaW1wb3J0X3ByZWZlcmVuY2VzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5pbXBvcnRQcmVmZXJlbmNlcyhhcmdzLmltcG9ydFBhdGgpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgb3BlblByZWZlcmVuY2VzU2V0dGluZ3ModGFiPzogc3RyaW5nLCBhcmdzPzogYW55W10pOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6ICdQcmVmZXJlbmNlcyB0b29scyBhcmUgbm90IGF2YWlsYWJsZSBpbiBDb2NvcyBDcmVhdG9yIDIueCdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeVByZWZlcmVuY2VzQ29uZmlnKG5hbWU6IHN0cmluZywgcGF0aD86IHN0cmluZywgdHlwZTogc3RyaW5nID0gJ2dsb2JhbCcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6ICdQcmVmZXJlbmNlcyB0b29scyBhcmUgbm90IGF2YWlsYWJsZSBpbiBDb2NvcyBDcmVhdG9yIDIueCdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBzZXRQcmVmZXJlbmNlc0NvbmZpZyhuYW1lOiBzdHJpbmcsIHBhdGg6IHN0cmluZywgdmFsdWU6IGFueSwgdHlwZTogc3RyaW5nID0gJ2dsb2JhbCcpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6ICdQcmVmZXJlbmNlcyB0b29scyBhcmUgbm90IGF2YWlsYWJsZSBpbiBDb2NvcyBDcmVhdG9yIDIueCdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBnZXRBbGxQcmVmZXJlbmNlcygpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgZXJyb3I6ICdQcmVmZXJlbmNlcyB0b29scyBhcmUgbm90IGF2YWlsYWJsZSBpbiBDb2NvcyBDcmVhdG9yIDIueCdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyByZXNldFByZWZlcmVuY2VzKG5hbWU/OiBzdHJpbmcsIHR5cGU6IHN0cmluZyA9ICdnbG9iYWwnKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiAnUHJlZmVyZW5jZXMgdG9vbHMgYXJlIG5vdCBhdmFpbGFibGUgaW4gQ29jb3MgQ3JlYXRvciAyLngnXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgZXhwb3J0UHJlZmVyZW5jZXMoZXhwb3J0UGF0aD86IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogJ1ByZWZlcmVuY2VzIHRvb2xzIGFyZSBub3QgYXZhaWxhYmxlIGluIENvY29zIENyZWF0b3IgMi54J1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGltcG9ydFByZWZlcmVuY2VzKGltcG9ydFBhdGg6IHN0cmluZyk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogJ1ByZWZlcmVuY2VzIHRvb2xzIGFyZSBub3QgYXZhaWxhYmxlIGluIENvY29zIENyZWF0b3IgMi54J1xuICAgICAgICB9KTtcbiAgICB9XG59Il19