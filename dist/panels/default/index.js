"use strict";
/// <reference path="../../types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
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
    state: {
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
        settingsChanged: false
    },
    statusUpdateInterval: null,
    ready() {
        const appElement = this.$.app;
        if (appElement) {
            this.initApp(appElement);
            console.log('[MCP Panel] App initialized');
        }
    },
    initApp(container) {
        // 初始渲染
        this.render(container);
        this.bindEventListeners(container);
        // 初始状态加载
        this.updateServerStatus();
        // 定期更新服务器状态
        this.statusUpdateInterval = setInterval(() => {
            this.updateServerStatus();
        }, 2000);
    },
    render(container) {
        const state = this.state;
        container.innerHTML = this.getAppHTML(state);
    },
    getAppHTML(state) {
        return `
            <div class="mcp-app">
                ${this.getTabNavigationHTML(state)}
                ${state.activeTab === 'server' ? this.getServerTabHTML(state) : this.getToolsTabHTML(state)}
            </div>
        `;
    },
    getTabNavigationHTML(state) {
        return `
            <div class="tab-navigation">
                <button class="tab-button ${state.activeTab === 'server' ? 'active' : ''}" data-tab="server">
                    <span>服务器</span>
                </button>
                <button class="tab-button ${state.activeTab === 'tools' ? 'active' : ''}" data-tab="tools">
                    <span>工具管理</span>
                </button>
            </div>
        `;
    },
    getServerTabHTML(state) {
        return `
            <div class="tab-content">
                <section class="server-status">
                    <h3>服务器状态</h3>
                    <div class="status-info">
                        <ui-prop>
                            <ui-label slot="label">状态</ui-label>
                            <ui-label slot="content" class="status-value ${state.serverRunning ? 'status-running' : 'status-stopped'}">${state.serverStatus}</ui-label>
                        </ui-prop>
                        ${state.serverRunning ? `
                            <ui-prop>
                                <ui-label slot="label">连接数</ui-label>
                                <ui-label slot="content">${state.connectedClients}</ui-label>
                            </ui-prop>
                        ` : ''}
                    </div>
                </section>

                <section class="server-controls">
                    <ui-button id="toggleServerBtn" class="primary" ${state.isProcessing ? 'disabled' : ''}>
                        ${state.serverRunning ? '停止服务器' : '启动服务器'}
                    </ui-button>
                </section>

                <section class="server-settings">
                    <h3>服务器设置</h3>
                    <ui-prop>
                        <ui-label slot="label">端口</ui-label>
                        <ui-num-input slot="content" id="portInput" value="${state.settings.port}" min="1024" max="65535" step="1" ${state.serverRunning ? 'disabled' : ''}></ui-num-input>
                    </ui-prop>
                    <ui-prop>
                        <ui-label slot="label">自动启动</ui-label>
                        <ui-checkbox slot="content" id="autoStartCheckbox" ${state.settings.autoStart ? 'checked' : ''} ${state.serverRunning ? 'disabled' : ''}></ui-checkbox>
                    </ui-prop>
                    <ui-prop>
                        <ui-label slot="label">调试日志</ui-label>
                        <ui-checkbox slot="content" id="debugLogCheckbox" ${state.settings.debugLog ? 'checked' : ''}></ui-checkbox>
                    </ui-prop>
                    <ui-prop>
                        <ui-label slot="label">最大连接数</ui-label>
                        <ui-num-input slot="content" id="maxConnectionsInput" value="${state.settings.maxConnections}" min="1" max="100" step="1"></ui-num-input>
                    </ui-prop>
                </section>

                ${state.serverRunning ? `
                    <section class="server-info">
                        <h3>连接信息</h3>
                        <div class="connection-details">
                            <ui-prop>
                                <ui-label slot="label">HTTP URL</ui-label>
                                <ui-input slot="content" value="${state.httpUrl}" readonly>
                                    <ui-button slot="suffix" id="copyUrlBtn">复制</ui-button>
                                </ui-input>
                            </ui-prop>
                        </div>
                    </section>
                ` : ''}

                <footer>
                    <ui-button id="saveSettingsBtn" ${!state.settingsChanged ? 'disabled' : ''}>保存设置</ui-button>
                </footer>
            </div>
        `;
    },
    getToolsTabHTML(state) {
        const totalTools = state.availableTools.length;
        const enabledTools = state.availableTools.filter(t => t.enabled).length;
        const disabledTools = totalTools - enabledTools;
        return `
            <div class="tab-content">
                <section class="tool-manager">
                    <div class="tool-manager-header">
                        <h3>工具管理</h3>
                    </div>
                    
                    <div class="tools-section">
                        <div class="tools-section-header">
                            <div class="tools-section-title">
                                <h4>可用工具</h4>
                                <div class="tools-stats">
                                    ${totalTools} 个工具
                                    (${enabledTools} 启用 / ${disabledTools} 禁用)
                                </div>
                            </div>
                            <div class="tools-section-controls">
                                <ui-button id="selectAllBtn" class="small">全选</ui-button>
                                <ui-button id="deselectAllBtn" class="small">取消全选</ui-button>
                                <ui-button id="saveToolsBtn" class="primary">保存更改</ui-button>
                            </div>
                        </div>
                        
                        <div class="tools-container">
                            ${state.toolCategories.map(category => this.getCategoryHTML(category, state)).join('')}
                        </div>
                    </div>
                </section>
            </div>
        `;
    },
    getCategoryHTML(category, state) {
        const tools = state.availableTools.filter(t => t.category === category);
        const categoryDisplayName = this.getCategoryDisplayName(category);
        return `
            <div class="tool-category" data-category="${category}">
                <div class="category-header">
                    <h5>${categoryDisplayName}</h5>
                    <div class="category-controls">
                        <ui-button class="small category-select-all" data-category="${category}">全选</ui-button>
                        <ui-button class="small category-deselect-all" data-category="${category}">取消全选</ui-button>
                    </div>
                </div>
                <div class="tool-items">
                    ${tools.map(tool => `
                        <div class="tool-item">
                            <ui-checkbox 
                                class="tool-checkbox"
                                data-category="${tool.category}"
                                data-tool="${tool.name}"
                                ${tool.enabled ? 'checked' : ''}
                            ></ui-checkbox>
                            <div class="tool-info">
                                <div class="tool-name">${tool.name}</div>
                                <div class="tool-description">${tool.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    getCategoryDisplayName(category) {
        const categoryMap = {
            'scene': '场景工具',
            'node': '节点工具',
            'component': '组件工具',
            'prefab': '预制体工具',
            'asset': '资源工具',
            'project': '项目工具',
            'debug': '调试工具',
            'server': '服务器工具',
            'validation': '验证工具',
            'broadcast': '广播工具',
            'preferences': '偏好设置工具',
            'reference-image': '参考图像工具'
        };
        return categoryMap[category] || category;
    },
    bindEventListeners(container) {
        const self = this;
        const state = self.state;
        // 选项卡切换
        container.addEventListener('click', (e) => {
            const target = e.target;
            const tabButton = target.closest('.tab-button');
            if (tabButton) {
                const tab = tabButton.getAttribute('data-tab');
                if (tab && (tab === 'server' || tab === 'tools')) {
                    self.switchTab(tab);
                }
            }
        });
        // 服务器控制
        const toggleServerBtn = container.querySelector('#toggleServerBtn');
        if (toggleServerBtn) {
            toggleServerBtn.addEventListener('click', () => {
                self.toggleServer();
            });
        }
        // 设置保存
        const saveSettingsBtn = container.querySelector('#saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                self.saveSettings();
            });
        }
        // URL 복사
        const copyUrlBtn = container.querySelector('#copyUrlBtn');
        if (copyUrlBtn) {
            copyUrlBtn.addEventListener('click', () => {
                self.copyUrl();
            });
        }
        // 设置输入 변경 감지
        const portInput = container.querySelector('#portInput');
        if (portInput) {
            portInput.addEventListener('change', () => {
                state.settings.port = parseInt(portInput.value) || 3000;
                state.settingsChanged = true;
                self.render(container);
                self.bindEventListeners(container);
            });
        }
        const autoStartCheckbox = container.querySelector('#autoStartCheckbox');
        if (autoStartCheckbox) {
            autoStartCheckbox.addEventListener('change', () => {
                state.settings.autoStart = autoStartCheckbox.checked;
                state.settingsChanged = true;
                self.render(container);
                self.bindEventListeners(container);
            });
        }
        const debugLogCheckbox = container.querySelector('#debugLogCheckbox');
        if (debugLogCheckbox) {
            debugLogCheckbox.addEventListener('change', () => {
                state.settings.debugLog = debugLogCheckbox.checked;
                state.settingsChanged = true;
                self.render(container);
                self.bindEventListeners(container);
            });
        }
        const maxConnectionsInput = container.querySelector('#maxConnectionsInput');
        if (maxConnectionsInput) {
            maxConnectionsInput.addEventListener('change', () => {
                state.settings.maxConnections = parseInt(maxConnectionsInput.value) || 10;
                state.settingsChanged = true;
                self.render(container);
                self.bindEventListeners(container);
            });
        }
        // 工具管理
        const selectAllBtn = container.querySelector('#selectAllBtn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                self.selectAllTools();
            });
        }
        const deselectAllBtn = container.querySelector('#deselectAllBtn');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                self.deselectAllTools();
            });
        }
        const saveToolsBtn = container.querySelector('#saveToolsBtn');
        if (saveToolsBtn) {
            saveToolsBtn.addEventListener('click', () => {
                self.saveToolsChanges();
            });
        }
        // 分类控制
        container.addEventListener('click', (e) => {
            const target = e.target;
            const categorySelectAll = target.closest('.category-select-all');
            const categoryDeselectAll = target.closest('.category-deselect-all');
            if (categorySelectAll) {
                const category = categorySelectAll.getAttribute('data-category');
                if (category) {
                    self.toggleCategoryTools(category, true);
                }
            }
            else if (categoryDeselectAll) {
                const category = categoryDeselectAll.getAttribute('data-category');
                if (category) {
                    self.toggleCategoryTools(category, false);
                }
            }
        });
        // 工具复选框 변경
        container.addEventListener('change', (e) => {
            const target = e.target;
            const checkbox = target.closest('.tool-checkbox');
            if (checkbox) {
                const category = checkbox.getAttribute('data-category');
                const toolName = checkbox.getAttribute('data-tool');
                const checked = checkbox.checked;
                if (category && toolName) {
                    self.updateToolStatus(category, toolName, checked);
                }
            }
        });
    },
    switchTab(tabName) {
        const self = this;
        const state = self.state;
        state.activeTab = tabName;
        if (tabName === 'tools') {
            self.loadToolManagerState();
        }
        const container = self.$.app;
        self.render(container);
        self.bindEventListeners(container);
    },
    async toggleServer() {
        const self = this;
        const state = self.state;
        try {
            state.isProcessing = true;
            const container = self.$.app;
            self.render(container);
            self.bindEventListeners(container);
            if (state.serverRunning) {
                await self.sendIpcRequest('cocos-mcp-server', 'stop-server');
            }
            else {
                const currentSettings = {
                    port: state.settings.port,
                    autoStart: state.settings.autoStart,
                    enableDebugLog: state.settings.debugLog,
                    maxConnections: state.settings.maxConnections
                };
                await self.sendIpcRequest('cocos-mcp-server', 'update-settings', currentSettings);
                await self.sendIpcRequest('cocos-mcp-server', 'start-server');
            }
            console.log('[MCP Panel] Server toggled');
            await self.updateServerStatus();
        }
        catch (error) {
            console.error('[MCP Panel] Failed to toggle server:', error);
        }
        finally {
            state.isProcessing = false;
            const container = self.$.app;
            self.render(container);
            self.bindEventListeners(container);
        }
    },
    async saveSettings() {
        const self = this;
        const state = self.state;
        try {
            const settingsData = {
                port: state.settings.port,
                autoStart: state.settings.autoStart,
                debugLog: state.settings.debugLog,
                maxConnections: state.settings.maxConnections
            };
            await self.sendIpcRequest('cocos-mcp-server', 'update-settings', settingsData);
            console.log('[MCP Panel] Settings saved');
            state.settingsChanged = false;
            const container = self.$.app;
            self.render(container);
            self.bindEventListeners(container);
        }
        catch (error) {
            console.error('[MCP Panel] Failed to save settings:', error);
        }
    },
    async copyUrl() {
        const self = this;
        const state = self.state;
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(state.httpUrl);
            }
            else {
                const textarea = document.createElement('textarea');
                textarea.value = state.httpUrl;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            console.log('[MCP Panel] URL copied to clipboard');
        }
        catch (error) {
            console.error('[MCP Panel] Failed to copy URL:', error);
        }
    },
    async loadToolManagerState() {
        const self = this;
        const state = self.state;
        try {
            const result = await self.sendIpcRequest('cocos-mcp-server', 'get-tool-manager-state');
            if (result && result.tools) {
                state.availableTools = result.tools;
                state.toolCategories = Array.from(new Set(result.tools.map((t) => t.category)));
                const container = self.$.app;
                self.render(container);
                self.bindEventListeners(container);
            }
        }
        catch (error) {
            console.error('[MCP Panel] Failed to load tool manager state:', error);
        }
    },
    async updateToolStatus(category, toolName, enabled) {
        const self = this;
        const state = self.state;
        try {
            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status', category, toolName, enabled);
            await self.loadToolManagerState();
        }
        catch (error) {
            console.error('[MCP Panel] Failed to update tool status:', error);
        }
    },
    async toggleCategoryTools(category, enabled) {
        const self = this;
        const state = self.state;
        try {
            const updates = state.availableTools
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
            console.error('[MCP Panel] Failed to toggle category:', error);
        }
    },
    async selectAllTools() {
        const self = this;
        const state = self.state;
        try {
            const updates = state.availableTools.map((t) => ({
                category: t.category,
                name: t.name,
                enabled: true
            }));
            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status-batch', updates);
            await self.loadToolManagerState();
        }
        catch (error) {
            console.error('[MCP Panel] Failed to select all tools:', error);
        }
    },
    async deselectAllTools() {
        const self = this;
        const state = self.state;
        try {
            const updates = state.availableTools.map((t) => ({
                category: t.category,
                name: t.name,
                enabled: false
            }));
            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status-batch', updates);
            await self.loadToolManagerState();
        }
        catch (error) {
            console.error('[MCP Panel] Failed to deselect all tools:', error);
        }
    },
    async saveToolsChanges() {
        const self = this;
        console.log('[MCP Panel] Tools changes saved');
        // 工具 변경사항은 즉시 반영되므로 별도 저장 로직 불필요
    },
    async updateServerStatus() {
        var _a;
        const self = this;
        const state = self.state;
        try {
            const status = await self.sendIpcRequest('cocos-mcp-server', 'get-server-status');
            if (status) {
                state.serverRunning = status.running || false;
                state.serverStatus = status.running ? '运行中' : '已停止';
                state.connectedClients = status.clients || 0;
                state.httpUrl = `http://127.0.0.1:${((_a = status.settings) === null || _a === void 0 ? void 0 : _a.port) || 3000}/mcp`;
                if (status.settings) {
                    state.settings.port = status.settings.port || 3000;
                    state.settings.autoStart = status.settings.autoStart || false;
                    state.settings.debugLog = status.settings.debugLog || false;
                    state.settings.maxConnections = status.settings.maxConnections || 10;
                }
                // 状态更新时重新渲染
                const container = self.$.app;
                if (container) {
                    self.render(container);
                    self.bindEventListeners(container);
                }
            }
        }
        catch (error) {
            console.error('[MCP Panel] Failed to update server status:', error);
        }
    },
    sendIpcRequest(packageName, message, ...args) {
        return new Promise((resolve, reject) => {
            try {
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
    },
    beforeClose() {
        const self = this;
        if (self.statusUpdateInterval) {
            clearInterval(self.statusUpdateInterval);
            self.statusUpdateInterval = null;
        }
    },
    close() {
        const self = this;
        if (self.statusUpdateInterval) {
            clearInterval(self.statusUpdateInterval);
            self.statusUpdateInterval = null;
        }
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG1EQUFtRDs7QUFFbkQsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQWdDNUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEVBQUU7UUFDUCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFDRCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDZDQUE2QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQy9GLEtBQUssRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3hGLENBQUMsRUFBRTtRQUNDLEdBQUcsRUFBRSxNQUFNO1FBQ1gsVUFBVSxFQUFFLGFBQWE7S0FDNUI7SUFDRCxLQUFLLEVBQUU7UUFDSCxTQUFTLEVBQUUsUUFBOEI7UUFDekMsYUFBYSxFQUFFLEtBQUs7UUFDcEIsWUFBWSxFQUFFLEtBQUs7UUFDbkIsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixPQUFPLEVBQUUsRUFBRTtRQUNYLFlBQVksRUFBRSxLQUFLO1FBQ25CLFFBQVEsRUFBRTtZQUNOLElBQUksRUFBRSxJQUFJO1lBQ1YsU0FBUyxFQUFFLEtBQUs7WUFDaEIsUUFBUSxFQUFFLEtBQUs7WUFDZixjQUFjLEVBQUUsRUFBRTtTQUNyQjtRQUNELGNBQWMsRUFBRSxFQUFrQjtRQUNsQyxjQUFjLEVBQUUsRUFBYztRQUM5QixlQUFlLEVBQUUs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dXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi90eXBlcy9lZGl0b3ItMnguZC50c1wiIC8+XG5cbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcblxuLy8g5a6a5LmJ5bel5YW36YWN572u5o6l5Y+jXG5pbnRlcmZhY2UgVG9vbENvbmZpZyB7XG4gICAgY2F0ZWdvcnk6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xufVxuXG4vLyDlrprkuYnmnI3liqHlmajorr7nva7mjqXlj6NcbmludGVyZmFjZSBTZXJ2ZXJTZXR0aW5ncyB7XG4gICAgcG9ydDogbnVtYmVyO1xuICAgIGF1dG9TdGFydDogYm9vbGVhbjtcbiAgICBkZWJ1Z0xvZzogYm9vbGVhbjtcbiAgICBtYXhDb25uZWN0aW9uczogbnVtYmVyO1xufVxuXG4vLyDnirbmgIHnrqHnkIZcbmludGVyZmFjZSBBcHBTdGF0ZSB7XG4gICAgYWN0aXZlVGFiOiAnc2VydmVyJyB8ICd0b29scyc7XG4gICAgc2VydmVyUnVubmluZzogYm9vbGVhbjtcbiAgICBzZXJ2ZXJTdGF0dXM6IHN0cmluZztcbiAgICBjb25uZWN0ZWRDbGllbnRzOiBudW1iZXI7XG4gICAgaHR0cFVybDogc3RyaW5nO1xuICAgIGlzUHJvY2Vzc2luZzogYm9vbGVhbjtcbiAgICBzZXR0aW5nczogU2VydmVyU2V0dGluZ3M7XG4gICAgYXZhaWxhYmxlVG9vbHM6IFRvb2xDb25maWdbXTtcbiAgICB0b29sQ2F0ZWdvcmllczogc3RyaW5nW107XG4gICAgc2V0dGluZ3NDaGFuZ2VkOiBib29sZWFuO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5leHRlbmQoe1xuICAgIGxpc3RlbmVyczoge1xuICAgICAgICBzaG93KCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFBhbmVsIHNob3duJyk7XG4gICAgICAgIH0sXG4gICAgICAgIGhpZGUoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gUGFuZWwgaGlkZGVuJyk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB0ZW1wbGF0ZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3RlbXBsYXRlL2RlZmF1bHQvaW5kZXguaHRtbCcpLCAndXRmLTgnKSxcbiAgICBzdHlsZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3N0eWxlL2RlZmF1bHQvaW5kZXguY3NzJyksICd1dGYtOCcpLFxuICAgICQ6IHtcbiAgICAgICAgYXBwOiAnI2FwcCcsXG4gICAgICAgIHBhbmVsVGl0bGU6ICcjcGFuZWxUaXRsZScsXG4gICAgfSxcbiAgICBzdGF0ZToge1xuICAgICAgICBhY3RpdmVUYWI6ICdzZXJ2ZXInIGFzICdzZXJ2ZXInIHwgJ3Rvb2xzJyxcbiAgICAgICAgc2VydmVyUnVubmluZzogZmFsc2UsXG4gICAgICAgIHNlcnZlclN0YXR1czogJ+W3suWBnOatoicsXG4gICAgICAgIGNvbm5lY3RlZENsaWVudHM6IDAsXG4gICAgICAgIGh0dHBVcmw6ICcnLFxuICAgICAgICBpc1Byb2Nlc3Npbmc6IGZhbHNlLFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgICAgIGF1dG9TdGFydDogZmFsc2UsXG4gICAgICAgICAgICBkZWJ1Z0xvZzogZmFsc2UsXG4gICAgICAgICAgICBtYXhDb25uZWN0aW9uczogMTBcbiAgICAgICAgfSxcbiAgICAgICAgYXZhaWxhYmxlVG9vbHM6IFtdIGFzIFRvb2xDb25maWdbXSxcbiAgICAgICAgdG9vbENhdGVnb3JpZXM6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgICBzZXR0aW5nc0NoYW5nZWQ6IGZhbHNlXG4gICAgfSBhcyBBcHBTdGF0ZSxcbiAgICBzdGF0dXNVcGRhdGVJbnRlcnZhbDogbnVsbCBhcyBOb2RlSlMuVGltZW91dCB8IG51bGwsXG4gICAgcmVhZHkoKSB7XG4gICAgICAgIGNvbnN0IGFwcEVsZW1lbnQgPSAodGhpcyBhcyBhbnkpLiQuYXBwO1xuICAgICAgICBpZiAoYXBwRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5pbml0QXBwKGFwcEVsZW1lbnQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIEFwcCBpbml0aWFsaXplZCcpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBpbml0QXBwKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgLy8g5Yid5aeL5riy5p+TXG4gICAgICAgIHRoaXMucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgICAgIFxuICAgICAgICAvLyDliJ3lp4vnirbmgIHliqDovb1cbiAgICAgICAgdGhpcy51cGRhdGVTZXJ2ZXJTdGF0dXMoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWumuacn+abtOaWsOacjeWKoeWZqOeKtuaAgVxuICAgICAgICB0aGlzLnN0YXR1c1VwZGF0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTZXJ2ZXJTdGF0dXMoKTtcbiAgICAgICAgfSwgMjAwMCk7XG4gICAgfSxcbiAgICByZW5kZXIoY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuICAgICAgICBjb25zdCBzdGF0ZSA9ICh0aGlzIGFzIGFueSkuc3RhdGUgYXMgQXBwU3RhdGU7XG4gICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSB0aGlzLmdldEFwcEhUTUwoc3RhdGUpO1xuICAgIH0sXG4gICAgZ2V0QXBwSFRNTChzdGF0ZTogQXBwU3RhdGUpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1jcC1hcHBcIj5cbiAgICAgICAgICAgICAgICAke3RoaXMuZ2V0VGFiTmF2aWdhdGlvbkhUTUwoc3RhdGUpfVxuICAgICAgICAgICAgICAgICR7c3RhdGUuYWN0aXZlVGFiID09PSAnc2VydmVyJyA/IHRoaXMuZ2V0U2VydmVyVGFiSFRNTChzdGF0ZSkgOiB0aGlzLmdldFRvb2xzVGFiSFRNTChzdGF0ZSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICB9LFxuICAgIGdldFRhYk5hdmlnYXRpb25IVE1MKHN0YXRlOiBBcHBTdGF0ZSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFiLW5hdmlnYXRpb25cIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwidGFiLWJ1dHRvbiAke3N0YXRlLmFjdGl2ZVRhYiA9PT0gJ3NlcnZlcicgPyAnYWN0aXZlJyA6ICcnfVwiIGRhdGEtdGFiPVwic2VydmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPuacjeWKoeWZqDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwidGFiLWJ1dHRvbiAke3N0YXRlLmFjdGl2ZVRhYiA9PT0gJ3Rvb2xzJyA/ICdhY3RpdmUnIDogJyd9XCIgZGF0YS10YWI9XCJ0b29sc1wiPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj7lt6XlhbfnrqHnkIY8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICB9LFxuICAgIGdldFNlcnZlclRhYkhUTUwoc3RhdGU6IEFwcFN0YXRlKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0YWItY29udGVudFwiPlxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzPVwic2VydmVyLXN0YXR1c1wiPlxuICAgICAgICAgICAgICAgICAgICA8aDM+5pyN5Yqh5Zmo54q25oCBPC9oMz5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXR1cy1pbmZvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+54q25oCBPC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImNvbnRlbnRcIiBjbGFzcz1cInN0YXR1cy12YWx1ZSAke3N0YXRlLnNlcnZlclJ1bm5pbmcgPyAnc3RhdHVzLXJ1bm5pbmcnIDogJ3N0YXR1cy1zdG9wcGVkJ31cIj4ke3N0YXRlLnNlcnZlclN0YXR1c308L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgJHtzdGF0ZS5zZXJ2ZXJSdW5uaW5nID8gYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+6L+e5o6l5pWwPC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJjb250ZW50XCI+JHtzdGF0ZS5jb25uZWN0ZWRDbGllbnRzfTwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgYCA6ICcnfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XG5cbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzcz1cInNlcnZlci1jb250cm9sc1wiPlxuICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGlkPVwidG9nZ2xlU2VydmVyQnRuXCIgY2xhc3M9XCJwcmltYXJ5XCIgJHtzdGF0ZS5pc1Byb2Nlc3NpbmcgPyAnZGlzYWJsZWQnIDogJyd9PlxuICAgICAgICAgICAgICAgICAgICAgICAgJHtzdGF0ZS5zZXJ2ZXJSdW5uaW5nID8gJ+WBnOatouacjeWKoeWZqCcgOiAn5ZCv5Yqo5pyN5Yqh5ZmoJ31cbiAgICAgICAgICAgICAgICAgICAgPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxuXG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3M9XCJzZXJ2ZXItc2V0dGluZ3NcIj5cbiAgICAgICAgICAgICAgICAgICAgPGgzPuacjeWKoeWZqOiuvue9rjwvaDM+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJsYWJlbFwiPuerr+WPozwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbnVtLWlucHV0IHNsb3Q9XCJjb250ZW50XCIgaWQ9XCJwb3J0SW5wdXRcIiB2YWx1ZT1cIiR7c3RhdGUuc2V0dGluZ3MucG9ydH1cIiBtaW49XCIxMDI0XCIgbWF4PVwiNjU1MzVcIiBzdGVwPVwiMVwiICR7c3RhdGUuc2VydmVyUnVubmluZyA/ICdkaXNhYmxlZCcgOiAnJ30+PC91aS1udW0taW5wdXQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgPHVpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+6Ieq5Yqo5ZCv5YqoPC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1jaGVja2JveCBzbG90PVwiY29udGVudFwiIGlkPVwiYXV0b1N0YXJ0Q2hlY2tib3hcIiAke3N0YXRlLnNldHRpbmdzLmF1dG9TdGFydCA/ICdjaGVja2VkJyA6ICcnfSAke3N0YXRlLnNlcnZlclJ1bm5pbmcgPyAnZGlzYWJsZWQnIDogJyd9PjwvdWktY2hlY2tib3g+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgPHVpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+6LCD6K+V5pel5b+XPC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1jaGVja2JveCBzbG90PVwiY29udGVudFwiIGlkPVwiZGVidWdMb2dDaGVja2JveFwiICR7c3RhdGUuc2V0dGluZ3MuZGVidWdMb2cgPyAnY2hlY2tlZCcgOiAnJ30+PC91aS1jaGVja2JveD5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICA8dWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwibGFiZWxcIj7mnIDlpKfov57mjqXmlbA8L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLW51bS1pbnB1dCBzbG90PVwiY29udGVudFwiIGlkPVwibWF4Q29ubmVjdGlvbnNJbnB1dFwiIHZhbHVlPVwiJHtzdGF0ZS5zZXR0aW5ncy5tYXhDb25uZWN0aW9uc31cIiBtaW49XCIxXCIgbWF4PVwiMTAwXCIgc3RlcD1cIjFcIj48L3VpLW51bS1pbnB1dD5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cblxuICAgICAgICAgICAgICAgICR7c3RhdGUuc2VydmVyUnVubmluZyA/IGBcbiAgICAgICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3M9XCJzZXJ2ZXItaW5mb1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGgzPui/nuaOpeS/oeaBrzwvaDM+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29ubmVjdGlvbi1kZXRhaWxzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwibGFiZWxcIj5IVFRQIFVSTDwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1pbnB1dCBzbG90PVwiY29udGVudFwiIHZhbHVlPVwiJHtzdGF0ZS5odHRwVXJsfVwiIHJlYWRvbmx5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBzbG90PVwic3VmZml4XCIgaWQ9XCJjb3B5VXJsQnRuXCI+5aSN5Yi2PC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWktaW5wdXQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICAgICAgICBgIDogJyd9XG5cbiAgICAgICAgICAgICAgICA8Zm9vdGVyPlxuICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGlkPVwic2F2ZVNldHRpbmdzQnRuXCIgJHshc3RhdGUuc2V0dGluZ3NDaGFuZ2VkID8gJ2Rpc2FibGVkJyA6ICcnfT7kv53lrZjorr7nva48L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH0sXG4gICAgZ2V0VG9vbHNUYWJIVE1MKHN0YXRlOiBBcHBTdGF0ZSk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHRvdGFsVG9vbHMgPSBzdGF0ZS5hdmFpbGFibGVUb29scy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHN0YXRlLmF2YWlsYWJsZVRvb2xzLmZpbHRlcih0ID0+IHQuZW5hYmxlZCkubGVuZ3RoO1xuICAgICAgICBjb25zdCBkaXNhYmxlZFRvb2xzID0gdG90YWxUb29scyAtIGVuYWJsZWRUb29scztcblxuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRhYi1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3M9XCJ0b29sLW1hbmFnZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtbWFuYWdlci1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMz7lt6XlhbfnrqHnkIY8L2gzPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29scy1zZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbHMtc2VjdGlvbi1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbHMtc2VjdGlvbi10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+5Y+v55So5bel5YW3PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2xzLXN0YXRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke3RvdGFsVG9vbHN9IOS4quW3peWFt1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCR7ZW5hYmxlZFRvb2xzfSDlkK/nlKggLyAke2Rpc2FibGVkVG9vbHN9IOemgeeUqClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2xzLXNlY3Rpb24tY29udHJvbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBpZD1cInNlbGVjdEFsbEJ0blwiIGNsYXNzPVwic21hbGxcIj7lhajpgIk8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBpZD1cImRlc2VsZWN0QWxsQnRuXCIgY2xhc3M9XCJzbWFsbFwiPuWPlua2iOWFqOmAiTwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGlkPVwic2F2ZVRvb2xzQnRuXCIgY2xhc3M9XCJwcmltYXJ5XCI+5L+d5a2Y5pu05pS5PC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2xzLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7c3RhdGUudG9vbENhdGVnb3JpZXMubWFwKGNhdGVnb3J5ID0+IHRoaXMuZ2V0Q2F0ZWdvcnlIVE1MKGNhdGVnb3J5LCBzdGF0ZSkpLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH0sXG4gICAgZ2V0Q2F0ZWdvcnlIVE1MKGNhdGVnb3J5OiBzdHJpbmcsIHN0YXRlOiBBcHBTdGF0ZSk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHRvb2xzID0gc3RhdGUuYXZhaWxhYmxlVG9vbHMuZmlsdGVyKHQgPT4gdC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkpO1xuICAgICAgICBjb25zdCBjYXRlZ29yeURpc3BsYXlOYW1lID0gdGhpcy5nZXRDYXRlZ29yeURpc3BsYXlOYW1lKGNhdGVnb3J5KTtcblxuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtY2F0ZWdvcnlcIiBkYXRhLWNhdGVnb3J5PVwiJHtjYXRlZ29yeX1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2F0ZWdvcnktaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxoNT4ke2NhdGVnb3J5RGlzcGxheU5hbWV9PC9oNT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhdGVnb3J5LWNvbnRyb2xzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGNsYXNzPVwic21hbGwgY2F0ZWdvcnktc2VsZWN0LWFsbFwiIGRhdGEtY2F0ZWdvcnk9XCIke2NhdGVnb3J5fVwiPuWFqOmAiTwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBjbGFzcz1cInNtYWxsIGNhdGVnb3J5LWRlc2VsZWN0LWFsbFwiIGRhdGEtY2F0ZWdvcnk9XCIke2NhdGVnb3J5fVwiPuWPlua2iOWFqOmAiTwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC1pdGVtc1wiPlxuICAgICAgICAgICAgICAgICAgICAke3Rvb2xzLm1hcCh0b29sID0+IGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLWl0ZW1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktY2hlY2tib3ggXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidG9vbC1jaGVja2JveFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtY2F0ZWdvcnk9XCIke3Rvb2wuY2F0ZWdvcnl9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS10b29sPVwiJHt0b29sLm5hbWV9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHt0b29sLmVuYWJsZWQgPyAnY2hlY2tlZCcgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+PC91aS1jaGVja2JveD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC1pbmZvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLW5hbWVcIj4ke3Rvb2wubmFtZX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtZGVzY3JpcHRpb25cIj4ke3Rvb2wuZGVzY3JpcHRpb259PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgYCkuam9pbignJyl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICB9LFxuICAgIGdldENhdGVnb3J5RGlzcGxheU5hbWUoY2F0ZWdvcnk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGNhdGVnb3J5TWFwOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xuICAgICAgICAgICAgJ3NjZW5lJzogJ+WcuuaZr+W3peWFtycsXG4gICAgICAgICAgICAnbm9kZSc6ICfoioLngrnlt6XlhbcnLFxuICAgICAgICAgICAgJ2NvbXBvbmVudCc6ICfnu4Tku7blt6XlhbcnLFxuICAgICAgICAgICAgJ3ByZWZhYic6ICfpooTliLbkvZPlt6XlhbcnLFxuICAgICAgICAgICAgJ2Fzc2V0JzogJ+i1hOa6kOW3peWFtycsXG4gICAgICAgICAgICAncHJvamVjdCc6ICfpobnnm67lt6XlhbcnLFxuICAgICAgICAgICAgJ2RlYnVnJzogJ+iwg+ivleW3peWFtycsXG4gICAgICAgICAgICAnc2VydmVyJzogJ+acjeWKoeWZqOW3peWFtycsXG4gICAgICAgICAgICAndmFsaWRhdGlvbic6ICfpqozor4Hlt6XlhbcnLFxuICAgICAgICAgICAgJ2Jyb2FkY2FzdCc6ICflub/mkq3lt6XlhbcnLFxuICAgICAgICAgICAgJ3ByZWZlcmVuY2VzJzogJ+WBj+Wlveiuvue9ruW3peWFtycsXG4gICAgICAgICAgICAncmVmZXJlbmNlLWltYWdlJzogJ+WPguiAg+WbvuWDj+W3peWFtydcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGNhdGVnb3J5TWFwW2NhdGVnb3J5XSB8fCBjYXRlZ29yeTtcbiAgICB9LFxuICAgIGJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIC8vIOmAiemhueWNoeWIh+aNolxuICAgICAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCB0YWJCdXR0b24gPSB0YXJnZXQuY2xvc2VzdCgnLnRhYi1idXR0b24nKTtcbiAgICAgICAgICAgIGlmICh0YWJCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YWIgPSB0YWJCdXR0b24uZ2V0QXR0cmlidXRlKCdkYXRhLXRhYicpO1xuICAgICAgICAgICAgICAgIGlmICh0YWIgJiYgKHRhYiA9PT0gJ3NlcnZlcicgfHwgdGFiID09PSAndG9vbHMnKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnN3aXRjaFRhYih0YWIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5pyN5Yqh5Zmo5o6n5Yi2XG4gICAgICAgIGNvbnN0IHRvZ2dsZVNlcnZlckJ0biA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjdG9nZ2xlU2VydmVyQnRuJyk7XG4gICAgICAgIGlmICh0b2dnbGVTZXJ2ZXJCdG4pIHtcbiAgICAgICAgICAgIHRvZ2dsZVNlcnZlckJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLnRvZ2dsZVNlcnZlcigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDorr7nva7kv53lrZhcbiAgICAgICAgY29uc3Qgc2F2ZVNldHRpbmdzQnRuID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNzYXZlU2V0dGluZ3NCdG4nKTtcbiAgICAgICAgaWYgKHNhdmVTZXR0aW5nc0J0bikge1xuICAgICAgICAgICAgc2F2ZVNldHRpbmdzQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVSTCDrs7XsgqxcbiAgICAgICAgY29uc3QgY29weVVybEJ0biA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjY29weVVybEJ0bicpO1xuICAgICAgICBpZiAoY29weVVybEJ0bikge1xuICAgICAgICAgICAgY29weVVybEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLmNvcHlVcmwoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6K6+572u6L6T5YWlIOuzgOqyvSDqsJDsp4BcbiAgICAgICAgY29uc3QgcG9ydElucHV0ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwb3J0SW5wdXQnKSBhcyBhbnk7XG4gICAgICAgIGlmIChwb3J0SW5wdXQpIHtcbiAgICAgICAgICAgIHBvcnRJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3MucG9ydCA9IHBhcnNlSW50KHBvcnRJbnB1dC52YWx1ZSkgfHwgMzAwMDtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXV0b1N0YXJ0Q2hlY2tib3ggPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI2F1dG9TdGFydENoZWNrYm94JykgYXMgYW55O1xuICAgICAgICBpZiAoYXV0b1N0YXJ0Q2hlY2tib3gpIHtcbiAgICAgICAgICAgIGF1dG9TdGFydENoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5hdXRvU3RhcnQgPSBhdXRvU3RhcnRDaGVja2JveC5jaGVja2VkO1xuICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZWJ1Z0xvZ0NoZWNrYm94ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNkZWJ1Z0xvZ0NoZWNrYm94JykgYXMgYW55O1xuICAgICAgICBpZiAoZGVidWdMb2dDaGVja2JveCkge1xuICAgICAgICAgICAgZGVidWdMb2dDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3MuZGVidWdMb2cgPSBkZWJ1Z0xvZ0NoZWNrYm94LmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1heENvbm5lY3Rpb25zSW5wdXQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI21heENvbm5lY3Rpb25zSW5wdXQnKSBhcyBhbnk7XG4gICAgICAgIGlmIChtYXhDb25uZWN0aW9uc0lucHV0KSB7XG4gICAgICAgICAgICBtYXhDb25uZWN0aW9uc0lucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5tYXhDb25uZWN0aW9ucyA9IHBhcnNlSW50KG1heENvbm5lY3Rpb25zSW5wdXQudmFsdWUpIHx8IDEwO1xuICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlt6XlhbfnrqHnkIZcbiAgICAgICAgY29uc3Qgc2VsZWN0QWxsQnRuID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNzZWxlY3RBbGxCdG4nKTtcbiAgICAgICAgaWYgKHNlbGVjdEFsbEJ0bikge1xuICAgICAgICAgICAgc2VsZWN0QWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYuc2VsZWN0QWxsVG9vbHMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVzZWxlY3RBbGxCdG4gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI2Rlc2VsZWN0QWxsQnRuJyk7XG4gICAgICAgIGlmIChkZXNlbGVjdEFsbEJ0bikge1xuICAgICAgICAgICAgZGVzZWxlY3RBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5kZXNlbGVjdEFsbFRvb2xzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNhdmVUb29sc0J0biA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjc2F2ZVRvb2xzQnRuJyk7XG4gICAgICAgIGlmIChzYXZlVG9vbHNCdG4pIHtcbiAgICAgICAgICAgIHNhdmVUb29sc0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVUb29sc0NoYW5nZXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YiG57G75o6n5Yi2XG4gICAgICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5U2VsZWN0QWxsID0gdGFyZ2V0LmNsb3Nlc3QoJy5jYXRlZ29yeS1zZWxlY3QtYWxsJyk7XG4gICAgICAgICAgICBjb25zdCBjYXRlZ29yeURlc2VsZWN0QWxsID0gdGFyZ2V0LmNsb3Nlc3QoJy5jYXRlZ29yeS1kZXNlbGVjdC1hbGwnKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGNhdGVnb3J5U2VsZWN0QWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSBjYXRlZ29yeVNlbGVjdEFsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2F0ZWdvcnknKTtcbiAgICAgICAgICAgICAgICBpZiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50b2dnbGVDYXRlZ29yeVRvb2xzKGNhdGVnb3J5LCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNhdGVnb3J5RGVzZWxlY3RBbGwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IGNhdGVnb3J5RGVzZWxlY3RBbGwuZ2V0QXR0cmlidXRlKCdkYXRhLWNhdGVnb3J5Jyk7XG4gICAgICAgICAgICAgICAgaWYgKGNhdGVnb3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudG9nZ2xlQ2F0ZWdvcnlUb29scyhjYXRlZ29yeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5bel5YW35aSN6YCJ5qGGIOuzgOqyvVxuICAgICAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrYm94ID0gdGFyZ2V0LmNsb3Nlc3QoJy50b29sLWNoZWNrYm94Jyk7XG4gICAgICAgICAgICBpZiAoY2hlY2tib3gpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IGNoZWNrYm94LmdldEF0dHJpYnV0ZSgnZGF0YS1jYXRlZ29yeScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvb2xOYW1lID0gY2hlY2tib3guZ2V0QXR0cmlidXRlKCdkYXRhLXRvb2wnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkID0gKGNoZWNrYm94IGFzIGFueSkuY2hlY2tlZDtcbiAgICAgICAgICAgICAgICBpZiAoY2F0ZWdvcnkgJiYgdG9vbE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi51cGRhdGVUb29sU3RhdHVzKGNhdGVnb3J5LCB0b29sTmFtZSwgY2hlY2tlZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHN3aXRjaFRhYih0YWJOYW1lOiAnc2VydmVyJyB8ICd0b29scycpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG4gICAgICAgIHN0YXRlLmFjdGl2ZVRhYiA9IHRhYk5hbWU7XG4gICAgICAgIFxuICAgICAgICBpZiAodGFiTmFtZSA9PT0gJ3Rvb2xzJykge1xuICAgICAgICAgICAgc2VsZi5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBjb25zdCBjb250YWluZXIgPSBzZWxmLiQuYXBwO1xuICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgIH0sXG4gICAgYXN5bmMgdG9nZ2xlU2VydmVyKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdGF0ZS5pc1Byb2Nlc3NpbmcgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gc2VsZi4kLmFwcDtcbiAgICAgICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuXG4gICAgICAgICAgICBpZiAoc3RhdGUuc2VydmVyUnVubmluZykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnc3RvcC1zZXJ2ZXInKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFNldHRpbmdzID0ge1xuICAgICAgICAgICAgICAgICAgICBwb3J0OiBzdGF0ZS5zZXR0aW5ncy5wb3J0LFxuICAgICAgICAgICAgICAgICAgICBhdXRvU3RhcnQ6IHN0YXRlLnNldHRpbmdzLmF1dG9TdGFydCxcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGVidWdMb2c6IHN0YXRlLnNldHRpbmdzLmRlYnVnTG9nLFxuICAgICAgICAgICAgICAgICAgICBtYXhDb25uZWN0aW9uczogc3RhdGUuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXNldHRpbmdzJywgY3VycmVudFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3N0YXJ0LXNlcnZlcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gU2VydmVyIHRvZ2dsZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IHNlbGYudXBkYXRlU2VydmVyU3RhdHVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gdG9nZ2xlIHNlcnZlcjonLCBlcnJvcik7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBzdGF0ZS5pc1Byb2Nlc3NpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHNlbGYuJC5hcHA7XG4gICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzZXR0aW5nc0RhdGEgPSB7XG4gICAgICAgICAgICAgICAgcG9ydDogc3RhdGUuc2V0dGluZ3MucG9ydCxcbiAgICAgICAgICAgICAgICBhdXRvU3RhcnQ6IHN0YXRlLnNldHRpbmdzLmF1dG9TdGFydCxcbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZzogc3RhdGUuc2V0dGluZ3MuZGVidWdMb2csXG4gICAgICAgICAgICAgICAgbWF4Q29ubmVjdGlvbnM6IHN0YXRlLnNldHRpbmdzLm1heENvbm5lY3Rpb25zXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS1zZXR0aW5ncycsIHNldHRpbmdzRGF0YSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gU2V0dGluZ3Mgc2F2ZWQnKTtcbiAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBzZWxmLiQuYXBwO1xuICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gc2F2ZSBzZXR0aW5nczonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIGNvcHlVcmwoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IuY2xpcGJvYXJkKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoc3RhdGUuaHR0cFVybCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRleHRhcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgICAgICAgICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9IHN0YXRlLmh0dHBVcmw7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZXh0YXJlYSk7XG4gICAgICAgICAgICAgICAgdGV4dGFyZWEuc2VsZWN0KCk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRleHRhcmVhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBVUkwgY29waWVkIHRvIGNsaXBib2FyZCcpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIGNvcHkgVVJMOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgbG9hZFRvb2xNYW5hZ2VyU3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnZ2V0LXRvb2wtbWFuYWdlci1zdGF0ZScpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQudG9vbHMpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5hdmFpbGFibGVUb29scyA9IHJlc3VsdC50b29scztcbiAgICAgICAgICAgICAgICBzdGF0ZS50b29sQ2F0ZWdvcmllcyA9IEFycmF5LmZyb20obmV3IFNldChyZXN1bHQudG9vbHMubWFwKCh0OiBUb29sQ29uZmlnKSA9PiB0LmNhdGVnb3J5KSkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHNlbGYuJC5hcHA7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIGxvYWQgdG9vbCBtYW5hZ2VyIHN0YXRlOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgdXBkYXRlVG9vbFN0YXR1cyhjYXRlZ29yeTogc3RyaW5nLCB0b29sTmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXRvb2wtc3RhdHVzJywgY2F0ZWdvcnksIHRvb2xOYW1lLCBlbmFibGVkKTtcbiAgICAgICAgICAgIGF3YWl0IHNlbGYubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byB1cGRhdGUgdG9vbCBzdGF0dXM6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyB0b2dnbGVDYXRlZ29yeVRvb2xzKGNhdGVnb3J5OiBzdHJpbmcsIGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlcyA9IHN0YXRlLmF2YWlsYWJsZVRvb2xzXG4gICAgICAgICAgICAgICAgLmZpbHRlcigodDogVG9vbENvbmZpZykgPT4gdC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkpXG4gICAgICAgICAgICAgICAgLm1hcCgodDogVG9vbENvbmZpZykgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6IHQuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZW5hYmxlZFxuICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtdG9vbC1zdGF0dXMtYmF0Y2gnLCB1cGRhdGVzKTtcbiAgICAgICAgICAgIGF3YWl0IHNlbGYubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byB0b2dnbGUgY2F0ZWdvcnk6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBzZWxlY3RBbGxUb29scygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlcyA9IHN0YXRlLmF2YWlsYWJsZVRvb2xzLm1hcCgodDogVG9vbENvbmZpZykgPT4gKHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogdC5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0Lm5hbWUsXG4gICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLXN0YXR1cy1iYXRjaCcsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgYXdhaXQgc2VsZi5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIHNlbGVjdCBhbGwgdG9vbHM6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBkZXNlbGVjdEFsbFRvb2xzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gc3RhdGUuYXZhaWxhYmxlVG9vbHMubWFwKCh0OiBUb29sQ29uZmlnKSA9PiAoe1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0LmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgIG5hbWU6IHQubmFtZSxcbiAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLXN0YXR1cy1iYXRjaCcsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgYXdhaXQgc2VsZi5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIGRlc2VsZWN0IGFsbCB0b29sczonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIHNhdmVUb29sc0NoYW5nZXMoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFRvb2xzIGNoYW5nZXMgc2F2ZWQnKTtcbiAgICAgICAgLy8g5bel5YW3IOuzgOqyveyCrO2VreydgCDsponsi5wg67CY7JiB65CY66+A66GcIOuzhOuPhCDsoIDsnqUg66Gc7KeBIOu2iO2VhOyalFxuICAgIH0sXG4gICAgYXN5bmMgdXBkYXRlU2VydmVyU3RhdHVzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2dldC1zZXJ2ZXItc3RhdHVzJyk7XG4gICAgICAgICAgICBpZiAoc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2VydmVyUnVubmluZyA9IHN0YXR1cy5ydW5uaW5nIHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgIHN0YXRlLnNlcnZlclN0YXR1cyA9IHN0YXR1cy5ydW5uaW5nID8gJ+i/kOihjOS4rScgOiAn5bey5YGc5q2iJztcbiAgICAgICAgICAgICAgICBzdGF0ZS5jb25uZWN0ZWRDbGllbnRzID0gc3RhdHVzLmNsaWVudHMgfHwgMDtcbiAgICAgICAgICAgICAgICBzdGF0ZS5odHRwVXJsID0gYGh0dHA6Ly8xMjcuMC4wLjE6JHtzdGF0dXMuc2V0dGluZ3M/LnBvcnQgfHwgMzAwMH0vbWNwYDtcblxuICAgICAgICAgICAgICAgIGlmIChzdGF0dXMuc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3MucG9ydCA9IHN0YXR1cy5zZXR0aW5ncy5wb3J0IHx8IDMwMDA7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzLmF1dG9TdGFydCA9IHN0YXR1cy5zZXR0aW5ncy5hdXRvU3RhcnQgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzLmRlYnVnTG9nID0gc3RhdHVzLnNldHRpbmdzLmRlYnVnTG9nIHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5tYXhDb25uZWN0aW9ucyA9IHN0YXR1cy5zZXR0aW5ncy5tYXhDb25uZWN0aW9ucyB8fCAxMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDnirbmgIHmm7TmlrDml7bph43mlrDmuLLmn5NcbiAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBzZWxmLiQuYXBwO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gdXBkYXRlIHNlcnZlciBzdGF0dXM6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzZW5kSXBjUmVxdWVzdChwYWNrYWdlTmFtZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZnVsbE1lc3NhZ2UgPSBgJHtwYWNrYWdlTmFtZX06JHttZXNzYWdlfWA7XG4gICAgICAgICAgICAgICAgRWRpdG9yLklwYy5zZW5kVG9NYWluKGZ1bGxNZXNzYWdlLCAuLi5hcmdzLCAoZXJyb3I6IEVycm9yIHwgbnVsbCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgYmVmb3JlQ2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgaWYgKHNlbGYuc3RhdHVzVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5zdGF0dXNVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgICAgICBzZWxmLnN0YXR1c1VwZGF0ZUludGVydmFsID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgaWYgKHNlbGYuc3RhdHVzVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5zdGF0dXNVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgICAgICBzZWxmLnN0YXR1c1VwZGF0ZUludGVydmFsID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG59KTtcbiJdfQ==