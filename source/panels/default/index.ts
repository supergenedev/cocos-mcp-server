/// <reference path="../../types/editor-2x.d.ts" />

import { readFileSync } from 'fs-extra';
import { join } from 'path';
import * as Vue from 'vue';

// 定义工具配置接口
interface ToolConfig {
    category: string;
    name: string;
    enabled: boolean;
    description: string;
}

// 定义配置接口
interface Configuration {
    id: string;
    name: string;
    description: string;
    tools: ToolConfig[];
    createdAt: string;
    updatedAt: string;
}

// 定义服务器设置接口
interface ServerSettings {
    port: number;
    autoStart: boolean;
    debugLog: boolean;
    maxConnections: number;
}

module.exports = Editor.Panel.extend({
    listeners: {
        show() {
            console.log('[MCP Panel] Panel shown');
        },
        hide() {
            console.log('[MCP Panel] Panel hidden');
        },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        panelTitle: '#panelTitle',
    },
    ready() {
        if (this.$.app) {
            // Vue 2 application using Options API
            const vm = new Vue({
                el: this.$.app,
                data: {
                    activeTab: 'server',
                    serverRunning: false,
                    serverStatus: '已停止',
                    connectedClients: 0,
                    httpUrl: '',
                    isProcessing: false,
                    settings: {
                        port: 3000,
                        autoStart: false,
                        debugLog: false,
                        maxConnections: 10
                    },
                    availableTools: [] as ToolConfig[],
                    toolCategories: [] as string[],
                    settingsChanged: false,
                    selectedCategory: '',
                    searchQuery: ''
                },
                computed: {
                    statusClass(): any {
                        return {
                            'status-running': this.serverRunning,
                            'status-stopped': !this.serverRunning
                        };
                    },
                    totalTools(): number {
                        return this.availableTools.length;
                    },
                    enabledTools(): number {
                        return this.availableTools.filter((t: ToolConfig) => t.enabled).length;
                    },
                    disabledTools(): number {
                        return this.totalTools - this.enabledTools;
                    },
                    filteredTools(): ToolConfig[] {
                        let tools = this.availableTools;

                        if (this.selectedCategory) {
                            tools = tools.filter((t: ToolConfig) => t.category === this.selectedCategory);
                        }

                        if (this.searchQuery) {
                            const query = this.searchQuery.toLowerCase();
                            tools = tools.filter((t: ToolConfig) =>
                                t.name.toLowerCase().includes(query) ||
                                t.description.toLowerCase().includes(query)
                            );
                        }

                        return tools;
                    },
                    groupedTools(): any {
                        const groups: any = {};
                        this.filteredTools.forEach((tool: ToolConfig) => {
                            if (!groups[tool.category]) {
                                groups[tool.category] = [];
                            }
                            groups[tool.category].push(tool);
                        });
                        return groups;
                    }
                },
                methods: {
                    switchTab(tabName: string) {
                        this.activeTab = tabName;
                        if (tabName === 'tools') {
                            this.loadToolManagerState();
                        }
                    },

                    async toggleServer() {
                        try {
                            if (this.serverRunning) {
                                await this.sendIpcRequest('cocos-mcp-server', 'stop-server');
                            } else {
                                const currentSettings = {
                                    port: this.settings.port,
                                    autoStart: this.settings.autoStart,
                                    enableDebugLog: this.settings.debugLog,
                                    maxConnections: this.settings.maxConnections
                                };
                                await this.sendIpcRequest('cocos-mcp-server', 'update-settings', currentSettings);
                                await this.sendIpcRequest('cocos-mcp-server', 'start-server');
                            }
                            console.log('[Vue App] Server toggled');
                        } catch (error) {
                            console.error('[Vue App] Failed to toggle server:', error);
                        }
                    },

                    async saveSettings() {
                        try {
                            const settingsData = {
                                port: this.settings.port,
                                autoStart: this.settings.autoStart,
                                debugLog: this.settings.debugLog,
                                maxConnections: this.settings.maxConnections
                            };

                            await this.sendIpcRequest('cocos-mcp-server', 'update-settings', settingsData);
                            console.log('[Vue App] Settings saved');
                            this.settingsChanged = false;
                        } catch (error) {
                            console.error('[Vue App] Failed to save settings:', error);
                        }
                    },

                    async copyUrl() {
                        try {
                            // In 2.x, use a simpler clipboard method or Electron's clipboard
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                await navigator.clipboard.writeText(this.httpUrl);
                            } else {
                                // Fallback for older environments
                                const textarea = document.createElement('textarea');
                                textarea.value = this.httpUrl;
                                document.body.appendChild(textarea);
                                textarea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textarea);
                            }
                            console.log('[Vue App] URL copied to clipboard');
                        } catch (error) {
                            console.error('[Vue App] Failed to copy URL:', error);
                        }
                    },

                    async loadToolManagerState() {
                        try {
                            const result = await this.sendIpcRequest('cocos-mcp-server', 'getToolManagerState');
                            if (result && result.tools) {
                                this.availableTools = result.tools;
                                this.toolCategories = Array.from(new Set(result.tools.map((t: ToolConfig) => t.category)));
                            }
                        } catch (error) {
                            console.error('[Vue App] Failed to load tool manager state:', error);
                        }
                    },

                    async updateToolStatus(category: string, toolName: string, enabled: boolean) {
                        try {
                            await this.sendIpcRequest('cocos-mcp-server', 'updateToolStatus', category, toolName, enabled);
                            await this.loadToolManagerState();
                        } catch (error) {
                            console.error('[Vue App] Failed to update tool status:', error);
                        }
                    },

                    async toggleCategory(category: string, enabled: boolean) {
                        try {
                            const updates = this.availableTools
                                .filter((t: ToolConfig) => t.category === category)
                                .map((t: ToolConfig) => ({
                                    category: t.category,
                                    name: t.name,
                                    enabled: enabled
                                }));

                            await this.sendIpcRequest('cocos-mcp-server', 'updateToolStatusBatch', updates);
                            await this.loadToolManagerState();
                        } catch (error) {
                            console.error('[Vue App] Failed to toggle category:', error);
                        }
                    },

                    async updateServerStatus() {
                        try {
                            const status = await this.sendIpcRequest('cocos-mcp-server', 'get-server-status');
                            if (status) {
                                this.serverRunning = status.running || false;
                                this.serverStatus = status.running ? '运行中' : '已停止';
                                this.connectedClients = status.clients || 0;
                                this.httpUrl = `http://127.0.0.1:${status.settings?.port || 3000}/mcp`;

                                if (status.settings) {
                                    this.settings.port = status.settings.port || 3000;
                                    this.settings.autoStart = status.settings.autoStart || false;
                                    this.settings.debugLog = status.settings.debugLog || false;
                                    this.settings.maxConnections = status.settings.maxConnections || 10;
                                }
                            }
                        } catch (error) {
                            console.error('[Vue App] Failed to update server status:', error);
                        }
                    },

                    // Helper method for IPC requests in 2.x
                    sendIpcRequest(packageName: string, message: string, ...args: any[]): Promise<any> {
                        return new Promise((resolve, reject) => {
                            try {
                                // In 2.x, we need to use Editor.Ipc
                                // The exact signature may vary, so this is a compatibility layer
                                const fullMessage = `${packageName}:${message}`;
                                Editor.Ipc.sendToMain(fullMessage, ...args, (error: Error | null, result: any) => {
                                    if (error) {
                                        reject(error);
                                    } else {
                                        resolve(result);
                                    }
                                });
                            } catch (error) {
                                reject(error);
                            }
                        });
                    }
                },
                watch: {
                    'settings.port'() {
                        this.settingsChanged = true;
                    },
                    'settings.autoStart'() {
                        this.settingsChanged = true;
                    },
                    'settings.debugLog'() {
                        this.settingsChanged = true;
                    },
                    'settings.maxConnections'() {
                        this.settingsChanged = true;
                    }
                },
                mounted() {
                    console.log('[Vue App] Component mounted');
                    this.updateServerStatus();

                    // Poll for status updates every 2 seconds
                    setInterval(() => {
                        this.updateServerStatus();
                    }, 2000);
                }
            });

            console.log('[MCP Panel] Vue 2 app initialized');
        }
    },
    beforeClose() {
        // Clean up if needed
    },
    close() {
        // Panel closing
    },
});
