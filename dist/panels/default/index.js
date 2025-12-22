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
        serverStatus: '중지됨',
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
        const appElement = this.$app;
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
                    <span>서버</span>
                </button>
                <button class="tab-button ${state.activeTab === 'tools' ? 'active' : ''}" data-tab="tools">
                    <span>도구 관리</span>
                </button>
            </div>
        `;
    },
    getServerTabHTML(state) {
        return `
            <div class="tab-content">
                <section class="server-status">
                    <h3>서버 상태</h3>
                    <div class="status-info">
                        <ui-prop>
                            <ui-label slot="label">상태</ui-label>
                            <ui-label slot="content" class="status-value ${state.serverRunning ? 'status-running' : 'status-stopped'}">${state.serverStatus}</ui-label>
                        </ui-prop>
                        ${state.serverRunning ? `
                            <ui-prop>
                                <ui-label slot="label">연결 수</ui-label>
                                <ui-label slot="content">${state.connectedClients}</ui-label>
                            </ui-prop>
                        ` : ''}
                    </div>
                </section>

                <section class="server-controls">
                    <ui-button id="toggleServerBtn" class="primary" ${state.isProcessing ? 'disabled' : ''}>
                        ${state.serverRunning ? '서버 중지' : '서버 시작'}
                    </ui-button>
                </section>

                <section class="server-settings">
                    <h3>서버 설정</h3>
                    <ui-prop>
                        <ui-label slot="label">포트</ui-label>
                        <ui-num-input slot="content" id="portInput" value="${state.settings.port}" min="1024" max="65535" step="1" ${state.serverRunning ? 'disabled' : ''}></ui-num-input>
                    </ui-prop>
                    <ui-prop>
                        <ui-label slot="label">자동 시작</ui-label>
                        <ui-checkbox slot="content" id="autoStartCheckbox" ${state.settings.autoStart ? 'checked' : ''} ${state.serverRunning ? 'disabled' : ''}></ui-checkbox>
                    </ui-prop>
                    <ui-prop>
                        <ui-label slot="label">디버그 로그</ui-label>
                        <ui-checkbox slot="content" id="debugLogCheckbox" ${state.settings.debugLog ? 'checked' : ''}></ui-checkbox>
                    </ui-prop>
                    <ui-prop>
                        <ui-label slot="label">최대 연결 수</ui-label>
                        <ui-num-input slot="content" id="maxConnectionsInput" value="${state.settings.maxConnections}" min="1" max="100" step="1"></ui-num-input>
                    </ui-prop>
                </section>

                ${state.serverRunning ? `
                    <section class="server-info">
                        <h3>연결 정보</h3>
                        <div class="connection-details">
                            <ui-prop>
                                <ui-label slot="label">HTTP URL</ui-label>
                                <ui-input slot="content" value="${state.httpUrl}" readonly>
                                    <ui-button slot="suffix" id="copyUrlBtn">복사</ui-button>
                                </ui-input>
                            </ui-prop>
                        </div>
                    </section>
                ` : ''}

                <footer>
                    <ui-button id="saveSettingsBtn" ${!state.settingsChanged ? 'disabled' : ''}>설정 저장</ui-button>
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
                        <h3>도구 관리</h3>
                    </div>

                    <div class="tools-section">
                        <div class="tools-section-header">
                            <div class="tools-section-title">
                                <h4>사용 가능한 도구</h4>
                                <div class="tools-stats">
                                    ${totalTools}개 도구
                                    (${enabledTools} 활성화 / ${disabledTools} 비활성화)
                                </div>
                            </div>
                            <div class="tools-section-controls">
                                <ui-button id="selectAllBtn" class="small">전체 선택</ui-button>
                                <ui-button id="deselectAllBtn" class="small">전체 선택 해제</ui-button>
                                <ui-button id="saveToolsBtn" class="primary">변경 사항 저장</ui-button>
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
                        <ui-button class="small category-select-all" data-category="${category}">전체 선택</ui-button>
                        <ui-button class="small category-deselect-all" data-category="${category}">전체 선택 해제</ui-button>
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
            'scene': '씬 도구',
            'node': '노드 도구',
            'component': '컴포넌트 도구',
            'prefab': '프리팹 도구',
            'asset': '에셋 도구',
            'project': '프로젝트 도구',
            'debug': '디버그 도구',
            'server': '서버 도구',
            'validation': '검증 도구',
            'broadcast': '브로드캐스트 도구',
            'preferences': '환경 설정 도구',
            'reference-image': '참조 이미지 도구'
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
        const container = self.$app;
        self.render(container);
        self.bindEventListeners(container);
    },
    async toggleServer() {
        const self = this;
        const state = self.state;
        try {
            state.isProcessing = true;
            const container = self.$app;
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
            const container = self.$app;
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
            const container = self.$app;
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
                const container = self.$app;
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
            Editor.log('[Panel] updateServerStatus start');
            const status = await self.sendIpcRequest('cocos-mcp-server', 'get-server-status');
            if (status) {
                Editor.log('[Panel] updateServerStatus', status);
                state.serverRunning = status.running || false;
                state.serverStatus = status.running ? '실행 중' : '중지됨';
                state.connectedClients = status.clients || 0;
                state.httpUrl = `http://127.0.0.1:${((_a = status.settings) === null || _a === void 0 ? void 0 : _a.port) || 3000}/mcp`;
                if (status.settings) {
                    state.settings.port = status.settings.port || 3000;
                    state.settings.autoStart = status.settings.autoStart || false;
                    state.settings.debugLog = status.settings.debugLog || false;
                    state.settings.maxConnections = status.settings.maxConnections || 10;
                }
                // 状态更新时重新渲染
                const container = self.$app;
                Editor.log('[Panel] updateServerStatus container', container);
                if (container) {
                    self.render(container);
                    self.bindEventListeners(container);
                }
            }
            Editor.log('[Panel] updateServerStatus end');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG1EQUFtRDs7QUFFbkQsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQWdDNUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEVBQUU7UUFDUCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFDRCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDZDQUE2QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQy9GLEtBQUssRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3hGLENBQUMsRUFBRTtRQUNDLEdBQUcsRUFBRSxNQUFNO1FBQ1gsVUFBVSxFQUFFLGFBQWE7S0FDNUI7SUFDRCxLQUFLLEVBQUU7UUFDSCxTQUFTLEVBQUUsUUFBOEI7UUFDekMsYUFBYSxFQUFFLEtBQUs7UUFDcEIsWUFBWSxFQUFFLEtBQUs7UUFDbkIsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixPQUFPLEVBQUUsRUFBRTtRQUNYLFlBQVksRUFBRSxLQUFLO1FBQ25CLFFBQVEsRUFBRTtZQUNOLElBQUksRUFBRSxJQUFJO1lBQ1YsU0FBUyxFQUFFLEtBQUs7WUFDaEIsUUFBUSxFQUFFLEtBQUs7WUFDZixjQUFjLEVBQUUsRUFBRTtTQUNyQjtRQUNELGNBQWMsRUFBRSxFQUFrQjtRQUNsQyxjQUFjLEVBQUUsRUFBYztRQUM5QixlQUFlLEVBQUUs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Q0FBQztZQUM1QixhQUFhLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztRQUNyQyxDQUFDO0lBQ0wsQ0FBQztDQUNKLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi90eXBlcy9lZGl0b3ItMnguZC50c1wiIC8+XG5cbmltcG9ydCB7IHJlYWRGaWxlU3luYyB9IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJztcblxuLy8g5a6a5LmJ5bel5YW36YWN572u5o6l5Y+jXG5pbnRlcmZhY2UgVG9vbENvbmZpZyB7XG4gICAgY2F0ZWdvcnk6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICBkZXNjcmlwdGlvbjogc3RyaW5nO1xufVxuXG4vLyDlrprkuYnmnI3liqHlmajorr7nva7mjqXlj6NcbmludGVyZmFjZSBTZXJ2ZXJTZXR0aW5ncyB7XG4gICAgcG9ydDogbnVtYmVyO1xuICAgIGF1dG9TdGFydDogYm9vbGVhbjtcbiAgICBkZWJ1Z0xvZzogYm9vbGVhbjtcbiAgICBtYXhDb25uZWN0aW9uczogbnVtYmVyO1xufVxuXG4vLyDnirbmgIHnrqHnkIZcbmludGVyZmFjZSBBcHBTdGF0ZSB7XG4gICAgYWN0aXZlVGFiOiAnc2VydmVyJyB8ICd0b29scyc7XG4gICAgc2VydmVyUnVubmluZzogYm9vbGVhbjtcbiAgICBzZXJ2ZXJTdGF0dXM6IHN0cmluZztcbiAgICBjb25uZWN0ZWRDbGllbnRzOiBudW1iZXI7XG4gICAgaHR0cFVybDogc3RyaW5nO1xuICAgIGlzUHJvY2Vzc2luZzogYm9vbGVhbjtcbiAgICBzZXR0aW5nczogU2VydmVyU2V0dGluZ3M7XG4gICAgYXZhaWxhYmxlVG9vbHM6IFRvb2xDb25maWdbXTtcbiAgICB0b29sQ2F0ZWdvcmllczogc3RyaW5nW107XG4gICAgc2V0dGluZ3NDaGFuZ2VkOiBib29sZWFuO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5leHRlbmQoe1xuICAgIGxpc3RlbmVyczoge1xuICAgICAgICBzaG93KCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFBhbmVsIHNob3duJyk7XG4gICAgICAgIH0sXG4gICAgICAgIGhpZGUoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gUGFuZWwgaGlkZGVuJyk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICB0ZW1wbGF0ZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3RlbXBsYXRlL2RlZmF1bHQvaW5kZXguaHRtbCcpLCAndXRmLTgnKSxcbiAgICBzdHlsZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3N0eWxlL2RlZmF1bHQvaW5kZXguY3NzJyksICd1dGYtOCcpLFxuICAgICQ6IHtcbiAgICAgICAgYXBwOiAnI2FwcCcsXG4gICAgICAgIHBhbmVsVGl0bGU6ICcjcGFuZWxUaXRsZScsXG4gICAgfSxcbiAgICBzdGF0ZToge1xuICAgICAgICBhY3RpdmVUYWI6ICdzZXJ2ZXInIGFzICdzZXJ2ZXInIHwgJ3Rvb2xzJyxcbiAgICAgICAgc2VydmVyUnVubmluZzogZmFsc2UsXG4gICAgICAgIHNlcnZlclN0YXR1czogJ+ykkeyngOuQqCcsXG4gICAgICAgIGNvbm5lY3RlZENsaWVudHM6IDAsXG4gICAgICAgIGh0dHBVcmw6ICcnLFxuICAgICAgICBpc1Byb2Nlc3Npbmc6IGZhbHNlLFxuICAgICAgICBzZXR0aW5nczoge1xuICAgICAgICAgICAgcG9ydDogMzAwMCxcbiAgICAgICAgICAgIGF1dG9TdGFydDogZmFsc2UsXG4gICAgICAgICAgICBkZWJ1Z0xvZzogZmFsc2UsXG4gICAgICAgICAgICBtYXhDb25uZWN0aW9uczogMTBcbiAgICAgICAgfSxcbiAgICAgICAgYXZhaWxhYmxlVG9vbHM6IFtdIGFzIFRvb2xDb25maWdbXSxcbiAgICAgICAgdG9vbENhdGVnb3JpZXM6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgICBzZXR0aW5nc0NoYW5nZWQ6IGZhbHNlXG4gICAgfSBhcyBBcHBTdGF0ZSxcbiAgICBzdGF0dXNVcGRhdGVJbnRlcnZhbDogbnVsbCBhcyBOb2RlSlMuVGltZW91dCB8IG51bGwsXG4gICAgcmVhZHkoKSB7XG4gICAgICAgIGNvbnN0IGFwcEVsZW1lbnQgPSAodGhpcyBhcyBhbnkpLiRhcHA7XG4gICAgICAgIGlmIChhcHBFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLmluaXRBcHAoYXBwRWxlbWVudCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gQXBwIGluaXRpYWxpemVkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXRBcHAoY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuICAgICAgICAvLyDliJ3lp4vmuLLmn5NcbiAgICAgICAgdGhpcy5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcblxuICAgICAgICAvLyDliJ3lp4vnirbmgIHliqDovb1cbiAgICAgICAgdGhpcy51cGRhdGVTZXJ2ZXJTdGF0dXMoKTtcblxuICAgICAgICAvLyDlrprmnJ/mm7TmlrDmnI3liqHlmajnirbmgIFcbiAgICAgICAgdGhpcy5zdGF0dXNVcGRhdGVJbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2VydmVyU3RhdHVzKCk7XG4gICAgICAgIH0sIDIwMDApO1xuICAgIH0sXG4gICAgcmVuZGVyKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSAodGhpcyBhcyBhbnkpLnN0YXRlIGFzIEFwcFN0YXRlO1xuICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gdGhpcy5nZXRBcHBIVE1MKHN0YXRlKTtcbiAgICB9LFxuICAgIGdldEFwcEhUTUwoc3RhdGU6IEFwcFN0YXRlKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtY3AtYXBwXCI+XG4gICAgICAgICAgICAgICAgJHt0aGlzLmdldFRhYk5hdmlnYXRpb25IVE1MKHN0YXRlKX1cbiAgICAgICAgICAgICAgICAke3N0YXRlLmFjdGl2ZVRhYiA9PT0gJ3NlcnZlcicgPyB0aGlzLmdldFNlcnZlclRhYkhUTUwoc3RhdGUpIDogdGhpcy5nZXRUb29sc1RhYkhUTUwoc3RhdGUpfVxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfSxcbiAgICBnZXRUYWJOYXZpZ2F0aW9uSFRNTChzdGF0ZTogQXBwU3RhdGUpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRhYi1uYXZpZ2F0aW9uXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInRhYi1idXR0b24gJHtzdGF0ZS5hY3RpdmVUYWIgPT09ICdzZXJ2ZXInID8gJ2FjdGl2ZScgOiAnJ31cIiBkYXRhLXRhYj1cInNlcnZlclwiPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj7shJzrsoQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cInRhYi1idXR0b24gJHtzdGF0ZS5hY3RpdmVUYWIgPT09ICd0b29scycgPyAnYWN0aXZlJyA6ICcnfVwiIGRhdGEtdGFiPVwidG9vbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+64+E6rWsIOq0gOumrDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH0sXG4gICAgZ2V0U2VydmVyVGFiSFRNTChzdGF0ZTogQXBwU3RhdGUpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRhYi1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3M9XCJzZXJ2ZXItc3RhdHVzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxoMz7shJzrsoQg7IOB7YOcPC9oMz5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInN0YXR1cy1pbmZvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+7IOB7YOcPC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImNvbnRlbnRcIiBjbGFzcz1cInN0YXR1cy12YWx1ZSAke3N0YXRlLnNlcnZlclJ1bm5pbmcgPyAnc3RhdHVzLXJ1bm5pbmcnIDogJ3N0YXR1cy1zdG9wcGVkJ31cIj4ke3N0YXRlLnNlcnZlclN0YXR1c308L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgJHtzdGF0ZS5zZXJ2ZXJSdW5uaW5nID8gYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+7Jew6rKwIOyImDwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwiY29udGVudFwiPiR7c3RhdGUuY29ubmVjdGVkQ2xpZW50c308L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIGAgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxuXG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3M9XCJzZXJ2ZXItY29udHJvbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBpZD1cInRvZ2dsZVNlcnZlckJ0blwiIGNsYXNzPVwicHJpbWFyeVwiICR7c3RhdGUuaXNQcm9jZXNzaW5nID8gJ2Rpc2FibGVkJyA6ICcnfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICR7c3RhdGUuc2VydmVyUnVubmluZyA/ICfshJzrsoQg7KSR7KeAJyA6ICfshJzrsoQg7Iuc7J6RJ31cbiAgICAgICAgICAgICAgICAgICAgPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxuXG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3M9XCJzZXJ2ZXItc2V0dGluZ3NcIj5cbiAgICAgICAgICAgICAgICAgICAgPGgzPuyEnOuyhCDshKTsoJU8L2gzPlxuICAgICAgICAgICAgICAgICAgICA8dWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwibGFiZWxcIj7tj6ztirg8L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLW51bS1pbnB1dCBzbG90PVwiY29udGVudFwiIGlkPVwicG9ydElucHV0XCIgdmFsdWU9XCIke3N0YXRlLnNldHRpbmdzLnBvcnR9XCIgbWluPVwiMTAyNFwiIG1heD1cIjY1NTM1XCIgc3RlcD1cIjFcIiAke3N0YXRlLnNlcnZlclJ1bm5pbmcgPyAnZGlzYWJsZWQnIDogJyd9PjwvdWktbnVtLWlucHV0PlxuICAgICAgICAgICAgICAgICAgICA8L3VpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJsYWJlbFwiPuyekOuPmSDsi5zsnpE8L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWNoZWNrYm94IHNsb3Q9XCJjb250ZW50XCIgaWQ9XCJhdXRvU3RhcnRDaGVja2JveFwiICR7c3RhdGUuc2V0dGluZ3MuYXV0b1N0YXJ0ID8gJ2NoZWNrZWQnIDogJyd9ICR7c3RhdGUuc2VydmVyUnVubmluZyA/ICdkaXNhYmxlZCcgOiAnJ30+PC91aS1jaGVja2JveD5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICA8dWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwibGFiZWxcIj7rlJTrsoTqt7gg66Gc6re4PC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1jaGVja2JveCBzbG90PVwiY29udGVudFwiIGlkPVwiZGVidWdMb2dDaGVja2JveFwiICR7c3RhdGUuc2V0dGluZ3MuZGVidWdMb2cgPyAnY2hlY2tlZCcgOiAnJ30+PC91aS1jaGVja2JveD5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICA8dWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwibGFiZWxcIj7stZzrjIAg7Jew6rKwIOyImDwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbnVtLWlucHV0IHNsb3Q9XCJjb250ZW50XCIgaWQ9XCJtYXhDb25uZWN0aW9uc0lucHV0XCIgdmFsdWU9XCIke3N0YXRlLnNldHRpbmdzLm1heENvbm5lY3Rpb25zfVwiIG1pbj1cIjFcIiBtYXg9XCIxMDBcIiBzdGVwPVwiMVwiPjwvdWktbnVtLWlucHV0PlxuICAgICAgICAgICAgICAgICAgICA8L3VpLXByb3A+XG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxuXG4gICAgICAgICAgICAgICAgJHtzdGF0ZS5zZXJ2ZXJSdW5uaW5nID8gYFxuICAgICAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzcz1cInNlcnZlci1pbmZvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+7Jew6rKwIOygleuztDwvaDM+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29ubmVjdGlvbi1kZXRhaWxzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwibGFiZWxcIj5IVFRQIFVSTDwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1pbnB1dCBzbG90PVwiY29udGVudFwiIHZhbHVlPVwiJHtzdGF0ZS5odHRwVXJsfVwiIHJlYWRvbmx5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBzbG90PVwic3VmZml4XCIgaWQ9XCJjb3B5VXJsQnRuXCI+67O17IKsPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWktaW5wdXQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICAgICAgICBgIDogJyd9XG5cbiAgICAgICAgICAgICAgICA8Zm9vdGVyPlxuICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGlkPVwic2F2ZVNldHRpbmdzQnRuXCIgJHshc3RhdGUuc2V0dGluZ3NDaGFuZ2VkID8gJ2Rpc2FibGVkJyA6ICcnfT7shKTsoJUg7KCA7J6lPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgPC9mb290ZXI+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICB9LFxuICAgIGdldFRvb2xzVGFiSFRNTChzdGF0ZTogQXBwU3RhdGUpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCB0b3RhbFRvb2xzID0gc3RhdGUuYXZhaWxhYmxlVG9vbHMubGVuZ3RoO1xuICAgICAgICBjb25zdCBlbmFibGVkVG9vbHMgPSBzdGF0ZS5hdmFpbGFibGVUb29scy5maWx0ZXIodCA9PiB0LmVuYWJsZWQpLmxlbmd0aDtcbiAgICAgICAgY29uc3QgZGlzYWJsZWRUb29scyA9IHRvdGFsVG9vbHMgLSBlbmFibGVkVG9vbHM7XG5cbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0YWItY29udGVudFwiPlxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzPVwidG9vbC1tYW5hZ2VyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLW1hbmFnZXItaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+64+E6rWsIOq0gOumrDwvaDM+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29scy1zZWN0aW9uXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbHMtc2VjdGlvbi1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbHMtc2VjdGlvbi10aXRsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+7IKs7JqpIOqwgOuKpe2VnCDrj4Tqtaw8L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbHMtc3RhdHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7dG90YWxUb29sc33qsJwg64+E6rWsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoJHtlbmFibGVkVG9vbHN9IO2ZnOyEse2ZlCAvICR7ZGlzYWJsZWRUb29sc30g67mE7Zmc7ISx7ZmUKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbHMtc2VjdGlvbi1jb250cm9sc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGlkPVwic2VsZWN0QWxsQnRuXCIgY2xhc3M9XCJzbWFsbFwiPuyghOyytCDshKDtg508L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBpZD1cImRlc2VsZWN0QWxsQnRuXCIgY2xhc3M9XCJzbWFsbFwiPuyghOyytCDshKDtg50g7ZW07KCcPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b24gaWQ9XCJzYXZlVG9vbHNCdG5cIiBjbGFzcz1cInByaW1hcnlcIj7rs4Dqsr0g7IKs7ZWtIOyggOyepTwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29scy1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAke3N0YXRlLnRvb2xDYXRlZ29yaWVzLm1hcChjYXRlZ29yeSA9PiB0aGlzLmdldENhdGVnb3J5SFRNTChjYXRlZ29yeSwgc3RhdGUpKS5qb2luKCcnKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICB9LFxuICAgIGdldENhdGVnb3J5SFRNTChjYXRlZ29yeTogc3RyaW5nLCBzdGF0ZTogQXBwU3RhdGUpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCB0b29scyA9IHN0YXRlLmF2YWlsYWJsZVRvb2xzLmZpbHRlcih0ID0+IHQuY2F0ZWdvcnkgPT09IGNhdGVnb3J5KTtcbiAgICAgICAgY29uc3QgY2F0ZWdvcnlEaXNwbGF5TmFtZSA9IHRoaXMuZ2V0Q2F0ZWdvcnlEaXNwbGF5TmFtZShjYXRlZ29yeSk7XG5cbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLWNhdGVnb3J5XCIgZGF0YS1jYXRlZ29yeT1cIiR7Y2F0ZWdvcnl9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhdGVnb3J5LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICA8aDU+JHtjYXRlZ29yeURpc3BsYXlOYW1lfTwvaDU+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXRlZ29yeS1jb250cm9sc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBjbGFzcz1cInNtYWxsIGNhdGVnb3J5LXNlbGVjdC1hbGxcIiBkYXRhLWNhdGVnb3J5PVwiJHtjYXRlZ29yeX1cIj7soITssrQg7ISg7YOdPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGNsYXNzPVwic21hbGwgY2F0ZWdvcnktZGVzZWxlY3QtYWxsXCIgZGF0YS1jYXRlZ29yeT1cIiR7Y2F0ZWdvcnl9XCI+7KCE7LK0IOyEoO2DnSDtlbTsoJw8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtaXRlbXNcIj5cbiAgICAgICAgICAgICAgICAgICAgJHt0b29scy5tYXAodG9vbCA9PiBgXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC1pdGVtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWNoZWNrYm94XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzPVwidG9vbC1jaGVja2JveFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtY2F0ZWdvcnk9XCIke3Rvb2wuY2F0ZWdvcnl9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS10b29sPVwiJHt0b29sLm5hbWV9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHt0b29sLmVuYWJsZWQgPyAnY2hlY2tlZCcgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+PC91aS1jaGVja2JveD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC1pbmZvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLW5hbWVcIj4ke3Rvb2wubmFtZX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtZGVzY3JpcHRpb25cIj4ke3Rvb2wuZGVzY3JpcHRpb259PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgYCkuam9pbignJyl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICB9LFxuICAgIGdldENhdGVnb3J5RGlzcGxheU5hbWUoY2F0ZWdvcnk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGNhdGVnb3J5TWFwOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xuICAgICAgICAgICAgJ3NjZW5lJzogJ+yUrCDrj4TqtawnLFxuICAgICAgICAgICAgJ25vZGUnOiAn64W465OcIOuPhOq1rCcsXG4gICAgICAgICAgICAnY29tcG9uZW50JzogJ+y7tO2PrOuEjO2KuCDrj4TqtawnLFxuICAgICAgICAgICAgJ3ByZWZhYic6ICftlITrpqztjLkg64+E6rWsJyxcbiAgICAgICAgICAgICdhc3NldCc6ICfsl5DshYsg64+E6rWsJyxcbiAgICAgICAgICAgICdwcm9qZWN0JzogJ+2UhOuhnOygne2KuCDrj4TqtawnLFxuICAgICAgICAgICAgJ2RlYnVnJzogJ+uUlOuyhOq3uCDrj4TqtawnLFxuICAgICAgICAgICAgJ3NlcnZlcic6ICfshJzrsoQg64+E6rWsJyxcbiAgICAgICAgICAgICd2YWxpZGF0aW9uJzogJ+qygOymnSDrj4TqtawnLFxuICAgICAgICAgICAgJ2Jyb2FkY2FzdCc6ICfruIzroZzrk5zsupDsiqTtirgg64+E6rWsJyxcbiAgICAgICAgICAgICdwcmVmZXJlbmNlcyc6ICftmZjqsr0g7ISk7KCVIOuPhOq1rCcsXG4gICAgICAgICAgICAncmVmZXJlbmNlLWltYWdlJzogJ+ywuOyhsCDsnbTrr7jsp4Ag64+E6rWsJ1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gY2F0ZWdvcnlNYXBbY2F0ZWdvcnldIHx8IGNhdGVnb3J5O1xuICAgIH0sXG4gICAgYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG5cbiAgICAgICAgLy8g6YCJ6aG55Y2h5YiH5o2iXG4gICAgICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IHRhYkJ1dHRvbiA9IHRhcmdldC5jbG9zZXN0KCcudGFiLWJ1dHRvbicpO1xuICAgICAgICAgICAgaWYgKHRhYkJ1dHRvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhYiA9IHRhYkJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGFiJyk7XG4gICAgICAgICAgICAgICAgaWYgKHRhYiAmJiAodGFiID09PSAnc2VydmVyJyB8fCB0YWIgPT09ICd0b29scycpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc3dpdGNoVGFiKHRhYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDmnI3liqHlmajmjqfliLZcbiAgICAgICAgY29uc3QgdG9nZ2xlU2VydmVyQnRuID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyN0b2dnbGVTZXJ2ZXJCdG4nKTtcbiAgICAgICAgaWYgKHRvZ2dsZVNlcnZlckJ0bikge1xuICAgICAgICAgICAgdG9nZ2xlU2VydmVyQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYudG9nZ2xlU2VydmVyKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOiuvue9ruS/neWtmFxuICAgICAgICBjb25zdCBzYXZlU2V0dGluZ3NCdG4gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI3NhdmVTZXR0aW5nc0J0bicpO1xuICAgICAgICBpZiAoc2F2ZVNldHRpbmdzQnRuKSB7XG4gICAgICAgICAgICBzYXZlU2V0dGluZ3NCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVVJMIOuzteyCrFxuICAgICAgICBjb25zdCBjb3B5VXJsQnRuID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNjb3B5VXJsQnRuJyk7XG4gICAgICAgIGlmIChjb3B5VXJsQnRuKSB7XG4gICAgICAgICAgICBjb3B5VXJsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYuY29weVVybCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDorr7nva7ovpPlhaUg67OA6rK9IOqwkOyngFxuICAgICAgICBjb25zdCBwb3J0SW5wdXQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI3BvcnRJbnB1dCcpIGFzIGFueTtcbiAgICAgICAgaWYgKHBvcnRJbnB1dCkge1xuICAgICAgICAgICAgcG9ydElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5wb3J0ID0gcGFyc2VJbnQocG9ydElucHV0LnZhbHVlKSB8fCAzMDAwO1xuICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBhdXRvU3RhcnRDaGVja2JveCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjYXV0b1N0YXJ0Q2hlY2tib3gnKSBhcyBhbnk7XG4gICAgICAgIGlmIChhdXRvU3RhcnRDaGVja2JveCkge1xuICAgICAgICAgICAgYXV0b1N0YXJ0Q2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzLmF1dG9TdGFydCA9IGF1dG9TdGFydENoZWNrYm94LmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlYnVnTG9nQ2hlY2tib3ggPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI2RlYnVnTG9nQ2hlY2tib3gnKSBhcyBhbnk7XG4gICAgICAgIGlmIChkZWJ1Z0xvZ0NoZWNrYm94KSB7XG4gICAgICAgICAgICBkZWJ1Z0xvZ0NoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5kZWJ1Z0xvZyA9IGRlYnVnTG9nQ2hlY2tib3guY2hlY2tlZDtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWF4Q29ubmVjdGlvbnNJbnB1dCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjbWF4Q29ubmVjdGlvbnNJbnB1dCcpIGFzIGFueTtcbiAgICAgICAgaWYgKG1heENvbm5lY3Rpb25zSW5wdXQpIHtcbiAgICAgICAgICAgIG1heENvbm5lY3Rpb25zSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzLm1heENvbm5lY3Rpb25zID0gcGFyc2VJbnQobWF4Q29ubmVjdGlvbnNJbnB1dC52YWx1ZSkgfHwgMTA7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOW3peWFt+euoeeQhlxuICAgICAgICBjb25zdCBzZWxlY3RBbGxCdG4gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI3NlbGVjdEFsbEJ0bicpO1xuICAgICAgICBpZiAoc2VsZWN0QWxsQnRuKSB7XG4gICAgICAgICAgICBzZWxlY3RBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5zZWxlY3RBbGxUb29scygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZXNlbGVjdEFsbEJ0biA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjZGVzZWxlY3RBbGxCdG4nKTtcbiAgICAgICAgaWYgKGRlc2VsZWN0QWxsQnRuKSB7XG4gICAgICAgICAgICBkZXNlbGVjdEFsbEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLmRlc2VsZWN0QWxsVG9vbHMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2F2ZVRvb2xzQnRuID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNzYXZlVG9vbHNCdG4nKTtcbiAgICAgICAgaWYgKHNhdmVUb29sc0J0bikge1xuICAgICAgICAgICAgc2F2ZVRvb2xzQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZVRvb2xzQ2hhbmdlcygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDliIbnsbvmjqfliLZcbiAgICAgICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnlTZWxlY3RBbGwgPSB0YXJnZXQuY2xvc2VzdCgnLmNhdGVnb3J5LXNlbGVjdC1hbGwnKTtcbiAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5RGVzZWxlY3RBbGwgPSB0YXJnZXQuY2xvc2VzdCgnLmNhdGVnb3J5LWRlc2VsZWN0LWFsbCcpO1xuXG4gICAgICAgICAgICBpZiAoY2F0ZWdvcnlTZWxlY3RBbGwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IGNhdGVnb3J5U2VsZWN0QWxsLmdldEF0dHJpYnV0ZSgnZGF0YS1jYXRlZ29yeScpO1xuICAgICAgICAgICAgICAgIGlmIChjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRvZ2dsZUNhdGVnb3J5VG9vbHMoY2F0ZWdvcnksIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY2F0ZWdvcnlEZXNlbGVjdEFsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gY2F0ZWdvcnlEZXNlbGVjdEFsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2F0ZWdvcnknKTtcbiAgICAgICAgICAgICAgICBpZiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50b2dnbGVDYXRlZ29yeVRvb2xzKGNhdGVnb3J5LCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDlt6XlhbflpI3pgInmoYYg67OA6rK9XG4gICAgICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgY2hlY2tib3ggPSB0YXJnZXQuY2xvc2VzdCgnLnRvb2wtY2hlY2tib3gnKTtcbiAgICAgICAgICAgIGlmIChjaGVja2JveCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gY2hlY2tib3guZ2V0QXR0cmlidXRlKCdkYXRhLWNhdGVnb3J5Jyk7XG4gICAgICAgICAgICAgICAgY29uc3QgdG9vbE5hbWUgPSBjaGVja2JveC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdG9vbCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrZWQgPSAoY2hlY2tib3ggYXMgYW55KS5jaGVja2VkO1xuICAgICAgICAgICAgICAgIGlmIChjYXRlZ29yeSAmJiB0b29sTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnVwZGF0ZVRvb2xTdGF0dXMoY2F0ZWdvcnksIHRvb2xOYW1lLCBjaGVja2VkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc3dpdGNoVGFiKHRhYk5hbWU6ICdzZXJ2ZXInIHwgJ3Rvb2xzJykge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcbiAgICAgICAgc3RhdGUuYWN0aXZlVGFiID0gdGFiTmFtZTtcblxuICAgICAgICBpZiAodGFiTmFtZSA9PT0gJ3Rvb2xzJykge1xuICAgICAgICAgICAgc2VsZi5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gc2VsZi4kYXBwO1xuICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgIH0sXG4gICAgYXN5bmMgdG9nZ2xlU2VydmVyKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RhdGUuaXNQcm9jZXNzaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHNlbGYuJGFwcDtcbiAgICAgICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuXG4gICAgICAgICAgICBpZiAoc3RhdGUuc2VydmVyUnVubmluZykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnc3RvcC1zZXJ2ZXInKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY3VycmVudFNldHRpbmdzID0ge1xuICAgICAgICAgICAgICAgICAgICBwb3J0OiBzdGF0ZS5zZXR0aW5ncy5wb3J0LFxuICAgICAgICAgICAgICAgICAgICBhdXRvU3RhcnQ6IHN0YXRlLnNldHRpbmdzLmF1dG9TdGFydCxcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGVidWdMb2c6IHN0YXRlLnNldHRpbmdzLmRlYnVnTG9nLFxuICAgICAgICAgICAgICAgICAgICBtYXhDb25uZWN0aW9uczogc3RhdGUuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXNldHRpbmdzJywgY3VycmVudFNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3N0YXJ0LXNlcnZlcicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gU2VydmVyIHRvZ2dsZWQnKTtcbiAgICAgICAgICAgIGF3YWl0IHNlbGYudXBkYXRlU2VydmVyU3RhdHVzKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gdG9nZ2xlIHNlcnZlcjonLCBlcnJvcik7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBzdGF0ZS5pc1Byb2Nlc3NpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHNlbGYuJGFwcDtcbiAgICAgICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzZXR0aW5nc0RhdGEgPSB7XG4gICAgICAgICAgICAgICAgcG9ydDogc3RhdGUuc2V0dGluZ3MucG9ydCxcbiAgICAgICAgICAgICAgICBhdXRvU3RhcnQ6IHN0YXRlLnNldHRpbmdzLmF1dG9TdGFydCxcbiAgICAgICAgICAgICAgICBkZWJ1Z0xvZzogc3RhdGUuc2V0dGluZ3MuZGVidWdMb2csXG4gICAgICAgICAgICAgICAgbWF4Q29ubmVjdGlvbnM6IHN0YXRlLnNldHRpbmdzLm1heENvbm5lY3Rpb25zXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS1zZXR0aW5ncycsIHNldHRpbmdzRGF0YSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gU2V0dGluZ3Mgc2F2ZWQnKTtcbiAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzQ2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBzZWxmLiRhcHA7XG4gICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byBzYXZlIHNldHRpbmdzOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgY29weVVybCgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmF2aWdhdG9yICE9PSAndW5kZWZpbmVkJyAmJiBuYXZpZ2F0b3IuY2xpcGJvYXJkKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQoc3RhdGUuaHR0cFVybCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRleHRhcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGV4dGFyZWEnKTtcbiAgICAgICAgICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9IHN0YXRlLmh0dHBVcmw7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZXh0YXJlYSk7XG4gICAgICAgICAgICAgICAgdGV4dGFyZWEuc2VsZWN0KCk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoJ2NvcHknKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRleHRhcmVhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBVUkwgY29waWVkIHRvIGNsaXBib2FyZCcpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIGNvcHkgVVJMOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgbG9hZFRvb2xNYW5hZ2VyU3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2dldC10b29sLW1hbmFnZXItc3RhdGUnKTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LnRvb2xzKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuYXZhaWxhYmxlVG9vbHMgPSByZXN1bHQudG9vbHM7XG4gICAgICAgICAgICAgICAgc3RhdGUudG9vbENhdGVnb3JpZXMgPSBBcnJheS5mcm9tKG5ldyBTZXQocmVzdWx0LnRvb2xzLm1hcCgodDogVG9vbENvbmZpZykgPT4gdC5jYXRlZ29yeSkpKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHNlbGYuJGFwcDtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gbG9hZCB0b29sIG1hbmFnZXIgc3RhdGU6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyB1cGRhdGVUb29sU3RhdHVzKGNhdGVnb3J5OiBzdHJpbmcsIHRvb2xOYW1lOiBzdHJpbmcsIGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXRvb2wtc3RhdHVzJywgY2F0ZWdvcnksIHRvb2xOYW1lLCBlbmFibGVkKTtcbiAgICAgICAgICAgIGF3YWl0IHNlbGYubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byB1cGRhdGUgdG9vbCBzdGF0dXM6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyB0b2dnbGVDYXRlZ29yeVRvb2xzKGNhdGVnb3J5OiBzdHJpbmcsIGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZXMgPSBzdGF0ZS5hdmFpbGFibGVUb29sc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoKHQ6IFRvb2xDb25maWcpID0+IHQuY2F0ZWdvcnkgPT09IGNhdGVnb3J5KVxuICAgICAgICAgICAgICAgIC5tYXAoKHQ6IFRvb2xDb25maWcpID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0LmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiB0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGVuYWJsZWRcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXRvb2wtc3RhdHVzLWJhdGNoJywgdXBkYXRlcyk7XG4gICAgICAgICAgICBhd2FpdCBzZWxmLmxvYWRUb29sTWFuYWdlclN0YXRlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gdG9nZ2xlIGNhdGVnb3J5OicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgc2VsZWN0QWxsVG9vbHMoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gc3RhdGUuYXZhaWxhYmxlVG9vbHMubWFwKCh0OiBUb29sQ29uZmlnKSA9PiAoe1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0LmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgIG5hbWU6IHQubmFtZSxcbiAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXRvb2wtc3RhdHVzLWJhdGNoJywgdXBkYXRlcyk7XG4gICAgICAgICAgICBhd2FpdCBzZWxmLmxvYWRUb29sTWFuYWdlclN0YXRlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gc2VsZWN0IGFsbCB0b29sczonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIGRlc2VsZWN0QWxsVG9vbHMoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gc3RhdGUuYXZhaWxhYmxlVG9vbHMubWFwKCh0OiBUb29sQ29uZmlnKSA9PiAoe1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0LmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgIG5hbWU6IHQubmFtZSxcbiAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLXN0YXR1cy1iYXRjaCcsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgYXdhaXQgc2VsZi5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIGRlc2VsZWN0IGFsbCB0b29sczonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIHNhdmVUb29sc0NoYW5nZXMoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFRvb2xzIGNoYW5nZXMgc2F2ZWQnKTtcbiAgICAgICAgLy8g5bel5YW3IOuzgOqyveyCrO2VreydgCDsponsi5wg67CY7JiB65CY66+A66GcIOuzhOuPhCDsoIDsnqUg66Gc7KeBIOu2iO2VhOyalFxuICAgIH0sXG4gICAgYXN5bmMgdXBkYXRlU2VydmVyU3RhdHVzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgRWRpdG9yLmxvZygnW1BhbmVsXSB1cGRhdGVTZXJ2ZXJTdGF0dXMgc3RhcnQnKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnZ2V0LXNlcnZlci1zdGF0dXMnKTtcbiAgICAgICAgICAgIGlmIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBFZGl0b3IubG9nKCdbUGFuZWxdIHVwZGF0ZVNlcnZlclN0YXR1cycsIHN0YXR1cyk7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2VydmVyUnVubmluZyA9IHN0YXR1cy5ydW5uaW5nIHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgIHN0YXRlLnNlcnZlclN0YXR1cyA9IHN0YXR1cy5ydW5uaW5nID8gJ+yLpO2WiSDspJEnIDogJ+ykkeyngOuQqCc7XG4gICAgICAgICAgICAgICAgc3RhdGUuY29ubmVjdGVkQ2xpZW50cyA9IHN0YXR1cy5jbGllbnRzIHx8IDA7XG4gICAgICAgICAgICAgICAgc3RhdGUuaHR0cFVybCA9IGBodHRwOi8vMTI3LjAuMC4xOiR7c3RhdHVzLnNldHRpbmdzPy5wb3J0IHx8IDMwMDB9L21jcGA7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RhdHVzLnNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzLnBvcnQgPSBzdGF0dXMuc2V0dGluZ3MucG9ydCB8fCAzMDAwO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5hdXRvU3RhcnQgPSBzdGF0dXMuc2V0dGluZ3MuYXV0b1N0YXJ0IHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5kZWJ1Z0xvZyA9IHN0YXR1cy5zZXR0aW5ncy5kZWJ1Z0xvZyB8fCBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnMgPSBzdGF0dXMuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnMgfHwgMTA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g54q25oCB5pu05paw5pe26YeN5paw5riy5p+TXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gc2VsZi4kYXBwO1xuICAgICAgICAgICAgICAgIEVkaXRvci5sb2coJ1tQYW5lbF0gdXBkYXRlU2VydmVyU3RhdHVzIGNvbnRhaW5lcicsIGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEVkaXRvci5sb2coJ1tQYW5lbF0gdXBkYXRlU2VydmVyU3RhdHVzIGVuZCcpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIHVwZGF0ZSBzZXJ2ZXIgc3RhdHVzOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2VuZElwY1JlcXVlc3QocGFja2FnZU5hbWU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxNZXNzYWdlID0gYCR7cGFja2FnZU5hbWV9OiR7bWVzc2FnZX1gO1xuICAgICAgICAgICAgICAgIEVkaXRvci5JcGMuc2VuZFRvTWFpbihmdWxsTWVzc2FnZSwgLi4uYXJncywgKGVycm9yOiBFcnJvciB8IG51bGwsIHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGJlZm9yZUNsb3NlKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGlmIChzZWxmLnN0YXR1c1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc3RhdHVzVXBkYXRlSW50ZXJ2YWwpO1xuICAgICAgICAgICAgc2VsZi5zdGF0dXNVcGRhdGVJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNsb3NlKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGlmIChzZWxmLnN0YXR1c1VwZGF0ZUludGVydmFsKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuc3RhdHVzVXBkYXRlSW50ZXJ2YWwpO1xuICAgICAgICAgICAgc2VsZi5zdGF0dXNVcGRhdGVJbnRlcnZhbCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxufSk7XG4iXX0=