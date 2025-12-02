"use strict";
/// <reference path="../../types/editor-2x.d.ts" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const vue_1 = __importDefault(require("vue"));
module.exports = Editor.Panel.extend({
    listeners: {
        show() {
            console.log('[MCP Panel] Panel shown');
        },
        hide() {
            console.log('[MCP Panel] Panel hidden');
        },
    },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        panelTitle: '#panelTitle',
    },
    ready() {
        const appElement = this.$.app;
        if (appElement) {
            // Vue 2 application using Options API
            // TypeScript strict mode compatibility: use type assertion for Vue instance
            const vm = new vue_1.default({
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
                    availableTools: [],
                    toolCategories: [],
                    settingsChanged: false,
                    selectedCategory: '',
                    searchQuery: ''
                },
                computed: {
                    statusClass() {
                        const self = this;
                        return {
                            'status-running': self.serverRunning,
                            'status-stopped': !self.serverRunning
                        };
                    },
                    totalTools() {
                        const self = this;
                        return self.availableTools.length;
                    },
                    enabledTools() {
                        const self = this;
                        return self.availableTools.filter((t) => t.enabled).length;
                    },
                    disabledTools() {
                        const self = this;
                        return self.totalTools - self.enabledTools;
                    },
                    filteredTools() {
                        const self = this;
                        let tools = self.availableTools;
                        if (self.selectedCategory) {
                            tools = tools.filter((t) => t.category === self.selectedCategory);
                        }
                        if (self.searchQuery) {
                            const query = self.searchQuery.toLowerCase();
                            tools = tools.filter((t) => t.name.toLowerCase().includes(query) ||
                                t.description.toLowerCase().includes(query));
                        }
                        return tools;
                    },
                    groupedTools() {
                        const self = this;
                        const groups = {};
                        self.filteredTools.forEach((tool) => {
                            if (!groups[tool.category]) {
                                groups[tool.category] = [];
                            }
                            groups[tool.category].push(tool);
                        });
                        return groups;
                    }
                },
                methods: {
                    switchTab(tabName) {
                        const self = this;
                        self.activeTab = tabName;
                        if (tabName === 'tools') {
                            self.loadToolManagerState();
                        }
                    },
                    async toggleServer() {
                        const self = this;
                        try {
                            if (self.serverRunning) {
                                await self.sendIpcRequest('cocos-mcp-server', 'stop-server');
                            }
                            else {
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
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to toggle server:', error);
                        }
                    },
                    async saveSettings() {
                        const self = this;
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
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to save settings:', error);
                        }
                    },
                    async copyUrl() {
                        const self = this;
                        try {
                            // In 2.x, use a simpler clipboard method or Electron's clipboard
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                await navigator.clipboard.writeText(self.httpUrl);
                            }
                            else {
                                // Fallback for older environments
                                const textarea = document.createElement('textarea');
                                textarea.value = self.httpUrl;
                                document.body.appendChild(textarea);
                                textarea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textarea);
                            }
                            console.log('[Vue App] URL copied to clipboard');
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to copy URL:', error);
                        }
                    },
                    async loadToolManagerState() {
                        const self = this;
                        try {
                            const result = await self.sendIpcRequest('cocos-mcp-server', 'get-tool-manager-state');
                            if (result && result.tools) {
                                self.availableTools = result.tools;
                                self.toolCategories = Array.from(new Set(result.tools.map((t) => t.category)));
                            }
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to load tool manager state:', error);
                        }
                    },
                    async updateToolStatus(category, toolName, enabled) {
                        const self = this;
                        try {
                            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status', category, toolName, enabled);
                            await self.loadToolManagerState();
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to update tool status:', error);
                        }
                    },
                    async toggleCategory(category, enabled) {
                        const self = this;
                        try {
                            const updates = self.availableTools
                                .filter((t) => t.category === category)
                                .map((t) => ({
                                category: t.category,
                                name: t.name,
                                enabled: enabled
                            }));
                            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status-batch', updates);
                            await self.loadToolManagerState();
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to toggle category:', error);
                        }
                    },
                    async updateServerStatus() {
                        var _a;
                        const self = this;
                        try {
                            const status = await self.sendIpcRequest('cocos-mcp-server', 'get-server-status');
                            if (status) {
                                self.serverRunning = status.running || false;
                                self.serverStatus = status.running ? '运行中' : '已停止';
                                self.connectedClients = status.clients || 0;
                                self.httpUrl = `http://127.0.0.1:${((_a = status.settings) === null || _a === void 0 ? void 0 : _a.port) || 3000}/mcp`;
                                if (status.settings) {
                                    self.settings.port = status.settings.port || 3000;
                                    self.settings.autoStart = status.settings.autoStart || false;
                                    self.settings.debugLog = status.settings.debugLog || false;
                                    self.settings.maxConnections = status.settings.maxConnections || 10;
                                }
                            }
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to update server status:', error);
                        }
                    },
                    // Helper method for IPC requests in 2.x
                    sendIpcRequest(packageName, message, ...args) {
                        return new Promise((resolve, reject) => {
                            try {
                                // In 2.x, we need to use Editor.Ipc
                                // The exact signature may vary, so this is a compatibility layer
                                const fullMessage = `${packageName}:${message}`;
                                // Type assertion needed because TypeScript doesn't support rest params before callback
                                Editor.Ipc.sendToMain(fullMessage, ...args, (error, result) => {
                                    if (error) {
                                        reject(error);
                                    }
                                    else {
                                        resolve(result);
                                    }
                                });
                            }
                            catch (error) {
                                reject(error);
                            }
                        });
                    }
                },
                watch: {
                    'settings.port'() {
                        const self = this;
                        self.settingsChanged = true;
                    },
                    'settings.autoStart'() {
                        const self = this;
                        self.settingsChanged = true;
                    },
                    'settings.debugLog'() {
                        const self = this;
                        self.settingsChanged = true;
                    },
                    'settings.maxConnections'() {
                        const self = this;
                        self.settingsChanged = true;
                    }
                },
                mounted() {
                    const self = this;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG1EQUFtRDs7Ozs7QUFFbkQsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQUM1Qiw4Q0FBc0I7QUE0QnRCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDakMsU0FBUyxFQUFFO1FBQ1AsSUFBSTtZQUNBLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBQ0QsSUFBSTtZQUNBLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUM1QyxDQUFDO0tBQ0o7SUFDRCxRQUFRLEVBQUUsSUFBQSx1QkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSw2Q0FBNkMsQ0FBQyxFQUFFLE9BQU8sQ0FBQztJQUMvRixLQUFLLEVBQUUsSUFBQSx1QkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSx5Q0FBeUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQztJQUN4RixDQUFDLEVBQUU7UUFDQyxHQUFHLEVBQUUsTUFBTTtRQUNYLFVBQVUsRUFBRSxhQUFhO0tBQzVCO0lBQ0QsS0FBSztRQUNELE1BQU0sVUFBVSxHQUFJLElBQVksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ3ZDLElBQUksVUFBVSxFQUFFO1lBQ1osc0NBQXNDO1lBQ3RDLDRFQUE0RTtZQUM1RSxNQUFNLEVBQUUsR0FBRyxJQUFJLGFBQUcsQ0FBQztnQkFDZixFQUFFLEVBQUUsVUFBVTtnQkFDZCxJQUFJLEVBQUU7b0JBQ0YsU0FBUyxFQUFFLFFBQVE7b0JBQ25CLGFBQWEsRUFBRSxLQUFLO29CQUNwQixZQUFZLEVBQUUsS0FBSztvQkFDbkIsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDbkIsT0FBTyxFQUFFLEVB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QyxtQ0FBbUMsQ0FBQyxDQUFDO1NBQ3BEO0lBQ0wsQ0FBQztJQUNELFdBQVc7UUFDUCxxQkFBcUI7SUFDekIsQ0FBQztJQUNELEtBQUs7UUFDRCxnQkFBZ0I7SUFDcEIsQ0FBQztDQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi90eXBlcy9lZGl0b3ItMnguZC50c1wiIC8+XG5cbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcbmltcG9ydCBWdWUgZnJvbSAndnVlJztcblxuLy8g5a6a5LmJ5bel5YW36YWN572u5o6l5Y+jXG5pbnRlcmZhY2UgVG9vbENvbmZpZyB7XG4gICAgY2F0ZWdvcnk6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xufVxuXG4vLyDlrprkuYnphY3nva7mjqXlj6NcbmludGVyZmFjZSBDb25maWd1cmF0aW9uIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIHRvb2xzOiBUb29sQ29uZmlnW107XG4gICAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gICAgdXBkYXRlZEF0OiBzdHJpbmc7XG59XG5cbi8vIOWumuS5ieacjeWKoeWZqOiuvue9ruaOpeWPo1xuaW50ZXJmYWNlIFNlcnZlclNldHRpbmdzIHtcbiAgICBwb3J0OiBudW1iZXI7XG4gICAgYXV0b1N0YXJ0OiBib29sZWFuO1xuICAgIGRlYnVnTG9nOiBib29sZWFuO1xuICAgIG1heENvbm5lY3Rpb25zOiBudW1iZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yLlBhbmVsLmV4dGVuZCh7XG4gICAgbGlzdGVuZXJzOiB7XG4gICAgICAgIHNob3coKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gUGFuZWwgc2hvd24nKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGlkZSgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBQYW5lbCBoaWRkZW4nKTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvZGVmYXVsdC9pbmRleC5odG1sJyksICd1dGYtOCcpLFxuICAgIHN0eWxlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvc3R5bGUvZGVmYXVsdC9pbmRleC5jc3MnKSwgJ3V0Zi04JyksXG4gICAgJDoge1xuICAgICAgICBhcHA6ICcjYXBwJyxcbiAgICAgICAgcGFuZWxUaXRsZTogJyNwYW5lbFRpdGxlJyxcbiAgICB9LFxuICAgIHJlYWR5KCkge1xuICAgICAgICBjb25zdCBhcHBFbGVtZW50ID0gKHRoaXMgYXMgYW55KS4kLmFwcDtcbiAgICAgICAgaWYgKGFwcEVsZW1lbnQpIHtcbiAgICAgICAgICAgIC8vIFZ1ZSAyIGFwcGxpY2F0aW9uIHVzaW5nIE9wdGlvbnMgQVBJXG4gICAgICAgICAgICAvLyBUeXBlU2NyaXB0IHN0cmljdCBtb2RlIGNvbXBhdGliaWxpdHk6IHVzZSB0eXBlIGFzc2VydGlvbiBmb3IgVnVlIGluc3RhbmNlXG4gICAgICAgICAgICBjb25zdCB2bSA9IG5ldyBWdWUoe1xuICAgICAgICAgICAgICAgIGVsOiBhcHBFbGVtZW50LFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlVGFiOiAnc2VydmVyJyxcbiAgICAgICAgICAgICAgICAgICAgc2VydmVyUnVubmluZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHNlcnZlclN0YXR1czogJ+W3suWBnOatoicsXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3RlZENsaWVudHM6IDAsXG4gICAgICAgICAgICAgICAgICAgIGh0dHBVcmw6ICcnLFxuICAgICAgICAgICAgICAgICAgICBpc1Byb2Nlc3Npbmc6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhDb25uZWN0aW9uczogMTBcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHM6IFtdIGFzIFRvb2xDb25maWdbXSxcbiAgICAgICAgICAgICAgICAgICAgdG9vbENhdGVnb3JpZXM6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICBzZXR0aW5nc0NoYW5nZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZENhdGVnb3J5OiAnJyxcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoUXVlcnk6ICcnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb21wdXRlZDoge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXNDbGFzcygpOiBhbnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc3RhdHVzLXJ1bm5pbmcnOiBzZWxmLnNlcnZlclJ1bm5pbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3N0YXR1cy1zdG9wcGVkJzogIXNlbGYuc2VydmVyUnVubmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdG90YWxUb29scygpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuYXZhaWxhYmxlVG9vbHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVkVG9vbHMoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmF2YWlsYWJsZVRvb2xzLmZpbHRlcigodDogVG9vbENvbmZpZykgPT4gdC5lbmFibGVkKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkVG9vbHMoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnRvdGFsVG9vbHMgLSBzZWxmLmVuYWJsZWRUb29scztcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyZWRUb29scygpOiBUb29sQ29uZmlnW10ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRvb2xzID0gc2VsZi5hdmFpbGFibGVUb29scztcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuc2VsZWN0ZWRDYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xzID0gdG9vbHMuZmlsdGVyKCh0OiBUb29sQ29uZmlnKSA9PiB0LmNhdGVnb3J5ID09PSBzZWxmLnNlbGVjdGVkQ2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5zZWFyY2hRdWVyeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gc2VsZi5zZWFyY2hRdWVyeS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xzID0gdG9vbHMuZmlsdGVyKCh0OiBUb29sQ29uZmlnKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0Lm5hbWUudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhxdWVyeSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdC5kZXNjcmlwdGlvbi50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0b29scztcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBlZFRvb2xzKCk6IGFueSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncm91cHM6IGFueSA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5maWx0ZXJlZFRvb2xzLmZvckVhY2goKHRvb2w6IFRvb2xDb25maWcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWdyb3Vwc1t0b29sLmNhdGVnb3J5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cHNbdG9vbC5jYXRlZ29yeV0gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBzW3Rvb2wuY2F0ZWdvcnldLnB1c2godG9vbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBncm91cHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1ldGhvZHM6IHtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoVGFiKHRhYk5hbWU6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5hY3RpdmVUYWIgPSB0YWJOYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhYk5hbWUgPT09ICd0b29scycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmxvYWRUb29sTWFuYWdlclN0YXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgYXN5bmMgdG9nZ2xlU2VydmVyKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5zZXJ2ZXJSdW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnc3RvcC1zZXJ2ZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U2V0dGluZ3MgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiBzZWxmLnNldHRpbmdzLnBvcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvU3RhcnQ6IHNlbGYuc2V0dGluZ3MuYXV0b1N0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGVidWdMb2c6IHNlbGYuc2V0dGluZ3MuZGVidWdMb2csXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhDb25uZWN0aW9uczogc2VsZi5zZXR0aW5ncy5tYXhDb25uZWN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS1zZXR0aW5ncycsIGN1cnJlbnRTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnc3RhcnQtc2VydmVyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVnVlIEFwcF0gU2VydmVyIHRvZ2dsZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byB0b2dnbGUgc2VydmVyOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9ydDogc2VsZi5zZXR0aW5ncy5wb3J0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXRvU3RhcnQ6IHNlbGYuc2V0dGluZ3MuYXV0b1N0YXJ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWJ1Z0xvZzogc2VsZi5zZXR0aW5ncy5kZWJ1Z0xvZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4Q29ubmVjdGlvbnM6IHNlbGYuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtc2V0dGluZ3MnLCBzZXR0aW5nc0RhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVnVlIEFwcF0gU2V0dGluZ3Mgc2F2ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNldHRpbmdzQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIHNhdmUgc2V0dGluZ3M6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jIGNvcHlVcmwoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluIDIueCwgdXNlIGEgc2ltcGxlciBjbGlwYm9hcmQgbWV0aG9kIG9yIEVsZWN0cm9uJ3MgY2xpcGJvYXJkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci5jbGlwYm9hcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoc2VsZi5odHRwVXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGYWxsYmFjayBmb3Igb2xkZXIgZW52aXJvbm1lbnRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRleHRhcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dGFyZWEudmFsdWUgPSBzZWxmLmh0dHBVcmw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGV4dGFyZWEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0YXJlYS5zZWxlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0ZXh0YXJlYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVnVlIEFwcF0gVVJMIGNvcGllZCB0byBjbGlwYm9hcmQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBjb3B5IFVSTDonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgYXN5bmMgbG9hZFRvb2xNYW5hZ2VyU3RhdGUoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnZ2V0LXRvb2wtbWFuYWdlci1zdGF0ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnRvb2xzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYXZhaWxhYmxlVG9vbHMgPSByZXN1bHQudG9vbHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYudG9vbENhdGVnb3JpZXMgPSBBcnJheS5mcm9tKG5ldyBTZXQocmVzdWx0LnRvb2xzLm1hcCgodDogVG9vbENvbmZpZykgPT4gdC5jYXRlZ29yeSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWdWUgQXBwXSBGYWlsZWQgdG8gbG9hZCB0b29sIG1hbmFnZXIgc3RhdGU6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jIHVwZGF0ZVRvb2xTdGF0dXMoY2F0ZWdvcnk6IHN0cmluZywgdG9vbE5hbWU6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLXN0YXR1cycsIGNhdGVnb3J5LCB0b29sTmFtZSwgZW5hYmxlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgc2VsZi5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIHVwZGF0ZSB0b29sIHN0YXR1czonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgYXN5bmMgdG9nZ2xlQ2F0ZWdvcnkoY2F0ZWdvcnk6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gc2VsZi5hdmFpbGFibGVUb29sc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKCh0OiBUb29sQ29uZmlnKSA9PiB0LmNhdGVnb3J5ID09PSBjYXRlZ29yeSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgodDogVG9vbENvbmZpZykgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0LmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZW5hYmxlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLXN0YXR1cy1iYXRjaCcsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHNlbGYubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byB0b2dnbGUgY2F0ZWdvcnk6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jIHVwZGF0ZVNlcnZlclN0YXR1cygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdnZXQtc2VydmVyLXN0YXR1cycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXJ2ZXJSdW5uaW5nID0gc3RhdHVzLnJ1bm5pbmcgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2VydmVyU3RhdHVzID0gc3RhdHVzLnJ1bm5pbmcgPyAn6L+Q6KGM5LitJyA6ICflt7LlgZzmraInO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNvbm5lY3RlZENsaWVudHMgPSBzdGF0dXMuY2xpZW50cyB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmh0dHBVcmwgPSBgaHR0cDovLzEyNy4wLjAuMToke3N0YXR1cy5zZXR0aW5ncz8ucG9ydCB8fCAzMDAwfS9tY3BgO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMuc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0dGluZ3MucG9ydCA9IHN0YXR1cy5zZXR0aW5ncy5wb3J0IHx8IDMwMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNldHRpbmdzLmF1dG9TdGFydCA9IHN0YXR1cy5zZXR0aW5ncy5hdXRvU3RhcnQgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNldHRpbmdzLmRlYnVnTG9nID0gc3RhdHVzLnNldHRpbmdzLmRlYnVnTG9nIHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXR0aW5ncy5tYXhDb25uZWN0aW9ucyA9IHN0YXR1cy5zZXR0aW5ncy5tYXhDb25uZWN0aW9ucyB8fCAxMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byB1cGRhdGUgc2VydmVyIHN0YXR1czonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSGVscGVyIG1ldGhvZCBmb3IgSVBDIHJlcXVlc3RzIGluIDIueFxuICAgICAgICAgICAgICAgICAgICBzZW5kSXBjUmVxdWVzdChwYWNrYWdlTmFtZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW4gMi54LCB3ZSBuZWVkIHRvIHVzZSBFZGl0b3IuSXBjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBleGFjdCBzaWduYXR1cmUgbWF5IHZhcnksIHNvIHRoaXMgaXMgYSBjb21wYXRpYmlsaXR5IGxheWVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxNZXNzYWdlID0gYCR7cGFja2FnZU5hbWV9OiR7bWVzc2FnZX1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUeXBlIGFzc2VydGlvbiBuZWVkZWQgYmVjYXVzZSBUeXBlU2NyaXB0IGRvZXNuJ3Qgc3VwcG9ydCByZXN0IHBhcmFtcyBiZWZvcmUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWRpdG9yLklwYy5zZW5kVG9NYWluKGZ1bGxNZXNzYWdlLCAuLi5hcmdzLCAoZXJyb3I6IEVycm9yIHwgbnVsbCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgd2F0Y2g6IHtcbiAgICAgICAgICAgICAgICAgICAgJ3NldHRpbmdzLnBvcnQnKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnc2V0dGluZ3MuYXV0b1N0YXJ0JygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0dGluZ3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgJ3NldHRpbmdzLmRlYnVnTG9nJygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0dGluZ3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgJ3NldHRpbmdzLm1heENvbm5lY3Rpb25zJygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0dGluZ3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbW91bnRlZCgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIENvbXBvbmVudCBtb3VudGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudXBkYXRlU2VydmVyU3RhdHVzKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUG9sbCBmb3Igc3RhdHVzIHVwZGF0ZXMgZXZlcnkgMiBzZWNvbmRzXG4gICAgICAgICAgICAgICAgICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYudXBkYXRlU2VydmVyU3RhdHVzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gVnVlIDIgYXBwIGluaXRpYWxpemVkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGJlZm9yZUNsb3NlKCkge1xuICAgICAgICAvLyBDbGVhbiB1cCBpZiBuZWVkZWRcbiAgICB9LFxuICAgIGNsb3NlKCkge1xuICAgICAgICAvLyBQYW5lbCBjbG9zaW5nXG4gICAgfSxcbn0pO1xuIl19