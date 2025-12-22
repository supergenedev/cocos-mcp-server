"use strict";
/// <reference path="./types/editor-2x.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.messages = exports.methods = void 0;
exports.load = load;
exports.unload = unload;
const mcp_server_1 = require("./mcp-server");
const settings_1 = require("./settings");
const tool_manager_1 = require("./tools/tool-manager");
let mcpServer = null;
let toolManager;
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    /**
     * @en Open the MCP server panel
     * @zh 打开 MCP 服务器面板
     */
    openPanel() {
        Editor.Panel.open('cocos-mcp-server');
    },
    /**
     * @en Start the MCP server
     * @zh 启动 MCP 服务器
     */
    async startServer() {
        if (mcpServer) {
            Editor.log('[Main] startServer');
            // 确保使用最新的工具配置
            const enabledTools = toolManager.getEnabledTools();
            mcpServer.updateEnabledTools(enabledTools);
            await mcpServer.start();
        }
        else {
            console.warn('[MCP插件] mcpServer 未初始化');
        }
    },
    /**
     * @en Stop the MCP server
     * @zh 停止 MCP 服务器
     */
    async stopServer() {
        if (mcpServer) {
            Editor.log('[Main] stopServer');
            mcpServer.stop();
        }
        else {
            console.warn('[MCP插件] mcpServer 未初始化');
        }
    },
    /**
     * @en Get server status
     * @zh 获取服务器状态
     */
    getServerStatus() {
        const status = mcpServer ? mcpServer.getStatus() : { running: false, port: 0, clients: 0 };
        const settings = mcpServer ? mcpServer.getSettings() : (0, settings_1.readSettings)();
        return {
            ...status,
            settings: settings
        };
    },
    /**
     * @en Update server settings
     * @zh 更新服务器设置
     */
    updateSettings(settings) {
        (0, settings_1.saveSettings)(settings);
        if (mcpServer) {
            mcpServer.stop();
            mcpServer = new mcp_server_1.MCPServer(settings);
            mcpServer.start();
        }
        else {
            mcpServer = new mcp_server_1.MCPServer(settings);
            mcpServer.start();
        }
    },
    /**
     * @en Get tools list
     * @zh 获取工具列表
     */
    getToolsList() {
        return mcpServer ? mcpServer.getAvailableTools() : [];
    },
    getFilteredToolsList() {
        if (!mcpServer)
            return [];
        // 获取当前启用的工具
        const enabledTools = toolManager.getEnabledTools();
        // 更新MCP服务器的启用工具列表
        mcpServer.updateEnabledTools(enabledTools);
        return mcpServer.getFilteredTools(enabledTools);
    },
    /**
     * @en Get server settings
     * @zh 获取服务器设置
     */
    async getServerSettings() {
        return mcpServer ? mcpServer.getSettings() : (0, settings_1.readSettings)();
    },
    /**
     * @en Get server settings (alternative method)
     * @zh 获取服务器设置（替代方法）
     */
    async getSettings() {
        return mcpServer ? mcpServer.getSettings() : (0, settings_1.readSettings)();
    },
    // 工具管理器相关方法
    async getToolManagerState() {
        return toolManager.getToolManagerState();
    },
    async createToolConfiguration(name, description) {
        try {
            const config = toolManager.createConfiguration(name, description);
            return { success: true, id: config.id, config };
        }
        catch (error) {
            throw new Error(`创建配置失败: ${error.message}`);
        }
    },
    async updateToolConfiguration(configId, updates) {
        try {
            return toolManager.updateConfiguration(configId, updates);
        }
        catch (error) {
            throw new Error(`更新配置失败: ${error.message}`);
        }
    },
    async deleteToolConfiguration(configId) {
        try {
            toolManager.deleteConfiguration(configId);
            return { success: true };
        }
        catch (error) {
            throw new Error(`删除配置失败: ${error.message}`);
        }
    },
    async setCurrentToolConfiguration(configId) {
        try {
            toolManager.setCurrentConfiguration(configId);
            return { success: true };
        }
        catch (error) {
            throw new Error(`设置当前配置失败: ${error.message}`);
        }
    },
    async updateToolStatus(category, toolName, enabled) {
        try {
            const currentConfig = toolManager.getCurrentConfiguration();
            if (!currentConfig) {
                throw new Error('没有当前配置');
            }
            toolManager.updateToolStatus(currentConfig.id, category, toolName, enabled);
            // 更新MCP服务器的工具列表
            if (mcpServer) {
                const enabledTools = toolManager.getEnabledTools();
                mcpServer.updateEnabledTools(enabledTools);
            }
            return { success: true };
        }
        catch (error) {
            throw new Error(`更新工具状态失败: ${error.message}`);
        }
    },
    async updateToolStatusBatch(updates) {
        try {
            console.log(`[Main] updateToolStatusBatch called with updates count:`, updates ? updates.length : 0);
            const currentConfig = toolManager.getCurrentConfiguration();
            if (!currentConfig) {
                throw new Error('没有当前配置');
            }
            toolManager.updateToolStatusBatch(currentConfig.id, updates);
            // 更新MCP服务器的工具列表
            if (mcpServer) {
                const enabledTools = toolManager.getEnabledTools();
                mcpServer.updateEnabledTools(enabledTools);
            }
            return { success: true };
        }
        catch (error) {
            throw new Error(`批量更新工具状态失败: ${error.message}`);
        }
    },
    async exportToolConfiguration(configId) {
        try {
            return { configJson: toolManager.exportConfiguration(configId) };
        }
        catch (error) {
            throw new Error(`导出配置失败: ${error.message}`);
        }
    },
    async importToolConfiguration(configJson) {
        try {
            return toolManager.importConfiguration(configJson);
        }
        catch (error) {
            throw new Error(`导入配置失败: ${error.message}`);
        }
    },
    async getEnabledTools() {
        return toolManager.getEnabledTools();
    }
};
/**
 * @en Method Triggered on Extension Startup
 * @zh 扩展启动时触发的方法
 */
