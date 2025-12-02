/// <reference path="../../types/editor-2x.d.ts" />

import { readFileSync } from 'fs-extra';
import { join } from 'path';
import Vue from 'vue';

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
        const appElement = (this as any).$.app;
        if (appElement) {
            // Vue 2 application using Options API
            // TypeScript strict mode compatibility: use type assertion for Vue instance
            const vm = new Vue({
                el: appElement,
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
                        const self = this as any;
                        return {
                            'status-running': self.serverRunning,
                            'status-stopped': !self.serverRunning
                        };
                    },
                    totalTools(): number {
                        const self = this as any;
                        return self.availableTools.length;
                    },
                    enabledTools(): number {
                        const self = this as any;
                        return self.availableTools.filter((t: ToolConfig) => t.enabled).length;
                    },
                    disabledTools(): number {
                        const self = this as any;
                        return self.totalTools - self.enabledTools;
                    },
                    filteredTools(): ToolConfig[] {
                        const self = this as any;
                        let tools = self.availableTools;

                        if (self.selectedCategory) {
                            tools = tools.filter((t: ToolConfig) => t.category === self.selectedCategory);
                        }

                        if (self.searchQuery) {
                            const query = self.searchQuery.toLowerCase();
                            tools = tools.filter((t: ToolConfig) =>
                                t.name.toLowerCase().includes(query) ||
                                t.description.toLowerCase().includes(query)
                            );
                        }

                        return tools;
                    },
                    groupedTools(): any {
                        const self = this as any;
                        const groups: any = {};
                        self.filteredTools.forEach((tool: ToolConfig) => {
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
                        const self = this as any;
                        self.activeTab = tabName;
                        if (tabName === 'tools') {
                            self.loadToolManagerState();
                        }
                    },

                    async toggleServer() {
                        const self = this as any;
                        try {
                            if (self.serverRunning) {
                                await self.sendIpcRequest('cocos-mcp-server', 'stop-server');
                            } else {
                                const currentSettings = {
                                    port: self.settings.port,
                                    autoStart: self.settings.autoStart,
                                    enableDebugLog: self.settings.debugLog,
                                    maxConnections: self.settings.maxConnections
                                };
                                await self.sendIpcRequest('cocos-mcp-server', 'update-settings', currentSettings);
                                await self.sendIpcRequest('cocos-mcp-server', 'start-server');
                            }
                            console.log('[Vue App] Server toggled');
                        } catch (error) {
                            console.error('[Vue App] Failed to toggle server:', error);
                        }
                    },

                    async saveSettings() {
                        const self = this as any;
                        try {
                            const settingsData = {
                                port: self.settings.port,
                                autoStart: self.settings.autoStart,
                                debugLog: self.settings.debugLog,
                                maxConnections: self.settings.maxConnections
                            };

                            await self.sendIpcRequest('cocos-mcp-server', 'update-settings', settingsData);
                            console.log('[Vue App] Settings saved');
                            self.settingsChanged = false;
                        } catch (error) {
                            console.error('[Vue App] Failed to save settings:', error);
                        }
                    },

                    async copyUrl() {
                        const self = this as any;
                        try {
                            // In 2.x, use a simpler clipboard method or Electron's clipboard
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                await navigator.clipboard.writeText(self.httpUrl);
                            } else {
                                // Fallback for older environments
                                const textarea = document.createElement('textarea');
                                textarea.value = self.httpUrl;
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
                        const self = this as any;
                        try {
                            const result = await self.sendIpcRequest('cocos-mcp-server', 'get-tool-manager-state');
                            if (result && result.tools) {
                                self.availableTools = result.tools;
                                self.toolCategories = Array.from(new Set(result.tools.map((t: ToolConfig) => t.category)));
                            }
                        } catch (error) {
                            console.error('[Vue App] Failed to load tool manager state:', error);
                        }
                    },

                    async updateToolStatus(category: string, toolName: string, enabled: boolean) {
                        const self = this as any;
                        try {
                            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status', category, toolName, enabled);
                            await self.loadToolManagerState();
                        } catch (error) {
                            console.error('[Vue App] Failed to update tool status:', error);
                        }
                    },

                    async toggleCategory(category: string, enabled: boolean) {
                        const self = this as any;
                        try {
                            const updates = self.availableTools
                                .filter((t: ToolConfig) => t.category === category)
                                .map((t: ToolConfig) => ({
                                    category: t.category,
                                    name: t.name,
                                    enabled: enabled
                                }));

                            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status-batch', updates);
                            await self.loadToolManagerState();
                        } catch (error) {
                            console.error('[Vue App] Failed to toggle category:', error);
                        }
                    },

                    async updateServerStatus() {
                        const self = this as any;
                        try {
                            const status = await self.sendIpcRequest('cocos-mcp-server', 'get-server-status');
                            if (status) {
                                self.serverRunning = status.running || false;
                                self.serverStatus = status.running ? '运行中' : '已停止';
                                self.connectedClients = status.clients || 0;
                                self.httpUrl = `http://127.0.0.1:${status.settings?.port || 3000}/mcp`;

                                if (status.settings) {
                                    self.settings.port = status.settings.port || 3000;
                                    self.settings.autoStart = status.settings.autoStart || false;
                                    self.settings.debugLog = status.settings.debugLog || false;
                                    self.settings.maxConnections = status.settings.maxConnections || 10;
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
                                // Type assertion needed because TypeScript doesn't support rest params before callback
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
                        const self = this as any;
                        self.settingsChanged = true;
                    },
                    'settings.autoStart'() {
                        const self = this as any;
                        self.settingsChanged = true;
                    },
                    'settings.debugLog'() {
                        const self = this as any;
                        self.settingsChanged = true;
                    },
                    'settings.maxConnections'() {
                        const self = this as any;
                        self.settingsChanged = true;
                    }
                },
                mounted() {
                    const self = this as any;
                    console.log('[Vue App] Component mounted');
                    self.updateServerStatus();

                    // Poll for status updates every 2 seconds
                    setInterval(() => {
                        self.updateServerStatus();
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
