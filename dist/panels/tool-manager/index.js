"use strict";
/// <reference path="../../types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
module.exports = Editor.Panel.extend({
    listeners: {
        show() { console.log('Tool Manager panel shown'); },
        hide() { console.log('Tool Manager panel hidden'); }
    },
    template: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/template/default/tool-manager.html'), 'utf-8'),
    style: (0, fs_extra_1.readFileSync)((0, path_1.join)(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        panelTitle: '#panelTitle',
        createConfigBtn: '#createConfigBtn',
        importConfigBtn: '#importConfigBtn',
        exportConfigBtn: '#exportConfigBtn',
        configSelector: '#configSelector',
        applyConfigBtn: '#applyConfigBtn',
        editConfigBtn: '#editConfigBtn',
        deleteConfigBtn: '#deleteConfigBtn',
        toolsContainer: '#toolsContainer',
        selectAllBtn: '#selectAllBtn',
        deselectAllBtn: '#deselectAllBtn',
        saveChangesBtn: '#saveChangesBtn',
        totalToolsCount: '#totalToolsCount',
        enabledToolsCount: '#enabledToolsCount',
        disabledToolsCount: '#disabledToolsCount',
        configModal: '#configModal',
        modalTitle: '#modalTitle',
        configForm: '#configForm',
        configName: '#configName',
        configDescription: '#configDescription',
        closeModal: '#closeModal',
        cancelConfigBtn: '#cancelConfigBtn',
        saveConfigBtn: '#saveConfigBtn',
        importModal: '#importModal',
        importConfigJson: '#importConfigJson',
        closeImportModal: '#closeImportModal',
        cancelImportBtn: '#cancelImportBtn',
        confirmImportBtn: '#confirmImportBtn'
    },
    methods: {
        // Helper method for IPC requests in 2.x
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
        async loadToolManagerState() {
            try {
                this.toolManagerState = await this.sendIpcRequest('cocos-mcp-server', 'get-tool-manager-state');
                this.currentConfiguration = this.toolManagerState.currentConfiguration;
                this.configurations = this.toolManagerState.configurations;
                this.availableTools = this.toolManagerState.availableTools;
                this.updateUI();
            }
            catch (error) {
                console.error('Failed to load tool manager state:', error);
                this.showError('加载工具管理器状态失败');
            }
        },
        updateUI() {
            this.updateConfigSelector();
            this.updateToolsDisplay();
            this.updateStatusBar();
            this.updateButtons();
        },
        updateConfigSelector() {
            const selector = this.$.configSelector;
            selector.innerHTML = '<option value="">选择配置...</option>';
            this.configurations.forEach((config) => {
                const option = document.createElement('option');
                option.value = config.id;
                option.textContent = config.name;
                if (this.currentConfiguration && config.id === this.currentConfiguration.id) {
                    option.selected = true;
                }
                selector.appendChild(option);
            });
        },
        updateToolsDisplay() {
            const container = this.$.toolsContainer;
            if (!this.currentConfiguration) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>没有选择配置</h3>
                        <p>请先选择一个配置或创建新配置</p>
                    </div>
                `;
                return;
            }
            const toolsByCategory = {};
            this.currentConfiguration.tools.forEach((tool) => {
                if (!toolsByCategory[tool.category]) {
                    toolsByCategory[tool.category] = [];
                }
                toolsByCategory[tool.category].push(tool);
            });
            container.innerHTML = '';
            Object.entries(toolsByCategory).forEach(([category, tools]) => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'tool-category';
                const enabledCount = tools.filter((t) => t.enabled).length;
                const totalCount = tools.length;
                categoryDiv.innerHTML = `
                    <div class="category-header">
                        <div class="category-name">${this.getCategoryDisplayName(category)}</div>
                        <div class="category-toggle">
                            <span>${enabledCount}/${totalCount}</span>
                            <input type="checkbox" class="checkbox category-checkbox"
                                   data-category="${category}"
                                   ${enabledCount === totalCount ? 'checked' : ''}>
                        </div>
                    </div>
                    <div class="tool-list">
                        ${tools.map((tool) => `
                            <div class="tool-item">
                                <div class="tool-info">
                                    <div class="tool-name">${tool.name}</div>
                                    <div class="tool-description">${tool.description}</div>
                                </div>
                                <div class="tool-toggle">
                                    <input type="checkbox" class="checkbox tool-checkbox"
                                           data-category="${tool.category}"
                                           data-name="${tool.name}"
                                           ${tool.enabled ? 'checked' : ''}>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                container.appendChild(categoryDiv);
            });
            this.bindToolEvents();
        },
        bindToolEvents() {
            document.querySelectorAll('.category-checkbox').forEach((checkbox) => {
                checkbox.addEventListener('change', (e) => {
                    const category = e.target.dataset.category;
                    const checked = e.target.checked;
                    this.toggleCategoryTools(category, checked);
                });
            });
            document.querySelectorAll('.tool-checkbox').forEach((checkbox) => {
                checkbox.addEventListener('change', (e) => {
                    const category = e.target.dataset.category;
                    const name = e.target.dataset.name;
                    const enabled = e.target.checked;
                    this.updateToolStatus(category, name, enabled);
                });
            });
        },
        async toggleCategoryTools(category, enabled) {
            if (!this.currentConfiguration)
                return;
            console.log(`Toggling category tools: ${category} = ${enabled}`);
            const categoryTools = this.currentConfiguration.tools.filter((tool) => tool.category === category);
            if (categoryTools.length === 0)
                return;
            const updates = categoryTools.map((tool) => ({
                category: tool.category,
                name: tool.name,
                enabled: enabled
            }));
            try {
                // 先更新本地状态
                categoryTools.forEach((tool) => {
                    tool.enabled = enabled;
                });
                console.log(`Updated local category state: ${category} = ${enabled}`);
                // 立即更新UI
                this.updateStatusBar();
                this.updateCategoryCounts();
                this.updateToolCheckboxes(category, enabled);
                // 然后发送到后端
                await this.sendIpcRequest('cocos-mcp-server', 'update-tool-status-batch', this.currentConfiguration.id, updates);
            }
            catch (error) {
                console.error('Failed to toggle category tools:', error);
                this.showError('切换类别工具失败');
                // 如果后端更新失败，回滚本地状态
                categoryTools.forEach((tool) => {
                    tool.enabled = !enabled;
                });
                this.updateStatusBar();
                this.updateCategoryCounts();
                this.updateToolCheckboxes(category, !enabled);
            }
        },
        async updateToolStatus(category, name, enabled) {
            if (!this.currentConfiguration)
                return;
            console.log(`Updating tool status: ${category}.${name} = ${enabled}`);
            console.log(`Current config ID: ${this.currentConfiguration.id}`);
            // 先更新本地状态
            const tool = this.currentConfiguration.tools.find((t) => t.category === category && t.name === name);
            if (!tool) {
                console.error(`Tool not found: ${category}.${name}`);
                return;
            }
            try {
                tool.enabled = enabled;
                console.log(`Updated local tool state: ${tool.name} = ${tool.enabled}`);
                // 立即更新UI（只更新统计信息，不重新渲染工具列表）
                this.updateStatusBar();
                this.updateCategoryCounts();
                // 然后发送到后端
                console.log(`Sending to backend: configId=${this.currentConfiguration.id}, category=${category}, name=${name}, enabled=${enabled}`);
                const result = await this.sendIpcRequest('cocos-mcp-server', 'update-tool-status', this.currentConfiguration.id, category, name, enabled);
                console.log('Backend response:', result);
            }
            catch (error) {
                console.error('Failed to update tool status:', error);
                this.showError('更新工具状态失败');
                // 如果后端更新失败，回滚本地状态
                tool.enabled = !enabled;
                this.updateStatusBar();
                this.updateCategoryCounts();
            }
        },
        updateStatusBar() {
            if (!this.currentConfiguration) {
                this.$.totalToolsCount.textContent = '0';
                this.$.enabledToolsCount.textContent = '0';
                this.$.disabledToolsCount.textContent = '0';
                return;
            }
            const total = this.currentConfiguration.tools.length;
            const enabled = this.currentConfiguration.tools.filter((t) => t.enabled).length;
            const disabled = total - enabled;
            console.log(`Status bar update: total=${total}, enabled=${enabled}, disabled=${disabled}`);
            this.$.totalToolsCount.textContent = total.toString();
            this.$.enabledToolsCount.textContent = enabled.toString();
            this.$.disabledToolsCount.textContent = disabled.toString();
        },
        updateCategoryCounts() {
            if (!this.currentConfiguration)
                return;
            // 更新每个类别的计数显示
            document.querySelectorAll('.category-checkbox').forEach((checkbox) => {
                const category = checkbox.dataset.category;
                const categoryTools = this.currentConfiguration.tools.filter((t) => t.category === category);
                const enabledCount = categoryTools.filter((t) => t.enabled).length;
                const totalCount = categoryTools.length;
                // 更新计数显示
                const countSpan = checkbox.parentElement.querySelector('span');
                if (countSpan) {
                    countSpan.textContent = `${enabledCount}/${totalCount}`;
                }
                // 更新类别复选框状态
                checkbox.checked = enabledCount === totalCount;
            });
        },
        updateToolCheckboxes(category, enabled) {
            // 更新特定类别的所有工具复选框
            document.querySelectorAll(`.tool-checkbox[data-category="${category}"]`).forEach((checkbox) => {
                checkbox.checked = enabled;
            });
        },
        updateButtons() {
            const hasCurrentConfig = !!this.currentConfiguration;
            this.$.editConfigBtn.disabled = !hasCurrentConfig;
            this.$.deleteConfigBtn.disabled = !hasCurrentConfig;
            this.$.exportConfigBtn.disabled = !hasCurrentConfig;
            this.$.applyConfigBtn.disabled = !hasCurrentConfig;
        },
        async createConfiguration() {
            this.editingConfig = null;
            this.$.modalTitle.textContent = '新建配置';
            this.$.configName.value = '';
            this.$.configDescription.value = '';
            this.showModal('configModal');
        },
        async editConfiguration() {
            if (!this.currentConfiguration)
                return;
            this.editingConfig = this.currentConfiguration;
            this.$.modalTitle.textContent = '编辑配置';
            this.$.configName.value = this.currentConfiguration.name;
            this.$.configDescription.value = this.currentConfiguration.description || '';
            this.showModal('configModal');
        },
        async saveConfiguration() {
            const name = this.$.configName.value.trim();
            const description = this.$.configDescription.value.trim();
            if (!name) {
                this.showError('配置名称不能为空');
                return;
            }
            try {
                if (this.editingConfig) {
                    await this.sendIpcRequest('cocos-mcp-server', 'update-tool-configuration', this.editingConfig.id, { name, description });
                }
                else {
                    await this.sendIpcRequest('cocos-mcp-server', 'create-tool-configuration', name, description);
                }
                this.hideModal('configModal');
                await this.loadToolManagerState();
            }
            catch (error) {
                console.error('Failed to save configuration:', error);
                this.showError('保存配置失败');
            }
        },
        async deleteConfiguration() {
            if (!this.currentConfiguration)
                return;
            const confirmed = window.confirm(`确定要删除配置 "${this.currentConfiguration.name}" 吗？此操作不可撤销。`);
            if (confirmed) {
                try {
                    await this.sendIpcRequest('cocos-mcp-server', 'delete-tool-configuration', this.currentConfiguration.id);
                    await this.loadToolManagerState();
                }
                catch (error) {
                    console.error('Failed to delete configuration:', error);
                    this.showError('删除配置失败');
                }
            }
        },
        async applyConfiguration() {
            const configId = this.$.configSelector.value;
            if (!configId)
                return;
            try {
                await this.sendIpcRequest('cocos-mcp-server', 'set-current-tool-configuration', configId);
                await this.loadToolManagerState();
            }
            catch (error) {
                console.error('Failed to apply configuration:', error);
                this.showError('应用配置失败');
            }
        },
        async exportConfiguration() {
            if (!this.currentConfiguration)
                return;
            try {
                const result = await this.sendIpcRequest('cocos-mcp-server', 'export-tool-configuration', this.currentConfiguration.id);
                // Use DOM clipboard API for 2.x compatibility
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    await navigator.clipboard.writeText(result.configJson);
                }
                else {
                    // Fallback for older environments
                    const textarea = document.createElement('textarea');
                    textarea.value = result.configJson;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }
                window.alert('导出成功\n配置已复制到剪贴板');
            }
            catch (error) {
                console.error('Failed to export configuration:', error);
                this.showError('导出配置失败');
            }
        },
        async importConfiguration() {
            this.$.importConfigJson.value = '';
            this.showModal('importModal');
        },
        async confirmImport() {
            const configJson = this.$.importConfigJson.value.trim();
            if (!configJson) {
                this.showError('请输入配置JSON');
                return;
            }
            try {
                await this.sendIpcRequest('cocos-mcp-server', 'import-tool-configuration', configJson);
                this.hideModal('importModal');
                await this.loadToolManagerState();
                window.alert('导入成功\n配置已成功导入');
            }
            catch (error) {
                console.error('Failed to import configuration:', error);
                this.showError('导入配置失败');
            }
        },
        async selectAllTools() {
            if (!this.currentConfiguration)
                return;
            console.log('Selecting all tools');
            const updates = this.currentConfiguration.tools.map((tool) => ({
                category: tool.category,
                name: tool.name,
                enabled: true
            }));
            try {
                // 先更新本地状态
                this.currentConfiguration.tools.forEach((tool) => {
                    tool.enabled = true;
                });
                console.log('Updated local state: all tools enabled');
                // 立即更新UI
                this.updateStatusBar();
                this.updateToolsDisplay();
                // 然后发送到后端
                await this.sendIpcRequest('cocos-mcp-server', 'update-tool-status-batch', this.currentConfiguration.id, updates);
            }
            catch (error) {
                console.error('Failed to select all tools:', error);
                this.showError('全选工具失败');
                // 如果后端更新失败，回滚本地状态
                this.currentConfiguration.tools.forEach((tool) => {
                    tool.enabled = false;
                });
                this.updateStatusBar();
                this.updateToolsDisplay();
            }
        },
        async deselectAllTools() {
            if (!this.currentConfiguration)
                return;
            console.log('Deselecting all tools');
            const updates = this.currentConfiguration.tools.map((tool) => ({
                category: tool.category,
                name: tool.name,
                enabled: false
            }));
            try {
                // 先更新本地状态
                this.currentConfiguration.tools.forEach((tool) => {
                    tool.enabled = false;
                });
                console.log('Updated local state: all tools disabled');
                // 立即更新UI
                this.updateStatusBar();
                this.updateToolsDisplay();
                // 然后发送到后端
                await this.sendIpcRequest('cocos-mcp-server', 'update-tool-status-batch', this.currentConfiguration.id, updates);
            }
            catch (error) {
                console.error('Failed to deselect all tools:', error);
                this.showError('取消全选工具失败');
                // 如果后端更新失败，回滚本地状态
                this.currentConfiguration.tools.forEach((tool) => {
                    tool.enabled = true;
                });
                this.updateStatusBar();
                this.updateToolsDisplay();
            }
        },
        getCategoryDisplayName(category) {
            const categoryNames = {
                'scene': '场景工具',
                'node': '节点工具',
                'component': '组件工具',
                'prefab': '预制体工具',
                'project': '项目工具',
                'debug': '调试工具',
                'preferences': '偏好设置工具',
                'server': '服务器工具',
                'broadcast': '广播工具',
                'sceneAdvanced': '高级场景工具',
                'sceneView': '场景视图工具',
                'referenceImage': '参考图片工具',
                'assetAdvanced': '高级资源工具',
                'validation': '验证工具'
            };
            return categoryNames[category] || category;
        },
        showModal(modalId) {
            this.$[modalId].style.display = 'block';
        },
        hideModal(modalId) {
            this.$[modalId].style.display = 'none';
        },
        showError(message) {
            window.alert(`错误: ${message}`);
        },
        async saveChanges() {
            if (!this.currentConfiguration) {
                this.showError('没有选择配置');
                return;
            }
            try {
                // 确保当前配置已保存到后端
                await this.sendIpcRequest('cocos-mcp-server', 'update-tool-configuration', this.currentConfiguration.id, {
                    name: this.currentConfiguration.name,
                    description: this.currentConfiguration.description,
                    tools: this.currentConfiguration.tools
                });
                window.alert('保存成功\n配置更改已保存');
            }
            catch (error) {
                console.error('Failed to save changes:', error);
                this.showError('保存更改失败');
            }
        },
        bindEvents() {
            this.$.createConfigBtn.addEventListener('click', this.createConfiguration.bind(this));
            this.$.editConfigBtn.addEventListener('click', this.editConfiguration.bind(this));
            this.$.deleteConfigBtn.addEventListener('click', this.deleteConfiguration.bind(this));
            this.$.applyConfigBtn.addEventListener('click', this.applyConfiguration.bind(this));
            this.$.exportConfigBtn.addEventListener('click', this.exportConfiguration.bind(this));
            this.$.importConfigBtn.addEventListener('click', this.importConfiguration.bind(this));
            this.$.selectAllBtn.addEventListener('click', this.selectAllTools.bind(this));
            this.$.deselectAllBtn.addEventListener('click', this.deselectAllTools.bind(this));
            this.$.saveChangesBtn.addEventListener('click', this.saveChanges.bind(this));
            this.$.closeModal.addEventListener('click', () => this.hideModal('configModal'));
            this.$.cancelConfigBtn.addEventListener('click', () => this.hideModal('configModal'));
            this.$.configForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveConfiguration();
            });
            this.$.closeImportModal.addEventListener('click', () => this.hideModal('importModal'));
            this.$.cancelImportBtn.addEventListener('click', () => this.hideModal('importModal'));
            this.$.confirmImportBtn.addEventListener('click', this.confirmImport.bind(this));
            this.$.configSelector.addEventListener('change', this.applyConfiguration.bind(this));
        }
    },
    ready() {
        this.toolManagerState = null;
        this.currentConfiguration = null;
        this.configurations = [];
        this.availableTools = [];
        this.editingConfig = null;
        this.bindEvents();
        this.loadToolManagerState();
    },
    beforeClose() {
        // 清理工作
    },
    close() {
        // 面板关闭清理
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL3Rvb2wtbWFuYWdlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsbURBQW1EOztBQUVuRCx1Q0FBd0M7QUFDeEMsK0JBQTRCO0FBRTVCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDakMsU0FBUyxFQUFFO1FBQ1AsSUFBSSxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsSUFBSSxLQUFLLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkQ7SUFDRCxRQUFRLEVBQUUsSUFBQSx1QkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSxvREFBb0QsQ0FBQyxFQUFFLE9BQU8sQ0FBQztJQUN0RyxLQUFLLEVBQUUsSUFBQSx1QkFBWSxFQUFDLElBQUEsV0FBSSxFQUFDLFNBQVMsRUFBRSx5Q0FBeUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQztJQUN4RixDQUFDLEVBQUU7UUFDQyxVQUFVLEVBQUUsYUFBYTtRQUN6QixlQUFlLEVBQUUsa0JBQWtCO1FBQ25DLGVBQWUsRUFBRSxrQkFBa0I7UUFDbkMsZUFBZSxFQUFFLGtCQUFrQjtRQUNuQyxjQUFjLEVBQUUsaUJBQWlCO1FBQ2pDLGNBQWMsRUFBRSxpQkFBaUI7UUFDakMsYUFBYSxFQUFFLGdCQUFnQjtRQUMvQixlQUFlLEVBQUUsa0JBQWtCO1FBQ25DLGNBQWMsRUFBRSxpQkFBaUI7UUFDakMsWUFBWSxFQUFFLGVBQWU7UUFDN0IsY0FBYyxFQUFFLGlCQUFpQjtRQUNqQyxjQUFjLEVBQUUsaUJBQWlCO1FBQ2pDLGVBQWUsRUFBRSxrQkFBa0I7UUFDbkMsaUJBQWlCLEVBQUUsb0JBQW9CO1FBQ3ZDLGtCQUFrQixFQUFFLHFCQUFxQjtR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QUksQ0FBQztRQUNyQyxJQUFZLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1FBQ3pDLElBQVksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ2pDLElBQVksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ2pDLElBQVksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBRWxDLElBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxQixJQUFZLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUN6QyxDQUFDO0lBQ0QsV0FBVztRQUNQLE9BQU87SUFDWCxDQUFDO0lBQ0QsS0FBSztRQUNELFNBQVM7SUFDYixDQUFDO0NBQ0csQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL3R5cGVzL2VkaXRvci0yeC5kLnRzXCIgLz5cblxuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5leHRlbmQoe1xuICAgIGxpc3RlbmVyczoge1xuICAgICAgICBzaG93KCkgeyBjb25zb2xlLmxvZygnVG9vbCBNYW5hZ2VyIHBhbmVsIHNob3duJyk7IH0sXG4gICAgICAgIGhpZGUoKSB7IGNvbnNvbGUubG9nKCdUb29sIE1hbmFnZXIgcGFuZWwgaGlkZGVuJyk7IH1cbiAgICB9LFxuICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvZGVmYXVsdC90b29sLW1hbmFnZXIuaHRtbCcpLCAndXRmLTgnKSxcbiAgICBzdHlsZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3N0eWxlL2RlZmF1bHQvaW5kZXguY3NzJyksICd1dGYtOCcpLFxuICAgICQ6IHtcbiAgICAgICAgcGFuZWxUaXRsZTogJyNwYW5lbFRpdGxlJyxcbiAgICAgICAgY3JlYXRlQ29uZmlnQnRuOiAnI2NyZWF0ZUNvbmZpZ0J0bicsXG4gICAgICAgIGltcG9ydENvbmZpZ0J0bjogJyNpbXBvcnRDb25maWdCdG4nLFxuICAgICAgICBleHBvcnRDb25maWdCdG46ICcjZXhwb3J0Q29uZmlnQnRuJyxcbiAgICAgICAgY29uZmlnU2VsZWN0b3I6ICcjY29uZmlnU2VsZWN0b3InLFxuICAgICAgICBhcHBseUNvbmZpZ0J0bjogJyNhcHBseUNvbmZpZ0J0bicsXG4gICAgICAgIGVkaXRDb25maWdCdG46ICcjZWRpdENvbmZpZ0J0bicsXG4gICAgICAgIGRlbGV0ZUNvbmZpZ0J0bjogJyNkZWxldGVDb25maWdCdG4nLFxuICAgICAgICB0b29sc0NvbnRhaW5lcjogJyN0b29sc0NvbnRhaW5lcicsXG4gICAgICAgIHNlbGVjdEFsbEJ0bjogJyNzZWxlY3RBbGxCdG4nLFxuICAgICAgICBkZXNlbGVjdEFsbEJ0bjogJyNkZXNlbGVjdEFsbEJ0bicsXG4gICAgICAgIHNhdmVDaGFuZ2VzQnRuOiAnI3NhdmVDaGFuZ2VzQnRuJyxcbiAgICAgICAgdG90YWxUb29sc0NvdW50OiAnI3RvdGFsVG9vbHNDb3VudCcsXG4gICAgICAgIGVuYWJsZWRUb29sc0NvdW50OiAnI2VuYWJsZWRUb29sc0NvdW50JyxcbiAgICAgICAgZGlzYWJsZWRUb29sc0NvdW50OiAnI2Rpc2FibGVkVG9vbHNDb3VudCcsXG4gICAgICAgIGNvbmZpZ01vZGFsOiAnI2NvbmZpZ01vZGFsJyxcbiAgICAgICAgbW9kYWxUaXRsZTogJyNtb2RhbFRpdGxlJyxcbiAgICAgICAgY29uZmlnRm9ybTogJyNjb25maWdGb3JtJyxcbiAgICAgICAgY29uZmlnTmFtZTogJyNjb25maWdOYW1lJyxcbiAgICAgICAgY29uZmlnRGVzY3JpcHRpb246ICcjY29uZmlnRGVzY3JpcHRpb24nLFxuICAgICAgICBjbG9zZU1vZGFsOiAnI2Nsb3NlTW9kYWwnLFxuICAgICAgICBjYW5jZWxDb25maWdCdG46ICcjY2FuY2VsQ29uZmlnQnRuJyxcbiAgICAgICAgc2F2ZUNvbmZpZ0J0bjogJyNzYXZlQ29uZmlnQnRuJyxcbiAgICAgICAgaW1wb3J0TW9kYWw6ICcjaW1wb3J0TW9kYWwnLFxuICAgICAgICBpbXBvcnRDb25maWdKc29uOiAnI2ltcG9ydENvbmZpZ0pzb24nLFxuICAgICAgICBjbG9zZUltcG9ydE1vZGFsOiAnI2Nsb3NlSW1wb3J0TW9kYWwnLFxuICAgICAgICBjYW5jZWxJbXBvcnRCdG46ICcjY2FuY2VsSW1wb3J0QnRuJyxcbiAgICAgICAgY29uZmlybUltcG9ydEJ0bjogJyNjb25maXJtSW1wb3J0QnRuJ1xuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICAvLyBIZWxwZXIgbWV0aG9kIGZvciBJUEMgcmVxdWVzdHMgaW4gMi54XG4gICAgICAgIHNlbmRJcGNSZXF1ZXN0KHRoaXM6IGFueSwgcGFja2FnZU5hbWU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZ1bGxNZXNzYWdlID0gYCR7cGFja2FnZU5hbWV9OiR7bWVzc2FnZX1gO1xuICAgICAgICAgICAgICAgICAgICBFZGl0b3IuSXBjLnNlbmRUb01haW4oZnVsbE1lc3NhZ2UsIC4uLmFyZ3MsIChlcnJvcjogRXJyb3IgfCBudWxsLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGxvYWRUb29sTWFuYWdlclN0YXRlKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnRvb2xNYW5hZ2VyU3RhdGUgPSBhd2FpdCB0aGlzLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2dldC10b29sLW1hbmFnZXItc3RhdGUnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uID0gdGhpcy50b29sTWFuYWdlclN0YXRlLmN1cnJlbnRDb25maWd1cmF0aW9uO1xuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSB0aGlzLnRvb2xNYW5hZ2VyU3RhdGUuY29uZmlndXJhdGlvbnM7XG4gICAgICAgICAgICAgICAgdGhpcy5hdmFpbGFibGVUb29scyA9IHRoaXMudG9vbE1hbmFnZXJTdGF0ZS5hdmFpbGFibGVUb29scztcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVVJKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIHRvb2wgbWFuYWdlciBzdGF0ZTonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+WKoOi9veW3peWFt+euoeeQhuWZqOeKtuaAgeWksei0pScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZVVJKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25maWdTZWxlY3RvcigpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVUb29sc0Rpc3BsYXkoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdHVzQmFyKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUJ1dHRvbnMoKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVDb25maWdTZWxlY3Rvcih0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdG9yID0gdGhpcy4kLmNvbmZpZ1NlbGVjdG9yO1xuICAgICAgICAgICAgc2VsZWN0b3IuaW5uZXJIVE1MID0gJzxvcHRpb24gdmFsdWU9XCJcIj7pgInmi6nphY3nva4uLi48L29wdGlvbj4nO1xuXG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25zLmZvckVhY2goKGNvbmZpZzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICAgICAgICAgICAgb3B0aW9uLnZhbHVlID0gY29uZmlnLmlkO1xuICAgICAgICAgICAgICAgIG9wdGlvbi50ZXh0Q29udGVudCA9IGNvbmZpZy5uYW1lO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uICYmIGNvbmZpZy5pZCA9PT0gdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi5pZCkge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxlY3Rvci5hcHBlbmRDaGlsZChvcHRpb24pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlVG9vbHNEaXNwbGF5KHRoaXM6IGFueSkge1xuICAgICAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy4kLnRvb2xzQ29udGFpbmVyO1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiZW1wdHktc3RhdGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxoMz7msqHmnInpgInmi6nphY3nva48L2gzPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHA+6K+35YWI6YCJ5oup5LiA5Liq6YWN572u5oiW5Yib5bu65paw6YWN572uPC9wPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICBgO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgdG9vbHNCeUNhdGVnb3J5OiBhbnkgPSB7fTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24udG9vbHMuZm9yRWFjaCgodG9vbDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0b29sc0J5Q2F0ZWdvcnlbdG9vbC5jYXRlZ29yeV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdG9vbHNCeUNhdGVnb3J5W3Rvb2wuY2F0ZWdvcnldID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRvb2xzQnlDYXRlZ29yeVt0b29sLmNhdGVnb3J5XS5wdXNoKHRvb2wpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcblxuICAgICAgICAgICAgT2JqZWN0LmVudHJpZXModG9vbHNCeUNhdGVnb3J5KS5mb3JFYWNoKChbY2F0ZWdvcnksIHRvb2xzXTogW3N0cmluZywgYW55XSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5RGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnlEaXYuY2xhc3NOYW1lID0gJ3Rvb2wtY2F0ZWdvcnknO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZW5hYmxlZENvdW50ID0gdG9vbHMuZmlsdGVyKCh0OiBhbnkpID0+IHQuZW5hYmxlZCkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsQ291bnQgPSB0b29scy5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBjYXRlZ29yeURpdi5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXRlZ29yeS1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXRlZ29yeS1uYW1lXCI+JHt0aGlzLmdldENhdGVnb3J5RGlzcGxheU5hbWUoY2F0ZWdvcnkpfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhdGVnb3J5LXRvZ2dsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPiR7ZW5hYmxlZENvdW50fS8ke3RvdGFsQ291bnR9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjbGFzcz1cImNoZWNrYm94IGNhdGVnb3J5LWNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1jYXRlZ29yeT1cIiR7Y2F0ZWdvcnl9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtlbmFibGVkQ291bnQgPT09IHRvdGFsQ291bnQgPyAnY2hlY2tlZCcgOiAnJ30+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLWxpc3RcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICR7dG9vbHMubWFwKCh0b29sOiBhbnkpID0+IGBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC1pdGVtXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLWluZm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLW5hbWVcIj4ke3Rvb2wubmFtZX08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLWRlc2NyaXB0aW9uXCI+JHt0b29sLmRlc2NyaXB0aW9ufTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtdG9nZ2xlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgY2xhc3M9XCJjaGVja2JveCB0b29sLWNoZWNrYm94XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLWNhdGVnb3J5PVwiJHt0b29sLmNhdGVnb3J5fVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS1uYW1lPVwiJHt0b29sLm5hbWV9XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke3Rvb2wuZW5hYmxlZCA/ICdjaGVja2VkJyA6ICcnfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICBgKS5qb2luKCcnKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgYDtcblxuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYXRlZ29yeURpdik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5iaW5kVG9vbEV2ZW50cygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGJpbmRUb29sRXZlbnRzKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmNhdGVnb3J5LWNoZWNrYm94JykuZm9yRWFjaCgoY2hlY2tib3g6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSBlLnRhcmdldC5kYXRhc2V0LmNhdGVnb3J5O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkID0gZS50YXJnZXQuY2hlY2tlZDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVDYXRlZ29yeVRvb2xzKGNhdGVnb3J5LCBjaGVja2VkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudG9vbC1jaGVja2JveCcpLmZvckVhY2goKGNoZWNrYm94OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gZS50YXJnZXQuZGF0YXNldC5jYXRlZ29yeTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGUudGFyZ2V0LmRhdGFzZXQubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW5hYmxlZCA9IGUudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVG9vbFN0YXR1cyhjYXRlZ29yeSwgbmFtZSwgZW5hYmxlZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyB0b2dnbGVDYXRlZ29yeVRvb2xzKHRoaXM6IGFueSwgY2F0ZWdvcnk6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBUb2dnbGluZyBjYXRlZ29yeSB0b29sczogJHtjYXRlZ29yeX0gPSAke2VuYWJsZWR9YCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5VG9vbHMgPSB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLnRvb2xzLmZpbHRlcigodG9vbDogYW55KSA9PiB0b29sLmNhdGVnb3J5ID09PSBjYXRlZ29yeSk7XG4gICAgICAgICAgICBpZiAoY2F0ZWdvcnlUb29scy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgdXBkYXRlcyA9IGNhdGVnb3J5VG9vbHMubWFwKCh0b29sOiBhbnkpID0+ICh7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6IHRvb2wuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgbmFtZTogdG9vbC5uYW1lLFxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGVuYWJsZWRcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDlhYjmm7TmlrDmnKzlnLDnirbmgIFcbiAgICAgICAgICAgICAgICBjYXRlZ29yeVRvb2xzLmZvckVhY2goKHRvb2w6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0b29sLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBVcGRhdGVkIGxvY2FsIGNhdGVnb3J5IHN0YXRlOiAke2NhdGVnb3J5fSA9ICR7ZW5hYmxlZH1gKTtcblxuICAgICAgICAgICAgICAgIC8vIOeri+WNs+abtOaWsFVJXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdGF0dXNCYXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNhdGVnb3J5Q291bnRzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUb29sQ2hlY2tib3hlcyhjYXRlZ29yeSwgZW5hYmxlZCk7XG5cbiAgICAgICAgICAgICAgICAvLyDnhLblkI7lj5HpgIHliLDlkI7nq69cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLXN0YXR1cy1iYXRjaCcsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24uaWQsIHVwZGF0ZXMpO1xuXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB0b2dnbGUgY2F0ZWdvcnkgdG9vbHM6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKCfliIfmjaLnsbvliKvlt6XlhbflpLHotKUnKTtcblxuICAgICAgICAgICAgICAgIC8vIOWmguaenOWQjuerr+abtOaWsOWksei0pe+8jOWbnua7muacrOWcsOeKtuaAgVxuICAgICAgICAgICAgICAgIGNhdGVnb3J5VG9vbHMuZm9yRWFjaCgodG9vbDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRvb2wuZW5hYmxlZCA9ICFlbmFibGVkO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdHVzQmFyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDYXRlZ29yeUNvdW50cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVG9vbENoZWNrYm94ZXMoY2F0ZWdvcnksICFlbmFibGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyB1cGRhdGVUb29sU3RhdHVzKHRoaXM6IGFueSwgY2F0ZWdvcnk6IHN0cmluZywgbmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24pIHJldHVybjtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coYFVwZGF0aW5nIHRvb2wgc3RhdHVzOiAke2NhdGVnb3J5fS4ke25hbWV9ID0gJHtlbmFibGVkfWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYEN1cnJlbnQgY29uZmlnIElEOiAke3RoaXMuY3VycmVudENvbmZpZ3VyYXRpb24uaWR9YCk7XG5cbiAgICAgICAgICAgIC8vIOWFiOabtOaWsOacrOWcsOeKtuaAgVxuICAgICAgICAgICAgY29uc3QgdG9vbCA9IHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24udG9vbHMuZmluZCgodDogYW55KSA9PlxuICAgICAgICAgICAgICAgIHQuY2F0ZWdvcnkgPT09IGNhdGVnb3J5ICYmIHQubmFtZSA9PT0gbmFtZSk7XG4gICAgICAgICAgICBpZiAoIXRvb2wpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBUb29sIG5vdCBmb3VuZDogJHtjYXRlZ29yeX0uJHtuYW1lfWApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0b29sLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBVcGRhdGVkIGxvY2FsIHRvb2wgc3RhdGU6ICR7dG9vbC5uYW1lfSA9ICR7dG9vbC5lbmFibGVkfWApO1xuXG4gICAgICAgICAgICAgICAgLy8g56uL5Y2z5pu05pawVUnvvIjlj6rmm7TmlrDnu5/orqHkv6Hmga/vvIzkuI3ph43mlrDmuLLmn5Plt6XlhbfliJfooajvvIlcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1c0JhcigpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ2F0ZWdvcnlDb3VudHMoKTtcblxuICAgICAgICAgICAgICAgIC8vIOeEtuWQjuWPkemAgeWIsOWQjuerr1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTZW5kaW5nIHRvIGJhY2tlbmQ6IGNvbmZpZ0lkPSR7dGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi5pZH0sIGNhdGVnb3J5PSR7Y2F0ZWdvcnl9LCBuYW1lPSR7bmFtZX0sIGVuYWJsZWQ9JHtlbmFibGVkfWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXRvb2wtc3RhdHVzJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi5pZCwgY2F0ZWdvcnksIG5hbWUsIGVuYWJsZWQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCYWNrZW5kIHJlc3BvbnNlOicsIHJlc3VsdCk7XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHVwZGF0ZSB0b29sIHN0YXR1czonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+abtOaWsOW3peWFt+eKtuaAgeWksei0pScpO1xuXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5ZCO56uv5pu05paw5aSx6LSl77yM5Zue5rua5pys5Zyw54q25oCBXG4gICAgICAgICAgICAgICAgdG9vbC5lbmFibGVkID0gIWVuYWJsZWQ7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdGF0dXNCYXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNhdGVnb3J5Q291bnRzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlU3RhdHVzQmFyKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kLnRvdGFsVG9vbHNDb3VudC50ZXh0Q29udGVudCA9ICcwJztcbiAgICAgICAgICAgICAgICB0aGlzLiQuZW5hYmxlZFRvb2xzQ291bnQudGV4dENvbnRlbnQgPSAnMCc7XG4gICAgICAgICAgICAgICAgdGhpcy4kLmRpc2FibGVkVG9vbHNDb3VudC50ZXh0Q29udGVudCA9ICcwJztcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRvdGFsID0gdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi50b29scy5sZW5ndGg7XG4gICAgICAgICAgICBjb25zdCBlbmFibGVkID0gdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi50b29scy5maWx0ZXIoKHQ6IGFueSkgPT4gdC5lbmFibGVkKS5sZW5ndGg7XG4gICAgICAgICAgICBjb25zdCBkaXNhYmxlZCA9IHRvdGFsIC0gZW5hYmxlZDtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coYFN0YXR1cyBiYXIgdXBkYXRlOiB0b3RhbD0ke3RvdGFsfSwgZW5hYmxlZD0ke2VuYWJsZWR9LCBkaXNhYmxlZD0ke2Rpc2FibGVkfWApO1xuXG4gICAgICAgICAgICB0aGlzLiQudG90YWxUb29sc0NvdW50LnRleHRDb250ZW50ID0gdG90YWwudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIHRoaXMuJC5lbmFibGVkVG9vbHNDb3VudC50ZXh0Q29udGVudCA9IGVuYWJsZWQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIHRoaXMuJC5kaXNhYmxlZFRvb2xzQ291bnQudGV4dENvbnRlbnQgPSBkaXNhYmxlZC50b1N0cmluZygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUNhdGVnb3J5Q291bnRzKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIOabtOaWsOavj+S4quexu+WIq+eahOiuoeaVsOaYvuekulxuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmNhdGVnb3J5LWNoZWNrYm94JykuZm9yRWFjaCgoY2hlY2tib3g6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gY2hlY2tib3guZGF0YXNldC5jYXRlZ29yeTtcbiAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yeVRvb2xzID0gdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi50b29scy5maWx0ZXIoKHQ6IGFueSkgPT4gdC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRDb3VudCA9IGNhdGVnb3J5VG9vbHMuZmlsdGVyKCh0OiBhbnkpID0+IHQuZW5hYmxlZCkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsQ291bnQgPSBjYXRlZ29yeVRvb2xzLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIC8vIOabtOaWsOiuoeaVsOaYvuekulxuICAgICAgICAgICAgICAgIGNvbnN0IGNvdW50U3BhbiA9IGNoZWNrYm94LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuICAgICAgICAgICAgICAgIGlmIChjb3VudFNwYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgY291bnRTcGFuLnRleHRDb250ZW50ID0gYCR7ZW5hYmxlZENvdW50fS8ke3RvdGFsQ291bnR9YDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyDmm7TmlrDnsbvliKvlpI3pgInmoYbnirbmgIFcbiAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZW5hYmxlZENvdW50ID09PSB0b3RhbENvdW50O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlVG9vbENoZWNrYm94ZXModGhpczogYW55LCBjYXRlZ29yeTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgICAgICAvLyDmm7TmlrDnibnlrprnsbvliKvnmoTmiYDmnInlt6XlhbflpI3pgInmoYZcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC50b29sLWNoZWNrYm94W2RhdGEtY2F0ZWdvcnk9XCIke2NhdGVnb3J5fVwiXWApLmZvckVhY2goKGNoZWNrYm94OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZW5hYmxlZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUJ1dHRvbnModGhpczogYW55KSB7XG4gICAgICAgICAgICBjb25zdCBoYXNDdXJyZW50Q29uZmlnID0gISF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uO1xuICAgICAgICAgICAgdGhpcy4kLmVkaXRDb25maWdCdG4uZGlzYWJsZWQgPSAhaGFzQ3VycmVudENvbmZpZztcbiAgICAgICAgICAgIHRoaXMuJC5kZWxldGVDb25maWdCdG4uZGlzYWJsZWQgPSAhaGFzQ3VycmVudENvbmZpZztcbiAgICAgICAgICAgIHRoaXMuJC5leHBvcnRDb25maWdCdG4uZGlzYWJsZWQgPSAhaGFzQ3VycmVudENvbmZpZztcbiAgICAgICAgICAgIHRoaXMuJC5hcHBseUNvbmZpZ0J0bi5kaXNhYmxlZCA9ICFoYXNDdXJyZW50Q29uZmlnO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGNyZWF0ZUNvbmZpZ3VyYXRpb24odGhpczogYW55KSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRpbmdDb25maWcgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy4kLm1vZGFsVGl0bGUudGV4dENvbnRlbnQgPSAn5paw5bu66YWN572uJztcbiAgICAgICAgICAgIHRoaXMuJC5jb25maWdOYW1lLnZhbHVlID0gJyc7XG4gICAgICAgICAgICB0aGlzLiQuY29uZmlnRGVzY3JpcHRpb24udmFsdWUgPSAnJztcbiAgICAgICAgICAgIHRoaXMuc2hvd01vZGFsKCdjb25maWdNb2RhbCcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGVkaXRDb25maWd1cmF0aW9uKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIHRoaXMuZWRpdGluZ0NvbmZpZyA9IHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb247XG4gICAgICAgICAgICB0aGlzLiQubW9kYWxUaXRsZS50ZXh0Q29udGVudCA9ICfnvJbovpHphY3nva4nO1xuICAgICAgICAgICAgdGhpcy4kLmNvbmZpZ05hbWUudmFsdWUgPSB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLm5hbWU7XG4gICAgICAgICAgICB0aGlzLiQuY29uZmlnRGVzY3JpcHRpb24udmFsdWUgPSB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLmRlc2NyaXB0aW9uIHx8ICcnO1xuICAgICAgICAgICAgdGhpcy5zaG93TW9kYWwoJ2NvbmZpZ01vZGFsJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgc2F2ZUNvbmZpZ3VyYXRpb24odGhpczogYW55KSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gdGhpcy4kLmNvbmZpZ05hbWUudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLiQuY29uZmlnRGVzY3JpcHRpb24udmFsdWUudHJpbSgpO1xuXG4gICAgICAgICAgICBpZiAoIW5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dFcnJvcign6YWN572u5ZCN56ew5LiN6IO95Li656m6Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmVkaXRpbmdDb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtdG9vbC1jb25maWd1cmF0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdGluZ0NvbmZpZy5pZCwgeyBuYW1lLCBkZXNjcmlwdGlvbiB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2NyZWF0ZS10b29sLWNvbmZpZ3VyYXRpb24nLCBuYW1lLCBkZXNjcmlwdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlTW9kYWwoJ2NvbmZpZ01vZGFsJyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2F2ZSBjb25maWd1cmF0aW9uOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dFcnJvcign5L+d5a2Y6YWN572u5aSx6LSlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgZGVsZXRlQ29uZmlndXJhdGlvbih0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbikgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zdCBjb25maXJtZWQgPSB3aW5kb3cuY29uZmlybShg56Gu5a6a6KaB5Yig6Zmk6YWN572uIFwiJHt0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLm5hbWV9XCIg5ZCX77yf5q2k5pON5L2c5LiN5Y+v5pKk6ZSA44CCYCk7XG5cbiAgICAgICAgICAgIGlmIChjb25maXJtZWQpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2RlbGV0ZS10b29sLWNvbmZpZ3VyYXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi5pZCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZGVsZXRlIGNvbmZpZ3VyYXRpb246JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dFcnJvcign5Yig6Zmk6YWN572u5aSx6LSlJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGFwcGx5Q29uZmlndXJhdGlvbih0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ0lkID0gdGhpcy4kLmNvbmZpZ1NlbGVjdG9yLnZhbHVlO1xuICAgICAgICAgICAgaWYgKCFjb25maWdJZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnc2V0LWN1cnJlbnQtdG9vbC1jb25maWd1cmF0aW9uJywgY29uZmlnSWQpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGFwcGx5IGNvbmZpZ3VyYXRpb246JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKCflupTnlKjphY3nva7lpLHotKUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyBleHBvcnRDb25maWd1cmF0aW9uKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdleHBvcnQtdG9vbC1jb25maWd1cmF0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi5pZCk7XG5cbiAgICAgICAgICAgICAgICAvLyBVc2UgRE9NIGNsaXBib2FyZCBBUEkgZm9yIDIueCBjb21wYXRpYmlsaXR5XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci5jbGlwYm9hcmQpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQocmVzdWx0LmNvbmZpZ0pzb24pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZhbGxiYWNrIGZvciBvbGRlciBlbnZpcm9ubWVudHNcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGV4dGFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgICAgICAgICAgICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9IHJlc3VsdC5jb25maWdKc29uO1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRleHRhcmVhKTtcbiAgICAgICAgICAgICAgICAgICAgdGV4dGFyZWEuc2VsZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGV4dGFyZWEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB3aW5kb3cuYWxlcnQoJ+WvvOWHuuaIkOWKn1xcbumFjee9ruW3suWkjeWItuWIsOWJqui0tOadvycpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZXhwb3J0IGNvbmZpZ3VyYXRpb246JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKCflr7zlh7rphY3nva7lpLHotKUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyBpbXBvcnRDb25maWd1cmF0aW9uKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgdGhpcy4kLmltcG9ydENvbmZpZ0pzb24udmFsdWUgPSAnJztcbiAgICAgICAgICAgIHRoaXMuc2hvd01vZGFsKCdpbXBvcnRNb2RhbCcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGNvbmZpcm1JbXBvcnQodGhpczogYW55KSB7XG4gICAgICAgICAgICBjb25zdCBjb25maWdKc29uID0gdGhpcy4kLmltcG9ydENvbmZpZ0pzb24udmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKCFjb25maWdKc29uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+ivt+i+k+WFpemFjee9rkpTT04nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdpbXBvcnQtdG9vbC1jb25maWd1cmF0aW9uJywgY29uZmlnSnNvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlTW9kYWwoJ2ltcG9ydE1vZGFsJyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5hbGVydCgn5a+85YWl5oiQ5YqfXFxu6YWN572u5bey5oiQ5Yqf5a+85YWlJyk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBpbXBvcnQgY29uZmlndXJhdGlvbjonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+WvvOWFpemFjee9ruWksei0pScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIHNlbGVjdEFsbFRvb2xzKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTZWxlY3RpbmcgYWxsIHRvb2xzJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZXMgPSB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLnRvb2xzLm1hcCgodG9vbDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0b29sLmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgIG5hbWU6IHRvb2wubmFtZSxcbiAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g5YWI5pu05paw5pys5Zyw54q25oCBXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi50b29scy5mb3JFYWNoKCh0b29sOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdG9vbC5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVXBkYXRlZCBsb2NhbCBzdGF0ZTogYWxsIHRvb2xzIGVuYWJsZWQnKTtcblxuICAgICAgICAgICAgICAgIC8vIOeri+WNs+abtOaWsFVJXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdGF0dXNCYXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRvb2xzRGlzcGxheSgpO1xuXG4gICAgICAgICAgICAgICAgLy8g54S25ZCO5Y+R6YCB5Yiw5ZCO56uvXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZW5kSXBjUmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGUtdG9vbC1zdGF0dXMtYmF0Y2gnLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLmlkLCB1cGRhdGVzKTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2VsZWN0IGFsbCB0b29sczonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+WFqOmAieW3peWFt+Wksei0pScpO1xuXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5ZCO56uv5pu05paw5aSx6LSl77yM5Zue5rua5pys5Zyw54q25oCBXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi50b29scy5mb3JFYWNoKCh0b29sOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdG9vbC5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTdGF0dXNCYXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRvb2xzRGlzcGxheSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGRlc2VsZWN0QWxsVG9vbHModGhpczogYW55KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24pIHJldHVybjtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coJ0Rlc2VsZWN0aW5nIGFsbCB0b29scycpO1xuXG4gICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi50b29scy5tYXAoKHRvb2w6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogdG9vbC5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0b29sLm5hbWUsXG4gICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2VcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDlhYjmm7TmlrDmnKzlnLDnirbmgIFcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLnRvb2xzLmZvckVhY2goKHRvb2w6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0b29sLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVXBkYXRlZCBsb2NhbCBzdGF0ZTogYWxsIHRvb2xzIGRpc2FibGVkJyk7XG5cbiAgICAgICAgICAgICAgICAvLyDnq4vljbPmm7TmlrBVSVxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdHVzQmFyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUb29sc0Rpc3BsYXkoKTtcblxuICAgICAgICAgICAgICAgIC8vIOeEtuWQjuWPkemAgeWIsOWQjuerr1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc2VuZElwY1JlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlLXRvb2wtc3RhdHVzLWJhdGNoJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi5pZCwgdXBkYXRlcyk7XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGRlc2VsZWN0IGFsbCB0b29sczonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+WPlua2iOWFqOmAieW3peWFt+Wksei0pScpO1xuXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5ZCO56uv5pu05paw5aSx6LSl77yM5Zue5rua5pys5Zyw54q25oCBXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi50b29scy5mb3JFYWNoKCh0b29sOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdG9vbC5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1c0JhcigpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVG9vbHNEaXNwbGF5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0Q2F0ZWdvcnlEaXNwbGF5TmFtZSh0aGlzOiBhbnksIGNhdGVnb3J5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnlOYW1lczogYW55ID0ge1xuICAgICAgICAgICAgICAgICdzY2VuZSc6ICflnLrmma/lt6XlhbcnLFxuICAgICAgICAgICAgICAgICdub2RlJzogJ+iKgueCueW3peWFtycsXG4gICAgICAgICAgICAgICAgJ2NvbXBvbmVudCc6ICfnu4Tku7blt6XlhbcnLFxuICAgICAgICAgICAgICAgICdwcmVmYWInOiAn6aKE5Yi25L2T5bel5YW3JyxcbiAgICAgICAgICAgICAgICAncHJvamVjdCc6ICfpobnnm67lt6XlhbcnLFxuICAgICAgICAgICAgICAgICdkZWJ1Zyc6ICfosIPor5Xlt6XlhbcnLFxuICAgICAgICAgICAgICAgICdwcmVmZXJlbmNlcyc6ICflgY/lpb3orr7nva7lt6XlhbcnLFxuICAgICAgICAgICAgICAgICdzZXJ2ZXInOiAn5pyN5Yqh5Zmo5bel5YW3JyxcbiAgICAgICAgICAgICAgICAnYnJvYWRjYXN0JzogJ+W5v+aSreW3peWFtycsXG4gICAgICAgICAgICAgICAgJ3NjZW5lQWR2YW5jZWQnOiAn6auY57qn5Zy65pmv5bel5YW3JyxcbiAgICAgICAgICAgICAgICAnc2NlbmVWaWV3JzogJ+WcuuaZr+inhuWbvuW3peWFtycsXG4gICAgICAgICAgICAgICAgJ3JlZmVyZW5jZUltYWdlJzogJ+WPguiAg+WbvueJh+W3peWFtycsXG4gICAgICAgICAgICAgICAgJ2Fzc2V0QWR2YW5jZWQnOiAn6auY57qn6LWE5rqQ5bel5YW3JyxcbiAgICAgICAgICAgICAgICAndmFsaWRhdGlvbic6ICfpqozor4Hlt6XlhbcnXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGNhdGVnb3J5TmFtZXNbY2F0ZWdvcnldIHx8IGNhdGVnb3J5O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNob3dNb2RhbCh0aGlzOiBhbnksIG1vZGFsSWQ6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy4kW21vZGFsSWRdLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhpZGVNb2RhbCh0aGlzOiBhbnksIG1vZGFsSWQ6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy4kW21vZGFsSWRdLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2hvd0Vycm9yKHRoaXM6IGFueSwgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgICAgICB3aW5kb3cuYWxlcnQoYOmUmeivrzogJHttZXNzYWdlfWApO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIHNhdmVDaGFuZ2VzKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+ayoeaciemAieaLqemFjee9ricpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDnoa7kv53lvZPliY3phY3nva7lt7Lkv53lrZjliLDlkI7nq69cbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnNlbmRJcGNSZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZS10b29sLWNvbmZpZ3VyYXRpb24nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLmlkLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xzOiB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLnRvb2xzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgd2luZG93LmFsZXJ0KCfkv53lrZjmiJDlip9cXG7phY3nva7mm7TmlLnlt7Lkv53lrZgnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHNhdmUgY2hhbmdlczonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+S/neWtmOabtOaUueWksei0pScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGJpbmRFdmVudHModGhpczogYW55KSB7XG4gICAgICAgICAgICB0aGlzLiQuY3JlYXRlQ29uZmlnQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5jcmVhdGVDb25maWd1cmF0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy4kLmVkaXRDb25maWdCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmVkaXRDb25maWd1cmF0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy4kLmRlbGV0ZUNvbmZpZ0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuZGVsZXRlQ29uZmlndXJhdGlvbi5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIHRoaXMuJC5hcHBseUNvbmZpZ0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuYXBwbHlDb25maWd1cmF0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy4kLmV4cG9ydENvbmZpZ0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuZXhwb3J0Q29uZmlndXJhdGlvbi5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIHRoaXMuJC5pbXBvcnRDb25maWdCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmltcG9ydENvbmZpZ3VyYXRpb24uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIHRoaXMuJC5zZWxlY3RBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnNlbGVjdEFsbFRvb2xzLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy4kLmRlc2VsZWN0QWxsQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5kZXNlbGVjdEFsbFRvb2xzLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy4kLnNhdmVDaGFuZ2VzQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5zYXZlQ2hhbmdlcy5iaW5kKHRoaXMpKTtcblxuICAgICAgICAgICAgdGhpcy4kLmNsb3NlTW9kYWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmhpZGVNb2RhbCgnY29uZmlnTW9kYWwnKSk7XG4gICAgICAgICAgICB0aGlzLiQuY2FuY2VsQ29uZmlnQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5oaWRlTW9kYWwoJ2NvbmZpZ01vZGFsJykpO1xuICAgICAgICAgICAgdGhpcy4kLmNvbmZpZ0Zvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgKGU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmVDb25maWd1cmF0aW9uKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy4kLmNsb3NlSW1wb3J0TW9kYWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmhpZGVNb2RhbCgnaW1wb3J0TW9kYWwnKSk7XG4gICAgICAgICAgICB0aGlzLiQuY2FuY2VsSW1wb3J0QnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5oaWRlTW9kYWwoJ2ltcG9ydE1vZGFsJykpO1xuICAgICAgICAgICAgdGhpcy4kLmNvbmZpcm1JbXBvcnRCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNvbmZpcm1JbXBvcnQuYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIHRoaXMuJC5jb25maWdTZWxlY3Rvci5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCB0aGlzLmFwcGx5Q29uZmlndXJhdGlvbi5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmVhZHkoKSB7XG4gICAgICAgICh0aGlzIGFzIGFueSkudG9vbE1hbmFnZXJTdGF0ZSA9IG51bGw7XG4gICAgICAgICh0aGlzIGFzIGFueSkuY3VycmVudENvbmZpZ3VyYXRpb24gPSBudWxsO1xuICAgICAgICAodGhpcyBhcyBhbnkpLmNvbmZpZ3VyYXRpb25zID0gW107XG4gICAgICAgICh0aGlzIGFzIGFueSkuYXZhaWxhYmxlVG9vbHMgPSBbXTtcbiAgICAgICAgKHRoaXMgYXMgYW55KS5lZGl0aW5nQ29uZmlnID0gbnVsbDtcblxuICAgICAgICAodGhpcyBhcyBhbnkpLmJpbmRFdmVudHMoKTtcbiAgICAgICAgKHRoaXMgYXMgYW55KS5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgIH0sXG4gICAgYmVmb3JlQ2xvc2UoKSB7XG4gICAgICAgIC8vIOa4heeQhuW3peS9nFxuICAgIH0sXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIC8vIOmdouadv+WFs+mXrea4heeQhlxuICAgIH1cbn0gYXMgYW55KTsiXX0=