"use strict";
/// <reference path="../../types/editor-2x.d.ts" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const Vue = __importStar(require("vue"));
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
                    availableTools: [],
                    toolCategories: [],
                    settingsChanged: false,
                    selectedCategory: '',
                    searchQuery: ''
                },
                computed: {
                    statusClass() {
                        return {
                            'status-running': this.serverRunning,
                            'status-stopped': !this.serverRunning
                        };
                    },
                    totalTools() {
                        return this.availableTools.length;
                    },
                    enabledTools() {
                        return this.availableTools.filter((t) => t.enabled).length;
                    },
                    disabledTools() {
                        return this.totalTools - this.enabledTools;
                    },
                    filteredTools() {
                        let tools = this.availableTools;
                        if (this.selectedCategory) {
                            tools = tools.filter((t) => t.category === this.selectedCategory);
                        }
                        if (this.searchQuery) {
                            const query = this.searchQuery.toLowerCase();
                            tools = tools.filter((t) => t.name.toLowerCase().includes(query) ||
                                t.description.toLowerCase().includes(query));
                        }
                        return tools;
                    },
                    groupedTools() {
                        const groups = {};
                        this.filteredTools.forEach((tool) => {
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
                        this.activeTab = tabName;
                        if (tabName === 'tools') {
                            this.loadToolManagerState();
                        }
                    },
                    async toggleServer() {
                        try {
                            if (this.serverRunning) {
                                await this.sendIpcRequest('cocos-mcp-server', 'stop-server');
                            }
                            else {
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
                        }
                        catch (error) {
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
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to save settings:', error);
                        }
                    },
                    async copyUrl() {
                        try {
                            // In 2.x, use a simpler clipboard method or Electron's clipboard
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                await navigator.clipboard.writeText(this.httpUrl);
                            }
                            else {
                                // Fallback for older environments
                                const textarea = document.createElement('textarea');
                                textarea.value = this.httpUrl;
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
                        try {
                            const result = await this.sendIpcRequest('cocos-mcp-server', 'getToolManagerState');
                            if (result && result.tools) {
                                this.availableTools = result.tools;
                                this.toolCategories = Array.from(new Set(result.tools.map((t) => t.category)));
                            }
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to load tool manager state:', error);
                        }
                    },
                    async updateToolStatus(category, toolName, enabled) {
                        try {
                            await this.sendIpcRequest('cocos-mcp-server', 'updateToolStatus', category, toolName, enabled);
                            await this.loadToolManagerState();
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to update tool status:', error);
                        }
                    },
                    async toggleCategory(category, enabled) {
                        try {
                            const updates = this.availableTools
                                .filter((t) => t.category === category)
                                .map((t) => ({
                                category: t.category,
                                name: t.name,
                                enabled: enabled
                            }));
                            await this.sendIpcRequest('cocos-mcp-server', 'updateToolStatusBatch', updates);
                            await this.loadToolManagerState();
                        }
                        catch (error) {
                            console.error('[Vue App] Failed to toggle category:', error);
                        }
                    },
                    async updateServerStatus() {
                        var _a;
                        try {
                            const status = await this.sendIpcRequest('cocos-mcp-server', 'get-server-status');
                            if (status) {
                                this.serverRunning = status.running || false;
                                this.serverStatus = status.running ? '运行中' : '已停止';
                                this.connectedClients = status.clients || 0;
                                this.httpUrl = `http://127.0.0.1:${((_a = status.settings) === null || _a === void 0 ? void 0 : _a.port) || 3000}/mcp`;
                                if (status.settings) {
                                    this.settings.port = status.settings.port || 3000;
                                    this.settings.autoStart = status.settings.autoStart || false;
                                    this.settings.debugLog = status.settings.debugLog || false;
                                    this.settings.maxConnections = status.settings.maxConnections || 10;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG1EQUFtRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVuRCx1Q0FBd0M7QUFDeEMsK0JBQTRCO0FBQzVCLHlDQUEyQjtBQTRCM0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEVBQUU7UUFDUCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFDRCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDZDQUE2QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQy9GLEtBQUssRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3hGLENBQUMsRUFBRTtRQUNDLEdBQUcsRUFBRSxNQUFNO1FBQ1gsVUFBVSxFQUFFLGFBQWE7S0FDNUI7SUFDRCxLQUFLO1FBQ0QsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRTtZQUNaLHNDQUFzQztZQUN0QyxNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQztnQkFDZixFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO2dCQUNkLElBQUksRUFBRTtvQkFDRixTQUFTLEVBQUUsUUFBUTtvQkFDbkIsYUFBYSxFQUFFLEtBQUs7b0JBQ3BCLFlBQVksRUFBRSxLQUFLO29CQUNuQixnQkFBZ0IsRUFBRSxDQUFDO29CQUNuQixPQUFPLEVBQUUsRUFBRTtv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QUcsSUFBSSxDQUFDO29CQUNoQyxDQUFDO2lCQUNKO2dCQUNELE9BQU87b0JBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO29CQUMzQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztvQkFFMUIsMENBQTBDO29CQUMxQyxXQUFXLENBQUMsR0FBRyxFQUFFO3dCQUNiLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO29CQUM5QixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2IsQ0FBQzthQUNKLENBQUMsQ0FBQztZQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztTQUNwRDtJQUNMLENBQUM7SUFDRCxXQUFXO1FBQ1AscUJBQXFCO0lBQ3pCLENBQUM7SUFDRCxLQUFLO1FBQ0QsZ0JBQWdCO0lBQ3BCLENBQUM7Q0FDSixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vdHlwZXMvZWRpdG9yLTJ4LmQudHNcIiAvPlxuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBWdWUgZnJvbSAndnVlJztcblxuLy8g5a6a5LmJ5bel5YW36YWN572u5o6l5Y+jXG5pbnRlcmZhY2UgVG9vbENvbmZpZyB7XG4gICAgY2F0ZWdvcnk6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xufVxuXG4vLyDlrprkuYnphY3nva7mjqXlj6NcbmludGVyZmFjZSBDb25maWd1cmF0aW9uIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICAgIHRvb2xzOiBUb29sQ29uZmlnW107XG4gICAgY3JlYXRlZEF0OiBzdHJpbmc7XG4gICAgdXBkYXRlZEF0OiBzdHJpbmc7XG59XG5cbi8vIOWumuS5ieacjeWKoeWZqOiuvue9ruaOpeWPo1xuaW50ZXJmYWNlIFNlcnZlclNldHRpbmdzIHtcbiAgICBwb3J0OiBudW1iZXI7XG4gICAgYXV0b1N0YXJ0OiBib29sZWFuO1xuICAgIGRlYnVnTG9nOiBib29sZWFuO1xuICAgIG1heENvbm5lY3Rpb25zOiBudW1iZXI7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yLlBhbmVsLmV4dGVuZCh7XG4gICAgbGlzdGVuZXJzOiB7XG4gICAgICAgIHNob3coKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gUGFuZWwgc2hvd24nKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGlkZSgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBQYW5lbCBoaWRkZW4nKTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvZGVmYXVsdC9pbmRleC5odG1sJyksICd1dGYtOCcpLFxuICAgIHN0eWxlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvc3R5bGUvZGVmYXVsdC9pbmRleC5jc3MnKSwgJ3V0Zi04JyksXG4gICAgJDoge1xuICAgICAgICBhcHA6ICcjYXBwJyxcbiAgICAgICAgcGFuZWxUaXRsZTogJyNwYW5lbFRpdGxlJyxcbiAgICB9LFxuICAgIHJlYWR5KCkge1xuICAgICAgICBpZiAodGhpcy4kLmFwcCkge1xuICAgICAgICAgICAgLy8gVnVlIDIgYXBwbGljYXRpb24gdXNpbmcgT3B0aW9ucyBBUElcbiAgICAgICAgICAgIGNvbnN0IHZtID0gbmV3IFZ1ZSh7XG4gICAgICAgICAgICAgICAgZWw6IHRoaXMuJC5hcHAsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBhY3RpdmVUYWI6ICdzZXJ2ZXInLFxuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJSdW5uaW5nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgc2VydmVyU3RhdHVzOiAn5bey5YGc5q2iJyxcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdGVkQ2xpZW50czogMCxcbiAgICAgICAgICAgICAgICAgICAgaHR0cFVybDogJycsXG4gICAgICAgICAgICAgICAgICAgIGlzUHJvY2Vzc2luZzogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiAzMDAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgYXV0b1N0YXJ0OiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnTG9nOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiAxMFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBhdmFpbGFibGVUb29sczogW10gYXMgVG9vbENvbmZpZ1tdLFxuICAgICAgICAgICAgICAgICAgICB0b29sQ2F0ZWdvcmllczogW10gYXMgc3RyaW5nW10sXG4gICAgICAgICAgICAgICAgICAgIHNldHRpbmdzQ2hhbmdlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkQ2F0ZWdvcnk6ICcnLFxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hRdWVyeTogJydcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNvbXB1dGVkOiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c0NsYXNzKCk6IGFueSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdzdGF0dXMtcnVubmluZyc6IHRoaXMuc2VydmVyUnVubmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnc3RhdHVzLXN0b3BwZWQnOiAhdGhpcy5zZXJ2ZXJSdW5uaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0b3RhbFRvb2xzKCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hdmFpbGFibGVUb29scy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWRUb29scygpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXZhaWxhYmxlVG9vbHMuZmlsdGVyKCh0OiBUb29sQ29uZmlnKSA9PiB0LmVuYWJsZWQpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWRUb29scygpOiBudW1iZXIge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG90YWxUb29scyAtIHRoaXMuZW5hYmxlZFRvb2xzO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJlZFRvb2xzKCk6IFRvb2xDb25maWdbXSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG9vbHMgPSB0aGlzLmF2YWlsYWJsZVRvb2xzO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RlZENhdGVnb3J5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9vbHMgPSB0b29scy5maWx0ZXIoKHQ6IFRvb2xDb25maWcpID0+IHQuY2F0ZWdvcnkgPT09IHRoaXMuc2VsZWN0ZWRDYXRlZ29yeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaFF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnNlYXJjaFF1ZXJ5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9vbHMgPSB0b29scy5maWx0ZXIoKHQ6IFRvb2xDb25maWcpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHF1ZXJ5KSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmRlc2NyaXB0aW9uLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMocXVlcnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRvb2xzO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBncm91cGVkVG9vbHMoKTogYW55IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyb3VwczogYW55ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbHRlcmVkVG9vbHMuZm9yRWFjaCgodG9vbDogVG9vbENvbmZpZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZ3JvdXBzW3Rvb2wuY2F0ZWdvcnldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1t0b29sLmNhdGVnb3J5XSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cHNbdG9vbC5jYXRlZ29yeV0ucHVzaCh0b29sKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbWV0aG9kczoge1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2hUYWIodGFiTmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZVRhYiA9IHRhYk5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFiTmFtZSA9PT0gJ3Rvb2xzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICBhc3luYyB0b2dnbGVTZXJ2ZXIoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlcnZlclJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdzdG9wLXNlcnZlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTZXR0aW5ncyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcnQ6IHRoaXMuc2V0dGluZ3MucG9ydCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogdGhpcy5zZXR0aW5ncy5hdXRvU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEZWJ1Z0xvZzogdGhpcy5zZXR0aW5ncy5kZWJ1Z0xvZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiB0aGlzLnNldHRpbmdzLm1heENvbm5lY3Rpb25zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXNldHRpbmdzJywgY3VycmVudFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdzdGFydC1zZXJ2ZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWdWUgQXBwXSBTZXJ2ZXIgdG9nZ2xlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIHRvZ2dsZSBzZXJ2ZXI6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3NEYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiB0aGlzLnNldHRpbmdzLnBvcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogdGhpcy5zZXR0aW5ncy5hdXRvU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlYnVnTG9nOiB0aGlzLnNldHRpbmdzLmRlYnVnTG9nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhDb25uZWN0aW9uczogdGhpcy5zZXR0aW5ncy5tYXhDb25uZWN0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS1zZXR0aW5ncycsIHNldHRpbmdzRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWdWUgQXBwXSBTZXR0aW5ncyBzYXZlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3NDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tWdWUgQXBwXSBGYWlsZWQgdG8gc2F2ZSBzZXR0aW5nczonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgYXN5bmMgY29weVVybCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW4gMi54LCB1c2UgYSBzaW1wbGVyIGNsaXBib2FyZCBtZXRob2Qgb3IgRWxlY3Ryb24ncyBjbGlwYm9hcmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLmNsaXBib2FyZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCh0aGlzLmh0dHBVcmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrIGZvciBvbGRlciBlbnZpcm9ubWVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dGFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9IHRoaXMuaHR0cFVybDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZXh0YXJlYSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRhcmVhLnNlbGVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRleHRhcmVhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1tWdWUgQXBwXSBVUkwgY29waWVkIHRvIGNsaXBib2FyZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIGNvcHkgVVJMOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgICAgICBhc3luYyBsb2FkVG9vbE1hbmFnZXJTdGF0ZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdnZXRUb29sTWFuYWdlclN0YXRlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQudG9vbHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hdmFpbGFibGVUb29scyA9IHJlc3VsdC50b29scztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b29sQ2F0ZWdvcmllcyA9IEFycmF5LmZyb20obmV3IFNldChyZXN1bHQudG9vbHMubWFwKCh0OiBUb29sQ29uZmlnKSA9PiB0LmNhdGVnb3J5KSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byBsb2FkIHRvb2wgbWFuYWdlciBzdGF0ZTonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgYXN5bmMgdXBkYXRlVG9vbFN0YXR1cyhjYXRlZ29yeTogc3RyaW5nLCB0b29sTmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlVG9vbFN0YXR1cycsIGNhdGVnb3J5LCB0b29sTmFtZSwgZW5hYmxlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbVnVlIEFwcF0gRmFpbGVkIHRvIHVwZGF0ZSB0b29sIHN0YXR1czonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgYXN5bmMgdG9nZ2xlQ2F0ZWdvcnkoY2F0ZWdvcnk6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gdGhpcy5hdmFpbGFibGVUb29sc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKCh0OiBUb29sQ29uZmlnKSA9PiB0LmNhdGVnb3J5ID09PSBjYXRlZ29yeSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgodDogVG9vbENvbmZpZykgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0LmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZW5hYmxlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZVRvb2xTdGF0dXNCYXRjaCcsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byB0b2dnbGUgY2F0ZWdvcnk6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jIHVwZGF0ZVNlcnZlclN0YXR1cygpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzID0gYXdhaXQgdGhpcy5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdnZXQtc2VydmVyLXN0YXR1cycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXJ2ZXJSdW5uaW5nID0gc3RhdHVzLnJ1bm5pbmcgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VydmVyU3RhdHVzID0gc3RhdHVzLnJ1bm5pbmcgPyAn6L+Q6KGM5LitJyA6ICflt7LlgZzmraInO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3RlZENsaWVudHMgPSBzdGF0dXMuY2xpZW50cyB8fCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmh0dHBVcmwgPSBgaHR0cDovLzEyNy4wLjAuMToke3N0YXR1cy5zZXR0aW5ncz8ucG9ydCB8fCAzMDAwfS9tY3BgO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGF0dXMuc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MucG9ydCA9IHN0YXR1cy5zZXR0aW5ncy5wb3J0IHx8IDMwMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmF1dG9TdGFydCA9IHN0YXR1cy5zZXR0aW5ncy5hdXRvU3RhcnQgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLmRlYnVnTG9nID0gc3RhdHVzLnNldHRpbmdzLmRlYnVnTG9nIHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5tYXhDb25uZWN0aW9ucyA9IHN0YXR1cy5zZXR0aW5ncy5tYXhDb25uZWN0aW9ucyB8fCAxMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Z1ZSBBcHBdIEZhaWxlZCB0byB1cGRhdGUgc2VydmVyIHN0YXR1czonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gSGVscGVyIG1ldGhvZCBmb3IgSVBDIHJlcXVlc3RzIGluIDIueFxuICAgICAgICAgICAgICAgICAgICBzZW5kSXBjUmVxdWVzdChwYWNrYWdlTmFtZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSW4gMi54LCB3ZSBuZWVkIHRvIHVzZSBFZGl0b3IuSXBjXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBleGFjdCBzaWduYXR1cmUgbWF5IHZhcnksIHNvIHRoaXMgaXMgYSBjb21wYXRpYmlsaXR5IGxheWVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxNZXNzYWdlID0gYCR7cGFja2FnZU5hbWV9OiR7bWVzc2FnZX1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFZGl0b3IuSXBjLnNlbmRUb01haW4oZnVsbE1lc3NhZ2UsIC4uLmFyZ3MsIChlcnJvcjogRXJyb3IgfCBudWxsLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB3YXRjaDoge1xuICAgICAgICAgICAgICAgICAgICAnc2V0dGluZ3MucG9ydCcoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICdzZXR0aW5ncy5hdXRvU3RhcnQnKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnc2V0dGluZ3MuZGVidWdMb2cnKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAnc2V0dGluZ3MubWF4Q29ubmVjdGlvbnMnKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtb3VudGVkKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW1Z1ZSBBcHBdIENvbXBvbmVudCBtb3VudGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2VydmVyU3RhdHVzKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUG9sbCBmb3Igc3RhdHVzIHVwZGF0ZXMgZXZlcnkgMiBzZWNvbmRzXG4gICAgICAgICAgICAgICAgICAgIHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU2VydmVyU3RhdHVzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gVnVlIDIgYXBwIGluaXRpYWxpemVkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGJlZm9yZUNsb3NlKCkge1xuICAgICAgICAvLyBDbGVhbiB1cCBpZiBuZWVkZWRcbiAgICB9LFxuICAgIGNsb3NlKCkge1xuICAgICAgICAvLyBQYW5lbCBjbG9zaW5nXG4gICAgfSxcbn0pO1xuIl19