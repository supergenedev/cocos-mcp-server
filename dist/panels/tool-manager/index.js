"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
module.exports = Editor.Panel.define({
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
        async loadToolManagerState() {
            try {
                this.toolManagerState = await Editor.Message.request('cocos-mcp-server', 'getToolManagerState');
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
                await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', this.currentConfiguration.id, updates);
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
                const result = await Editor.Message.request('cocos-mcp-server', 'updateToolStatus', this.currentConfiguration.id, category, name, enabled);
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
                    await Editor.Message.request('cocos-mcp-server', 'updateToolConfiguration', this.editingConfig.id, { name, description });
                }
                else {
                    await Editor.Message.request('cocos-mcp-server', 'createToolConfiguration', name, description);
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
            const confirmed = await Editor.Dialog.warn('确认删除', {
                detail: `确定要删除配置 "${this.currentConfiguration.name}" 吗？此操作不可撤销。`
            });
            if (confirmed) {
                try {
                    await Editor.Message.request('cocos-mcp-server', 'deleteToolConfiguration', this.currentConfiguration.id);
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
                await Editor.Message.request('cocos-mcp-server', 'setCurrentToolConfiguration', configId);
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
                const result = await Editor.Message.request('cocos-mcp-server', 'exportToolConfiguration', this.currentConfiguration.id);
                Editor.Clipboard.write('text', result.configJson);
                Editor.Dialog.info('导出成功', { detail: '配置已复制到剪贴板' });
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
                await Editor.Message.request('cocos-mcp-server', 'importToolConfiguration', configJson);
                this.hideModal('importModal');
                await this.loadToolManagerState();
                Editor.Dialog.info('导入成功', { detail: '配置已成功导入' });
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
                await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', this.currentConfiguration.id, updates);
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
                await Editor.Message.request('cocos-mcp-server', 'updateToolStatusBatch', this.currentConfiguration.id, updates);
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
            Editor.Dialog.error('错误', { detail: message });
        },
        async saveChanges() {
            if (!this.currentConfiguration) {
                this.showError('没有选择配置');
                return;
            }
            try {
                // 确保当前配置已保存到后端
                await Editor.Message.request('cocos-mcp-server', 'updateToolConfiguration', this.currentConfiguration.id, {
                    name: this.currentConfiguration.name,
                    description: this.currentConfiguration.description,
                    tools: this.currentConfiguration.tools
                });
                Editor.Dialog.info('保存成功', { detail: '配置更改已保存' });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zb3VyY2UvcGFuZWxzL3Rvb2wtbWFuYWdlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUF3QztBQUN4QywrQkFBNEI7QUFFNUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxTQUFTLEVBQUU7UUFDUCxJQUFJLEtBQUssT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxJQUFJLEtBQUssT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN2RDtJQUNELFFBQVEsRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLG9EQUFvRCxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3RHLEtBQUssRUFBRSxJQUFBLHVCQUFZLEVBQUMsSUFBQSxXQUFJLEVBQUMsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLEVBQUUsT0FBTyxDQUFDO0lBQ3hGLENBQUMsRUFBRTtRQUNDLFVBQVUsRUFBRSxhQUFhO1FBQ3pCLGVBQWUsRUFBRSxrQkFBa0I7UUFDbkMsZUFBZSxFQUFFLGtCQUFrQjtRQUNuQyxlQUFlLEVBQUUsa0JBQWtCO1FBQ25DLGNBQWMsRUFBRSxpQkFBaUI7UUFDakMsY0FBYyxFQUFFLGlCQUFpQjtRQUNqQyxhQUFhLEVBQUUsZ0JBQWdCO1FBQy9CLGVBQWUsRUFBRSxrQkFBa0I7UUFDbkMsY0FBYyxFQUFFLGlCQUFpQjtRQUNqQyxZQUFZLEVBQUUsZUFBZTtRQUM3QixjQUFjLEVBQUUsaUJBQWlCO1FBQ2pDLGNBQWMsRUFBRSxpQkFBaUI7UUFDakMsZUFBZSxFQUFFLGtCQUFrQjtRQUNuQyxpQkFBaUIsRUFBRSxvQkFBb0I7UUFDdkMsa0JBQWtCLEVBQUUscUJBQXFCO1FBQ3pDLFdBQVcsRUFB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QUcsRUFBRSxDQUFDO1FBQ2pDLElBQVksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBQ2pDLElBQVksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1FBRWxDLElBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUMxQixJQUFZLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztJQUN6QyxDQUFDO0lBQ0QsV0FBVztRQUNQLE9BQU87SUFDWCxDQUFDO0lBQ0QsS0FBSztRQUNELFNBQVM7SUFDYixDQUFDO0NBQ0csQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVkaXRvci5QYW5lbC5kZWZpbmUoe1xuICAgIGxpc3RlbmVyczoge1xuICAgICAgICBzaG93KCkgeyBjb25zb2xlLmxvZygnVG9vbCBNYW5hZ2VyIHBhbmVsIHNob3duJyk7IH0sXG4gICAgICAgIGhpZGUoKSB7IGNvbnNvbGUubG9nKCdUb29sIE1hbmFnZXIgcGFuZWwgaGlkZGVuJyk7IH1cbiAgICB9LFxuICAgIHRlbXBsYXRlOiByZWFkRmlsZVN5bmMoam9pbihfX2Rpcm5hbWUsICcuLi8uLi8uLi9zdGF0aWMvdGVtcGxhdGUvZGVmYXVsdC90b29sLW1hbmFnZXIuaHRtbCcpLCAndXRmLTgnKSxcbiAgICBzdHlsZTogcmVhZEZpbGVTeW5jKGpvaW4oX19kaXJuYW1lLCAnLi4vLi4vLi4vc3RhdGljL3N0eWxlL2RlZmF1bHQvaW5kZXguY3NzJyksICd1dGYtOCcpLFxuICAgICQ6IHtcbiAgICAgICAgcGFuZWxUaXRsZTogJyNwYW5lbFRpdGxlJyxcbiAgICAgICAgY3JlYXRlQ29uZmlnQnRuOiAnI2NyZWF0ZUNvbmZpZ0J0bicsXG4gICAgICAgIGltcG9ydENvbmZpZ0J0bjogJyNpbXBvcnRDb25maWdCdG4nLFxuICAgICAgICBleHBvcnRDb25maWdCdG46ICcjZXhwb3J0Q29uZmlnQnRuJyxcbiAgICAgICAgY29uZmlnU2VsZWN0b3I6ICcjY29uZmlnU2VsZWN0b3InLFxuICAgICAgICBhcHBseUNvbmZpZ0J0bjogJyNhcHBseUNvbmZpZ0J0bicsXG4gICAgICAgIGVkaXRDb25maWdCdG46ICcjZWRpdENvbmZpZ0J0bicsXG4gICAgICAgIGRlbGV0ZUNvbmZpZ0J0bjogJyNkZWxldGVDb25maWdCdG4nLFxuICAgICAgICB0b29sc0NvbnRhaW5lcjogJyN0b29sc0NvbnRhaW5lcicsXG4gICAgICAgIHNlbGVjdEFsbEJ0bjogJyNzZWxlY3RBbGxCdG4nLFxuICAgICAgICBkZXNlbGVjdEFsbEJ0bjogJyNkZXNlbGVjdEFsbEJ0bicsXG4gICAgICAgIHNhdmVDaGFuZ2VzQnRuOiAnI3NhdmVDaGFuZ2VzQnRuJyxcbiAgICAgICAgdG90YWxUb29sc0NvdW50OiAnI3RvdGFsVG9vbHNDb3VudCcsXG4gICAgICAgIGVuYWJsZWRUb29sc0NvdW50OiAnI2VuYWJsZWRUb29sc0NvdW50JyxcbiAgICAgICAgZGlzYWJsZWRUb29sc0NvdW50OiAnI2Rpc2FibGVkVG9vbHNDb3VudCcsXG4gICAgICAgIGNvbmZpZ01vZGFsOiAnI2NvbmZpZ01vZGFsJyxcbiAgICAgICAgbW9kYWxUaXRsZTogJyNtb2RhbFRpdGxlJyxcbiAgICAgICAgY29uZmlnRm9ybTogJyNjb25maWdGb3JtJyxcbiAgICAgICAgY29uZmlnTmFtZTogJyNjb25maWdOYW1lJyxcbiAgICAgICAgY29uZmlnRGVzY3JpcHRpb246ICcjY29uZmlnRGVzY3JpcHRpb24nLFxuICAgICAgICBjbG9zZU1vZGFsOiAnI2Nsb3NlTW9kYWwnLFxuICAgICAgICBjYW5jZWxDb25maWdCdG46ICcjY2FuY2VsQ29uZmlnQnRuJyxcbiAgICAgICAgc2F2ZUNvbmZpZ0J0bjogJyNzYXZlQ29uZmlnQnRuJyxcbiAgICAgICAgaW1wb3J0TW9kYWw6ICcjaW1wb3J0TW9kYWwnLFxuICAgICAgICBpbXBvcnRDb25maWdKc29uOiAnI2ltcG9ydENvbmZpZ0pzb24nLFxuICAgICAgICBjbG9zZUltcG9ydE1vZGFsOiAnI2Nsb3NlSW1wb3J0TW9kYWwnLFxuICAgICAgICBjYW5jZWxJbXBvcnRCdG46ICcjY2FuY2VsSW1wb3J0QnRuJyxcbiAgICAgICAgY29uZmlybUltcG9ydEJ0bjogJyNjb25maXJtSW1wb3J0QnRuJ1xuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBhc3luYyBsb2FkVG9vbE1hbmFnZXJTdGF0ZSh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b29sTWFuYWdlclN0YXRlID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdnZXRUb29sTWFuYWdlclN0YXRlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbiA9IHRoaXMudG9vbE1hbmFnZXJTdGF0ZS5jdXJyZW50Q29uZmlndXJhdGlvbjtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25zID0gdGhpcy50b29sTWFuYWdlclN0YXRlLmNvbmZpZ3VyYXRpb25zO1xuICAgICAgICAgICAgICAgIHRoaXMuYXZhaWxhYmxlVG9vbHMgPSB0aGlzLnRvb2xNYW5hZ2VyU3RhdGUuYXZhaWxhYmxlVG9vbHM7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVVSSgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbG9hZCB0b29sIG1hbmFnZXIgc3RhdGU6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKCfliqDovb3lt6XlhbfnrqHnkIblmajnirbmgIHlpLHotKUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVVSSh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29uZmlnU2VsZWN0b3IoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVG9vbHNEaXNwbGF5KCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1c0JhcigpO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVCdXR0b25zKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlQ29uZmlnU2VsZWN0b3IodGhpczogYW55KSB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RvciA9IHRoaXMuJC5jb25maWdTZWxlY3RvcjtcbiAgICAgICAgICAgIHNlbGVjdG9yLmlubmVySFRNTCA9ICc8b3B0aW9uIHZhbHVlPVwiXCI+6YCJ5oup6YWN572uLi4uPC9vcHRpb24+JztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5jb25maWd1cmF0aW9ucy5mb3JFYWNoKChjb25maWc6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgICAgICAgICAgICAgIG9wdGlvbi52YWx1ZSA9IGNvbmZpZy5pZDtcbiAgICAgICAgICAgICAgICBvcHRpb24udGV4dENvbnRlbnQgPSBjb25maWcubmFtZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbiAmJiBjb25maWcuaWQgPT09IHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24uaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZWN0b3IuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZVRvb2xzRGlzcGxheSh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHRoaXMuJC50b29sc0NvbnRhaW5lcjtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGBcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImVtcHR5LXN0YXRlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8aDM+5rKh5pyJ6YCJ5oup6YWN572uPC9oMz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxwPuivt+WFiOmAieaLqeS4gOS4qumFjee9ruaIluWIm+W7uuaWsOmFjee9rjwvcD5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgYDtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHRvb2xzQnlDYXRlZ29yeTogYW55ID0ge307XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLnRvb2xzLmZvckVhY2goKHRvb2w6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdG9vbHNCeUNhdGVnb3J5W3Rvb2wuY2F0ZWdvcnldKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvb2xzQnlDYXRlZ29yeVt0b29sLmNhdGVnb3J5XSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0b29sc0J5Q2F0ZWdvcnlbdG9vbC5jYXRlZ29yeV0ucHVzaCh0b29sKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIE9iamVjdC5lbnRyaWVzKHRvb2xzQnlDYXRlZ29yeSkuZm9yRWFjaCgoW2NhdGVnb3J5LCB0b29sc106IFtzdHJpbmcsIGFueV0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yeURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5RGl2LmNsYXNzTmFtZSA9ICd0b29sLWNhdGVnb3J5JztcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb25zdCBlbmFibGVkQ291bnQgPSB0b29scy5maWx0ZXIoKHQ6IGFueSkgPT4gdC5lbmFibGVkKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3QgdG90YWxDb3VudCA9IHRvb2xzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjYXRlZ29yeURpdi5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXRlZ29yeS1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYXRlZ29yeS1uYW1lXCI+JHt0aGlzLmdldENhdGVnb3J5RGlzcGxheU5hbWUoY2F0ZWdvcnkpfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNhdGVnb3J5LXRvZ2dsZVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPiR7ZW5hYmxlZENvdW50fS8ke3RvdGFsQ291bnR9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjbGFzcz1cImNoZWNrYm94IGNhdGVnb3J5LWNoZWNrYm94XCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtY2F0ZWdvcnk9XCIke2NhdGVnb3J5fVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAke2VuYWJsZWRDb3VudCA9PT0gdG90YWxDb3VudCA/ICdjaGVja2VkJyA6ICcnfT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtbGlzdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgJHt0b29scy5tYXAoKHRvb2w6IGFueSkgPT4gYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0b29sLWl0ZW1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtaW5mb1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtbmFtZVwiPiR7dG9vbC5uYW1lfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRvb2wtZGVzY3JpcHRpb25cIj4ke3Rvb2wuZGVzY3JpcHRpb259PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwidG9vbC10b2dnbGVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjbGFzcz1cImNoZWNrYm94IHRvb2wtY2hlY2tib3hcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLWNhdGVnb3J5PVwiJHt0b29sLmNhdGVnb3J5fVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEtbmFtZT1cIiR7dG9vbC5uYW1lfVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR7dG9vbC5lbmFibGVkID8gJ2NoZWNrZWQnIDogJyd9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIGApLmpvaW4oJycpfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICBgO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChjYXRlZ29yeURpdik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5iaW5kVG9vbEV2ZW50cygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGJpbmRUb29sRXZlbnRzKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmNhdGVnb3J5LWNoZWNrYm94JykuZm9yRWFjaCgoY2hlY2tib3g6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNoZWNrYm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIChlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnkgPSBlLnRhcmdldC5kYXRhc2V0LmNhdGVnb3J5O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVja2VkID0gZS50YXJnZXQuY2hlY2tlZDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVDYXRlZ29yeVRvb2xzKGNhdGVnb3J5LCBjaGVja2VkKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcudG9vbC1jaGVja2JveCcpLmZvckVhY2goKGNoZWNrYm94OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjaGVja2JveC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5ID0gZS50YXJnZXQuZGF0YXNldC5jYXRlZ29yeTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGUudGFyZ2V0LmRhdGFzZXQubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW5hYmxlZCA9IGUudGFyZ2V0LmNoZWNrZWQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVG9vbFN0YXR1cyhjYXRlZ29yeSwgbmFtZSwgZW5hYmxlZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyB0b2dnbGVDYXRlZ29yeVRvb2xzKHRoaXM6IGFueSwgY2F0ZWdvcnk6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBUb2dnbGluZyBjYXRlZ29yeSB0b29sczogJHtjYXRlZ29yeX0gPSAke2VuYWJsZWR9YCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGNhdGVnb3J5VG9vbHMgPSB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLnRvb2xzLmZpbHRlcigodG9vbDogYW55KSA9PiB0b29sLmNhdGVnb3J5ID09PSBjYXRlZ29yeSk7XG4gICAgICAgICAgICBpZiAoY2F0ZWdvcnlUb29scy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgdXBkYXRlcyA9IGNhdGVnb3J5VG9vbHMubWFwKCh0b29sOiBhbnkpID0+ICh7XG4gICAgICAgICAgICAgICAgY2F0ZWdvcnk6IHRvb2wuY2F0ZWdvcnksXG4gICAgICAgICAgICAgICAgbmFtZTogdG9vbC5uYW1lLFxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGVuYWJsZWRcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDlhYjmm7TmlrDmnKzlnLDnirbmgIFcbiAgICAgICAgICAgICAgICBjYXRlZ29yeVRvb2xzLmZvckVhY2goKHRvb2w6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0b29sLmVuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBVcGRhdGVkIGxvY2FsIGNhdGVnb3J5IHN0YXRlOiAke2NhdGVnb3J5fSA9ICR7ZW5hYmxlZH1gKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDnq4vljbPmm7TmlrBVSVxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdHVzQmFyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDYXRlZ29yeUNvdW50cygpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVG9vbENoZWNrYm94ZXMoY2F0ZWdvcnksIGVuYWJsZWQpO1xuXG4gICAgICAgICAgICAgICAgLy8g54S25ZCO5Y+R6YCB5Yiw5ZCO56uvXG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGVUb29sU3RhdHVzQmF0Y2gnLCBcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi5pZCwgdXBkYXRlcyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB0b2dnbGUgY2F0ZWdvcnkgdG9vbHM6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKCfliIfmjaLnsbvliKvlt6XlhbflpLHotKUnKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzlkI7nq6/mm7TmlrDlpLHotKXvvIzlm57mu5rmnKzlnLDnirbmgIFcbiAgICAgICAgICAgICAgICBjYXRlZ29yeVRvb2xzLmZvckVhY2goKHRvb2w6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0b29sLmVuYWJsZWQgPSAhZW5hYmxlZDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1c0JhcigpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ2F0ZWdvcnlDb3VudHMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRvb2xDaGVja2JveGVzKGNhdGVnb3J5LCAhZW5hYmxlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgdXBkYXRlVG9vbFN0YXR1cyh0aGlzOiBhbnksIGNhdGVnb3J5OiBzdHJpbmcsIG5hbWU6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBVcGRhdGluZyB0b29sIHN0YXR1czogJHtjYXRlZ29yeX0uJHtuYW1lfSA9ICR7ZW5hYmxlZH1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDdXJyZW50IGNvbmZpZyBJRDogJHt0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLmlkfWApO1xuXG4gICAgICAgICAgICAvLyDlhYjmm7TmlrDmnKzlnLDnirbmgIFcbiAgICAgICAgICAgIGNvbnN0IHRvb2wgPSB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLnRvb2xzLmZpbmQoKHQ6IGFueSkgPT4gXG4gICAgICAgICAgICAgICAgdC5jYXRlZ29yeSA9PT0gY2F0ZWdvcnkgJiYgdC5uYW1lID09PSBuYW1lKTtcbiAgICAgICAgICAgIGlmICghdG9vbCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFRvb2wgbm90IGZvdW5kOiAke2NhdGVnb3J5fS4ke25hbWV9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRvb2wuZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYFVwZGF0ZWQgbG9jYWwgdG9vbCBzdGF0ZTogJHt0b29sLm5hbWV9ID0gJHt0b29sLmVuYWJsZWR9YCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g56uL5Y2z5pu05pawVUnvvIjlj6rmm7TmlrDnu5/orqHkv6Hmga/vvIzkuI3ph43mlrDmuLLmn5Plt6XlhbfliJfooajvvIlcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1c0JhcigpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ2F0ZWdvcnlDb3VudHMoKTtcblxuICAgICAgICAgICAgICAgIC8vIOeEtuWQjuWPkemAgeWIsOWQjuerr1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTZW5kaW5nIHRvIGJhY2tlbmQ6IGNvbmZpZ0lkPSR7dGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi5pZH0sIGNhdGVnb3J5PSR7Y2F0ZWdvcnl9LCBuYW1lPSR7bmFtZX0sIGVuYWJsZWQ9JHtlbmFibGVkfWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlVG9vbFN0YXR1cycsIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLmlkLCBjYXRlZ29yeSwgbmFtZSwgZW5hYmxlZCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0JhY2tlbmQgcmVzcG9uc2U6JywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHVwZGF0ZSB0b29sIHN0YXR1czonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+abtOaWsOW3peWFt+eKtuaAgeWksei0pScpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIOWmguaenOWQjuerr+abtOaWsOWksei0pe+8jOWbnua7muacrOWcsOeKtuaAgVxuICAgICAgICAgICAgICAgIHRvb2wuZW5hYmxlZCA9ICFlbmFibGVkO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdHVzQmFyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDYXRlZ29yeUNvdW50cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZVN0YXR1c0Jhcih0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuJC50b3RhbFRvb2xzQ291bnQudGV4dENvbnRlbnQgPSAnMCc7XG4gICAgICAgICAgICAgICAgdGhpcy4kLmVuYWJsZWRUb29sc0NvdW50LnRleHRDb250ZW50ID0gJzAnO1xuICAgICAgICAgICAgICAgIHRoaXMuJC5kaXNhYmxlZFRvb2xzQ291bnQudGV4dENvbnRlbnQgPSAnMCc7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB0b3RhbCA9IHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24udG9vbHMubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3QgZW5hYmxlZCA9IHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24udG9vbHMuZmlsdGVyKCh0OiBhbnkpID0+IHQuZW5hYmxlZCkubGVuZ3RoO1xuICAgICAgICAgICAgY29uc3QgZGlzYWJsZWQgPSB0b3RhbCAtIGVuYWJsZWQ7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBTdGF0dXMgYmFyIHVwZGF0ZTogdG90YWw9JHt0b3RhbH0sIGVuYWJsZWQ9JHtlbmFibGVkfSwgZGlzYWJsZWQ9JHtkaXNhYmxlZH1gKTtcblxuICAgICAgICAgICAgdGhpcy4kLnRvdGFsVG9vbHNDb3VudC50ZXh0Q29udGVudCA9IHRvdGFsLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB0aGlzLiQuZW5hYmxlZFRvb2xzQ291bnQudGV4dENvbnRlbnQgPSBlbmFibGVkLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB0aGlzLiQuZGlzYWJsZWRUb29sc0NvdW50LnRleHRDb250ZW50ID0gZGlzYWJsZWQudG9TdHJpbmcoKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVDYXRlZ29yeUNvdW50cyh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbikgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyDmm7TmlrDmr4/kuKrnsbvliKvnmoTorqHmlbDmmL7npLpcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5jYXRlZ29yeS1jaGVja2JveCcpLmZvckVhY2goKGNoZWNrYm94OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjYXRlZ29yeSA9IGNoZWNrYm94LmRhdGFzZXQuY2F0ZWdvcnk7XG4gICAgICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnlUb29scyA9IHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24udG9vbHMuZmlsdGVyKCh0OiBhbnkpID0+IHQuY2F0ZWdvcnkgPT09IGNhdGVnb3J5KTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbmFibGVkQ291bnQgPSBjYXRlZ29yeVRvb2xzLmZpbHRlcigodDogYW55KSA9PiB0LmVuYWJsZWQpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBjb25zdCB0b3RhbENvdW50ID0gY2F0ZWdvcnlUb29scy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5pu05paw6K6h5pWw5pi+56S6XG4gICAgICAgICAgICAgICAgY29uc3QgY291bnRTcGFuID0gY2hlY2tib3gucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG4gICAgICAgICAgICAgICAgaWYgKGNvdW50U3Bhbikge1xuICAgICAgICAgICAgICAgICAgICBjb3VudFNwYW4udGV4dENvbnRlbnQgPSBgJHtlbmFibGVkQ291bnR9LyR7dG90YWxDb3VudH1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDmm7TmlrDnsbvliKvlpI3pgInmoYbnirbmgIFcbiAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZW5hYmxlZENvdW50ID09PSB0b3RhbENvdW50O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlVG9vbENoZWNrYm94ZXModGhpczogYW55LCBjYXRlZ29yeTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgICAgICAvLyDmm7TmlrDnibnlrprnsbvliKvnmoTmiYDmnInlt6XlhbflpI3pgInmoYZcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC50b29sLWNoZWNrYm94W2RhdGEtY2F0ZWdvcnk9XCIke2NhdGVnb3J5fVwiXWApLmZvckVhY2goKGNoZWNrYm94OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjaGVja2JveC5jaGVja2VkID0gZW5hYmxlZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUJ1dHRvbnModGhpczogYW55KSB7XG4gICAgICAgICAgICBjb25zdCBoYXNDdXJyZW50Q29uZmlnID0gISF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uO1xuICAgICAgICAgICAgdGhpcy4kLmVkaXRDb25maWdCdG4uZGlzYWJsZWQgPSAhaGFzQ3VycmVudENvbmZpZztcbiAgICAgICAgICAgIHRoaXMuJC5kZWxldGVDb25maWdCdG4uZGlzYWJsZWQgPSAhaGFzQ3VycmVudENvbmZpZztcbiAgICAgICAgICAgIHRoaXMuJC5leHBvcnRDb25maWdCdG4uZGlzYWJsZWQgPSAhaGFzQ3VycmVudENvbmZpZztcbiAgICAgICAgICAgIHRoaXMuJC5hcHBseUNvbmZpZ0J0bi5kaXNhYmxlZCA9ICFoYXNDdXJyZW50Q29uZmlnO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGNyZWF0ZUNvbmZpZ3VyYXRpb24odGhpczogYW55KSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRpbmdDb25maWcgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy4kLm1vZGFsVGl0bGUudGV4dENvbnRlbnQgPSAn5paw5bu66YWN572uJztcbiAgICAgICAgICAgIHRoaXMuJC5jb25maWdOYW1lLnZhbHVlID0gJyc7XG4gICAgICAgICAgICB0aGlzLiQuY29uZmlnRGVzY3JpcHRpb24udmFsdWUgPSAnJztcbiAgICAgICAgICAgIHRoaXMuc2hvd01vZGFsKCdjb25maWdNb2RhbCcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGVkaXRDb25maWd1cmF0aW9uKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uKSByZXR1cm47XG5cbiAgICAgICAgICAgIHRoaXMuZWRpdGluZ0NvbmZpZyA9IHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb247XG4gICAgICAgICAgICB0aGlzLiQubW9kYWxUaXRsZS50ZXh0Q29udGVudCA9ICfnvJbovpHphY3nva4nO1xuICAgICAgICAgICAgdGhpcy4kLmNvbmZpZ05hbWUudmFsdWUgPSB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLm5hbWU7XG4gICAgICAgICAgICB0aGlzLiQuY29uZmlnRGVzY3JpcHRpb24udmFsdWUgPSB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLmRlc2NyaXB0aW9uIHx8ICcnO1xuICAgICAgICAgICAgdGhpcy5zaG93TW9kYWwoJ2NvbmZpZ01vZGFsJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgc2F2ZUNvbmZpZ3VyYXRpb24odGhpczogYW55KSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gdGhpcy4kLmNvbmZpZ05hbWUudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLiQuY29uZmlnRGVzY3JpcHRpb24udmFsdWUudHJpbSgpO1xuXG4gICAgICAgICAgICBpZiAoIW5hbWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dFcnJvcign6YWN572u5ZCN56ew5LiN6IO95Li656m6Jyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmVkaXRpbmdDb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGVUb29sQ29uZmlndXJhdGlvbicsIFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0aW5nQ29uZmlnLmlkLCB7IG5hbWUsIGRlc2NyaXB0aW9uIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAnY3JlYXRlVG9vbENvbmZpZ3VyYXRpb24nLCBuYW1lLCBkZXNjcmlwdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHRoaXMuaGlkZU1vZGFsKCdjb25maWdNb2RhbCcpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHNhdmUgY29uZmlndXJhdGlvbjonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+S/neWtmOmFjee9ruWksei0pScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGRlbGV0ZUNvbmZpZ3VyYXRpb24odGhpczogYW55KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24pIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgY29uZmlybWVkID0gYXdhaXQgRWRpdG9yLkRpYWxvZy53YXJuKCfnoa7orqTliKDpmaQnLCB7XG4gICAgICAgICAgICAgICAgZGV0YWlsOiBg56Gu5a6a6KaB5Yig6Zmk6YWN572uIFwiJHt0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLm5hbWV9XCIg5ZCX77yf5q2k5pON5L2c5LiN5Y+v5pKk6ZSA44CCYFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIChjb25maXJtZWQpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2RlbGV0ZVRvb2xDb25maWd1cmF0aW9uJywgXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBkZWxldGUgY29uZmlndXJhdGlvbjonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKCfliKDpmaTphY3nva7lpLHotKUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgYXBwbHlDb25maWd1cmF0aW9uKHRoaXM6IGFueSkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnSWQgPSB0aGlzLiQuY29uZmlnU2VsZWN0b3IudmFsdWU7XG4gICAgICAgICAgICBpZiAoIWNvbmZpZ0lkKSByZXR1cm47XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICdzZXRDdXJyZW50VG9vbENvbmZpZ3VyYXRpb24nLCBjb25maWdJZCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gYXBwbHkgY29uZmlndXJhdGlvbjonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+W6lOeUqOmFjee9ruWksei0pScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGV4cG9ydENvbmZpZ3VyYXRpb24odGhpczogYW55KSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24pIHJldHVybjtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2V4cG9ydFRvb2xDb25maWd1cmF0aW9uJywgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24uaWQpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEVkaXRvci5DbGlwYm9hcmQud3JpdGUoJ3RleHQnLCByZXN1bHQuY29uZmlnSnNvbik7XG4gICAgICAgICAgICAgICAgRWRpdG9yLkRpYWxvZy5pbmZvKCflr7zlh7rmiJDlip8nLCB7IGRldGFpbDogJ+mFjee9ruW3suWkjeWItuWIsOWJqui0tOadvycgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBleHBvcnQgY29uZmlndXJhdGlvbjonLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3IoJ+WvvOWHuumFjee9ruWksei0pScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGFzeW5jIGltcG9ydENvbmZpZ3VyYXRpb24odGhpczogYW55KSB7XG4gICAgICAgICAgICB0aGlzLiQuaW1wb3J0Q29uZmlnSnNvbi52YWx1ZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy5zaG93TW9kYWwoJ2ltcG9ydE1vZGFsJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgY29uZmlybUltcG9ydCh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ0pzb24gPSB0aGlzLiQuaW1wb3J0Q29uZmlnSnNvbi52YWx1ZS50cmltKCk7XG4gICAgICAgICAgICBpZiAoIWNvbmZpZ0pzb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dFcnJvcign6K+36L6T5YWl6YWN572uSlNPTicpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ2ltcG9ydFRvb2xDb25maWd1cmF0aW9uJywgY29uZmlnSnNvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlTW9kYWwoJ2ltcG9ydE1vZGFsJyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5sb2FkVG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgICAgICAgICAgICAgIEVkaXRvci5EaWFsb2cuaW5mbygn5a+85YWl5oiQ5YqfJywgeyBkZXRhaWw6ICfphY3nva7lt7LmiJDlip/lr7zlhaUnIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gaW1wb3J0IGNvbmZpZ3VyYXRpb246JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKCflr7zlhaXphY3nva7lpLHotKUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyBzZWxlY3RBbGxUb29scyh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbikgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnU2VsZWN0aW5nIGFsbCB0b29scycpO1xuXG4gICAgICAgICAgICBjb25zdCB1cGRhdGVzID0gdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi50b29scy5tYXAoKHRvb2w6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogdG9vbC5jYXRlZ29yeSxcbiAgICAgICAgICAgICAgICBuYW1lOiB0b29sLm5hbWUsXG4gICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIOWFiOabtOaWsOacrOWcsOeKtuaAgVxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24udG9vbHMuZm9yRWFjaCgodG9vbDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRvb2wuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1VwZGF0ZWQgbG9jYWwgc3RhdGU6IGFsbCB0b29scyBlbmFibGVkJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g56uL5Y2z5pu05pawVUlcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1c0JhcigpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVG9vbHNEaXNwbGF5KCk7XG5cbiAgICAgICAgICAgICAgICAvLyDnhLblkI7lj5HpgIHliLDlkI7nq69cbiAgICAgICAgICAgICAgICBhd2FpdCBFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0KCdjb2Nvcy1tY3Atc2VydmVyJywgJ3VwZGF0ZVRvb2xTdGF0dXNCYXRjaCcsIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLmlkLCB1cGRhdGVzKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHNlbGVjdCBhbGwgdG9vbHM6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKCflhajpgInlt6XlhbflpLHotKUnKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDlpoLmnpzlkI7nq6/mm7TmlrDlpLHotKXvvIzlm57mu5rmnKzlnLDnirbmgIFcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLnRvb2xzLmZvckVhY2goKHRvb2w6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0b29sLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1c0JhcigpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVG9vbHNEaXNwbGF5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYXN5bmMgZGVzZWxlY3RBbGxUb29scyh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbikgcmV0dXJuO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRGVzZWxlY3RpbmcgYWxsIHRvb2xzJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZXMgPSB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLnRvb2xzLm1hcCgodG9vbDogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0b29sLmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgIG5hbWU6IHRvb2wubmFtZSxcbiAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIOWFiOabtOaWsOacrOWcsOeKtuaAgVxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24udG9vbHMuZm9yRWFjaCgodG9vbDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRvb2wuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdVcGRhdGVkIGxvY2FsIHN0YXRlOiBhbGwgdG9vbHMgZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyDnq4vljbPmm7TmlrBVSVxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3RhdHVzQmFyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUb29sc0Rpc3BsYXkoKTtcblxuICAgICAgICAgICAgICAgIC8vIOeEtuWQjuWPkemAgeWIsOWQjuerr1xuICAgICAgICAgICAgICAgIGF3YWl0IEVkaXRvci5NZXNzYWdlLnJlcXVlc3QoJ2NvY29zLW1jcC1zZXJ2ZXInLCAndXBkYXRlVG9vbFN0YXR1c0JhdGNoJywgXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENvbmZpZ3VyYXRpb24uaWQsIHVwZGF0ZXMpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZGVzZWxlY3QgYWxsIHRvb2xzOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dFcnJvcign5Y+W5raI5YWo6YCJ5bel5YW35aSx6LSlJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgLy8g5aaC5p6c5ZCO56uv5pu05paw5aSx6LSl77yM5Zue5rua5pys5Zyw54q25oCBXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi50b29scy5mb3JFYWNoKCh0b29sOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdG9vbC5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1c0JhcigpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVG9vbHNEaXNwbGF5KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0Q2F0ZWdvcnlEaXNwbGF5TmFtZSh0aGlzOiBhbnksIGNhdGVnb3J5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICAgICAgY29uc3QgY2F0ZWdvcnlOYW1lczogYW55ID0ge1xuICAgICAgICAgICAgICAgICdzY2VuZSc6ICflnLrmma/lt6XlhbcnLFxuICAgICAgICAgICAgICAgICdub2RlJzogJ+iKgueCueW3peWFtycsXG4gICAgICAgICAgICAgICAgJ2NvbXBvbmVudCc6ICfnu4Tku7blt6XlhbcnLFxuICAgICAgICAgICAgICAgICdwcmVmYWInOiAn6aKE5Yi25L2T5bel5YW3JyxcbiAgICAgICAgICAgICAgICAncHJvamVjdCc6ICfpobnnm67lt6XlhbcnLFxuICAgICAgICAgICAgICAgICdkZWJ1Zyc6ICfosIPor5Xlt6XlhbcnLFxuICAgICAgICAgICAgICAgICdwcmVmZXJlbmNlcyc6ICflgY/lpb3orr7nva7lt6XlhbcnLFxuICAgICAgICAgICAgICAgICdzZXJ2ZXInOiAn5pyN5Yqh5Zmo5bel5YW3JyxcbiAgICAgICAgICAgICAgICAnYnJvYWRjYXN0JzogJ+W5v+aSreW3peWFtycsXG4gICAgICAgICAgICAgICAgJ3NjZW5lQWR2YW5jZWQnOiAn6auY57qn5Zy65pmv5bel5YW3JyxcbiAgICAgICAgICAgICAgICAnc2NlbmVWaWV3JzogJ+WcuuaZr+inhuWbvuW3peWFtycsXG4gICAgICAgICAgICAgICAgJ3JlZmVyZW5jZUltYWdlJzogJ+WPguiAg+WbvueJh+W3peWFtycsXG4gICAgICAgICAgICAgICAgJ2Fzc2V0QWR2YW5jZWQnOiAn6auY57qn6LWE5rqQ5bel5YW3JyxcbiAgICAgICAgICAgICAgICAndmFsaWRhdGlvbic6ICfpqozor4Hlt6XlhbcnXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGNhdGVnb3J5TmFtZXNbY2F0ZWdvcnldIHx8IGNhdGVnb3J5O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNob3dNb2RhbCh0aGlzOiBhbnksIG1vZGFsSWQ6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy4kW21vZGFsSWRdLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhpZGVNb2RhbCh0aGlzOiBhbnksIG1vZGFsSWQ6IHN0cmluZykge1xuICAgICAgICAgICAgdGhpcy4kW21vZGFsSWRdLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2hvd0Vycm9yKHRoaXM6IGFueSwgbWVzc2FnZTogc3RyaW5nKSB7XG4gICAgICAgICAgICBFZGl0b3IuRGlhbG9nLmVycm9yKCfplJnor68nLCB7IGRldGFpbDogbWVzc2FnZSB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhc3luYyBzYXZlQ2hhbmdlcyh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9yKCfmsqHmnInpgInmi6nphY3nva4nKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8g56Gu5L+d5b2T5YmN6YWN572u5bey5L+d5a2Y5Yiw5ZCO56uvXG4gICAgICAgICAgICAgICAgYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnY29jb3MtbWNwLXNlcnZlcicsICd1cGRhdGVUb29sQ29uZmlndXJhdGlvbicsIFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLmlkLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdGhpcy5jdXJyZW50Q29uZmlndXJhdGlvbi5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvb2xzOiB0aGlzLmN1cnJlbnRDb25maWd1cmF0aW9uLnRvb2xzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEVkaXRvci5EaWFsb2cuaW5mbygn5L+d5a2Y5oiQ5YqfJywgeyBkZXRhaWw6ICfphY3nva7mm7TmlLnlt7Lkv53lrZgnIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2F2ZSBjaGFuZ2VzOicsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dFcnJvcign5L+d5a2Y5pu05pS55aSx6LSlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgYmluZEV2ZW50cyh0aGlzOiBhbnkpIHtcbiAgICAgICAgICAgIHRoaXMuJC5jcmVhdGVDb25maWdCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmNyZWF0ZUNvbmZpZ3VyYXRpb24uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLiQuZWRpdENvbmZpZ0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuZWRpdENvbmZpZ3VyYXRpb24uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLiQuZGVsZXRlQ29uZmlnQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5kZWxldGVDb25maWd1cmF0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy4kLmFwcGx5Q29uZmlnQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5hcHBseUNvbmZpZ3VyYXRpb24uYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLiQuZXhwb3J0Q29uZmlnQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5leHBvcnRDb25maWd1cmF0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICAgICAgdGhpcy4kLmltcG9ydENvbmZpZ0J0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaW1wb3J0Q29uZmlndXJhdGlvbi5iaW5kKHRoaXMpKTtcblxuICAgICAgICAgICAgdGhpcy4kLnNlbGVjdEFsbEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuc2VsZWN0QWxsVG9vbHMuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLiQuZGVzZWxlY3RBbGxCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmRlc2VsZWN0QWxsVG9vbHMuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLiQuc2F2ZUNoYW5nZXNCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnNhdmVDaGFuZ2VzLmJpbmQodGhpcykpO1xuXG4gICAgICAgICAgICB0aGlzLiQuY2xvc2VNb2RhbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuaGlkZU1vZGFsKCdjb25maWdNb2RhbCcpKTtcbiAgICAgICAgICAgIHRoaXMuJC5jYW5jZWxDb25maWdCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmhpZGVNb2RhbCgnY29uZmlnTW9kYWwnKSk7XG4gICAgICAgICAgICB0aGlzLiQuY29uZmlnRm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCAoZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZUNvbmZpZ3VyYXRpb24oKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLiQuY2xvc2VJbXBvcnRNb2RhbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuaGlkZU1vZGFsKCdpbXBvcnRNb2RhbCcpKTtcbiAgICAgICAgICAgIHRoaXMuJC5jYW5jZWxJbXBvcnRCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmhpZGVNb2RhbCgnaW1wb3J0TW9kYWwnKSk7XG4gICAgICAgICAgICB0aGlzLiQuY29uZmlybUltcG9ydEJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuY29uZmlybUltcG9ydC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAgICAgdGhpcy4kLmNvbmZpZ1NlbGVjdG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIHRoaXMuYXBwbHlDb25maWd1cmF0aW9uLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICByZWFkeSgpIHtcbiAgICAgICAgKHRoaXMgYXMgYW55KS50b29sTWFuYWdlclN0YXRlID0gbnVsbDtcbiAgICAgICAgKHRoaXMgYXMgYW55KS5jdXJyZW50Q29uZmlndXJhdGlvbiA9IG51bGw7XG4gICAgICAgICh0aGlzIGFzIGFueSkuY29uZmlndXJhdGlvbnMgPSBbXTtcbiAgICAgICAgKHRoaXMgYXMgYW55KS5hdmFpbGFibGVUb29scyA9IFtdO1xuICAgICAgICAodGhpcyBhcyBhbnkpLmVkaXRpbmdDb25maWcgPSBudWxsO1xuXG4gICAgICAgICh0aGlzIGFzIGFueSkuYmluZEV2ZW50cygpO1xuICAgICAgICAodGhpcyBhcyBhbnkpLmxvYWRUb29sTWFuYWdlclN0YXRlKCk7XG4gICAgfSxcbiAgICBiZWZvcmVDbG9zZSgpIHtcbiAgICAgICAgLy8g5riF55CG5bel5L2cXG4gICAgfSxcbiAgICBjbG9zZSgpIHtcbiAgICAgICAgLy8g6Z2i5p2/5YWz6Zet5riF55CGXG4gICAgfVxufSBhcyBhbnkpOyAiXX0=