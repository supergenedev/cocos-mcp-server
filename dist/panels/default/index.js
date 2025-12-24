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
            const status = await self.sendIpcRequest('cocos-mcp-server', 'get-server-status');
            if (status) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG1EQUFtRDs7QUFFbkQsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQWdDNUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEVBQUU7UUFDUCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFDRCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDZDQUE2QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQy9GLEtBQUssRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3hGLENBQUMsRUFBRTtRQUNDLEdBQUcsRUFBRSxNQUFNO1FBQ1gsVUFBVSxFQUFFLGFBQWE7S0FDNUI7SUFDRCxLQUFLLEVBQUU7UUFDSCxTQUFTLEVBQUUsUUFBOEI7UUFDekMsYUFBYSxFQUFFLEtBQUs7UUFDcEIsWUFBWSxFQUFFLEtBQUs7UUFDbkIsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixPQUFPLEVBQUUsRUFBRTtRQUNYLFlBQVksRUFBRSxLQUFLO1FBQ25CLFFBQVEsRUFBRTtZQUNOLElBQUksRUFBRSxJQUFJO1lBQ1YsU0FBUyxFQUFFLEtBQUs7WUFDaEIsUUFBUSxFQUFFLEtBQUs7WUFDZixjQUFjLEVBQUUsRUFBRTtTQUNyQjtRQUNELGNBQWMsRUFBRSxFQUFrQjtRQUNsQyxjQUFjLEVBQUUsRUFBYztRQUM5QixlQUFlLEVBQUUs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QUFDLG9CQUFvQixFQUFFO1lBQzNCLGFBQWEsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1NBQ3BDO0lBQ0wsQ0FBQztJQUNELEtBQUs7UUFDRCxNQUFNLElBQUksR0FBRyxJQUFXLENBQUM7UUFDekIsSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7WUFDM0IsYUFBYSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7U0FDcEM7SUFDTCxDQUFDO0NBQ0osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL3R5cGVzL2VkaXRvci0yeC5kLnRzXCIgLz5cblxuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuXG4vLyDlrprkuYnlt6XlhbfphY3nva7mjqXlj6NcbmludGVyZmFjZSBUb29sQ29uZmlnIHtcbiAgICBjYXRlZ29yeTogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG59XG5cbi8vIOWumuS5ieacjeWKoeWZqOiuvue9ruaOpeWPo1xuaW50ZXJmYWNlIFNlcnZlclNldHRpbmdzIHtcbiAgICBwb3J0OiBudW1iZXI7XG4gICAgYXV0b1N0YXJ0OiBib29sZWFuO1xuICAgIGRlYnVnTG9nOiBib29sZWFuO1xuICAgIG1heENvbm5lY3Rpb25zOiBudW1iZXI7XG59XG5cbi8vIOeKtuaAgeeuoeeQhlxuaW50ZXJmYWNlIEFwcFN0YXRlIHtcbiAgICBhY3RpdmVUYWI6ICdzZXJ2ZXInIHwgJ3Rvb2xzJztcbiAgICBzZXJ2ZXJSdW5uaW5nOiBib29sZWFuO1xuICAgIHNlcnZlclN0YXR1czogc3RyaW5nO1xuICAgIGNvbm5lY3RlZENsaWVudHM6IG51bWJlcjtcbiAgICBodHRwVXJsOiBzdHJpbmc7XG4gICAgaXNQcm9jZXNzaW5nOiBib29sZWFuO1xuICAgIHNldHRpbmdzOiBTZXJ2ZXJTZXR0aW5ncztcbiAgICBhdmFpbGFibGVUb29sczogVG9vbENvbmZpZ1tdO1xuICAgIHRvb2xDYXRlZ29yaWVzOiBzdHJpbmdbXTtcbiAgICBzZXR0aW5nc0NoYW5nZWQ6IGJvb2xlYW47XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yLlBhbmVsLmV4dGVuZCh7XG4gICAgbGlzdGVuZXJzOiB7XG4gICAgICAgIHNob3coKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gUGFuZWwgc2hvd24nKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGlkZSgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBQYW5lbCBoaWRkZW4nKTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvZGVmYXVsdC9pbmRleC5odG1sJyksICd1dGYtOCcpLFxuICAgIHN0eWxlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvc3R5bGUvZGVmYXVsdC9pbmRleC5jc3MnKSwgJ3V0Zi04JyksXG4gICAgJDoge1xuICAgICAgICBhcHA6ICcjYXBwJyxcbiAgICAgICAgcGFuZWxUaXRsZTogJyNwYW5lbFRpdGxlJyxcbiAgICB9LFxuICAgIHN0YXRlOiB7XG4gICAgICAgIGFjdGl2ZVRhYjogJ3NlcnZlcicgYXMgJ3NlcnZlcicgfCAndG9vbHMnLFxuICAgICAgICBzZXJ2ZXJSdW5uaW5nOiBmYWxzZSxcbiAgICAgICAgc2VydmVyU3RhdHVzOiAn7KSR7KeA65CoJyxcbiAgICAgICAgY29ubmVjdGVkQ2xpZW50czogMCxcbiAgICAgICAgaHR0cFVybDogJycsXG4gICAgICAgIGlzUHJvY2Vzc2luZzogZmFsc2UsXG4gICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICBwb3J0OiAzMDAwLFxuICAgICAgICAgICAgYXV0b1N0YXJ0OiBmYWxzZSxcbiAgICAgICAgICAgIGRlYnVnTG9nOiBmYWxzZSxcbiAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiAxMFxuICAgICAgICB9LFxuICAgICAgICBhdmFpbGFibGVUb29sczogW10gYXMgVG9vbENvbmZpZ1tdLFxuICAgICAgICB0b29sQ2F0ZWdvcmllczogW10gYXMgc3RyaW5nW10sXG4gICAgICAgIHNldHRpbmdzQ2hhbmdlZDogZmFsc2VcbiAgICB9IGFzIEFwcFN0YXRlLFxuICAgIHN0YXR1c1VwZGF0ZUludGVydmFsOiBudWxsIGFzIE5vZGVKUy5UaW1lb3V0IHwgbnVsbCxcbiAgICByZWFkeSgpIHtcbiAgICAgICAgY29uc3QgYXBwRWxlbWVudCA9ICh0aGlzIGFzIGFueSkuJGFwcDtcbiAgICAgICAgaWYgKGFwcEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEFwcChhcHBFbGVtZW50KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBBcHAgaW5pdGlhbGl6ZWQnKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdEFwcChjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG4gICAgICAgIC8vIOWIneWni+a4suafk1xuICAgICAgICB0aGlzLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICB0aGlzLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuXG4gICAgICAgIC8vIOWIneWni+eKtuaAgeWKoOi9vVxuICAgICAgICB0aGlzLnVwZGF0ZVNlcnZlclN0YXR1cygpO1xuXG4gICAgICAgIC8vIOWumuacn+abtOaWsOacjeWKoeWZqOeKtuaAgVxuICAgICAgICB0aGlzLnN0YXR1c1VwZGF0ZUludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTZXJ2ZXJTdGF0dXMoKTtcbiAgICAgICAgfSwgMjAwMCk7XG4gICAgfSxcbiAgICByZW5kZXIoY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuICAgICAgICBjb25zdCBzdGF0ZSA9ICh0aGlzIGFzIGFueSkuc3RhdGUgYXMgQXBwU3RhdGU7XG4gICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSB0aGlzLmdldEFwcEhUTUwoc3RhdGUpO1xuICAgIH0sXG4gICAgZ2V0QXBwSFRNTChzdGF0ZTogQXBwU3RhdGUpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm1jcC1hcHBcIj5cbiAgICAgICAgICAgICAgICAke3RoaXMuZ2V0VGFiTmF2aWdhdGlvbkhUTUwoc3RhdGUpfVxuICAgICAgICAgICAgICAgICR7c3RhdGUuYWN0aXZlVGFiID09PSAnc2VydmVyJyA/IHRoaXMuZ2V0U2VydmVyVGFiSFRNTChzdGF0ZSkgOiB0aGlzLmdldFRvb2xzVGFiSFRNTChzdGF0ZSl9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICB9LFxuICAgIGdldFRhYk5hdmlnYXRpb25IVE1MKHN0YXRlOiBBcHBTdGF0ZSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFiLW5hdmlnYXRpb25cIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwidGFiLWJ1dHRvbiAke3N0YXRlLmFjdGl2ZVRhYiA9PT0gJ3NlcnZlcicgPyAnYWN0aXZlJyA6ICcnfVwiIGRhdGEtdGFiPVwic2VydmVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPuyEnOuyhDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwidGFiLWJ1dHRvbiAke3N0YXRlLmFjdGl2ZVRhYiA9PT0gJ3Rvb2xzJyA/ICdhY3RpdmUnIDogJyd9XCIgZGF0YS10YWI9XCJ0b29sc1wiPlxuICAgICAgICAgICAgICAgICAgICA8c3Bhbj7rj4Tqtawg6rSA66asPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfSxcbiAgICBnZXRTZXJ2ZXJUYWJIVE1MKHN0YXRlOiBBcHBTdGF0ZSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFiLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzcz1cInNlcnZlci1zdGF0dXNcIj5cbiAgICAgICAgICAgICAgICAgICAgPGgzPuyEnOuyhCDsg4Htg5w8L2gzPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwic3RhdHVzLWluZm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwibGFiZWxcIj7sg4Htg5w8L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwiY29udGVudFwiIGNsYXNzPVwic3RhdHVzLXZhbHVlICR7c3RhdGUuc2VydmVyUnVubmluZyA/ICdzdGF0dXMtcnVubmluZycgOiAnc3RhdHVzLXN0b3BwZWQnfVwiPiR7c3RhdGUuc2VydmVyU3RhdHVzfTwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L3VpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAke3N0YXRlLnNlcnZlclJ1bm5pbmcgPyBgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwibGFiZWxcIj7sl7DqsrAg7IiYPC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJjb250ZW50XCI+JHtzdGF0ZS5jb25uZWN0ZWRDbGllbnRzfTwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgYCA6ICcnfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XG5cbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzcz1cInNlcnZlci1jb250cm9sc1wiPlxuICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGlkPVwidG9nZ2xlU2VydmVyQnRuXCIgY2xhc3M9XCJwcmltYXJ5XCIgJHtzdGF0ZS5pc1Byb2Nlc3NpbmcgPyAnZGlzYWJsZWQnIDogJyd9PlxuICAgICAgICAgICAgICAgICAgICAgICAgJHtzdGF0ZS5zZXJ2ZXJSdW5uaW5nID8gJ+yEnOuyhCDspJHsp4AnIDogJ+yEnOuyhCDsi5zsnpEnfVxuICAgICAgICAgICAgICAgICAgICA8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XG5cbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzcz1cInNlcnZlci1zZXR0aW5nc1wiPlxuICAgICAgICAgICAgICAgICAgICA8aDM+7ISc67KEIOyEpOyglTwvaDM+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJsYWJlbFwiPu2PrO2KuDwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbnVtLWlucHV0IHNsb3Q9XCJjb250ZW50XCIgaWQ9XCJwb3J0SW5wdXRcIiB2YWx1ZT1cIiR7c3RhdGUuc2V0dGluZ3MucG9ydH1cIiBtaW49XCIxMDI0XCIgbWF4PVwiNjU1MzVcIiBzdGVwPVwiMVwiICR7c3RhdGUuc2VydmVyUnVubmluZyA/ICdkaXNhYmxlZCcgOiAnJ30+PC91aS1udW0taW5wdXQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgPHVpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+7J6Q64+ZIOyLnOyekTwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktY2hlY2tib3ggc2xvdD1cImNvbnRlbnRcIiBpZD1cImF1dG9TdGFydENoZWNrYm94XCIgJHtzdGF0ZS5zZXR0aW5ncy5hdXRvU3RhcnQgPyAnY2hlY2tlZCcgOiAnJ30gJHtzdGF0ZS5zZXJ2ZXJSdW5uaW5nID8gJ2Rpc2FibGVkJyA6ICcnfT48L3VpLWNoZWNrYm94PlxuICAgICAgICAgICAgICAgICAgICA8L3VpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJsYWJlbFwiPuuUlOuyhOq3uCDroZzqt7g8L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWNoZWNrYm94IHNsb3Q9XCJjb250ZW50XCIgaWQ9XCJkZWJ1Z0xvZ0NoZWNrYm94XCIgJHtzdGF0ZS5zZXR0aW5ncy5kZWJ1Z0xvZyA/ICdjaGVja2VkJyA6ICcnfT48L3VpLWNoZWNrYm94PlxuICAgICAgICAgICAgICAgICAgICA8L3VpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJsYWJlbFwiPuy1nOuMgCDsl7DqsrAg7IiYPC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1udW0taW5wdXQgc2xvdD1cImNvbnRlbnRcIiBpZD1cIm1heENvbm5lY3Rpb25zSW5wdXRcIiB2YWx1ZT1cIiR7c3RhdGUuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnN9XCIgbWluPVwiMVwiIG1heD1cIjEwMFwiIHN0ZXA9XCIxXCI+PC91aS1udW0taW5wdXQ+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktcHJvcD5cbiAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XG5cbiAgICAgICAgICAgICAgICAke3N0YXRlLnNlcnZlclJ1bm5pbmcgPyBgXG4gICAgICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzPVwic2VydmVyLWluZm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMz7sl7DqsrAg7KCV67O0PC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjb25uZWN0aW9uLWRldGFpbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJsYWJlbFwiPkhUVFAgVVJMPC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWlucHV0IHNsb3Q9XCJjb250ZW50XCIgdmFsdWU9XCIke3N0YXRlLmh0dHBVcmx9XCIgcmVhZG9ubHk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIHNsb3Q9XCJzdWZmaXhcIiBpZD1cImNvcHlVcmxCdG5cIj7rs7Xsgqw8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC91aS1pbnB1dD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICAgICAgICAgIGAgOiAnJ31cblxuICAgICAgICAgICAgICAgIDxmb290ZXI+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b24gaWQ9XCJzYXZlU2V0dGluZ3NCdG5cIiAkeyFzdGF0ZS5zZXR0aW5nc0NoYW5nZWQgPyAnZGlzYWJsZWQnIDogJyd9PuyEpOyglSDsoIDsnqU8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Zvb3Rlcj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH0sXG4gICAgZ2V0VG9vbHNUYWJIVE1MKHN0YXRlOiBBcHBTdGF0ZSk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHRvdGFsVG9vbHMgPSBzdGF0ZS5hdmFpbGFibGVUb29scy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHN0YXRlLmF2YWlsYWJsZVRvb2xzLmZpbHRlcih0ID0+IHQuZW5hYmxlZCkubGVuZ3RoO1xuICAgICAgICBjb25zdCBkaXNhYmxlZFRvb2xzID0gdG90YWxUb29scyAtIGVuYWJsZWRUb29scztcblxuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRhYi1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3M9XCJ0b29sLW1hbmFnZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtbWFuYWdlci1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMz7rj4Tqtawg6rSA66asPC9oMz5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2xzLXNlY3Rpb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29scy1zZWN0aW9uLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29scy1zZWN0aW9uLXRpdGxlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoND7sgqzsmqkg6rCA64ql7ZWcIOuPhOq1rDwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29scy1zdGF0c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHt0b3RhbFRvb2xzfeqwnCDrj4TqtaxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgke2VuYWJsZWRUb29sc30g7Zmc7ISx7ZmUIC8gJHtkaXNhYmxlZFRvb2xzfSDruYTtmZzshLHtmZQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29scy1zZWN0aW9uLWNvbnRyb2xzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b24gaWQ9XCJzZWxlY3RBbGxCdG5cIiBjbGFzcz1cInNtYWxsXCI+7KCE7LK0IOyEoO2DnTwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGlkPVwiZGVzZWxlY3RBbGxCdG5cIiBjbGFzcz1cInNtYWxsXCI+7KCE7LK0IOyEoO2DnSDtlbTsoJw8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBpZD1cInNhdmVUb29sc0J0blwiIGNsYXNzPVwicHJpbWFyeVwiPuuzgOqyvSDsgqztla0g7KCA7J6lPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2xzLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7c3RhdGUudG9vbENhdGVnb3JpZXMubWFwKGNhdGVnb3J5ID0+IHRoaXMuZ2V0Q2F0ZWdvcnlIVE1MKGNhdGVnb3J5LCBzdGF0ZSkpLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH0sXG4gICAgZ2V0Q2F0ZWdvcnlIVE1MKGNhdGVnb3J5OiBzdHJpbmcsIHN0YXRlOiBBcHBTdGF0ZSk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IHRvb2xzID0gc3RhdGUuYXZhaWxhYmxlVG9vbHMuZmlsdGVyKHQgPT4gdC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkpO1xuICAgICAgICBjb25zdCBjYXRlZ29yeURpc3BsYXlOYW1lID0gdGhpcy5nZXRDYXRlZ29yeURpc3BsYXlOYW1lKGNhdGVnb3J5KTtcblxuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtY2F0ZWdvcnlcIiBkYXRhLWNhdGVnb3J5PVwiJHtjYXRlZ29yeX1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2F0ZWdvcnktaGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxoNT4ke2NhdGVnb3J5RGlzcGxheU5hbWV9PC9oNT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhdGVnb3J5LWNvbnRyb2xzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGNsYXNzPVwic21hbGwgY2F0ZWdvcnktc2VsZWN0LWFsbFwiIGRhdGEtY2F0ZWdvcnk9XCIke2NhdGVnb3J5fVwiPuyghOyytCDshKDtg508L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b24gY2xhc3M9XCJzbWFsbCBjYXRlZ29yeS1kZXNlbGVjdC1hbGxcIiBkYXRhLWNhdGVnb3J5PVwiJHtjYXRlZ29yeX1cIj7soITssrQg7ISg7YOdIO2VtOygnDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC1pdGVtc1wiPlxuICAgICAgICAgICAgICAgICAgICAke3Rvb2xzLm1hcCh0b29sID0+IGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLWl0ZW1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktY2hlY2tib3hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ0b29sLWNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1jYXRlZ29yeT1cIiR7dG9vbC5jYXRlZ29yeX1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLXRvb2w9XCIke3Rvb2wubmFtZX1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke3Rvb2wuZW5hYmxlZCA/ICdjaGVja2VkJyA6ICcnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID48L3VpLWNoZWNrYm94PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLWluZm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtbmFtZVwiPiR7dG9vbC5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC1kZXNjcmlwdGlvblwiPiR7dG9vbC5kZXNjcmlwdGlvbn08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICBgKS5qb2luKCcnKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH0sXG4gICAgZ2V0Q2F0ZWdvcnlEaXNwbGF5TmFtZShjYXRlZ29yeTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgY2F0ZWdvcnlNYXA6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XG4gICAgICAgICAgICAnc2NlbmUnOiAn7JSsIOuPhOq1rCcsXG4gICAgICAgICAgICAnbm9kZSc6ICfrhbjrk5wg64+E6rWsJyxcbiAgICAgICAgICAgICdjb21wb25lbnQnOiAn7Lu07Y+s64SM7Yq4IOuPhOq1rCcsXG4gICAgICAgICAgICAncHJlZmFiJzogJ+2UhOumrO2MuSDrj4TqtawnLFxuICAgICAgICAgICAgJ2Fzc2V0JzogJ+yXkOyFiyDrj4TqtawnLFxuICAgICAgICAgICAgJ3Byb2plY3QnOiAn7ZSE66Gc7KCd7Yq4IOuPhOq1rCcsXG4gICAgICAgICAgICAnZGVidWcnOiAn65SU67KE6re4IOuPhOq1rCcsXG4gICAgICAgICAgICAnc2VydmVyJzogJ+yEnOuyhCDrj4TqtawnLFxuICAgICAgICAgICAgJ3ZhbGlkYXRpb24nOiAn6rKA7KadIOuPhOq1rCcsXG4gICAgICAgICAgICAnYnJvYWRjYXN0JzogJ+u4jOuhnOuTnOy6kOyKpO2KuCDrj4TqtawnLFxuICAgICAgICAgICAgJ3ByZWZlcmVuY2VzJzogJ+2ZmOqyvSDshKTsoJUg64+E6rWsJyxcbiAgICAgICAgICAgICdyZWZlcmVuY2UtaW1hZ2UnOiAn7LC47KGwIOydtOuvuOyngCDrj4TqtawnXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBjYXRlZ29yeU1hcFtjYXRlZ29yeV0gfHwgY2F0ZWdvcnk7XG4gICAgfSxcbiAgICBiaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcblxuICAgICAgICAvLyDpgInpobnljaHliIfmjaJcbiAgICAgICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGU6IE1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgdGFiQnV0dG9uID0gdGFyZ2V0LmNsb3Nlc3QoJy50YWItYnV0dG9uJyk7XG4gICAgICAgICAgICBpZiAodGFiQnV0dG9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFiID0gdGFiQnV0dG9uLmdldEF0dHJpYnV0ZSgnZGF0YS10YWInKTtcbiAgICAgICAgICAgICAgICBpZiAodGFiICYmICh0YWIgPT09ICdzZXJ2ZXInIHx8IHRhYiA9PT0gJ3Rvb2xzJykpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zd2l0Y2hUYWIodGFiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOacjeWKoeWZqOaOp+WItlxuICAgICAgICBjb25zdCB0b2dnbGVTZXJ2ZXJCdG4gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI3RvZ2dsZVNlcnZlckJ0bicpO1xuICAgICAgICBpZiAodG9nZ2xlU2VydmVyQnRuKSB7XG4gICAgICAgICAgICB0b2dnbGVTZXJ2ZXJCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi50b2dnbGVTZXJ2ZXIoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6K6+572u5L+d5a2YXG4gICAgICAgIGNvbnN0IHNhdmVTZXR0aW5nc0J0biA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjc2F2ZVNldHRpbmdzQnRuJyk7XG4gICAgICAgIGlmIChzYXZlU2V0dGluZ3NCdG4pIHtcbiAgICAgICAgICAgIHNhdmVTZXR0aW5nc0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVUkwg67O17IKsXG4gICAgICAgIGNvbnN0IGNvcHlVcmxCdG4gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI2NvcHlVcmxCdG4nKTtcbiAgICAgICAgaWYgKGNvcHlVcmxCdG4pIHtcbiAgICAgICAgICAgIGNvcHlVcmxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5jb3B5VXJsKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOiuvue9rui+k+WFpSDrs4Dqsr0g6rCQ7KeAXG4gICAgICAgIGNvbnN0IHBvcnRJbnB1dCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjcG9ydElucHV0JykgYXMgYW55O1xuICAgICAgICBpZiAocG9ydElucHV0KSB7XG4gICAgICAgICAgICBwb3J0SW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzLnBvcnQgPSBwYXJzZUludChwb3J0SW5wdXQudmFsdWUpIHx8IDMwMDA7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGF1dG9TdGFydENoZWNrYm94ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNhdXRvU3RhcnRDaGVja2JveCcpIGFzIGFueTtcbiAgICAgICAgaWYgKGF1dG9TdGFydENoZWNrYm94KSB7XG4gICAgICAgICAgICBhdXRvU3RhcnRDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3MuYXV0b1N0YXJ0ID0gYXV0b1N0YXJ0Q2hlY2tib3guY2hlY2tlZDtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVidWdMb2dDaGVja2JveCA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjZGVidWdMb2dDaGVja2JveCcpIGFzIGFueTtcbiAgICAgICAgaWYgKGRlYnVnTG9nQ2hlY2tib3gpIHtcbiAgICAgICAgICAgIGRlYnVnTG9nQ2hlY2tib3guYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzLmRlYnVnTG9nID0gZGVidWdMb2dDaGVja2JveC5jaGVja2VkO1xuICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtYXhDb25uZWN0aW9uc0lucHV0ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNtYXhDb25uZWN0aW9uc0lucHV0JykgYXMgYW55O1xuICAgICAgICBpZiAobWF4Q29ubmVjdGlvbnNJbnB1dCkge1xuICAgICAgICAgICAgbWF4Q29ubmVjdGlvbnNJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnMgPSBwYXJzZUludChtYXhDb25uZWN0aW9uc0lucHV0LnZhbHVlKSB8fCAxMDtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5bel5YW3566h55CGXG4gICAgICAgIGNvbnN0IHNlbGVjdEFsbEJ0biA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjc2VsZWN0QWxsQnRuJyk7XG4gICAgICAgIGlmIChzZWxlY3RBbGxCdG4pIHtcbiAgICAgICAgICAgIHNlbGVjdEFsbEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLnNlbGVjdEFsbFRvb2xzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRlc2VsZWN0QWxsQnRuID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNkZXNlbGVjdEFsbEJ0bicpO1xuICAgICAgICBpZiAoZGVzZWxlY3RBbGxCdG4pIHtcbiAgICAgICAgICAgIGRlc2VsZWN0QWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYuZGVzZWxlY3RBbGxUb29scygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzYXZlVG9vbHNCdG4gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI3NhdmVUb29sc0J0bicpO1xuICAgICAgICBpZiAoc2F2ZVRvb2xzQnRuKSB7XG4gICAgICAgICAgICBzYXZlVG9vbHNCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5zYXZlVG9vbHNDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWIhuexu+aOp+WItlxuICAgICAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBjYXRlZ29yeVNlbGVjdEFsbCA9IHRhcmdldC5jbG9zZXN0KCcuY2F0ZWdvcnktc2VsZWN0LWFsbCcpO1xuICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnlEZXNlbGVjdEFsbCA9IHRhcmdldC5jbG9zZXN0KCcuY2F0ZWdvcnktZGVzZWxlY3QtYWxsJyk7XG5cbiAgICAgICAgICAgIGlmIChjYXRlZ29yeVNlbGVjdEFsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gY2F0ZWdvcnlTZWxlY3RBbGwuZ2V0QXR0cmlidXRlKCdkYXRhLWNhdGVnb3J5Jyk7XG4gICAgICAgICAgICAgICAgaWYgKGNhdGVnb3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudG9nZ2xlQ2F0ZWdvcnlUb29scyhjYXRlZ29yeSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjYXRlZ29yeURlc2VsZWN0QWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSBjYXRlZ29yeURlc2VsZWN0QWxsLmdldEF0dHJpYnV0ZSgnZGF0YS1jYXRlZ29yeScpO1xuICAgICAgICAgICAgICAgIGlmIChjYXRlZ29yeSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRvZ2dsZUNhdGVnb3J5VG9vbHMoY2F0ZWdvcnksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIOW3peWFt+WkjemAieahhiDrs4Dqsr1cbiAgICAgICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBFdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBjaGVja2JveCA9IHRhcmdldC5jbG9zZXN0KCcudG9vbC1jaGVja2JveCcpO1xuICAgICAgICAgICAgaWYgKGNoZWNrYm94KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSBjaGVja2JveC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2F0ZWdvcnknKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0b29sTmFtZSA9IGNoZWNrYm94LmdldEF0dHJpYnV0ZSgnZGF0YS10b29sJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hlY2tlZCA9IChjaGVja2JveCBhcyBhbnkpLmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGNhdGVnb3J5ICYmIHRvb2xOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudXBkYXRlVG9vbFN0YXR1cyhjYXRlZ29yeSwgdG9vbE5hbWUsIGNoZWNrZWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzd2l0Y2hUYWIodGFiTmFtZTogJ3NlcnZlcicgfCAndG9vbHMnKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuICAgICAgICBzdGF0ZS5hY3RpdmVUYWIgPSB0YWJOYW1lO1xuXG4gICAgICAgIGlmICh0YWJOYW1lID09PSAndG9vbHMnKSB7XG4gICAgICAgICAgICBzZWxmLmxvYWRUb29sTWFuYWdlclN0YXRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb250YWluZXIgPSBzZWxmLiRhcHA7XG4gICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgfSxcbiAgICBhc3luYyB0b2dnbGVTZXJ2ZXIoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzdGF0ZS5pc1Byb2Nlc3NpbmcgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gc2VsZi4kYXBwO1xuICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG5cbiAgICAgICAgICAgIGlmIChzdGF0ZS5zZXJ2ZXJSdW5uaW5nKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdzdG9wLXNlcnZlcicpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50U2V0dGluZ3MgPSB7XG4gICAgICAgICAgICAgICAgICAgIHBvcnQ6IHN0YXRlLnNldHRpbmdzLnBvcnQsXG4gICAgICAgICAgICAgICAgICAgIGF1dG9TdGFydDogc3RhdGUuc2V0dGluZ3MuYXV0b1N0YXJ0LFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVEZWJ1Z0xvZzogc3RhdGUuc2V0dGluZ3MuZGVidWdMb2csXG4gICAgICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiBzdGF0ZS5zZXR0aW5ncy5tYXhDb25uZWN0aW9uc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtc2V0dGluZ3MnLCBjdXJyZW50U2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnc3RhcnQtc2VydmVyJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBTZXJ2ZXIgdG9nZ2xlZCcpO1xuICAgICAgICAgICAgYXdhaXQgc2VsZi51cGRhdGVTZXJ2ZXJTdGF0dXMoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byB0b2dnbGUgc2VydmVyOicsIGVycm9yKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHN0YXRlLmlzUHJvY2Vzc2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gc2VsZi4kYXBwO1xuICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNldHRpbmdzRGF0YSA9IHtcbiAgICAgICAgICAgICAgICBwb3J0OiBzdGF0ZS5zZXR0aW5ncy5wb3J0LFxuICAgICAgICAgICAgICAgIGF1dG9TdGFydDogc3RhdGUuc2V0dGluZ3MuYXV0b1N0YXJ0LFxuICAgICAgICAgICAgICAgIGRlYnVnTG9nOiBzdGF0ZS5zZXR0aW5ncy5kZWJ1Z0xvZyxcbiAgICAgICAgICAgICAgICBtYXhDb25uZWN0aW9uczogc3RhdGUuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnNcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXNldHRpbmdzJywgc2V0dGluZ3NEYXRhKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBTZXR0aW5ncyBzYXZlZCcpO1xuICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3NDaGFuZ2VkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHNlbGYuJGFwcDtcbiAgICAgICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIHNhdmUgc2V0dGluZ3M6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBjb3B5VXJsKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci5jbGlwYm9hcmQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dChzdGF0ZS5odHRwVXJsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGV4dGFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgICAgICAgICAgICAgIHRleHRhcmVhLnZhbHVlID0gc3RhdGUuaHR0cFVybDtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRleHRhcmVhKTtcbiAgICAgICAgICAgICAgICB0ZXh0YXJlYS5zZWxlY3QoKTtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGV4dGFyZWEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFVSTCBjb3BpZWQgdG8gY2xpcGJvYXJkJyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gY29weSBVUkw6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBsb2FkVG9vbE1hbmFnZXJTdGF0ZSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnZ2V0LXRvb2wtbWFuYWdlci1zdGF0ZScpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQudG9vbHMpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5hdmFpbGFibGVUb29scyA9IHJlc3VsdC50b29scztcbiAgICAgICAgICAgICAgICBzdGF0ZS50b29sQ2F0ZWdvcmllcyA9IEFycmF5LmZyb20obmV3IFNldChyZXN1bHQudG9vbHMubWFwKCh0OiBUb29sQ29uZmlnKSA9PiB0LmNhdGVnb3J5KSkpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gc2VsZi4kYXBwO1xuICAgICAgICAgICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byBsb2FkIHRvb2wgbWFuYWdlciBzdGF0ZTonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIHVwZGF0ZVRvb2xTdGF0dXMoY2F0ZWdvcnk6IHN0cmluZywgdG9vbE5hbWU6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtdG9vbC1zdGF0dXMnLCBjYXRlZ29yeSwgdG9vbE5hbWUsIGVuYWJsZWQpO1xuICAgICAgICAgICAgYXdhaXQgc2VsZi5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIHVwZGF0ZSB0b29sIHN0YXR1czonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIHRvZ2dsZUNhdGVnb3J5VG9vbHMoY2F0ZWdvcnk6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlcyA9IHN0YXRlLmF2YWlsYWJsZVRvb2xzXG4gICAgICAgICAgICAgICAgLmZpbHRlcigodDogVG9vbENvbmZpZykgPT4gdC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkpXG4gICAgICAgICAgICAgICAgLm1hcCgodDogVG9vbENvbmZpZykgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6IHQuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHQubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZW5hYmxlZFxuICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtdG9vbC1zdGF0dXMtYmF0Y2gnLCB1cGRhdGVzKTtcbiAgICAgICAgICAgIGF3YWl0IHNlbGYubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byB0b2dnbGUgY2F0ZWdvcnk6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBzZWxlY3RBbGxUb29scygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZXMgPSBzdGF0ZS5hdmFpbGFibGVUb29scy5tYXAoKHQ6IFRvb2xDb25maWcpID0+ICh7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6IHQuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgbmFtZTogdC5uYW1lLFxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWVcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtdG9vbC1zdGF0dXMtYmF0Y2gnLCB1cGRhdGVzKTtcbiAgICAgICAgICAgIGF3YWl0IHNlbGYubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byBzZWxlY3QgYWxsIHRvb2xzOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgZGVzZWxlY3RBbGxUb29scygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZXMgPSBzdGF0ZS5hdmFpbGFibGVUb29scy5tYXAoKHQ6IFRvb2xDb25maWcpID0+ICh7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6IHQuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgbmFtZTogdC5uYW1lLFxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXRvb2wtc3RhdHVzLWJhdGNoJywgdXBkYXRlcyk7XG4gICAgICAgICAgICBhd2FpdCBzZWxmLmxvYWRUb29sTWFuYWdlclN0YXRlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gZGVzZWxlY3QgYWxsIHRvb2xzOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgc2F2ZVRvb2xzQ2hhbmdlcygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gVG9vbHMgY2hhbmdlcyBzYXZlZCcpO1xuICAgICAgICAvLyDlt6Xlhbcg67OA6rK97IKs7ZWt7J2AIOymieyLnCDrsJjsmIHrkJjrr4DroZwg67OE64+EIOyggOyepSDroZzsp4Eg67aI7ZWE7JqUXG4gICAgfSxcbiAgICBhc3luYyB1cGRhdGVTZXJ2ZXJTdGF0dXMoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0dXMgPSBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2dldC1zZXJ2ZXItc3RhdHVzJyk7XG4gICAgICAgICAgICBpZiAoc3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2VydmVyUnVubmluZyA9IHN0YXR1cy5ydW5uaW5nIHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgIHN0YXRlLnNlcnZlclN0YXR1cyA9IHN0YXR1cy5ydW5uaW5nID8gJ+yLpO2WiSDspJEnIDogJ+ykkeyngOuQqCc7XG4gICAgICAgICAgICAgICAgc3RhdGUuY29ubmVjdGVkQ2xpZW50cyA9IHN0YXR1cy5jbGllbnRzIHx8IDA7XG4gICAgICAgICAgICAgICAgc3RhdGUuaHR0cFVybCA9IGBodHRwOi8vMTI3LjAuMC4xOiR7c3RhdHVzLnNldHRpbmdzPy5wb3J0IHx8IDMwMDB9L21jcGA7XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RhdHVzLnNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzLnBvcnQgPSBzdGF0dXMuc2V0dGluZ3MucG9ydCB8fCAzMDAwO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5hdXRvU3RhcnQgPSBzdGF0dXMuc2V0dGluZ3MuYXV0b1N0YXJ0IHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5kZWJ1Z0xvZyA9IHN0YXR1cy5zZXR0aW5ncy5kZWJ1Z0xvZyB8fCBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnMgPSBzdGF0dXMuc2V0dGluZ3MubWF4Q29ubmVjdGlvbnMgfHwgMTA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8g54q25oCB5pu05paw5pe26YeN5paw5riy5p+TXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gc2VsZi4kYXBwO1xuICAgICAgICAgICAgICAgIGlmIChjb250YWluZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gdXBkYXRlIHNlcnZlciBzdGF0dXM6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzZW5kSXBjUmVxdWVzdChwYWNrYWdlTmFtZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIC4uLmFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZnVsbE1lc3NhZ2UgPSBgJHtwYWNrYWdlTmFtZX06JHttZXNzYWdlfWA7XG4gICAgICAgICAgICAgICAgRWRpdG9yLklwYy5zZW5kVG9NYWluKGZ1bGxNZXNzYWdlLCAuLi5hcmdzLCAoZXJyb3I6IEVycm9yIHwgbnVsbCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgYmVmb3JlQ2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgaWYgKHNlbGYuc3RhdHVzVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5zdGF0dXNVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgICAgICBzZWxmLnN0YXR1c1VwZGF0ZUludGVydmFsID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgaWYgKHNlbGYuc3RhdHVzVXBkYXRlSW50ZXJ2YWwpIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5zdGF0dXNVcGRhdGVJbnRlcnZhbCk7XG4gICAgICAgICAgICBzZWxmLnN0YXR1c1VwZGF0ZUludGVydmFsID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG59KTtcbiJdfQ==