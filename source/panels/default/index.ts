/// <reference path="../../types/editor-2x.d.ts" />

import { readFileSync } from 'fs-extra';
import { join } from 'path';

// 定义工具配置接口
interface ToolConfig {
    category: string;
    name: string;
    enabled: boolean;
    description: string;
}

// 定义服务器设置接口
interface ServerSettings {
    port: number;
    autoStart: boolean;
    debugLog: boolean;
    maxConnections: number;
}

// 状态管理
interface AppState {
    activeTab: 'server' | 'tools';
    serverRunning: boolean;
    serverStatus: string;
    connectedClients: number;
    httpUrl: string;
    isProcessing: boolean;
    settings: ServerSettings;
    availableTools: ToolConfig[];
    toolCategories: string[];
    settingsChanged: boolean;
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
    state: {
        activeTab: 'server' as 'server' | 'tools',
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
        availableTools: [] as ToolConfig[],
        toolCategories: [] as string[],
        settingsChanged: false
    } as AppState,
    statusUpdateInterval: null as NodeJS.Timeout | null,
    ready() {
        const appElement = (this as any).$app;
        if (appElement) {
            this.initApp(appElement);
            console.log('[MCP Panel] App initialized');
        }
    },
    initApp(container: HTMLElement) {
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
    render(container: HTMLElement) {
        const state = (this as any).state as AppState;
        container.innerHTML = this.getAppHTML(state);
    },
    getAppHTML(state: AppState): string {
        return `
            <div class="mcp-app">
                ${this.getTabNavigationHTML(state)}
                ${state.activeTab === 'server' ? this.getServerTabHTML(state) : this.getToolsTabHTML(state)}
            </div>
        `;
    },
    getTabNavigationHTML(state: AppState): string {
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
    getServerTabHTML(state: AppState): string {
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
    getToolsTabHTML(state: AppState): string {
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
    getCategoryHTML(category: string, state: AppState): string {
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
    getCategoryDisplayName(category: string): string {
        const categoryMap: { [key: string]: string } = {
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
    bindEventListeners(container: HTMLElement) {
        const self = this as any;
        const state = self.state as AppState;

        // 选项卡切换
        container.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
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
        const portInput = container.querySelector('#portInput') as any;
        if (portInput) {
            portInput.addEventListener('change', () => {
                state.settings.port = parseInt(portInput.value) || 3000;
                state.settingsChanged = true;
                self.render(container);
                self.bindEventListeners(container);
            });
        }

        const autoStartCheckbox = container.querySelector('#autoStartCheckbox') as any;
        if (autoStartCheckbox) {
            autoStartCheckbox.addEventListener('change', () => {
                state.settings.autoStart = autoStartCheckbox.checked;
                state.settingsChanged = true;
                self.render(container);
                self.bindEventListeners(container);
            });
        }

        const debugLogCheckbox = container.querySelector('#debugLogCheckbox') as any;
        if (debugLogCheckbox) {
            debugLogCheckbox.addEventListener('change', () => {
                state.settings.debugLog = debugLogCheckbox.checked;
                state.settingsChanged = true;
                self.render(container);
                self.bindEventListeners(container);
            });
        }

        const maxConnectionsInput = container.querySelector('#maxConnectionsInput') as any;
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
        container.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const categorySelectAll = target.closest('.category-select-all');
            const categoryDeselectAll = target.closest('.category-deselect-all');

            if (categorySelectAll) {
                const category = categorySelectAll.getAttribute('data-category');
                if (category) {
                    self.toggleCategoryTools(category, true);
                }
            } else if (categoryDeselectAll) {
                const category = categoryDeselectAll.getAttribute('data-category');
                if (category) {
                    self.toggleCategoryTools(category, false);
                }
            }
        });

        // 工具复选框 변경
        container.addEventListener('change', (e: Event) => {
            const target = e.target as HTMLElement;
            const checkbox = target.closest('.tool-checkbox');
            if (checkbox) {
                const category = checkbox.getAttribute('data-category');
                const toolName = checkbox.getAttribute('data-tool');
                const checked = (checkbox as any).checked;
                if (category && toolName) {
                    self.updateToolStatus(category, toolName, checked);
                }
            }
        });
    },
    switchTab(tabName: 'server' | 'tools') {
        const self = this as any;
        const state = self.state as AppState;
        state.activeTab = tabName;

        if (tabName === 'tools') {
            self.loadToolManagerState();
        }

        const container = self.$app;
        self.render(container);
        self.bindEventListeners(container);
    },
    async toggleServer() {
        const self = this as any;
        const state = self.state as AppState;

        try {
            state.isProcessing = true;
            const container = self.$app;
            self.render(container);
            self.bindEventListeners(container);

            if (state.serverRunning) {
                await self.sendIpcRequest('cocos-mcp-server', 'stop-server');
            } else {
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
        } catch (error) {
            console.error('[MCP Panel] Failed to toggle server:', error);
        } finally {
            state.isProcessing = false;
            const container = self.$app;
            self.render(container);
            self.bindEventListeners(container);
        }
    },
    async saveSettings() {
        const self = this as any;
        const state = self.state as AppState;

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
        } catch (error) {
            console.error('[MCP Panel] Failed to save settings:', error);
        }
    },
    async copyUrl() {
        const self = this as any;
        const state = self.state as AppState;

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(state.httpUrl);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = state.httpUrl;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            console.log('[MCP Panel] URL copied to clipboard');
        } catch (error) {
            console.error('[MCP Panel] Failed to copy URL:', error);
        }
    },
    async loadToolManagerState() {
        const self = this as any;
        const state = self.state as AppState;

        try {
            const result = await self.sendIpcRequest('cocos-mcp-server', 'get-tool-manager-state');
            if (result && result.tools) {
                state.availableTools = result.tools;
                state.toolCategories = Array.from(new Set(result.tools.map((t: ToolConfig) => t.category)));

                const container = self.$app;
                self.render(container);
                self.bindEventListeners(container);
            }
        } catch (error) {
            console.error('[MCP Panel] Failed to load tool manager state:', error);
        }
    },
    async updateToolStatus(category: string, toolName: string, enabled: boolean) {
        const self = this as any;
        const state = self.state as AppState;

        try {
            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status', category, toolName, enabled);
            await self.loadToolManagerState();
        } catch (error) {
            console.error('[MCP Panel] Failed to update tool status:', error);
        }
    },
    async toggleCategoryTools(category: string, enabled: boolean) {
        const self = this as any;
        const state = self.state as AppState;

        try {
            const updates = state.availableTools
                .filter((t: ToolConfig) => t.category === category)
                .map((t: ToolConfig) => ({
                    category: t.category,
                    name: t.name,
                    enabled: enabled
                }));

            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status-batch', updates);
            await self.loadToolManagerState();
        } catch (error) {
            console.error('[MCP Panel] Failed to toggle category:', error);
        }
    },
    async selectAllTools() {
        const self = this as any;
        const state = self.state as AppState;

        try {
            const updates = state.availableTools.map((t: ToolConfig) => ({
                category: t.category,
                name: t.name,
                enabled: true
            }));

            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status-batch', updates);
            await self.loadToolManagerState();
        } catch (error) {
            console.error('[MCP Panel] Failed to select all tools:', error);
        }
    },
    async deselectAllTools() {
        const self = this as any;
        const state = self.state as AppState;

        try {
            const updates = state.availableTools.map((t: ToolConfig) => ({
                category: t.category,
                name: t.name,
                enabled: false
            }));

            await self.sendIpcRequest('cocos-mcp-server', 'update-tool-status-batch', updates);
            await self.loadToolManagerState();
        } catch (error) {
            console.error('[MCP Panel] Failed to deselect all tools:', error);
        }
    },
    async saveToolsChanges() {
        const self = this as any;
        console.log('[MCP Panel] Tools changes saved');
        // 工具 변경사항은 즉시 반영되므로 별도 저장 로직 불필요
    },
    async updateServerStatus() {
        const self = this as any;
        const state = self.state as AppState;

        try {
            const status = await self.sendIpcRequest('cocos-mcp-server', 'get-server-status');
            if (status) {
                state.serverRunning = status.running || false;
                state.serverStatus = status.running ? '실행 중' : '중지됨';
                state.connectedClients = status.clients || 0;
                state.httpUrl = `http://127.0.0.1:${status.settings?.port || 3000}/mcp`;

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
        } catch (error) {
            console.error('[MCP Panel] Failed to update server status:', error);
        }
    },
    sendIpcRequest(packageName: string, message: string, ...args: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
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
    },
    beforeClose() {
        const self = this as any;
        if (self.statusUpdateInterval) {
            clearInterval(self.statusUpdateInterval);
            self.statusUpdateInterval = null;
        }
    },
    close() {
        const self = this as any;
        if (self.statusUpdateInterval) {
            clearInterval(self.statusUpdateInterval);
            self.statusUpdateInterval = null;
        }
    },
});
