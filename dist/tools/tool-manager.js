"use strict";
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
exports.ToolManager = void 0;
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ToolManager {
    constructor() {
        this.availableTools = [];
        this.settings = this.readToolManagerSettings();
        this.initializeAvailableTools();
        // 如果没有配置，自动创建一个默认配置
        if (this.settings.configurations.length === 0) {
            console.log('[ToolManager] No configurations found, creating default configuration...');
            this.createConfiguration('默认配置', '自动创建的默认工具配置');
        }
    }
    getToolManagerSettingsPath() {
        return path.join(Editor.Project.path, 'settings', 'tool-manager.json');
    }
    ensureSettingsDir() {
        const settingsDir = path.dirname(this.getToolManagerSettingsPath());
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
    }
    readToolManagerSettings() {
        const DEFAULT_TOOL_MANAGER_SETTINGS = {
            configurations: [],
            currentConfigId: '',
            maxConfigSlots: 5
        };
        try {
            this.ensureSettingsDir();
            const settingsFile = this.getToolManagerSettingsPath();
            if (fs.existsSync(settingsFile)) {
                const content = fs.readFileSync(settingsFile, 'utf8');
                return { ...DEFAULT_TOOL_MANAGER_SETTINGS, ...JSON.parse(content) };
            }
        }
        catch (e) {
            console.error('Failed to read tool manager settings:', e);
        }
        return DEFAULT_TOOL_MANAGER_SETTINGS;
    }
    saveToolManagerSettings(settings) {
        try {
            this.ensureSettingsDir();
            const settingsFile = this.getToolManagerSettingsPath();
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
        }
        catch (e) {
            console.error('Failed to save tool manager settings:', e);
            throw e;
        }
    }
    exportToolConfiguration(config) {
        return JSON.stringify(config, null, 2);
    }
    importToolConfiguration(configJson) {
        try {
            const config = JSON.parse(configJson);
            // 验证配置格式
            if (!config.id || !config.name || !Array.isArray(config.tools)) {
                throw new Error('Invalid configuration format');
            }
            return config;
        }
        catch (e) {
            console.error('Failed to parse tool configuration:', e);
            throw new Error('Invalid JSON format or configuration structure');
        }
    }
    initializeAvailableTools() {
        // 从MCP服务器获取真实的工具列表
        try {
            // 导入所有工具类
            const { SceneTools } = require('./scene-tools');
            const { NodeTools } = require('./node-tools');
            const { ComponentTools } = require('./component-tools');
            const { PrefabTools } = require('./prefab-tools');
            const { ProjectTools } = require('./project-tools');
            const { DebugTools } = require('./debug-tools');
            const { ServerTools } = require('./server-tools');
            const { BroadcastTools } = require('./broadcast-tools');
            const { SceneAdvancedTools } = require('./scene-advanced-tools');
            const { SceneViewTools } = require('./scene-view-tools');
            const { ReferenceImageTools } = require('./reference-image-tools');
            const { AssetAdvancedTools } = require('./asset-advanced-tools');
            const { ValidationTools } = require('./validation-tools');
            // 初始化工具实例
            const tools = {
                scene: new SceneTools(),
                node: new NodeTools(),
                component: new ComponentTools(),
                prefab: new PrefabTools(),
                project: new ProjectTools(),
                debug: new DebugTools(),
                server: new ServerTools(),
                broadcast: new BroadcastTools(),
                sceneAdvanced: new SceneAdvancedTools(),
                sceneView: new SceneViewTools(),
                referenceImage: new ReferenceImageTools(),
                assetAdvanced: new AssetAdvancedTools(),
                validation: new ValidationTools()
            };
            // 从每个工具类获取工具列表
            this.availableTools = [];
            for (const [category, toolSet] of Object.entries(tools)) {
                const toolDefinitions = toolSet.getTools();
                toolDefinitions.forEach((tool) => {
                    this.availableTools.push({
                        category: category,
                        name: tool.name,
                        enabled: true,
                        description: tool.description
                    });
                });
            }
            console.log(`[ToolManager] Initialized ${this.availableTools.length} tools from MCP server`);
        }
        catch (error) {
            console.error('[ToolManager] Failed to initialize tools from MCP server:', error);
            // 如果获取失败，使用默认工具列表作为后备
            this.initializeDefaultTools();
        }
    }
    initializeDefaultTools() {
        // 默认工具列表作为后备方案
        const toolCategories = [
            { category: 'scene', name: '场景工具', tools: [
                    { name: 'getCurrentSceneInfo', description: '获取当前场景信息' },
                    { name: 'getSceneHierarchy', description: '获取场景层级结构' },
                    { name: 'createNewScene', description: '创建新场景' },
                    { name: 'saveScene', description: '保存场景' },
                    { name: 'loadScene', description: '加载场景' }
                ] },
            { category: 'node', name: '节点工具', tools: [
                    { name: 'getAllNodes', description: '获取所有节点' },
                    { name: 'findNodeByName', description: '根据名称查找节点' },
                    { name: 'createNode', description: '创建节点' },
                    { name: 'deleteNode', description: '删除节点' },
                    { name: 'setNodeProperty', description: '设置节点属性' },
                    { name: 'getNodeInfo', description: '获取节点信息' }
                ] },
            { category: 'component', name: '组件工具', tools: [
                    { name: 'addComponentToNode', description: '添加组件到节点' },
                    { name: 'removeComponentFromNode', description: '从节点移除组件' },
                    { name: 'setComponentProperty', description: '设置组件属性' },
                    { name: 'getComponentInfo', description: '获取组件信息' }
                ] },
            { category: 'prefab', name: '预制体工具', tools: [
                    { name: 'createPrefabFromNode', description: '从节点创建预制体' },
                    { name: 'instantiatePrefab', description: '实例化预制体' },
                    { name: 'getPrefabInfo', description: '获取预制体信息' },
                    { name: 'savePrefab', description: '保存预制体' }
                ] },
            { category: 'project', name: '项目工具', tools: [
                    { name: 'getProjectInfo', description: '获取项目信息' },
                    { name: 'getAssetList', description: '获取资源列表' },
                    { name: 'createAsset', description: '创建资源' },
                    { name: 'deleteAsset', description: '删除资源' }
                ] },
            { category: 'debug', name: '调试工具', tools: [
                    { name: 'getConsoleLogs', description: '获取控制台日志' },
                    { name: 'getPerformanceStats', description: '获取性能统计' },
                    { name: 'validateScene', description: '验证场景' },
                    { name: 'getErrorLogs', description: '获取错误日志' }
                ] },
            { category: 'server', name: '服务器工具', tools: [
                    { name: 'getServerStatus', description: '获取服务器状态' },
                    { name: 'getConnectedClients', description: '获取连接的客户端' },
                    { name: 'getServerLogs', description: '获取服务器日志' }
                ] },
            { category: 'broadcast', name: '广播工具', tools: [
                    { name: 'broadcastMessage', description: '广播消息' },
                    { name: 'getBroadcastHistory', description: '获取广播历史' }
                ] },
            { category: 'sceneAdvanced', name: '高级场景工具', tools: [
                    { name: 'optimizeScene', description: '优化场景' },
                    { name: 'analyzeScene', description: '分析场景' },
                    { name: 'batchOperation', description: '批量操作' }
                ] },
            { category: 'sceneView', name: '场景视图工具', tools: [
                    { name: 'getViewportInfo', description: '获取视口信息' },
                    { name: 'setViewportCamera', description: '设置视口相机' },
                    { name: 'focusOnNode', description: '聚焦到节点' }
                ] },
            { category: 'referenceImage', name: '参考图片工具', tools: [
                    { name: 'addReferenceImage', description: '添加参考图片' },
                    { name: 'removeReferenceImage', description: '移除参考图片' },
                    { name: 'getReferenceImages', description: '获取参考图片列表' }
                ] },
            { category: 'assetAdvanced', name: '高级资源工具', tools: [
                    { name: 'importAsset', description: '导入资源' },
                    { name: 'exportAsset', description: '导出资源' },
                    { name: 'processAsset', description: '处理资源' }
                ] },
            { category: 'validation', name: '验证工具', tools: [
                    { name: 'validateProject', description: '验证项目' },
                    { name: 'validateAssets', description: '验证资源' },
                    { name: 'generateReport', description: '生成报告' }
                ] }
        ];
        this.availableTools = [];
        toolCategories.forEach(category => {
            category.tools.forEach(tool => {
                this.availableTools.push({
                    category: category.category,
                    name: tool.name,
                    enabled: true,
                    description: tool.description
                });
            });
        });
        console.log(`[ToolManager] Initialized ${this.availableTools.length} default tools`);
    }
    getAvailableTools() {
        return [...this.availableTools];
    }
    getConfigurations() {
        return [...this.settings.configurations];
    }
    getCurrentConfiguration() {
        if (!this.settings.currentConfigId) {
            return null;
        }
        return this.settings.configurations.find(config => config.id === this.settings.currentConfigId) || null;
    }
    createConfiguration(name, description) {
        if (this.settings.configurations.length >= this.settings.maxConfigSlots) {
            throw new Error(`已达到最大配置槽位数量 (${this.settings.maxConfigSlots})`);
        }
        const config = {
            id: (0, uuid_1.v4)(),
            name,
            description,
            tools: this.availableTools.map(tool => ({ ...tool })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.settings.configurations.push(config);
        this.settings.currentConfigId = config.id;
        this.saveSettings();
        return config;
    }
    updateConfiguration(configId, updates) {
        const configIndex = this.settings.configurations.findIndex(config => config.id === configId);
        if (configIndex === -1) {
            throw new Error('配置不存在');
        }
        const config = this.settings.configurations[configIndex];
        const updatedConfig = {
            ...config,
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.settings.configurations[configIndex] = updatedConfig;
        this.saveSettings();
        return updatedConfig;
    }
    deleteConfiguration(configId) {
        const configIndex = this.settings.configurations.findIndex(config => config.id === configId);
        if (configIndex === -1) {
            throw new Error('配置不存在');
        }
        this.settings.configurations.splice(configIndex, 1);
        // 如果删除的是当前配置，清空当前配置ID
        if (this.settings.currentConfigId === configId) {
            this.settings.currentConfigId = this.settings.configurations.length > 0
                ? this.settings.configurations[0].id
                : '';
        }
        this.saveSettings();
    }
    setCurrentConfiguration(configId) {
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            throw new Error('配置不存在');
        }
        this.settings.currentConfigId = configId;
        this.saveSettings();
    }
    updateToolStatus(configId, category, toolName, enabled) {
        console.log(`Backend: Updating tool status - configId: ${configId}, category: ${category}, toolName: ${toolName}, enabled: ${enabled}`);
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            console.error(`Backend: Config not found with ID: ${configId}`);
            throw new Error('配置不存在');
        }
        console.log(`Backend: Found config: ${config.name}`);
        const tool = config.tools.find(t => t.category === category && t.name === toolName);
        if (!tool) {
            console.error(`Backend: Tool not found - category: ${category}, name: ${toolName}`);
            throw new Error('工具不存在');
        }
        console.log(`Backend: Found tool: ${tool.name}, current enabled: ${tool.enabled}, new enabled: ${enabled}`);
        tool.enabled = enabled;
        config.updatedAt = new Date().toISOString();
        console.log(`Backend: Tool updated, saving settings...`);
        this.saveSettings();
        console.log(`Backend: Settings saved successfully`);
    }
    updateToolStatusBatch(configId, updates) {
        console.log(`Backend: updateToolStatusBatch called with configId: ${configId}`);
        console.log(`Backend: Current configurations count: ${this.settings.configurations.length}`);
        console.log(`Backend: Current config IDs:`, this.settings.configurations.map(c => c.id));
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            console.error(`Backend: Config not found with ID: ${configId}`);
            console.error(`Backend: Available config IDs:`, this.settings.configurations.map(c => c.id));
            throw new Error('配置不存在');
        }
        console.log(`Backend: Found config: ${config.name}, updating ${updates.length} tools`);
        updates.forEach(update => {
            const tool = config.tools.find(t => t.category === update.category && t.name === update.name);
            if (tool) {
                tool.enabled = update.enabled;
            }
        });
        config.updatedAt = new Date().toISOString();
        this.saveSettings();
        console.log(`Backend: Batch update completed successfully`);
    }
    exportConfiguration(configId) {
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            throw new Error('配置不存在');
        }
        return this.exportToolConfiguration(config);
    }
    importConfiguration(configJson) {
        const config = this.importToolConfiguration(configJson);
        // 生成新的ID和时间戳
        config.id = (0, uuid_1.v4)();
        config.createdAt = new Date().toISOString();
        config.updatedAt = new Date().toISOString();
        if (this.settings.configurations.length >= this.settings.maxConfigSlots) {
            throw new Error(`已达到最大配置槽位数量 (${this.settings.maxConfigSlots})`);
        }
        this.settings.configurations.push(config);
        this.saveSettings();
        return config;
    }
    getEnabledTools() {
        const currentConfig = this.getCurrentConfiguration();
        if (!currentConfig) {
            return this.availableTools.filter(tool => tool.enabled);
        }
        return currentConfig.tools.filter(tool => tool.enabled);
    }
    getToolManagerState() {
        const currentConfig = this.getCurrentConfiguration();
        return {
            success: true,
            availableTools: currentConfig ? currentConfig.tools : this.getAvailableTools(),
            selectedConfigId: this.settings.currentConfigId,
            configurations: this.getConfigurations(),
            maxConfigSlots: this.settings.maxConfigSlots
        };
    }
    saveSettings() {
        console.log(`Backend: Saving settings, current configs count: ${this.settings.configurations.length}`);
        this.saveToolManagerSettings(this.settings);
        console.log(`Backend: Settings saved to file`);
    }
}
exports.ToolManager = ToolManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbC1tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3Rvb2wtbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUFvQztBQUVwQyx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBRTdCLE1BQWEsV0FBVztJQUlwQjtRQUZRLG1CQUFjLEdBQWlCLEVBQUUsQ0FBQztRQUd0QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQy9DLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1FBRWhDLG9CQUFvQjtRQUNwQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQywwRUFBMEUsQ0FBQyxDQUFDO1lBQ3hGLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDbkQ7SUFDTCxDQUFDO0lBRU8sMEJBQTBCO1FBQzlCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRU8saUJBQWlCO1FBQ3JCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLDBCQUEwQixFQUFFLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUM3QixFQUFFLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQ2xEO0lBQ0wsQ0FBQztJQUVPLHVCQUF1QjtRQUMzQixNQUFNLDZCQUE2QixHQUF3QjtZQUN2RCxjQUFjLEVBQUUsRUFB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LEVBQUUsQ0FBQztRQUNyRCxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ2hCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDM0Q7UUFDRCxPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFFTSxtQkFBbUI7UUFDdEIsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFDckQsT0FBTztZQUNILE9BQU8sRUFBRSxJQUFJO1lBQ2IsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQzlFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZTtZQUMvQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQ3hDLGNBQWMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWM7U0FDL0MsQ0FBQztJQUNOLENBQUM7SUFFTyxZQUFZO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0RBQW9ELElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdkcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM1QyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztDQUNKO0FBNVpELGtDQTRaQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHY0IGFzIHV1aWR2NCB9IGZyb20gJ3V1aWQnO1xuaW1wb3J0IHsgVG9vbENvbmZpZywgVG9vbENvbmZpZ3VyYXRpb24sIFRvb2xNYW5hZ2VyU2V0dGluZ3MsIFRvb2xEZWZpbml0aW9uIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNsYXNzIFRvb2xNYW5hZ2VyIHtcbiAgICBwcml2YXRlIHNldHRpbmdzOiBUb29sTWFuYWdlclNldHRpbmdzO1xuICAgIHByaXZhdGUgYXZhaWxhYmxlVG9vbHM6IFRvb2xDb25maWdbXSA9IFtdO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSB0aGlzLnJlYWRUb29sTWFuYWdlclNldHRpbmdzKCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZUF2YWlsYWJsZVRvb2xzKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDlpoLmnpzmsqHmnInphY3nva7vvIzoh6rliqjliJvlu7rkuIDkuKrpu5jorqTphY3nva5cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW1Rvb2xNYW5hZ2VyXSBObyBjb25maWd1cmF0aW9ucyBmb3VuZCwgY3JlYXRpbmcgZGVmYXVsdCBjb25maWd1cmF0aW9uLi4uJyk7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUNvbmZpZ3VyYXRpb24oJ+m7mOiupOmFjee9ricsICfoh6rliqjliJvlu7rnmoTpu5jorqTlt6XlhbfphY3nva4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0VG9vbE1hbmFnZXJTZXR0aW5nc1BhdGgoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnc2V0dGluZ3MnLCAndG9vbC1tYW5hZ2VyLmpzb24nKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGVuc3VyZVNldHRpbmdzRGlyKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzZXR0aW5nc0RpciA9IHBhdGguZGlybmFtZSh0aGlzLmdldFRvb2xNYW5hZ2VyU2V0dGluZ3NQYXRoKCkpO1xuICAgICAgICBpZiAoIWZzLmV4aXN0c1N5bmMoc2V0dGluZ3NEaXIpKSB7XG4gICAgICAgICAgICBmcy5ta2RpclN5bmMoc2V0dGluZ3NEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZWFkVG9vbE1hbmFnZXJTZXR0aW5ncygpOiBUb29sTWFuYWdlclNldHRpbmdzIHtcbiAgICAgICAgY29uc3QgREVGQVVMVF9UT09MX01BTkFHRVJfU0VUVElOR1M6IFRvb2xNYW5hZ2VyU2V0dGluZ3MgPSB7XG4gICAgICAgICAgICBjb25maWd1cmF0aW9uczogW10sXG4gICAgICAgICAgICBjdXJyZW50Q29uZmlnSWQ6ICcnLFxuICAgICAgICAgICAgbWF4Q29uZmlnU2xvdHM6IDVcbiAgICAgICAgfTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVTZXR0aW5nc0RpcigpO1xuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3NGaWxlID0gdGhpcy5nZXRUb29sTWFuYWdlclNldHRpbmdzUGF0aCgpO1xuICAgICAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMoc2V0dGluZ3NGaWxlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoc2V0dGluZ3NGaWxlLCAndXRmOCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IC4uLkRFRkFVTFRfVE9PTF9NQU5BR0VSX1NFVFRJTkdTLCAuLi5KU09OLnBhcnNlKGNvbnRlbnQpIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWFkIHRvb2wgbWFuYWdlciBzZXR0aW5nczonLCBlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gREVGQVVMVF9UT09MX01BTkFHRVJfU0VUVElOR1M7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzYXZlVG9vbE1hbmFnZXJTZXR0aW5ncyhzZXR0aW5nczogVG9vbE1hbmFnZXJTZXR0aW5ncyk6IHZvaWQge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVTZXR0aW5nc0RpcigpO1xuICAgICAgICAgICAgY29uc3Qgc2V0dGluZ3NGaWxlID0gdGhpcy5nZXRUb29sTWFuYWdlclNldHRpbmdzUGF0aCgpO1xuICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhzZXR0aW5nc0ZpbGUsIEpTT04uc3RyaW5naWZ5KHNldHRpbmdzLCBudWxsLCAyKSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzYXZlIHRvb2wgbWFuYWdlciBzZXR0aW5nczonLCBlKTtcbiAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGV4cG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZzogVG9vbENvbmZpZ3VyYXRpb24pOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoY29uZmlnLCBudWxsLCAyKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGltcG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0pzb246IHN0cmluZyk6IFRvb2xDb25maWd1cmF0aW9uIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnSnNvbik7XG4gICAgICAgICAgICAvLyDpqozor4HphY3nva7moLzlvI9cbiAgICAgICAgICAgIGlmICghY29uZmlnLmlkIHx8ICFjb25maWcubmFtZSB8fCAhQXJyYXkuaXNBcnJheShjb25maWcudG9vbHMpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbmZpZ3VyYXRpb24gZm9ybWF0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcGFyc2UgdG9vbCBjb25maWd1cmF0aW9uOicsIGUpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEpTT04gZm9ybWF0IG9yIGNvbmZpZ3VyYXRpb24gc3RydWN0dXJlJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGluaXRpYWxpemVBdmFpbGFibGVUb29scygpOiB2b2lkIHtcbiAgICAgICAgLy8g5LuOTUNQ5pyN5Yqh5Zmo6I635Y+W55yf5a6e55qE5bel5YW35YiX6KGoXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyDlr7zlhaXmiYDmnInlt6XlhbfnsbtcbiAgICAgICAgICAgIGNvbnN0IHsgU2NlbmVUb29scyB9ID0gcmVxdWlyZSgnLi9zY2VuZS10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBOb2RlVG9vbHMgfSA9IHJlcXVpcmUoJy4vbm9kZS10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBDb21wb25lbnRUb29scyB9ID0gcmVxdWlyZSgnLi9jb21wb25lbnQtdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgUHJlZmFiVG9vbHMgfSA9IHJlcXVpcmUoJy4vcHJlZmFiLXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IFByb2plY3RUb29scyB9ID0gcmVxdWlyZSgnLi9wcm9qZWN0LXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IERlYnVnVG9vbHMgfSA9IHJlcXVpcmUoJy4vZGVidWctdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgU2VydmVyVG9vbHMgfSA9IHJlcXVpcmUoJy4vc2VydmVyLXRvb2xzJyk7XG4gICAgICAgICAgICBjb25zdCB7IEJyb2FkY2FzdFRvb2xzIH0gPSByZXF1aXJlKCcuL2Jyb2FkY2FzdC10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBTY2VuZUFkdmFuY2VkVG9vbHMgfSA9IHJlcXVpcmUoJy4vc2NlbmUtYWR2YW5jZWQtdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgU2NlbmVWaWV3VG9vbHMgfSA9IHJlcXVpcmUoJy4vc2NlbmUtdmlldy10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBSZWZlcmVuY2VJbWFnZVRvb2xzIH0gPSByZXF1aXJlKCcuL3JlZmVyZW5jZS1pbWFnZS10b29scycpO1xuICAgICAgICAgICAgY29uc3QgeyBBc3NldEFkdmFuY2VkVG9vbHMgfSA9IHJlcXVpcmUoJy4vYXNzZXQtYWR2YW5jZWQtdG9vbHMnKTtcbiAgICAgICAgICAgIGNvbnN0IHsgVmFsaWRhdGlvblRvb2xzIH0gPSByZXF1aXJlKCcuL3ZhbGlkYXRpb24tdG9vbHMnKTtcblxuICAgICAgICAgICAgLy8g5Yid5aeL5YyW5bel5YW35a6e5L6LXG4gICAgICAgICAgICBjb25zdCB0b29scyA9IHtcbiAgICAgICAgICAgICAgICBzY2VuZTogbmV3IFNjZW5lVG9vbHMoKSxcbiAgICAgICAgICAgICAgICBub2RlOiBuZXcgTm9kZVRvb2xzKCksXG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiBuZXcgQ29tcG9uZW50VG9vbHMoKSxcbiAgICAgICAgICAgICAgICBwcmVmYWI6IG5ldyBQcmVmYWJUb29scygpLFxuICAgICAgICAgICAgICAgIHByb2plY3Q6IG5ldyBQcm9qZWN0VG9vbHMoKSxcbiAgICAgICAgICAgICAgICBkZWJ1ZzogbmV3IERlYnVnVG9vbHMoKSxcbiAgICAgICAgICAgICAgICBzZXJ2ZXI6IG5ldyBTZXJ2ZXJUb29scygpLFxuICAgICAgICAgICAgICAgIGJyb2FkY2FzdDogbmV3IEJyb2FkY2FzdFRvb2xzKCksXG4gICAgICAgICAgICAgICAgc2NlbmVBZHZhbmNlZDogbmV3IFNjZW5lQWR2YW5jZWRUb29scygpLFxuICAgICAgICAgICAgICAgIHNjZW5lVmlldzogbmV3IFNjZW5lVmlld1Rvb2xzKCksXG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlSW1hZ2U6IG5ldyBSZWZlcmVuY2VJbWFnZVRvb2xzKCksXG4gICAgICAgICAgICAgICAgYXNzZXRBZHZhbmNlZDogbmV3IEFzc2V0QWR2YW5jZWRUb29scygpLFxuICAgICAgICAgICAgICAgIHZhbGlkYXRpb246IG5ldyBWYWxpZGF0aW9uVG9vbHMoKVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8g5LuO5q+P5Liq5bel5YW357G76I635Y+W5bel5YW35YiX6KGoXG4gICAgICAgICAgICB0aGlzLmF2YWlsYWJsZVRvb2xzID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IFtjYXRlZ29yeSwgdG9vbFNldF0gb2YgT2JqZWN0LmVudHJpZXModG9vbHMpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdG9vbERlZmluaXRpb25zID0gdG9vbFNldC5nZXRUb29scygpO1xuICAgICAgICAgICAgICAgIHRvb2xEZWZpbml0aW9ucy5mb3JFYWNoKCh0b29sOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdmFpbGFibGVUb29scy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiBjYXRlZ29yeSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRvb2wubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsIC8vIOm7mOiupOWQr+eUqFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHRvb2wuZGVzY3JpcHRpb25cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbVG9vbE1hbmFnZXJdIEluaXRpYWxpemVkICR7dGhpcy5hdmFpbGFibGVUb29scy5sZW5ndGh9IHRvb2xzIGZyb20gTUNQIHNlcnZlcmApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1Rvb2xNYW5hZ2VyXSBGYWlsZWQgdG8gaW5pdGlhbGl6ZSB0b29scyBmcm9tIE1DUCBzZXJ2ZXI6JywgZXJyb3IpO1xuICAgICAgICAgICAgLy8g5aaC5p6c6I635Y+W5aSx6LSl77yM5L2/55So6buY6K6k5bel5YW35YiX6KGo5L2c5Li65ZCO5aSHXG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVEZWZhdWx0VG9vbHMoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaW5pdGlhbGl6ZURlZmF1bHRUb29scygpOiB2b2lkIHtcbiAgICAgICAgLy8g6buY6K6k5bel5YW35YiX6KGo5L2c5Li65ZCO5aSH5pa55qGIXG4gICAgICAgIGNvbnN0IHRvb2xDYXRlZ29yaWVzID0gW1xuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ3NjZW5lJywgbmFtZTogJ+WcuuaZr+W3peWFtycsIHRvb2xzOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0Q3VycmVudFNjZW5lSW5mbycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5b2T5YmN5Zy65pmv5L+h5oGvJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldFNjZW5lSGllcmFyY2h5JywgZGVzY3JpcHRpb246ICfojrflj5blnLrmma/lsYLnuqfnu5PmnoQnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnY3JlYXRlTmV3U2NlbmUnLCBkZXNjcmlwdGlvbjogJ+WIm+W7uuaWsOWcuuaZrycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdzYXZlU2NlbmUnLCBkZXNjcmlwdGlvbjogJ+S/neWtmOWcuuaZrycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdsb2FkU2NlbmUnLCBkZXNjcmlwdGlvbjogJ+WKoOi9veWcuuaZrycgfVxuICAgICAgICAgICAgXX0sXG4gICAgICAgICAgICB7IGNhdGVnb3J5OiAnbm9kZScsIG5hbWU6ICfoioLngrnlt6XlhbcnLCB0b29sczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldEFsbE5vZGVzJywgZGVzY3JpcHRpb246ICfojrflj5bmiYDmnInoioLngrknIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZmluZE5vZGVCeU5hbWUnLCBkZXNjcmlwdGlvbjogJ+agueaNruWQjeensOafpeaJvuiKgueCuScgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdjcmVhdGVOb2RlJywgZGVzY3JpcHRpb246ICfliJvlu7roioLngrknIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZGVsZXRlTm9kZScsIGRlc2NyaXB0aW9uOiAn5Yig6Zmk6IqC54K5JyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3NldE5vZGVQcm9wZXJ0eScsIGRlc2NyaXB0aW9uOiAn6K6+572u6IqC54K55bGe5oCnJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldE5vZGVJbmZvJywgZGVzY3JpcHRpb246ICfojrflj5boioLngrnkv6Hmga8nIH1cbiAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ2NvbXBvbmVudCcsIG5hbWU6ICfnu4Tku7blt6XlhbcnLCB0b29sczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2FkZENvbXBvbmVudFRvTm9kZScsIGRlc2NyaXB0aW9uOiAn5re75Yqg57uE5Lu25Yiw6IqC54K5JyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3JlbW92ZUNvbXBvbmVudEZyb21Ob2RlJywgZGVzY3JpcHRpb246ICfku47oioLngrnnp7vpmaTnu4Tku7YnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnc2V0Q29tcG9uZW50UHJvcGVydHknLCBkZXNjcmlwdGlvbjogJ+iuvue9rue7hOS7tuWxnuaApycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRDb21wb25lbnRJbmZvJywgZGVzY3JpcHRpb246ICfojrflj5bnu4Tku7bkv6Hmga8nIH1cbiAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ3ByZWZhYicsIG5hbWU6ICfpooTliLbkvZPlt6XlhbcnLCB0b29sczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2NyZWF0ZVByZWZhYkZyb21Ob2RlJywgZGVzY3JpcHRpb246ICfku47oioLngrnliJvlu7rpooTliLbkvZMnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnaW5zdGFudGlhdGVQcmVmYWInLCBkZXNjcmlwdGlvbjogJ+WunuS+i+WMlumihOWItuS9kycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRQcmVmYWJJbmZvJywgZGVzY3JpcHRpb246ICfojrflj5bpooTliLbkvZPkv6Hmga8nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnc2F2ZVByZWZhYicsIGRlc2NyaXB0aW9uOiAn5L+d5a2Y6aKE5Yi25L2TJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdwcm9qZWN0JywgbmFtZTogJ+mhueebruW3peWFtycsIHRvb2xzOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0UHJvamVjdEluZm8nLCBkZXNjcmlwdGlvbjogJ+iOt+WPlumhueebruS/oeaBrycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRBc3NldExpc3QnLCBkZXNjcmlwdGlvbjogJ+iOt+WPlui1hOa6kOWIl+ihqCcgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdjcmVhdGVBc3NldCcsIGRlc2NyaXB0aW9uOiAn5Yib5bu66LWE5rqQJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2RlbGV0ZUFzc2V0JywgZGVzY3JpcHRpb246ICfliKDpmaTotYTmupAnIH1cbiAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ2RlYnVnJywgbmFtZTogJ+iwg+ivleW3peWFtycsIHRvb2xzOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0Q29uc29sZUxvZ3MnLCBkZXNjcmlwdGlvbjogJ+iOt+WPluaOp+WItuWPsOaXpeW/lycgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRQZXJmb3JtYW5jZVN0YXRzJywgZGVzY3JpcHRpb246ICfojrflj5bmgKfog73nu5/orqEnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAndmFsaWRhdGVTY2VuZScsIGRlc2NyaXB0aW9uOiAn6aqM6K+B5Zy65pmvJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldEVycm9yTG9ncycsIGRlc2NyaXB0aW9uOiAn6I635Y+W6ZSZ6K+v5pel5b+XJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdzZXJ2ZXInLCBuYW1lOiAn5pyN5Yqh5Zmo5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRTZXJ2ZXJTdGF0dXMnLCBkZXNjcmlwdGlvbjogJ+iOt+WPluacjeWKoeWZqOeKtuaAgScgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdnZXRDb25uZWN0ZWRDbGllbnRzJywgZGVzY3JpcHRpb246ICfojrflj5bov57mjqXnmoTlrqLmiLfnq68nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0U2VydmVyTG9ncycsIGRlc2NyaXB0aW9uOiAn6I635Y+W5pyN5Yqh5Zmo5pel5b+XJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdicm9hZGNhc3QnLCBuYW1lOiAn5bm/5pKt5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdicm9hZGNhc3RNZXNzYWdlJywgZGVzY3JpcHRpb246ICflub/mkq3mtojmga8nIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0QnJvYWRjYXN0SGlzdG9yeScsIGRlc2NyaXB0aW9uOiAn6I635Y+W5bm/5pKt5Y6G5Y+yJyB9XG4gICAgICAgICAgICBdfSxcbiAgICAgICAgICAgIHsgY2F0ZWdvcnk6ICdzY2VuZUFkdmFuY2VkJywgbmFtZTogJ+mrmOe6p+WcuuaZr+W3peWFtycsIHRvb2xzOiBbXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW1pemVTY2VuZScsIGRlc2NyaXB0aW9uOiAn5LyY5YyW5Zy65pmvJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2FuYWx5emVTY2VuZScsIGRlc2NyaXB0aW9uOiAn5YiG5p6Q5Zy65pmvJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2JhdGNoT3BlcmF0aW9uJywgZGVzY3JpcHRpb246ICfmibnph4/mk43kvZwnIH1cbiAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ3NjZW5lVmlldycsIG5hbWU6ICflnLrmma/op4blm77lt6XlhbcnLCB0b29sczogW1xuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dldFZpZXdwb3J0SW5mbycsIGRlc2NyaXB0aW9uOiAn6I635Y+W6KeG5Y+j5L+h5oGvJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3NldFZpZXdwb3J0Q2FtZXJhJywgZGVzY3JpcHRpb246ICforr7nva7op4blj6Pnm7jmnLonIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZm9jdXNPbk5vZGUnLCBkZXNjcmlwdGlvbjogJ+iBmueEpuWIsOiKgueCuScgfVxuICAgICAgICAgICAgXX0sXG4gICAgICAgICAgICB7IGNhdGVnb3J5OiAncmVmZXJlbmNlSW1hZ2UnLCBuYW1lOiAn5Y+C6ICD5Zu+54mH5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdhZGRSZWZlcmVuY2VJbWFnZScsIGRlc2NyaXB0aW9uOiAn5re75Yqg5Y+C6ICD5Zu+54mHJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ3JlbW92ZVJlZmVyZW5jZUltYWdlJywgZGVzY3JpcHRpb246ICfnp7vpmaTlj4LogIPlm77niYcnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZ2V0UmVmZXJlbmNlSW1hZ2VzJywgZGVzY3JpcHRpb246ICfojrflj5blj4LogIPlm77niYfliJfooagnIH1cbiAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ2Fzc2V0QWR2YW5jZWQnLCBuYW1lOiAn6auY57qn6LWE5rqQ5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdpbXBvcnRBc3NldCcsIGRlc2NyaXB0aW9uOiAn5a+85YWl6LWE5rqQJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2V4cG9ydEFzc2V0JywgZGVzY3JpcHRpb246ICflr7zlh7rotYTmupAnIH0sXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAncHJvY2Vzc0Fzc2V0JywgZGVzY3JpcHRpb246ICflpITnkIbotYTmupAnIH1cbiAgICAgICAgICAgIF19LFxuICAgICAgICAgICAgeyBjYXRlZ29yeTogJ3ZhbGlkYXRpb24nLCBuYW1lOiAn6aqM6K+B5bel5YW3JywgdG9vbHM6IFtcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICd2YWxpZGF0ZVByb2plY3QnLCBkZXNjcmlwdGlvbjogJ+mqjOivgemhueebricgfSxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICd2YWxpZGF0ZUFzc2V0cycsIGRlc2NyaXB0aW9uOiAn6aqM6K+B6LWE5rqQJyB9LFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2dlbmVyYXRlUmVwb3J0JywgZGVzY3JpcHRpb246ICfnlJ/miJDmiqXlkYonIH1cbiAgICAgICAgICAgIF19XG4gICAgICAgIF07XG5cbiAgICAgICAgdGhpcy5hdmFpbGFibGVUb29scyA9IFtdO1xuICAgICAgICB0b29sQ2F0ZWdvcmllcy5mb3JFYWNoKGNhdGVnb3J5ID0+IHtcbiAgICAgICAgICAgIGNhdGVnb3J5LnRvb2xzLmZvckVhY2godG9vbCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5hdmFpbGFibGVUb29scy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6IGNhdGVnb3J5LmNhdGVnb3J5LFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiB0b29sLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsIC8vIOm7mOiupOWQr+eUqFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogdG9vbC5kZXNjcmlwdGlvblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKGBbVG9vbE1hbmFnZXJdIEluaXRpYWxpemVkICR7dGhpcy5hdmFpbGFibGVUb29scy5sZW5ndGh9IGRlZmF1bHQgdG9vbHNgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0QXZhaWxhYmxlVG9vbHMoKTogVG9vbENvbmZpZ1tdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLmF2YWlsYWJsZVRvb2xzXTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0Q29uZmlndXJhdGlvbnMoKTogVG9vbENvbmZpZ3VyYXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9uc107XG4gICAgfVxuXG4gICAgcHVibGljIGdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk6IFRvb2xDb25maWd1cmF0aW9uIHwgbnVsbCB7XG4gICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5jdXJyZW50Q29uZmlnSWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmZpbmQoY29uZmlnID0+IGNvbmZpZy5pZCA9PT0gdGhpcy5zZXR0aW5ncy5jdXJyZW50Q29uZmlnSWQpIHx8IG51bGw7XG4gICAgfVxuXG4gICAgcHVibGljIGNyZWF0ZUNvbmZpZ3VyYXRpb24obmFtZTogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFRvb2xDb25maWd1cmF0aW9uIHtcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubGVuZ3RoID49IHRoaXMuc2V0dGluZ3MubWF4Q29uZmlnU2xvdHMpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5bey6L6+5Yiw5pyA5aSn6YWN572u5qe95L2N5pWw6YePICgke3RoaXMuc2V0dGluZ3MubWF4Q29uZmlnU2xvdHN9KWApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29uZmlnOiBUb29sQ29uZmlndXJhdGlvbiA9IHtcbiAgICAgICAgICAgIGlkOiB1dWlkdjQoKSxcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgIHRvb2xzOiB0aGlzLmF2YWlsYWJsZVRvb2xzLm1hcCh0b29sID0+ICh7IC4uLnRvb2wgfSkpLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMucHVzaChjb25maWcpO1xuICAgICAgICB0aGlzLnNldHRpbmdzLmN1cnJlbnRDb25maWdJZCA9IGNvbmZpZy5pZDtcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcblxuICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVDb25maWd1cmF0aW9uKGNvbmZpZ0lkOiBzdHJpbmcsIHVwZGF0ZXM6IFBhcnRpYWw8VG9vbENvbmZpZ3VyYXRpb24+KTogVG9vbENvbmZpZ3VyYXRpb24ge1xuICAgICAgICBjb25zdCBjb25maWdJbmRleCA9IHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuZmluZEluZGV4KGNvbmZpZyA9PiBjb25maWcuaWQgPT09IGNvbmZpZ0lkKTtcbiAgICAgICAgaWYgKGNvbmZpZ0luZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7kuI3lrZjlnKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnNbY29uZmlnSW5kZXhdO1xuICAgICAgICBjb25zdCB1cGRhdGVkQ29uZmlnOiBUb29sQ29uZmlndXJhdGlvbiA9IHtcbiAgICAgICAgICAgIC4uLmNvbmZpZyxcbiAgICAgICAgICAgIC4uLnVwZGF0ZXMsXG4gICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnNbY29uZmlnSW5kZXhdID0gdXBkYXRlZENvbmZpZztcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcblxuICAgICAgICByZXR1cm4gdXBkYXRlZENvbmZpZztcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVsZXRlQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGNvbmZpZ0luZGV4ID0gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5maW5kSW5kZXgoY29uZmlnID0+IGNvbmZpZy5pZCA9PT0gY29uZmlnSWQpO1xuICAgICAgICBpZiAoY29uZmlnSW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mFjee9ruS4jeWtmOWcqCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5zcGxpY2UoY29uZmlnSW5kZXgsIDEpO1xuICAgICAgICBcbiAgICAgICAgLy8g5aaC5p6c5Yig6Zmk55qE5piv5b2T5YmN6YWN572u77yM5riF56m65b2T5YmN6YWN572uSURcbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3MuY3VycmVudENvbmZpZ0lkID09PSBjb25maWdJZCkge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5jdXJyZW50Q29uZmlnSWQgPSB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLmxlbmd0aCA+IDAgXG4gICAgICAgICAgICAgICAgPyB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zWzBdLmlkIFxuICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRDdXJyZW50Q29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuZmluZChjb25maWcgPT4gY29uZmlnLmlkID09PSBjb25maWdJZCk7XG4gICAgICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mFjee9ruS4jeWtmOWcqCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXR0aW5ncy5jdXJyZW50Q29uZmlnSWQgPSBjb25maWdJZDtcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlVG9vbFN0YXR1cyhjb25maWdJZDogc3RyaW5nLCBjYXRlZ29yeTogc3RyaW5nLCB0b29sTmFtZTogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBVcGRhdGluZyB0b29sIHN0YXR1cyAtIGNvbmZpZ0lkOiAke2NvbmZpZ0lkfSwgY2F0ZWdvcnk6ICR7Y2F0ZWdvcnl9LCB0b29sTmFtZTogJHt0b29sTmFtZX0sIGVuYWJsZWQ6ICR7ZW5hYmxlZH1gKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuZmluZChjb25maWcgPT4gY29uZmlnLmlkID09PSBjb25maWdJZCk7XG4gICAgICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBCYWNrZW5kOiBDb25maWcgbm90IGZvdW5kIHdpdGggSUQ6ICR7Y29uZmlnSWR9YCk7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mFjee9ruS4jeWtmOWcqCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IEZvdW5kIGNvbmZpZzogJHtjb25maWcubmFtZX1gKTtcblxuICAgICAgICBjb25zdCB0b29sID0gY29uZmlnLnRvb2xzLmZpbmQodCA9PiB0LmNhdGVnb3J5ID09PSBjYXRlZ29yeSAmJiB0Lm5hbWUgPT09IHRvb2xOYW1lKTtcbiAgICAgICAgaWYgKCF0b29sKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBCYWNrZW5kOiBUb29sIG5vdCBmb3VuZCAtIGNhdGVnb3J5OiAke2NhdGVnb3J5fSwgbmFtZTogJHt0b29sTmFtZX1gKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5bel5YW35LiN5a2Y5ZyoJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogRm91bmQgdG9vbDogJHt0b29sLm5hbWV9LCBjdXJyZW50IGVuYWJsZWQ6ICR7dG9vbC5lbmFibGVkfSwgbmV3IGVuYWJsZWQ6ICR7ZW5hYmxlZH1gKTtcbiAgICAgICAgXG4gICAgICAgIHRvb2wuZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgICAgIGNvbmZpZy51cGRhdGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogVG9vbCB1cGRhdGVkLCBzYXZpbmcgc2V0dGluZ3MuLi5gKTtcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IFNldHRpbmdzIHNhdmVkIHN1Y2Nlc3NmdWxseWApO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVUb29sU3RhdHVzQmF0Y2goY29uZmlnSWQ6IHN0cmluZywgdXBkYXRlczogeyBjYXRlZ29yeTogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IGVuYWJsZWQ6IGJvb2xlYW4gfVtdKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiB1cGRhdGVUb29sU3RhdHVzQmF0Y2ggY2FsbGVkIHdpdGggY29uZmlnSWQ6ICR7Y29uZmlnSWR9YCk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBDdXJyZW50IGNvbmZpZ3VyYXRpb25zIGNvdW50OiAke3RoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubGVuZ3RofWApO1xuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogQ3VycmVudCBjb25maWcgSURzOmAsIHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubWFwKGMgPT4gYy5pZCkpO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5maW5kKGNvbmZpZyA9PiBjb25maWcuaWQgPT09IGNvbmZpZ0lkKTtcbiAgICAgICAgaWYgKCFjb25maWcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEJhY2tlbmQ6IENvbmZpZyBub3QgZm91bmQgd2l0aCBJRDogJHtjb25maWdJZH1gKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEJhY2tlbmQ6IEF2YWlsYWJsZSBjb25maWcgSURzOmAsIHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubWFwKGMgPT4gYy5pZCkpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfphY3nva7kuI3lrZjlnKgnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKGBCYWNrZW5kOiBGb3VuZCBjb25maWc6ICR7Y29uZmlnLm5hbWV9LCB1cGRhdGluZyAke3VwZGF0ZXMubGVuZ3RofSB0b29sc2ApO1xuXG4gICAgICAgIHVwZGF0ZXMuZm9yRWFjaCh1cGRhdGUgPT4ge1xuICAgICAgICAgICAgY29uc3QgdG9vbCA9IGNvbmZpZy50b29scy5maW5kKHQgPT4gdC5jYXRlZ29yeSA9PT0gdXBkYXRlLmNhdGVnb3J5ICYmIHQubmFtZSA9PT0gdXBkYXRlLm5hbWUpO1xuICAgICAgICAgICAgaWYgKHRvb2wpIHtcbiAgICAgICAgICAgICAgICB0b29sLmVuYWJsZWQgPSB1cGRhdGUuZW5hYmxlZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uZmlnLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IEJhdGNoIHVwZGF0ZSBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5YCk7XG4gICAgfVxuXG4gICAgcHVibGljIGV4cG9ydENvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMuZmluZChjb25maWcgPT4gY29uZmlnLmlkID09PSBjb25maWdJZCk7XG4gICAgICAgIGlmICghY29uZmlnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+mFjee9ruS4jeWtmOWcqCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZXhwb3J0VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW1wb3J0Q29uZmlndXJhdGlvbihjb25maWdKc29uOiBzdHJpbmcpOiBUb29sQ29uZmlndXJhdGlvbiB7XG4gICAgICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuaW1wb3J0VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnSnNvbik7XG4gICAgICAgIFxuICAgICAgICAvLyDnlJ/miJDmlrDnmoRJROWSjOaXtumXtOaIs1xuICAgICAgICBjb25maWcuaWQgPSB1dWlkdjQoKTtcbiAgICAgICAgY29uZmlnLmNyZWF0ZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgY29uZmlnLnVwZGF0ZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5jb25maWd1cmF0aW9ucy5sZW5ndGggPj0gdGhpcy5zZXR0aW5ncy5tYXhDb25maWdTbG90cykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlt7Lovr7liLDmnIDlpKfphY3nva7mp73kvY3mlbDph48gKCR7dGhpcy5zZXR0aW5ncy5tYXhDb25maWdTbG90c30pYCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNldHRpbmdzLmNvbmZpZ3VyYXRpb25zLnB1c2goY29uZmlnKTtcbiAgICAgICAgdGhpcy5zYXZlU2V0dGluZ3MoKTtcblxuICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRFbmFibGVkVG9vbHMoKTogVG9vbENvbmZpZ1tdIHtcbiAgICAgICAgY29uc3QgY3VycmVudENvbmZpZyA9IHRoaXMuZ2V0Q3VycmVudENvbmZpZ3VyYXRpb24oKTtcbiAgICAgICAgaWYgKCFjdXJyZW50Q29uZmlnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hdmFpbGFibGVUb29scy5maWx0ZXIodG9vbCA9PiB0b29sLmVuYWJsZWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyZW50Q29uZmlnLnRvb2xzLmZpbHRlcih0b29sID0+IHRvb2wuZW5hYmxlZCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFRvb2xNYW5hZ2VyU3RhdGUoKSB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRDb25maWcgPSB0aGlzLmdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgYXZhaWxhYmxlVG9vbHM6IGN1cnJlbnRDb25maWcgPyBjdXJyZW50Q29uZmlnLnRvb2xzIDogdGhpcy5nZXRBdmFpbGFibGVUb29scygpLFxuICAgICAgICAgICAgc2VsZWN0ZWRDb25maWdJZDogdGhpcy5zZXR0aW5ncy5jdXJyZW50Q29uZmlnSWQsXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uczogdGhpcy5nZXRDb25maWd1cmF0aW9ucygpLFxuICAgICAgICAgICAgbWF4Q29uZmlnU2xvdHM6IHRoaXMuc2V0dGluZ3MubWF4Q29uZmlnU2xvdHNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNhdmVTZXR0aW5ncygpOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2coYEJhY2tlbmQ6IFNhdmluZyBzZXR0aW5ncywgY3VycmVudCBjb25maWdzIGNvdW50OiAke3RoaXMuc2V0dGluZ3MuY29uZmlndXJhdGlvbnMubGVuZ3RofWApO1xuICAgICAgICB0aGlzLnNhdmVUb29sTWFuYWdlclNldHRpbmdzKHRoaXMuc2V0dGluZ3MpO1xuICAgICAgICBjb25zb2xlLmxvZyhgQmFja2VuZDogU2V0dGluZ3Mgc2F2ZWQgdG8gZmlsZWApO1xuICAgIH1cbn0gIl19