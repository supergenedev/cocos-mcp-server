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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL2RlZmF1bHQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLG1EQUFtRDs7QUFFbkQsdUNBQXdDO0FBQ3hDLCtCQUE0QjtBQWdDNUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEVBQUU7UUFDUCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQzNDLENBQUM7UUFDRCxJQUFJO1lBQ0EsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzVDLENBQUM7S0FDSjtJQUNELFFBQVEsRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLDZDQUE2QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQy9GLEtBQUssRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3hGLENBQUMsRUFBRTtRQUNDLEdBQUcsRUFBRSxNQUFNO1FBQ1gsVUFBVSxFQUFFLGFBQWE7S0FDNUI7SUFDRCxLQUFLLEVBQUU7UUFDSCxTQUFTLEVBQUUsUUFBOEI7UUFDekMsYUFBYSxFQUFFLEtBQUs7UUFDcEIsWUFBWSxFQUFFLEtBQUs7UUFDbkIsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixPQUFPLEVBQUUsRUFBRTtRQUNYLFlBQVksRUFBRSxLQUFLO1FBQ25CLFFBQVEsRUFBRTtZQUNOLElBQUksRUFBRSxJQUFJO1lBQ1YsU0FBUyxFQUFFLEtBQUs7WUFDaEIsUUFBUSxFQUFFLEtBQUs7WUFDZixjQUFjLEVBQUUsRUFBRTtTQUNyQjtRQUNELGNBQWMsRUFBRSxFQUFrQjtRQUNsQyxjQUFjLEVBQUUsRUFBYztRQUM5QixlQUFlLEVBQUUs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LE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNuQyxJQUFJLENBQUM7Z0JBQ0QsTUFBTSxXQUFXLEdBQUcsR0FBRyxXQUFXLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQ2hELE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLEtBQW1CLEVBQUUsTUFBVyxFQUFFLEVBQUU7b0JBQzdFLElBQUksS0FBSyxFQUFFLENBQUM7d0JBQ1IsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNsQixDQUFDO3lCQUFNLENBQUM7d0JBQ0osT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNwQixDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2xCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFDRCxXQUFXO1FBQ1AsTUFBTSxJQUFJLEdBQUcsSUFBVyxDQUFDO1FBQ3pCLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDNUIsYUFBYSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7UUFDckMsQ0FBQztJQUNMLENBQUM7SUFDRCxLQUFLO1FBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBVyxDQUFDO1FBQ3pCLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDNUIsYUFBYSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7UUFDckMsQ0FBQztJQUNMLENBQUM7Q0FDSixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vdHlwZXMvZWRpdG9yLTJ4LmQudHNcIiAvPlxuXG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XG5cbi8vIOWumuS5ieW3peWFt+mFjee9ruaOpeWPo1xuaW50ZXJmYWNlIFRvb2xDb25maWcge1xuICAgIGNhdGVnb3J5OiBzdHJpbmc7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbn1cblxuLy8g5a6a5LmJ5pyN5Yqh5Zmo6K6+572u5o6l5Y+jXG5pbnRlcmZhY2UgU2VydmVyU2V0dGluZ3Mge1xuICAgIHBvcnQ6IG51bWJlcjtcbiAgICBhdXRvU3RhcnQ6IGJvb2xlYW47XG4gICAgZGVidWdMb2c6IGJvb2xlYW47XG4gICAgbWF4Q29ubmVjdGlvbnM6IG51bWJlcjtcbn1cblxuLy8g54q25oCB566h55CGXG5pbnRlcmZhY2UgQXBwU3RhdGUge1xuICAgIGFjdGl2ZVRhYjogJ3NlcnZlcicgfCAndG9vbHMnO1xuICAgIHNlcnZlclJ1bm5pbmc6IGJvb2xlYW47XG4gICAgc2VydmVyU3RhdHVzOiBzdHJpbmc7XG4gICAgY29ubmVjdGVkQ2xpZW50czogbnVtYmVyO1xuICAgIGh0dHBVcmw6IHN0cmluZztcbiAgICBpc1Byb2Nlc3Npbmc6IGJvb2xlYW47XG4gICAgc2V0dGluZ3M6IFNlcnZlclNldHRpbmdzO1xuICAgIGF2YWlsYWJsZVRvb2xzOiBUb29sQ29uZmlnW107XG4gICAgdG9vbENhdGVnb3JpZXM6IHN0cmluZ1tdO1xuICAgIHNldHRpbmdzQ2hhbmdlZDogYm9vbGVhbjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3IuUGFuZWwuZXh0ZW5kKHtcbiAgICBsaXN0ZW5lcnM6IHtcbiAgICAgICAgc2hvdygpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBQYW5lbCBzaG93bicpO1xuICAgICAgICB9LFxuICAgICAgICBoaWRlKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFBhbmVsIGhpZGRlbicpO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgdGVtcGxhdGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYy90ZW1wbGF0ZS9kZWZhdWx0L2luZGV4Lmh0bWwnKSwgJ3V0Zi04JyksXG4gICAgc3R5bGU6IHJlYWRGaWxlU3luYyhqb2luKF9fZGlybmFtZSwgJy4uLy4uLy4uL3N0YXRpYy9zdHlsZS9kZWZhdWx0L2luZGV4LmNzcycpLCAndXRmLTgnKSxcbiAgICAkOiB7XG4gICAgICAgIGFwcDogJyNhcHAnLFxuICAgICAgICBwYW5lbFRpdGxlOiAnI3BhbmVsVGl0bGUnLFxuICAgIH0sXG4gICAgc3RhdGU6IHtcbiAgICAgICAgYWN0aXZlVGFiOiAnc2VydmVyJyBhcyAnc2VydmVyJyB8ICd0b29scycsXG4gICAgICAgIHNlcnZlclJ1bm5pbmc6IGZhbHNlLFxuICAgICAgICBzZXJ2ZXJTdGF0dXM6ICfspJHsp4DrkKgnLFxuICAgICAgICBjb25uZWN0ZWRDbGllbnRzOiAwLFxuICAgICAgICBodHRwVXJsOiAnJyxcbiAgICAgICAgaXNQcm9jZXNzaW5nOiBmYWxzZSxcbiAgICAgICAgc2V0dGluZ3M6IHtcbiAgICAgICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICAgICAgICBhdXRvU3RhcnQ6IGZhbHNlLFxuICAgICAgICAgICAgZGVidWdMb2c6IGZhbHNlLFxuICAgICAgICAgICAgbWF4Q29ubmVjdGlvbnM6IDEwXG4gICAgICAgIH0sXG4gICAgICAgIGF2YWlsYWJsZVRvb2xzOiBbXSBhcyBUb29sQ29uZmlnW10sXG4gICAgICAgIHRvb2xDYXRlZ29yaWVzOiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgICAgc2V0dGluZ3NDaGFuZ2VkOiBmYWxzZVxuICAgIH0gYXMgQXBwU3RhdGUsXG4gICAgc3RhdHVzVXBkYXRlSW50ZXJ2YWw6IG51bGwgYXMgTm9kZUpTLlRpbWVvdXQgfCBudWxsLFxuICAgIHJlYWR5KCkge1xuICAgICAgICBjb25zdCBhcHBFbGVtZW50ID0gKHRoaXMgYXMgYW55KS4kYXBwO1xuICAgICAgICBpZiAoYXBwRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5pbml0QXBwKGFwcEVsZW1lbnQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIEFwcCBpbml0aWFsaXplZCcpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBpbml0QXBwKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgLy8g5Yid5aeL5riy5p+TXG4gICAgICAgIHRoaXMucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG5cbiAgICAgICAgLy8g5Yid5aeL54q25oCB5Yqg6L29XG4gICAgICAgIHRoaXMudXBkYXRlU2VydmVyU3RhdHVzKCk7XG5cbiAgICAgICAgLy8g5a6a5pyf5pu05paw5pyN5Yqh5Zmo54q25oCBXG4gICAgICAgIHRoaXMuc3RhdHVzVXBkYXRlSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNlcnZlclN0YXR1cygpO1xuICAgICAgICB9LCAyMDAwKTtcbiAgICB9LFxuICAgIHJlbmRlcihjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gKHRoaXMgYXMgYW55KS5zdGF0ZSBhcyBBcHBTdGF0ZTtcbiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IHRoaXMuZ2V0QXBwSFRNTChzdGF0ZSk7XG4gICAgfSxcbiAgICBnZXRBcHBIVE1MKHN0YXRlOiBBcHBTdGF0ZSk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwibWNwLWFwcFwiPlxuICAgICAgICAgICAgICAgICR7dGhpcy5nZXRUYWJOYXZpZ2F0aW9uSFRNTChzdGF0ZSl9XG4gICAgICAgICAgICAgICAgJHtzdGF0ZS5hY3RpdmVUYWIgPT09ICdzZXJ2ZXInID8gdGhpcy5nZXRTZXJ2ZXJUYWJIVE1MKHN0YXRlKSA6IHRoaXMuZ2V0VG9vbHNUYWJIVE1MKHN0YXRlKX1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICBgO1xuICAgIH0sXG4gICAgZ2V0VGFiTmF2aWdhdGlvbkhUTUwoc3RhdGU6IEFwcFN0YXRlKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0YWItbmF2aWdhdGlvblwiPlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJ0YWItYnV0dG9uICR7c3RhdGUuYWN0aXZlVGFiID09PSAnc2VydmVyJyA/ICdhY3RpdmUnIDogJyd9XCIgZGF0YS10YWI9XCJzZXJ2ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4+7ISc67KEPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJ0YWItYnV0dG9uICR7c3RhdGUuYWN0aXZlVGFiID09PSAndG9vbHMnID8gJ2FjdGl2ZScgOiAnJ31cIiBkYXRhLXRhYj1cInRvb2xzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuPuuPhOq1rCDqtIDrpqw8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgYDtcbiAgICB9LFxuICAgIGdldFNlcnZlclRhYkhUTUwoc3RhdGU6IEFwcFN0YXRlKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0YWItY29udGVudFwiPlxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzPVwic2VydmVyLXN0YXR1c1wiPlxuICAgICAgICAgICAgICAgICAgICA8aDM+7ISc67KEIOyDge2DnDwvaDM+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJzdGF0dXMtaW5mb1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJsYWJlbFwiPuyDge2DnDwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJjb250ZW50XCIgY2xhc3M9XCJzdGF0dXMtdmFsdWUgJHtzdGF0ZS5zZXJ2ZXJSdW5uaW5nID8gJ3N0YXR1cy1ydW5uaW5nJyA6ICdzdGF0dXMtc3RvcHBlZCd9XCI+JHtzdGF0ZS5zZXJ2ZXJTdGF0dXN9PC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICR7c3RhdGUuc2VydmVyUnVubmluZyA/IGBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWxhYmVsIHNsb3Q9XCJsYWJlbFwiPuyXsOqysCDsiJg8L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImNvbnRlbnRcIj4ke3N0YXRlLmNvbm5lY3RlZENsaWVudHN9PC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICBgIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cblxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzPVwic2VydmVyLWNvbnRyb2xzXCI+XG4gICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b24gaWQ9XCJ0b2dnbGVTZXJ2ZXJCdG5cIiBjbGFzcz1cInByaW1hcnlcIiAke3N0YXRlLmlzUHJvY2Vzc2luZyA/ICdkaXNhYmxlZCcgOiAnJ30+XG4gICAgICAgICAgICAgICAgICAgICAgICAke3N0YXRlLnNlcnZlclJ1bm5pbmcgPyAn7ISc67KEIOykkeyngCcgOiAn7ISc67KEIOyLnOyekSd9XG4gICAgICAgICAgICAgICAgICAgIDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cblxuICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzPVwic2VydmVyLXNldHRpbmdzXCI+XG4gICAgICAgICAgICAgICAgICAgIDxoMz7shJzrsoQg7ISk7KCVPC9oMz5cbiAgICAgICAgICAgICAgICAgICAgPHVpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+7Y+s7Yq4PC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1udW0taW5wdXQgc2xvdD1cImNvbnRlbnRcIiBpZD1cInBvcnRJbnB1dFwiIHZhbHVlPVwiJHtzdGF0ZS5zZXR0aW5ncy5wb3J0fVwiIG1pbj1cIjEwMjRcIiBtYXg9XCI2NTUzNVwiIHN0ZXA9XCIxXCIgJHtzdGF0ZS5zZXJ2ZXJSdW5uaW5nID8gJ2Rpc2FibGVkJyA6ICcnfT48L3VpLW51bS1pbnB1dD5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICA8dWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1sYWJlbCBzbG90PVwibGFiZWxcIj7snpDrj5kg7Iuc7J6RPC91aS1sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1jaGVja2JveCBzbG90PVwiY29udGVudFwiIGlkPVwiYXV0b1N0YXJ0Q2hlY2tib3hcIiAke3N0YXRlLnNldHRpbmdzLmF1dG9TdGFydCA/ICdjaGVja2VkJyA6ICcnfSAke3N0YXRlLnNlcnZlclJ1bm5pbmcgPyAnZGlzYWJsZWQnIDogJyd9PjwvdWktY2hlY2tib3g+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgPHVpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+65SU67KE6re4IOuhnOq3uDwvdWktbGFiZWw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktY2hlY2tib3ggc2xvdD1cImNvbnRlbnRcIiBpZD1cImRlYnVnTG9nQ2hlY2tib3hcIiAke3N0YXRlLnNldHRpbmdzLmRlYnVnTG9nID8gJ2NoZWNrZWQnIDogJyd9PjwvdWktY2hlY2tib3g+XG4gICAgICAgICAgICAgICAgICAgIDwvdWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgPHVpLXByb3A+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+7LWc64yAIOyXsOqysCDsiJg8L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLW51bS1pbnB1dCBzbG90PVwiY29udGVudFwiIGlkPVwibWF4Q29ubmVjdGlvbnNJbnB1dFwiIHZhbHVlPVwiJHtzdGF0ZS5zZXR0aW5ncy5tYXhDb25uZWN0aW9uc31cIiBtaW49XCIxXCIgbWF4PVwiMTAwXCIgc3RlcD1cIjFcIj48L3VpLW51bS1pbnB1dD5cbiAgICAgICAgICAgICAgICAgICAgPC91aS1wcm9wPlxuICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cblxuICAgICAgICAgICAgICAgICR7c3RhdGUuc2VydmVyUnVubmluZyA/IGBcbiAgICAgICAgICAgICAgICAgICAgPHNlY3Rpb24gY2xhc3M9XCJzZXJ2ZXItaW5mb1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGgzPuyXsOqysCDsoJXrs7Q8L2gzPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbm5lY3Rpb24tZGV0YWlsc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1wcm9wPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktbGFiZWwgc2xvdD1cImxhYmVsXCI+SFRUUCBVUkw8L3VpLWxhYmVsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktaW5wdXQgc2xvdD1cImNvbnRlbnRcIiB2YWx1ZT1cIiR7c3RhdGUuaHR0cFVybH1cIiByZWFkb25seT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b24gc2xvdD1cInN1ZmZpeFwiIGlkPVwiY29weVVybEJ0blwiPuuzteyCrDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3VpLWlucHV0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdWktcHJvcD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICAgICAgICAgYCA6ICcnfVxuXG4gICAgICAgICAgICAgICAgPGZvb3Rlcj5cbiAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBpZD1cInNhdmVTZXR0aW5nc0J0blwiICR7IXN0YXRlLnNldHRpbmdzQ2hhbmdlZCA/ICdkaXNhYmxlZCcgOiAnJ30+7ISk7KCVIOyggOyepTwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZm9vdGVyPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfSxcbiAgICBnZXRUb29sc1RhYkhUTUwoc3RhdGU6IEFwcFN0YXRlKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgdG90YWxUb29scyA9IHN0YXRlLmF2YWlsYWJsZVRvb2xzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgZW5hYmxlZFRvb2xzID0gc3RhdGUuYXZhaWxhYmxlVG9vbHMuZmlsdGVyKHQgPT4gdC5lbmFibGVkKS5sZW5ndGg7XG4gICAgICAgIGNvbnN0IGRpc2FibGVkVG9vbHMgPSB0b3RhbFRvb2xzIC0gZW5hYmxlZFRvb2xzO1xuXG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidGFiLWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzcz1cInRvb2wtbWFuYWdlclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC1tYW5hZ2VyLWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGgzPuuPhOq1rCDqtIDrpqw8L2gzPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbHMtc2VjdGlvblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2xzLXNlY3Rpb24taGVhZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2xzLXNlY3Rpb24tdGl0bGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGg0PuyCrOyaqSDqsIDriqXtlZwg64+E6rWsPC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2xzLXN0YXRzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke3RvdGFsVG9vbHN96rCcIOuPhOq1rFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCR7ZW5hYmxlZFRvb2xzfSDtmZzshLHtmZQgLyAke2Rpc2FibGVkVG9vbHN9IOu5hO2ZnOyEse2ZlClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2xzLXNlY3Rpb24tY29udHJvbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBpZD1cInNlbGVjdEFsbEJ0blwiIGNsYXNzPVwic21hbGxcIj7soITssrQg7ISg7YOdPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b24gaWQ9XCJkZXNlbGVjdEFsbEJ0blwiIGNsYXNzPVwic21hbGxcIj7soITssrQg7ISg7YOdIO2VtOygnDwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dWktYnV0dG9uIGlkPVwic2F2ZVRvb2xzQnRuXCIgY2xhc3M9XCJwcmltYXJ5XCI+67OA6rK9IOyCrO2VrSDsoIDsnqU8L3VpLWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbHMtY29udGFpbmVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtzdGF0ZS50b29sQ2F0ZWdvcmllcy5tYXAoY2F0ZWdvcnkgPT4gdGhpcy5nZXRDYXRlZ29yeUhUTUwoY2F0ZWdvcnksIHN0YXRlKSkuam9pbignJyl9XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9zZWN0aW9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfSxcbiAgICBnZXRDYXRlZ29yeUhUTUwoY2F0ZWdvcnk6IHN0cmluZywgc3RhdGU6IEFwcFN0YXRlKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgdG9vbHMgPSBzdGF0ZS5hdmFpbGFibGVUb29scy5maWx0ZXIodCA9PiB0LmNhdGVnb3J5ID09PSBjYXRlZ29yeSk7XG4gICAgICAgIGNvbnN0IGNhdGVnb3J5RGlzcGxheU5hbWUgPSB0aGlzLmdldENhdGVnb3J5RGlzcGxheU5hbWUoY2F0ZWdvcnkpO1xuXG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC1jYXRlZ29yeVwiIGRhdGEtY2F0ZWdvcnk9XCIke2NhdGVnb3J5fVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXRlZ29yeS1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGg1PiR7Y2F0ZWdvcnlEaXNwbGF5TmFtZX08L2g1PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2F0ZWdvcnktY29udHJvbHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1idXR0b24gY2xhc3M9XCJzbWFsbCBjYXRlZ29yeS1zZWxlY3QtYWxsXCIgZGF0YS1jYXRlZ29yeT1cIiR7Y2F0ZWdvcnl9XCI+7KCE7LK0IOyEoO2DnTwvdWktYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHVpLWJ1dHRvbiBjbGFzcz1cInNtYWxsIGNhdGVnb3J5LWRlc2VsZWN0LWFsbFwiIGRhdGEtY2F0ZWdvcnk9XCIke2NhdGVnb3J5fVwiPuyghOyytCDshKDtg50g7ZW07KCcPC91aS1idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLWl0ZW1zXCI+XG4gICAgICAgICAgICAgICAgICAgICR7dG9vbHMubWFwKHRvb2wgPT4gYFxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtaXRlbVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx1aS1jaGVja2JveFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInRvb2wtY2hlY2tib3hcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLWNhdGVnb3J5PVwiJHt0b29sLmNhdGVnb3J5fVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtdG9vbD1cIiR7dG9vbC5uYW1lfVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7dG9vbC5lbmFibGVkID8gJ2NoZWNrZWQnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPjwvdWktY2hlY2tib3g+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtaW5mb1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC1uYW1lXCI+JHt0b29sLm5hbWV9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLWRlc2NyaXB0aW9uXCI+JHt0b29sLmRlc2NyaXB0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIGApLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGA7XG4gICAgfSxcbiAgICBnZXRDYXRlZ29yeURpc3BsYXlOYW1lKGNhdGVnb3J5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBjYXRlZ29yeU1hcDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcbiAgICAgICAgICAgICdzY2VuZSc6ICfslKwg64+E6rWsJyxcbiAgICAgICAgICAgICdub2RlJzogJ+uFuOuTnCDrj4TqtawnLFxuICAgICAgICAgICAgJ2NvbXBvbmVudCc6ICfsu7Ttj6zrhIztirgg64+E6rWsJyxcbiAgICAgICAgICAgICdwcmVmYWInOiAn7ZSE66as7Yy5IOuPhOq1rCcsXG4gICAgICAgICAgICAnYXNzZXQnOiAn7JeQ7IWLIOuPhOq1rCcsXG4gICAgICAgICAgICAncHJvamVjdCc6ICftlITroZzsoJ3tirgg64+E6rWsJyxcbiAgICAgICAgICAgICdkZWJ1Zyc6ICfrlJTrsoTqt7gg64+E6rWsJyxcbiAgICAgICAgICAgICdzZXJ2ZXInOiAn7ISc67KEIOuPhOq1rCcsXG4gICAgICAgICAgICAndmFsaWRhdGlvbic6ICfqsoDspp0g64+E6rWsJyxcbiAgICAgICAgICAgICdicm9hZGNhc3QnOiAn67iM66Gc65Oc7LqQ7Iqk7Yq4IOuPhOq1rCcsXG4gICAgICAgICAgICAncHJlZmVyZW5jZXMnOiAn7ZmY6rK9IOyEpOyglSDrj4TqtawnLFxuICAgICAgICAgICAgJ3JlZmVyZW5jZS1pbWFnZSc6ICfssLjsobAg7J2066+47KeAIOuPhOq1rCdcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGNhdGVnb3J5TWFwW2NhdGVnb3J5XSB8fCBjYXRlZ29yeTtcbiAgICB9LFxuICAgIGJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIC8vIOmAiemhueWNoeWIh+aNolxuICAgICAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZTogTW91c2VFdmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCB0YWJCdXR0b24gPSB0YXJnZXQuY2xvc2VzdCgnLnRhYi1idXR0b24nKTtcbiAgICAgICAgICAgIGlmICh0YWJCdXR0b24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YWIgPSB0YWJCdXR0b24uZ2V0QXR0cmlidXRlKCdkYXRhLXRhYicpO1xuICAgICAgICAgICAgICAgIGlmICh0YWIgJiYgKHRhYiA9PT0gJ3NlcnZlcicgfHwgdGFiID09PSAndG9vbHMnKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnN3aXRjaFRhYih0YWIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5pyN5Yqh5Zmo5o6n5Yi2XG4gICAgICAgIGNvbnN0IHRvZ2dsZVNlcnZlckJ0biA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjdG9nZ2xlU2VydmVyQnRuJyk7XG4gICAgICAgIGlmICh0b2dnbGVTZXJ2ZXJCdG4pIHtcbiAgICAgICAgICAgIHRvZ2dsZVNlcnZlckJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLnRvZ2dsZVNlcnZlcigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDorr7nva7kv53lrZhcbiAgICAgICAgY29uc3Qgc2F2ZVNldHRpbmdzQnRuID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNzYXZlU2V0dGluZ3NCdG4nKTtcbiAgICAgICAgaWYgKHNhdmVTZXR0aW5nc0J0bikge1xuICAgICAgICAgICAgc2F2ZVNldHRpbmdzQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYuc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVSTCDrs7XsgqxcbiAgICAgICAgY29uc3QgY29weVVybEJ0biA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjY29weVVybEJ0bicpO1xuICAgICAgICBpZiAoY29weVVybEJ0bikge1xuICAgICAgICAgICAgY29weVVybEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLmNvcHlVcmwoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6K6+572u6L6T5YWlIOuzgOqyvSDqsJDsp4BcbiAgICAgICAgY29uc3QgcG9ydElucHV0ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNwb3J0SW5wdXQnKSBhcyBhbnk7XG4gICAgICAgIGlmIChwb3J0SW5wdXQpIHtcbiAgICAgICAgICAgIHBvcnRJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3MucG9ydCA9IHBhcnNlSW50KHBvcnRJbnB1dC52YWx1ZSkgfHwgMzAwMDtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5nc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHNlbGYucmVuZGVyKGNvbnRhaW5lcik7XG4gICAgICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgYXV0b1N0YXJ0Q2hlY2tib3ggPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI2F1dG9TdGFydENoZWNrYm94JykgYXMgYW55O1xuICAgICAgICBpZiAoYXV0b1N0YXJ0Q2hlY2tib3gpIHtcbiAgICAgICAgICAgIGF1dG9TdGFydENoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5hdXRvU3RhcnQgPSBhdXRvU3RhcnRDaGVja2JveC5jaGVja2VkO1xuICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkZWJ1Z0xvZ0NoZWNrYm94ID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNkZWJ1Z0xvZ0NoZWNrYm94JykgYXMgYW55O1xuICAgICAgICBpZiAoZGVidWdMb2dDaGVja2JveCkge1xuICAgICAgICAgICAgZGVidWdMb2dDaGVja2JveC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3MuZGVidWdMb2cgPSBkZWJ1Z0xvZ0NoZWNrYm94LmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1heENvbm5lY3Rpb25zSW5wdXQgPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI21heENvbm5lY3Rpb25zSW5wdXQnKSBhcyBhbnk7XG4gICAgICAgIGlmIChtYXhDb25uZWN0aW9uc0lucHV0KSB7XG4gICAgICAgICAgICBtYXhDb25uZWN0aW9uc0lucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5tYXhDb25uZWN0aW9ucyA9IHBhcnNlSW50KG1heENvbm5lY3Rpb25zSW5wdXQudmFsdWUpIHx8IDEwO1xuICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDlt6XlhbfnrqHnkIZcbiAgICAgICAgY29uc3Qgc2VsZWN0QWxsQnRuID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJyNzZWxlY3RBbGxCdG4nKTtcbiAgICAgICAgaWYgKHNlbGVjdEFsbEJ0bikge1xuICAgICAgICAgICAgc2VsZWN0QWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYuc2VsZWN0QWxsVG9vbHMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZGVzZWxlY3RBbGxCdG4gPSBjb250YWluZXIucXVlcnlTZWxlY3RvcignI2Rlc2VsZWN0QWxsQnRuJyk7XG4gICAgICAgIGlmIChkZXNlbGVjdEFsbEJ0bikge1xuICAgICAgICAgICAgZGVzZWxlY3RBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZi5kZXNlbGVjdEFsbFRvb2xzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNhdmVUb29sc0J0biA9IGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcjc2F2ZVRvb2xzQnRuJyk7XG4gICAgICAgIGlmIChzYXZlVG9vbHNCdG4pIHtcbiAgICAgICAgICAgIHNhdmVUb29sc0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICAgICAgICBzZWxmLnNhdmVUb29sc0NoYW5nZXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5YiG57G75o6n5Yi2XG4gICAgICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlOiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5U2VsZWN0QWxsID0gdGFyZ2V0LmNsb3Nlc3QoJy5jYXRlZ29yeS1zZWxlY3QtYWxsJyk7XG4gICAgICAgICAgICBjb25zdCBjYXRlZ29yeURlc2VsZWN0QWxsID0gdGFyZ2V0LmNsb3Nlc3QoJy5jYXRlZ29yeS1kZXNlbGVjdC1hbGwnKTtcblxuICAgICAgICAgICAgaWYgKGNhdGVnb3J5U2VsZWN0QWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSBjYXRlZ29yeVNlbGVjdEFsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2F0ZWdvcnknKTtcbiAgICAgICAgICAgICAgICBpZiAoY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50b2dnbGVDYXRlZ29yeVRvb2xzKGNhdGVnb3J5LCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNhdGVnb3J5RGVzZWxlY3RBbGwpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IGNhdGVnb3J5RGVzZWxlY3RBbGwuZ2V0QXR0cmlidXRlKCdkYXRhLWNhdGVnb3J5Jyk7XG4gICAgICAgICAgICAgICAgaWYgKGNhdGVnb3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudG9nZ2xlQ2F0ZWdvcnlUb29scyhjYXRlZ29yeSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5bel5YW35aSN6YCJ5qGGIOuzgOqyvVxuICAgICAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKGU6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgICAgIGNvbnN0IGNoZWNrYm94ID0gdGFyZ2V0LmNsb3Nlc3QoJy50b29sLWNoZWNrYm94Jyk7XG4gICAgICAgICAgICBpZiAoY2hlY2tib3gpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IGNoZWNrYm94LmdldEF0dHJpYnV0ZSgnZGF0YS1jYXRlZ29yeScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvb2xOYW1lID0gY2hlY2tib3guZ2V0QXR0cmlidXRlKCdkYXRhLXRvb2wnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkID0gKGNoZWNrYm94IGFzIGFueSkuY2hlY2tlZDtcbiAgICAgICAgICAgICAgICBpZiAoY2F0ZWdvcnkgJiYgdG9vbE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi51cGRhdGVUb29sU3RhdHVzKGNhdGVnb3J5LCB0b29sTmFtZSwgY2hlY2tlZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHN3aXRjaFRhYih0YWJOYW1lOiAnc2VydmVyJyB8ICd0b29scycpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG4gICAgICAgIHN0YXRlLmFjdGl2ZVRhYiA9IHRhYk5hbWU7XG5cbiAgICAgICAgaWYgKHRhYk5hbWUgPT09ICd0b29scycpIHtcbiAgICAgICAgICAgIHNlbGYubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHNlbGYuJGFwcDtcbiAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICB9LFxuICAgIGFzeW5jIHRvZ2dsZVNlcnZlcigpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHN0YXRlLmlzUHJvY2Vzc2luZyA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBzZWxmLiRhcHA7XG4gICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcblxuICAgICAgICAgICAgaWYgKHN0YXRlLnNlcnZlclJ1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3N0b3Atc2VydmVyJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRTZXR0aW5ncyA9IHtcbiAgICAgICAgICAgICAgICAgICAgcG9ydDogc3RhdGUuc2V0dGluZ3MucG9ydCxcbiAgICAgICAgICAgICAgICAgICAgYXV0b1N0YXJ0OiBzdGF0ZS5zZXR0aW5ncy5hdXRvU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZURlYnVnTG9nOiBzdGF0ZS5zZXR0aW5ncy5kZWJ1Z0xvZyxcbiAgICAgICAgICAgICAgICAgICAgbWF4Q29ubmVjdGlvbnM6IHN0YXRlLnNldHRpbmdzLm1heENvbm5lY3Rpb25zXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS1zZXR0aW5ncycsIGN1cnJlbnRTZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdzdGFydC1zZXJ2ZXInKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFNlcnZlciB0b2dnbGVkJyk7XG4gICAgICAgICAgICBhd2FpdCBzZWxmLnVwZGF0ZVNlcnZlclN0YXR1cygpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIHRvZ2dsZSBzZXJ2ZXI6JywgZXJyb3IpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgc3RhdGUuaXNQcm9jZXNzaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBzZWxmLiRhcHA7XG4gICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgc2VsZi5iaW5kRXZlbnRMaXN0ZW5lcnMoY29udGFpbmVyKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3NEYXRhID0ge1xuICAgICAgICAgICAgICAgIHBvcnQ6IHN0YXRlLnNldHRpbmdzLnBvcnQsXG4gICAgICAgICAgICAgICAgYXV0b1N0YXJ0OiBzdGF0ZS5zZXR0aW5ncy5hdXRvU3RhcnQsXG4gICAgICAgICAgICAgICAgZGVidWdMb2c6IHN0YXRlLnNldHRpbmdzLmRlYnVnTG9nLFxuICAgICAgICAgICAgICAgIG1heENvbm5lY3Rpb25zOiBzdGF0ZS5zZXR0aW5ncy5tYXhDb25uZWN0aW9uc1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtc2V0dGluZ3MnLCBzZXR0aW5nc0RhdGEpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1tNQ1AgUGFuZWxdIFNldHRpbmdzIHNhdmVkJyk7XG4gICAgICAgICAgICBzdGF0ZS5zZXR0aW5nc0NoYW5nZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gc2VsZi4kYXBwO1xuICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgIHNlbGYuYmluZEV2ZW50TGlzdGVuZXJzKGNvbnRhaW5lcik7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gc2F2ZSBzZXR0aW5nczonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIGNvcHlVcmwoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCcgJiYgbmF2aWdhdG9yLmNsaXBib2FyZCkge1xuICAgICAgICAgICAgICAgIGF3YWl0IG5hdmlnYXRvci5jbGlwYm9hcmQud3JpdGVUZXh0KHN0YXRlLmh0dHBVcmwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0ZXh0YXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgICAgICAgICAgICAgdGV4dGFyZWEudmFsdWUgPSBzdGF0ZS5odHRwVXJsO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGV4dGFyZWEpO1xuICAgICAgICAgICAgICAgIHRleHRhcmVhLnNlbGVjdCgpO1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0ZXh0YXJlYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW01DUCBQYW5lbF0gVVJMIGNvcGllZCB0byBjbGlwYm9hcmQnKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byBjb3B5IFVSTDonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIGxvYWRUb29sTWFuYWdlclN0YXRlKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdnZXQtdG9vbC1tYW5hZ2VyLXN0YXRlJyk7XG4gICAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC50b29scykge1xuICAgICAgICAgICAgICAgIHN0YXRlLmF2YWlsYWJsZVRvb2xzID0gcmVzdWx0LnRvb2xzO1xuICAgICAgICAgICAgICAgIHN0YXRlLnRvb2xDYXRlZ29yaWVzID0gQXJyYXkuZnJvbShuZXcgU2V0KHJlc3VsdC50b29scy5tYXAoKHQ6IFRvb2xDb25maWcpID0+IHQuY2F0ZWdvcnkpKSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBzZWxmLiRhcHA7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW5kZXIoY29udGFpbmVyKTtcbiAgICAgICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIGxvYWQgdG9vbCBtYW5hZ2VyIHN0YXRlOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgdXBkYXRlVG9vbFN0YXR1cyhjYXRlZ29yeTogc3RyaW5nLCB0b29sTmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLXN0YXR1cycsIGNhdGVnb3J5LCB0b29sTmFtZSwgZW5hYmxlZCk7XG4gICAgICAgICAgICBhd2FpdCBzZWxmLmxvYWRUb29sTWFuYWdlclN0YXRlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbTUNQIFBhbmVsXSBGYWlsZWQgdG8gdXBkYXRlIHRvb2wgc3RhdHVzOicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYXN5bmMgdG9nZ2xlQ2F0ZWdvcnlUb29scyhjYXRlZ29yeTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzIGFzIGFueTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBzZWxmLnN0YXRlIGFzIEFwcFN0YXRlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gc3RhdGUuYXZhaWxhYmxlVG9vbHNcbiAgICAgICAgICAgICAgICAuZmlsdGVyKCh0OiBUb29sQ29uZmlnKSA9PiB0LmNhdGVnb3J5ID09PSBjYXRlZ29yeSlcbiAgICAgICAgICAgICAgICAubWFwKCh0OiBUb29sQ29uZmlnKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogdC5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBlbmFibGVkXG4gICAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLXN0YXR1cy1iYXRjaCcsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgYXdhaXQgc2VsZi5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIHRvZ2dsZSBjYXRlZ29yeTonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGFzeW5jIHNlbGVjdEFsbFRvb2xzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlcyA9IHN0YXRlLmF2YWlsYWJsZVRvb2xzLm1hcCgodDogVG9vbENvbmZpZykgPT4gKHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogdC5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0Lm5hbWUsXG4gICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBhd2FpdCBzZWxmLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLXN0YXR1cy1iYXRjaCcsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgYXdhaXQgc2VsZi5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW01DUCBQYW5lbF0gRmFpbGVkIHRvIHNlbGVjdCBhbGwgdG9vbHM6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBkZXNlbGVjdEFsbFRvb2xzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gc2VsZi5zdGF0ZSBhcyBBcHBTdGF0ZTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgdXBkYXRlcyA9IHN0YXRlLmF2YWlsYWJsZVRvb2xzLm1hcCgodDogVG9vbENvbmZpZykgPT4gKHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogdC5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0Lm5hbWUsXG4gICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2VcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgYXdhaXQgc2VsZi5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtdG9vbC1zdGF0dXMtYmF0Y2gnLCB1cGRhdGVzKTtcbiAgICAgICAgICAgIGF3YWl0IHNlbGYubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byBkZXNlbGVjdCBhbGwgdG9vbHM6JywgZXJyb3IpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhc3luYyBzYXZlVG9vbHNDaGFuZ2VzKCkge1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcyBhcyBhbnk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbTUNQIFBhbmVsXSBUb29scyBjaGFuZ2VzIHNhdmVkJyk7XG4gICAgICAgIC8vIOW3peWFtyDrs4Dqsr3sgqztla3snYAg7KaJ7IucIOuwmOyYgeuQmOuvgOuhnCDrs4Trj4Qg7KCA7J6lIOuhnOyngSDrtojtlYTsmpRcbiAgICB9LFxuICAgIGFzeW5jIHVwZGF0ZVNlcnZlclN0YXR1cygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBjb25zdCBzdGF0ZSA9IHNlbGYuc3RhdGUgYXMgQXBwU3RhdGU7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGF3YWl0IHNlbGYuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnZ2V0LXNlcnZlci1zdGF0dXMnKTtcbiAgICAgICAgICAgIGlmIChzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZS5zZXJ2ZXJSdW5uaW5nID0gc3RhdHVzLnJ1bm5pbmcgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgc3RhdGUuc2VydmVyU3RhdHVzID0gc3RhdHVzLnJ1bm5pbmcgPyAn7Iuk7ZaJIOykkScgOiAn7KSR7KeA65CoJztcbiAgICAgICAgICAgICAgICBzdGF0ZS5jb25uZWN0ZWRDbGllbnRzID0gc3RhdHVzLmNsaWVudHMgfHwgMDtcbiAgICAgICAgICAgICAgICBzdGF0ZS5odHRwVXJsID0gYGh0dHA6Ly8xMjcuMC4wLjE6JHtzdGF0dXMuc2V0dGluZ3M/LnBvcnQgfHwgMzAwMH0vbWNwYDtcblxuICAgICAgICAgICAgICAgIGlmIChzdGF0dXMuc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGUuc2V0dGluZ3MucG9ydCA9IHN0YXR1cy5zZXR0aW5ncy5wb3J0IHx8IDMwMDA7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzLmF1dG9TdGFydCA9IHN0YXR1cy5zZXR0aW5ncy5hdXRvU3RhcnQgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlLnNldHRpbmdzLmRlYnVnTG9nID0gc3RhdHVzLnNldHRpbmdzLmRlYnVnTG9nIHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZS5zZXR0aW5ncy5tYXhDb25uZWN0aW9ucyA9IHN0YXR1cy5zZXR0aW5ncy5tYXhDb25uZWN0aW9ucyB8fCAxMDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDnirbmgIHmm7TmlrDml7bph43mlrDmuLLmn5NcbiAgICAgICAgICAgICAgICBjb25zdCBjb250YWluZXIgPSBzZWxmLiRhcHA7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbmRlcihjb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmJpbmRFdmVudExpc3RlbmVycyhjb250YWluZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tNQ1AgUGFuZWxdIEZhaWxlZCB0byB1cGRhdGUgc2VydmVyIHN0YXR1czonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNlbmRJcGNSZXF1ZXN0KHBhY2thZ2VOYW1lOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgLi4uYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmdWxsTWVzc2FnZSA9IGAke3BhY2thZ2VOYW1lfToke21lc3NhZ2V9YDtcbiAgICAgICAgICAgICAgICBFZGl0b3IuSXBjLnNlbmRUb01haW4oZnVsbE1lc3NhZ2UsIC4uLmFyZ3MsIChlcnJvcjogRXJyb3IgfCBudWxsLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBiZWZvcmVDbG9zZSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBpZiAoc2VsZi5zdGF0dXNVcGRhdGVJbnRlcnZhbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnN0YXR1c1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgICAgIHNlbGYuc3RhdHVzVXBkYXRlSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBjbG9zZSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXMgYXMgYW55O1xuICAgICAgICBpZiAoc2VsZi5zdGF0dXNVcGRhdGVJbnRlcnZhbCkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnN0YXR1c1VwZGF0ZUludGVydmFsKTtcbiAgICAgICAgICAgIHNlbGYuc3RhdHVzVXBkYXRlSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcbn0pO1xuIl19