function load() {
    console.log('Cocos MCP Server extension loaded');
    // 初始化工具管理器
    toolManager = new tool_manager_1.ToolManager();
    // 读取设置
    const settings = (0, settings_1.readSettings)();
    mcpServer = new mcp_server_1.MCPServer(settings);
    // 初始化MCP服务器的工具列表
    const enabledTools = toolManager.getEnabledTools();
    mcpServer.updateEnabledTools(enabledTools);
    // 如果设置了自动启动，则启动服务器
    if (settings.autoStart) {
        mcpServer.start().catch(err => {
            console.error('Failed to auto-start MCP server:', err);
        });
    }
}
/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展时触发的方法
 */
function unload() {
    if (mcpServer) {
        mcpServer.stop();
        mcpServer = null;
    }
}
exports.messages = {
    'open-panel'() {
        exports.methods.openPanel();
    },
    'open-tool-manager'() {
        exports.methods.openToolManager();
    },
    'start-server'() {
        exports.methods.startServer();
    },
    'stop-server'() {
        exports.methods.stopServer();
    },
    'get-server-status'() {
        exports.methods.getServerStatus();
    },
    'update-settings'() {
        exports.methods.updateSettings();
    },
    'get-tools-list'() {
        exports.methods.getToolsList();
    },
    'get-server-settings'() {
        exports.methods.getServerSettings();
    },
    'get-tool-manager-state'() {
        exports.methods.getToolManagerState();
    },
    'create-tool-configuration'() {
        exports.methods.createToolConfiguration();
    },
    'update-tool-configuration'() {
        exports.methods.updateToolConfiguration();
    },
    'delete-tool-configuration'() {
        exports.methods.deleteToolConfiguration();
    },
    'set-current-tool-configuration'() {
        exports.methods.setCurrentToolConfiguration();
    },
    'update-tool-status'() {
        exports.methods.updateToolStatus();
    },
    'update-tool-status-batch'() {
        exports.methods.updateToolStatusBatch();
    },
    'export-tool-configuration'() {
        exports.methods.exportToolConfiguration();
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSwrQ0FBK0M7OztBQW1PL0Msb0JBb0JDO0FBTUQsd0JBS0M7QUFoUUQsNkNBQXlDO0FBQ3pDLHlDQUF3RDtBQUV4RCx1REFBbUQ7QUFFbkQsSUFBSSxTQUFTLEdBQXFCLElBQUksQ0FBQztBQUN2QyxJQUFJLFdBQXdCLENBQUM7QUFFN0I7OztHQUdHO0FBQ1UsUUFBQSxPQUFPLEdBQTRDO0lBQzVEOzs7T0FHRztJQUNILFNBQVM7UUFDTCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFJRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsV0FBVztRQUNiLElBQUksU0FBUyxFQUFFLENBQUM7WUFDWixNQUFNLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDakMsY0FBYztZQUNkLE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNuRCxTQUFTLENBQUMsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDM0MsTUFBTSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDNUIsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFDM0MsQ0FBQztJQUNMLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsVUFBVTtRQUNaLElBQUksU0FBUyxFQUFFLENBQUM7WUFDWixNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDaEMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3JCLENBQUM7YUFBTSxDQUFDO1lBQ0osT0FBTyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQzNDLENBQUM7SUFDTCxDQUFDO0lBRUQ7OztPQUdHO0lB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LGVBQU8sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO0lBQ3RDLENBQUM7SUFDRCxnQ0FBZ0M7UUFDNUIsZUFBTyxDQUFDLDJCQUEyQixFQUFFLENBQUM7SUFDMUMsQ0FBQztJQUNELG9CQUFvQjtRQUNoQixlQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBQ0QsMEJBQTBCO1FBQ3RCLGVBQU8sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBQ3BDLENBQUM7SUFDRCwyQkFBMkI7UUFDdkIsZUFBTyxDQUFDLHVCQUF1QixFQUFFLENBQUM7SUFDdEMsQ0FBQztDQUNKLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi90eXBlcy9lZGl0b3ItMnguZC50c1wiIC8+XG5cbmltcG9ydCB7IE1DUFNlcnZlciB9IGZyb20gJy4vbWNwLXNlcnZlcic7XG5pbXBvcnQgeyByZWFkU2V0dGluZ3MsIHNhdmVTZXR0aW5ncyB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHsgTUNQU2VydmVyU2V0dGluZ3MgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IFRvb2xNYW5hZ2VyIH0gZnJvbSAnLi90b29scy90b29sLW1hbmFnZXInO1xuXG5sZXQgbWNwU2VydmVyOiBNQ1BTZXJ2ZXIgfCBudWxsID0gbnVsbDtcbmxldCB0b29sTWFuYWdlcjogVG9vbE1hbmFnZXI7XG5cbi8qKlxuICogQGVuIFJlZ2lzdHJhdGlvbiBtZXRob2QgZm9yIHRoZSBtYWluIHByb2Nlc3Mgb2YgRXh0ZW5zaW9uXG4gKiBAemgg5Li65omp5bGV55qE5Li76L+b56iL55qE5rOo5YaM5pa55rOVXG4gKi9cbmV4cG9ydCBjb25zdCBtZXRob2RzOiB7IFtrZXk6IHN0cmluZ106ICguLi5hbnk6IGFueSkgPT4gYW55IH0gPSB7XG4gICAgLyoqXG4gICAgICogQGVuIE9wZW4gdGhlIE1DUCBzZXJ2ZXIgcGFuZWxcbiAgICAgKiBAemgg5omT5byAIE1DUCDmnI3liqHlmajpnaLmnb9cbiAgICAgKi9cbiAgICBvcGVuUGFuZWwoKSB7XG4gICAgICAgIEVkaXRvci5QYW5lbC5vcGVuKCdjb2Nvcy1tY3Atc2VydmVyJyk7XG4gICAgfSxcblxuXG5cbiAgICAvKipcbiAgICAgKiBAZW4gU3RhcnQgdGhlIE1DUCBzZXJ2ZXJcbiAgICAgKiBAemgg5ZCv5YqoIE1DUCDmnI3liqHlmahcbiAgICAgKi9cbiAgICBhc3luYyBzdGFydFNlcnZlcigpIHtcbiAgICAgICAgaWYgKG1jcFNlcnZlcikge1xuICAgICAgICAgICAgRWRpdG9yLmxvZygnW01haW5dIHN0YXJ0U2VydmVyJyk7XG4gICAgICAgICAgICAvLyDnoa7kv53kvb/nlKjmnIDmlrDnmoTlt6XlhbfphY3nva5cbiAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuICAgICAgICAgICAgbWNwU2VydmVyLnVwZGF0ZUVuYWJsZWRUb29scyhlbmFibGVkVG9vbHMpO1xuICAgICAgICAgICAgYXdhaXQgbWNwU2VydmVyLnN0YXJ0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1tNQ1Dmj5Lku7ZdIG1jcFNlcnZlciDmnKrliJ3lp4vljJYnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZW4gU3RvcCB0aGUgTUNQIHNlcnZlclxuICAgICAqIEB6aCDlgZzmraIgTUNQIOacjeWKoeWZqFxuICAgICAqL1xuICAgIGFzeW5jIHN0b3BTZXJ2ZXIoKSB7XG4gICAgICAgIGlmIChtY3BTZXJ2ZXIpIHtcbiAgICAgICAgICAgIEVkaXRvci5sb2coJ1tNYWluXSBzdG9wU2VydmVyJyk7XG4gICAgICAgICAgICBtY3BTZXJ2ZXIuc3RvcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdbTUNQ5o+S5Lu2XSBtY3BTZXJ2ZXIg5pyq5Yid5aeL5YyWJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIEdldCBzZXJ2ZXIgc3RhdHVzXG4gICAgICogQHpoIOiOt+WPluacjeWKoeWZqOeKtuaAgVxuICAgICAqL1xuICAgIGdldFNlcnZlclN0YXR1cygpIHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gbWNwU2VydmVyID8gbWNwU2VydmVyLmdldFN0YXR1cygpIDogeyBydW5uaW5nOiBmYWxzZSwgcG9ydDogMCwgY2xpZW50czogMCB9O1xuICAgICAgICBjb25zdCBzZXR0aW5ncyA9IG1jcFNlcnZlciA/IG1jcFNlcnZlci5nZXRTZXR0aW5ncygpIDogcmVhZFNldHRpbmdzKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAuLi5zdGF0dXMsXG4gICAgICAgICAgICBzZXR0aW5nczogc2V0dGluZ3NcbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQGVuIFVwZGF0ZSBzZXJ2ZXIgc2V0dGluZ3NcbiAgICAgKiBAemgg5pu05paw5pyN5Yqh5Zmo6K6+572uXG4gICAgICovXG4gICAgdXBkYXRlU2V0dGluZ3Moc2V0dGluZ3M6IE1DUFNlcnZlclNldHRpbmdzKSB7XG4gICAgICAgIHNhdmVTZXR0aW5ncyhzZXR0aW5ncyk7XG4gICAgICAgIGlmIChtY3BTZXJ2ZXIpIHtcbiAgICAgICAgICAgIG1jcFNlcnZlci5zdG9wKCk7XG4gICAgICAgICAgICBtY3BTZXJ2ZXIgPSBuZXcgTUNQU2VydmVyKHNldHRpbmdzKTtcbiAgICAgICAgICAgIG1jcFNlcnZlci5zdGFydCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWNwU2VydmVyID0gbmV3IE1DUFNlcnZlcihzZXR0aW5ncyk7XG4gICAgICAgICAgICBtY3BTZXJ2ZXIuc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAZW4gR2V0IHRvb2xzIGxpc3RcbiAgICAgKiBAemgg6I635Y+W5bel5YW35YiX6KGoXG4gICAgICovXG4gICAgZ2V0VG9vbHNMaXN0KCkge1xuICAgICAgICByZXR1cm4gbWNwU2VydmVyID8gbWNwU2VydmVyLmdldEF2YWlsYWJsZVRvb2xzKCkgOiBbXTtcbiAgICB9LFxuXG4gICAgZ2V0RmlsdGVyZWRUb29sc0xpc3QoKSB7XG4gICAgICAgIGlmICghbWNwU2VydmVyKSByZXR1cm4gW107XG5cbiAgICAgICAgLy8g6I635Y+W5b2T5YmN5ZCv55So55qE5bel5YW3XG4gICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuXG4gICAgICAgIC8vIOabtOaWsE1DUOacjeWKoeWZqOeahOWQr+eUqOW3peWFt+WIl+ihqFxuICAgICAgICBtY3BTZXJ2ZXIudXBkYXRlRW5hYmxlZFRvb2xzKGVuYWJsZWRUb29scyk7XG5cbiAgICAgICAgcmV0dXJuIG1jcFNlcnZlci5nZXRGaWx0ZXJlZFRvb2xzKGVuYWJsZWRUb29scyk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBAZW4gR2V0IHNlcnZlciBzZXR0aW5nc1xuICAgICAqIEB6aCDojrflj5bmnI3liqHlmajorr7nva5cbiAgICAgKi9cbiAgICBhc3luYyBnZXRTZXJ2ZXJTZXR0aW5ncygpIHtcbiAgICAgICAgcmV0dXJuIG1jcFNlcnZlciA/IG1jcFNlcnZlci5nZXRTZXR0aW5ncygpIDogcmVhZFNldHRpbmdzKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBlbiBHZXQgc2VydmVyIHNldHRpbmdzIChhbHRlcm5hdGl2ZSBtZXRob2QpXG4gICAgICogQHpoIOiOt+WPluacjeWKoeWZqOiuvue9ru+8iOabv+S7o+aWueazle+8iVxuICAgICAqL1xuICAgIGFzeW5jIGdldFNldHRpbmdzKCkge1xuICAgICAgICByZXR1cm4gbWNwU2VydmVyID8gbWNwU2VydmVyLmdldFNldHRpbmdzKCkgOiByZWFkU2V0dGluZ3MoKTtcbiAgICB9LFxuXG4gICAgLy8g5bel5YW3566h55CG5Zmo55u45YWz5pa55rOVXG4gICAgYXN5bmMgZ2V0VG9vbE1hbmFnZXJTdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRvb2xNYW5hZ2VyLmdldFRvb2xNYW5hZ2VyU3RhdGUoKTtcbiAgICB9LFxuXG4gICAgYXN5bmMgY3JlYXRlVG9vbENvbmZpZ3VyYXRpb24obmFtZTogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnID0gdG9vbE1hbmFnZXIuY3JlYXRlQ29uZmlndXJhdGlvbihuYW1lLCBkZXNjcmlwdGlvbik7XG4gICAgICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBpZDogY29uZmlnLmlkLCBjb25maWcgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDliJvlu7rphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyB1cGRhdGVUb29sQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nLCB1cGRhdGVzOiBhbnkpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0b29sTWFuYWdlci51cGRhdGVDb25maWd1cmF0aW9uKGNvbmZpZ0lkLCB1cGRhdGVzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDmm7TmlrDphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBkZWxldGVUb29sQ29uZmlndXJhdGlvbihjb25maWdJZDogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0b29sTWFuYWdlci5kZWxldGVDb25maWd1cmF0aW9uKGNvbmZpZ0lkKTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUgfTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDliKDpmaTphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBzZXRDdXJyZW50VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnSWQ6IHN0cmluZykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdG9vbE1hbmFnZXIuc2V0Q3VycmVudENvbmZpZ3VyYXRpb24oY29uZmlnSWQpO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOiuvue9ruW9k+WJjemFjee9ruWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIHVwZGF0ZVRvb2xTdGF0dXMoY2F0ZWdvcnk6IHN0cmluZywgdG9vbE5hbWU6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudENvbmZpZyA9IHRvb2xNYW5hZ2VyLmdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRDb25maWcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ayoeacieW9k+WJjemFjee9ricpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0b29sTWFuYWdlci51cGRhdGVUb29sU3RhdHVzKGN1cnJlbnRDb25maWcuaWQsIGNhdGVnb3J5LCB0b29sTmFtZSwgZW5hYmxlZCk7XG5cbiAgICAgICAgICAgIC8vIOabtOaWsE1DUOacjeWKoeWZqOeahOW3peWFt+WIl+ihqFxuICAgICAgICAgICAgaWYgKG1jcFNlcnZlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuICAgICAgICAgICAgICAgIG1jcFNlcnZlci51cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOabtOaWsOW3peWFt+eKtuaAgeWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIHVwZGF0ZVRvb2xTdGF0dXNCYXRjaCh1cGRhdGVzOiBhbnlbXSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtNYWluXSB1cGRhdGVUb29sU3RhdHVzQmF0Y2ggY2FsbGVkIHdpdGggdXBkYXRlcyBjb3VudDpgLCB1cGRhdGVzID8gdXBkYXRlcy5sZW5ndGggOiAwKTtcblxuICAgICAgICAgICAgY29uc3QgY3VycmVudENvbmZpZyA9IHRvb2xNYW5hZ2VyLmdldEN1cnJlbnRDb25maWd1cmF0aW9uKCk7XG4gICAgICAgICAgICBpZiAoIWN1cnJlbnRDb25maWcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ayoeacieW9k+WJjemFjee9ricpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0b29sTWFuYWdlci51cGRhdGVUb29sU3RhdHVzQmF0Y2goY3VycmVudENvbmZpZy5pZCwgdXBkYXRlcyk7XG5cbiAgICAgICAgICAgIC8vIOabtOaWsE1DUOacjeWKoeWZqOeahOW3peWFt+WIl+ihqFxuICAgICAgICAgICAgaWYgKG1jcFNlcnZlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVuYWJsZWRUb29scyA9IHRvb2xNYW5hZ2VyLmdldEVuYWJsZWRUb29scygpO1xuICAgICAgICAgICAgICAgIG1jcFNlcnZlci51cGRhdGVFbmFibGVkVG9vbHMoZW5hYmxlZFRvb2xzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSB9O1xuICAgICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYOaJuemHj+abtOaWsOW3peWFt+eKtuaAgeWksei0pTogJHtlcnJvci5tZXNzYWdlfWApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIGV4cG9ydFRvb2xDb25maWd1cmF0aW9uKGNvbmZpZ0lkOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB7IGNvbmZpZ0pzb246IHRvb2xNYW5hZ2VyLmV4cG9ydENvbmZpZ3VyYXRpb24oY29uZmlnSWQpIH07XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihg5a+85Ye66YWN572u5aSx6LSlOiAke2Vycm9yLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgaW1wb3J0VG9vbENvbmZpZ3VyYXRpb24oY29uZmlnSnNvbjogc3RyaW5nKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gdG9vbE1hbmFnZXIuaW1wb3J0Q29uZmlndXJhdGlvbihjb25maWdKc29uKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGDlr7zlhaXphY3nva7lpLHotKU6ICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBnZXRFbmFibGVkVG9vbHMoKSB7XG4gICAgICAgIHJldHVybiB0b29sTWFuYWdlci5nZXRFbmFibGVkVG9vbHMoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEBlbiBNZXRob2QgVHJpZ2dlcmVkIG9uIEV4dGVuc2lvbiBTdGFydHVwXG4gKiBAemgg5omp5bGV5ZCv5Yqo5pe26Kem5Y+R55qE5pa55rOVXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkKCkge1xuICAgIGNvbnNvbGUubG9nKCdDb2NvcyBNQ1AgU2VydmVyIGV4dGVuc2lvbiBsb2FkZWQnKTtcblxuICAgIC8vIOWIneWni+WMluW3peWFt+euoeeQhuWZqFxuICAgIHRvb2xNYW5hZ2VyID0gbmV3IFRvb2xNYW5hZ2VyKCk7XG5cbiAgICAvLyDor7vlj5borr7nva5cbiAgICBjb25zdCBzZXR0aW5ncyA9IHJlYWRTZXR0aW5ncygpO1xuICAgIG1jcFNlcnZlciA9IG5ldyBNQ1BTZXJ2ZXIoc2V0dGluZ3MpO1xuXG4gICAgLy8g5Yid5aeL5YyWTUNQ5pyN5Yqh5Zmo55qE5bel5YW35YiX6KGoXG4gICAgY29uc3QgZW5hYmxlZFRvb2xzID0gdG9vbE1hbmFnZXIuZ2V0RW5hYmxlZFRvb2xzKCk7XG4gICAgbWNwU2VydmVyLnVwZGF0ZUVuYWJsZWRUb29scyhlbmFibGVkVG9vbHMpO1xuXG4gICAgLy8g5aaC5p6c6K6+572u5LqG6Ieq5Yqo5ZCv5Yqo77yM5YiZ5ZCv5Yqo5pyN5Yqh5ZmoXG4gICAgaWYgKHNldHRpbmdzLmF1dG9TdGFydCkge1xuICAgICAgICBtY3BTZXJ2ZXIuc3RhcnQoKS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGF1dG8tc3RhcnQgTUNQIHNlcnZlcjonLCBlcnIpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5cbi8qKlxuICogQGVuIE1ldGhvZCB0cmlnZ2VyZWQgd2hlbiB1bmluc3RhbGxpbmcgdGhlIGV4dGVuc2lvblxuICogQHpoIOWNuOi9veaJqeWxleaXtuinpuWPkeeahOaWueazlVxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5sb2FkKCkge1xuICAgIGlmIChtY3BTZXJ2ZXIpIHtcbiAgICAgICAgbWNwU2VydmVyLnN0b3AoKTtcbiAgICAgICAgbWNwU2VydmVyID0gbnVsbDtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCBtZXNzYWdlcyA9IHtcbiAgICAnb3Blbi1wYW5lbCcoKSB7XG4gICAgICAgIG1ldGhvZHMub3BlblBhbmVsKCk7XG4gICAgfSxcbiAgICAnb3Blbi10b29sLW1hbmFnZXInKCkge1xuICAgICAgICBtZXRob2RzLm9wZW5Ub29sTWFuYWdlcigpO1xuICAgIH0sXG4gICAgJ3N0YXJ0LXNlcnZlcicoKSB7XG4gICAgICAgIG1ldGhvZHMuc3RhcnRTZXJ2ZXIoKTtcbiAgICB9LFxuICAgICdzdG9wLXNlcnZlcicoKSB7XG4gICAgICAgIG1ldGhvZHMuc3RvcFNlcnZlcigpO1xuICAgIH0sXG4gICAgJ2dldC1zZXJ2ZXItc3RhdHVzJygpIHtcbiAgICAgICAgbWV0aG9kcy5nZXRTZXJ2ZXJTdGF0dXMoKTtcbiAgICB9LFxuICAgICd1cGRhdGUtc2V0dGluZ3MnKCkge1xuICAgICAgICBtZXRob2RzLnVwZGF0ZVNldHRpbmdzKCk7XG4gICAgfSxcbiAgICAnZ2V0LXRvb2xzLWxpc3QnKCkge1xuICAgICAgICBtZXRob2RzLmdldFRvb2xzTGlzdCgpO1xuICAgIH0sXG4gICAgJ2dldC1zZXJ2ZXItc2V0dGluZ3MnKCkge1xuICAgICAgICBtZXRob2RzLmdldFNlcnZlclNldHRpbmdzKCk7XG4gICAgfSxcbiAgICAnZ2V0LXRvb2wtbWFuYWdlci1zdGF0ZScoKSB7XG4gICAgICAgIG1ldGhvZHMuZ2V0VG9vbE1hbmFnZXJTdGF0ZSgpO1xuICAgIH0sXG4gICAgJ2NyZWF0ZS10b29sLWNvbmZpZ3VyYXRpb24nKCkge1xuICAgICAgICBtZXRob2RzLmNyZWF0ZVRvb2xDb25maWd1cmF0aW9uKCk7XG4gICAgfSxcbiAgICAndXBkYXRlLXRvb2wtY29uZmlndXJhdGlvbicoKSB7XG4gICAgICAgIG1ldGhvZHMudXBkYXRlVG9vbENvbmZpZ3VyYXRpb24oKTtcbiAgICB9LFxuICAgICdkZWxldGUtdG9vbC1jb25maWd1cmF0aW9uJygpIHtcbiAgICAgICAgbWV0aG9kcy5kZWxldGVUb29sQ29uZmlndXJhdGlvbigpO1xuICAgIH0sXG4gICAgJ3NldC1jdXJyZW50LXRvb2wtY29uZmlndXJhdGlvbicoKSB7XG4gICAgICAgIG1ldGhvZHMuc2V0Q3VycmVudFRvb2xDb25maWd1cmF0aW9uKCk7XG4gICAgfSxcbiAgICAndXBkYXRlLXRvb2wtc3RhdHVzJygpIHtcbiAgICAgICAgbWV0aG9kcy51cGRhdGVUb29sU3RhdHVzKCk7XG4gICAgfSxcbiAgICAndXBkYXRlLXRvb2wtc3RhdHVzLWJhdGNoJygpIHtcbiAgICAgICAgbWV0aG9kcy51cGRhdGVUb29sU3RhdHVzQmF0Y2goKTtcbiAgICB9LFxuICAgICdleHBvcnQtdG9vbC1jb25maWd1cmF0aW9uJygpIHtcbiAgICAgICAgbWV0aG9kcy5leHBvcnRUb29sQ29uZmlndXJhdGlvbigpO1xuICAgIH0sXG59Il19