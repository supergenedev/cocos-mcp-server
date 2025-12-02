/// <reference path="../types/editor-2x.d.ts" />

import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export class ServerTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [
            {
                name: 'query_server_ip_list',
                description: 'Query server IP list',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'query_sorted_server_ip_list',
                description: 'Get sorted server IP list',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'query_server_port',
                description: 'Query editor server current port',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_server_status',
                description: 'Get comprehensive server status information',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'check_server_connectivity',
                description: 'Check server connectivity and network status',
                inputSchema: {
                    type: 'object',
                    properties: {
                        timeout: {
                            type: 'number',
                            description: 'Timeout in milliseconds',
                            default: 5000
                        }
                    }
                }
            },
            {
                name: 'get_network_interfaces',
                description: 'Get available network interfaces',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'query_server_ip_list':
                return await this.queryServerIPList();
            case 'query_sorted_server_ip_list':
                return await this.querySortedServerIPList();
            case 'query_server_port':
                return await this.queryServerPort();
            case 'get_server_status':
                return await this.getServerStatus();
            case 'check_server_connectivity':
                return await this.checkServerConnectivity(args.timeout);
            case 'get_network_interfaces':
                return await this.getNetworkInterfaces();
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async queryServerIPList(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            try {
                const interfaces = os.networkInterfaces();
                const ipList: string[] = [];

                // Extract IPv4 addresses from all network interfaces
                Object.values(interfaces).forEach((addresses) => {
                    if (addresses) {
                        addresses.forEach((addr) => {
                            // Only include IPv4 addresses that are not internal
                            if (addr.family === 'IPv4' && !addr.internal) {
                                ipList.push(addr.address);
                            }
                        });
                    }
                });

                resolve({
                    success: true,
                    data: {
                        ipList: ipList,
                        count: ipList.length,
                        message: 'IP list retrieved successfully'
                    }
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async querySortedServerIPList(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                const ipListResult = await this.queryServerIPList();

                if (!ipListResult.success) {
                    resolve({ success: false, error: ipListResult.error });
                    return;
                }

                const ipList = ipListResult.data.ipList as string[];
                const sortedIPList: string[] = [];

                // Put localhost first if it exists
                if (ipList.includes('127.0.0.1')) {
                    sortedIPList.push('127.0.0.1');
                }

                // Add other IPs, excluding localhost
                ipList.forEach((ip) => {
                    if (ip !== '127.0.0.1') {
                        sortedIPList.push(ip);
                    }
                });

                resolve({
                    success: true,
                    data: {
                        sortedIPList: sortedIPList,
                        count: sortedIPList.length,
                        message: 'Sorted IP list retrieved successfully'
                    }
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async queryServerPort(): Promise<ToolResponse> {
        return new Promise((resolve) => {
            try {
                // Read preview-port from settings/project.json
                const projectJsonPath = path.join(Editor.Project.path, 'settings', 'project.json');

                let port: number = 7456; // Default port for Cocos Creator preview server

                if (fs.existsSync(projectJsonPath)) {
                    try {
                        const content = fs.readFileSync(projectJsonPath, 'utf8');
                        const projectJson = JSON.parse(content);

                        if (projectJson['preview-port'] !== null && projectJson['preview-port'] !== undefined) {
                            port = projectJson['preview-port'];
                        }
                    } catch (parseErr: any) {
                        // If JSON parsing fails, use default port
                        resolve({
                            success: true,
                            data: {
                                port: port,
                                message: `Using default port ${port} (failed to parse project.json: ${parseErr.message})`
                            }
                        });
                        return;
                    }
                }

                resolve({
                    success: true,
                    data: {
                        port: port,
                        message: `Editor server preview port: ${port}`
                    }
                });
            } catch (err: any) {
                resolve({ success: false, error: err.message });
            }
        });
    }

    private async getServerStatus(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // Gather comprehensive server information
                // Use Promise.all with catch to handle errors individually
                const [ipListResult, portResult] = await Promise.all([
                    this.queryServerIPList().catch((err: any) => ({
                        success: false,
                        error: err.message
                    } as ToolResponse)),
                    this.queryServerPort().catch((err: any) => ({
                        success: false,
                        error: err.message
                    } as ToolResponse))
                ]);

                const status: any = {
                    timestamp: new Date().toISOString(),
                    serverRunning: true
                };

                if (ipListResult.success) {
                    status.availableIPs = ipListResult.data.ipList;
                    status.ipCount = ipListResult.data.count;
                } else {
                    status.availableIPs = [];
                    status.ipCount = 0;
                    status.ipError = ipListResult.error;
                }

                if (portResult.success) {
                    status.port = portResult.data.port;
                } else {
                    status.port = null;
                    status.portError = portResult.error;
                }

                // Add additional server info
                status.mcpServerPort = 3000; // Our MCP server port
                status.editorVersion = (Editor as any).versions?.cocos || 'Unknown';
                status.platform = process.platform;
                status.nodeVersion = process.version;

                resolve({
                    success: true,
                    data: status
                });

            } catch (err: any) {
                resolve({
                    success: false,
                    error: `Failed to get server status: ${err.message}`
                });
            }
        });
    }

    private async checkServerConnectivity(timeout: number = 5000): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            const startTime = Date.now();

            try {
                // Test connectivity by checking if we can query server port
                // Use timeout to ensure we don't wait too long
                const testPromise = this.queryServerPort();
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Connection timeout')), timeout);
                });

                await Promise.race([testPromise, timeoutPromise]);

                const responseTime = Date.now() - startTime;

                resolve({
                    success: true,
                    data: {
                        connected: true,
                        responseTime: responseTime,
                        timeout: timeout,
                        message: `Server connectivity confirmed in ${responseTime}ms`
                    }
                });

            } catch (err: any) {
                const responseTime = Date.now() - startTime;

                resolve({
                    success: false,
                    data: {
                        connected: false,
                        responseTime: responseTime,
                        timeout: timeout,
                        error: err.message
                    }
                });
            }
        });
    }

    private async getNetworkInterfaces(): Promise<ToolResponse> {
        return new Promise(async (resolve) => {
            try {
                // Get network interfaces using Node.js os module
                const interfaces = os.networkInterfaces();

                const networkInfo = Object.entries(interfaces).map(([name, addresses]: [string, any]) => ({
                    name: name,
                    addresses: addresses.map((addr: any) => ({
                        address: addr.address,
                        family: addr.family,
                        internal: addr.internal,
                        cidr: addr.cidr
                    }))
                }));

                // Also try to get server IPs for comparison
                const serverIPResult = await this.queryServerIPList();

                resolve({
                    success: true,
                    data: {
                        networkInterfaces: networkInfo,
                        serverAvailableIPs: serverIPResult.success ? serverIPResult.data.ipList : [],
                        message: 'Network interfaces retrieved successfully'
                    }
                });

            } catch (err: any) {
                resolve({
                    success: false,
                    error: `Failed to get network interfaces: ${err.message}`
                });
            }
        });
    }
}