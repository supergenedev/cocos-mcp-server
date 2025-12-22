/// <reference path="./types/editor-2x.d.ts" />

import { MCPServer } from './mcp-server';
import { readSettings, saveSettings } from './settings';
import { MCPServerSettings } from './types';
import { ToolManager } from './tools/tool-manager';

let mcpServer: MCPServer | null = null;
let toolManager: ToolManager;

/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
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
        } else {
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
        } else {
            console.warn('[MCP插件] mcpServer 未初始化');
        }
    },

    /**
     * @en Get server status
     * @zh 获取服务器状态
     */
    getServerStatus() {
        const status = mcpServer ? mcpServer.getStatus() : { running: false, port: 0, clients: 0 };
        const settings = mcpServer ? mcpServer.getSettings() : readSettings();
        return {
            ...status,
            settings: settings
        };
    },

    /**
     * @en Update server settings
     * @zh 更新服务器设置
     */
    updateSettings(settings: MCPServerSettings) {
        saveSettings(settings);
        if (mcpServer) {
            mcpServer.stop();
            mcpServer = new MCPServer(settings);
            mcpServer.start();
        } else {
            mcpServer = new MCPServer(settings);
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
        if (!mcpServer) return [];

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
        return mcpServer ? mcpServer.getSettings() : readSettings();
    },

    /**
     * @en Get server settings (alternative method)
     * @zh 获取服务器设置（替代方法）
     */
    async getSettings() {
        return mcpServer ? mcpServer.getSettings() : readSettings();
    },

    // 工具管理器相关方法
    async getToolManagerState() {
        return toolManager.getToolManagerState();
    },

    async createToolConfiguration(name: string, description?: string) {
        try {
            const config = toolManager.createConfiguration(name, description);
            return { success: true, id: config.id, config };
        } catch (error: any) {
            throw new Error(`创建配置失败: ${error.message}`);
        }
    },

    async updateToolConfiguration(configId: string, updates: any) {
        try {
            return toolManager.updateConfiguration(configId, updates);
        } catch (error: any) {
            throw new Error(`更新配置失败: ${error.message}`);
        }
    },

    async deleteToolConfiguration(configId: string) {
        try {
            toolManager.deleteConfiguration(configId);
            return { success: true };
        } catch (error: any) {
            throw new Error(`删除配置失败: ${error.message}`);
        }
    },

    async setCurrentToolConfiguration(configId: string) {
        try {
            toolManager.setCurrentConfiguration(configId);
            return { success: true };
        } catch (error: any) {
            throw new Error(`设置当前配置失败: ${error.message}`);
        }
    },

    async updateToolStatus(category: string, toolName: string, enabled: boolean) {
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
        } catch (error: any) {
            throw new Error(`更新工具状态失败: ${error.message}`);
        }
    },

    async updateToolStatusBatch(updates: any[]) {
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
        } catch (error: any) {
            throw new Error(`批量更新工具状态失败: ${error.message}`);
        }
    },

    async exportToolConfiguration(configId: string) {
        try {
            return { configJson: toolManager.exportConfiguration(configId) };
        } catch (error: any) {
            throw new Error(`导出配置失败: ${error.message}`);
        }
    },

    async importToolConfiguration(configJson: string) {
        try {
            return toolManager.importConfiguration(configJson);
        } catch (error: any) {
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
export function load() {
    console.log('Cocos MCP Server extension loaded');

    // 初始化工具管理器
    toolManager = new ToolManager();

    // 读取设置
    const settings = readSettings();
    mcpServer = new MCPServer(settings);

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
export function unload() {
    if (mcpServer) {
        mcpServer.stop();
        mcpServer = null;
    }
}

export const messages = {
    'open-panel'(event: Editor.IpcEvent) {
        try {
            methods.openPanel();
            event.reply(null);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    'open-tool-manager'(event: Editor.IpcEvent) {
        try {
            // methods.openToolManager() 메서드가 없으므로 패널 열기로 대체
            methods.openPanel();
            event.reply(null);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'start-server'(event: Editor.IpcEvent) {
        try {
            await methods.startServer();
            event.reply(null);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'stop-server'(event: Editor.IpcEvent) {
        try {
            await methods.stopServer();
            event.reply(null);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    'get-server-status'(event: Editor.IpcEvent) {
        try {
            const result = methods.getServerStatus();
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    'update-settings'(event: Editor.IpcEvent, settings: MCPServerSettings) {
        try {
            methods.updateSettings(settings);
            event.reply(null);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    'get-tools-list'(event: Editor.IpcEvent) {
        try {
            const result = methods.getToolsList();
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'get-server-settings'(event: Editor.IpcEvent) {
        try {
            const result = await methods.getServerSettings();
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'get-tool-manager-state'(event: Editor.IpcEvent) {
        try {
            const result = await methods.getToolManagerState();
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'create-tool-configuration'(event: Editor.IpcEvent, name: string, description?: string) {
        try {
            const result = await methods.createToolConfiguration(name, description);
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'update-tool-configuration'(event: Editor.IpcEvent, configId: string, updates: any) {
        try {
            const result = await methods.updateToolConfiguration(configId, updates);
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'delete-tool-configuration'(event: Editor.IpcEvent, configId: string) {
        try {
            const result = await methods.deleteToolConfiguration(configId);
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'set-current-tool-configuration'(event: Editor.IpcEvent, configId: string) {
        try {
            const result = await methods.setCurrentToolConfiguration(configId);
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'update-tool-status'(event: Editor.IpcEvent, category: string, toolName: string, enabled: boolean) {
        try {
            const result = await methods.updateToolStatus(category, toolName, enabled);
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'update-tool-status-batch'(event: Editor.IpcEvent, updates: any[]) {
        try {
            const result = await methods.updateToolStatusBatch(updates);
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
    async 'export-tool-configuration'(event: Editor.IpcEvent, configId: string) {
        try {
            const result = await methods.exportToolConfiguration(configId);
            event.reply(null, result);
        } catch (error: any) {
            event.reply(error instanceof Error ? error : new Error(String(error)));
        }
    },
}