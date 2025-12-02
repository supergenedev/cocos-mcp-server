"use strict";
/// <reference path="../types/editor-2x.d.ts" />
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerTools = void 0;
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ServerTools {
    getTools() {
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
    async execute(toolName, args) {
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
    async queryServerIPList() {
        return new Promise((resolve) => {
            try {
                const interfaces = os.networkInterfaces();
                const ipList = [];
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
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async querySortedServerIPList() {
        return new Promise(async (resolve) => {
            try {
                const ipListResult = await this.queryServerIPList();
                if (!ipListResult.success) {
                    resolve({ success: false, error: ipListResult.error });
                    return;
                }
                const ipList = ipListResult.data.ipList;
                const sortedIPList = [];
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
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async queryServerPort() {
        return new Promise((resolve) => {
            try {
                // Read preview-port from settings/project.json
                const projectJsonPath = path.join(Editor.Project.path, 'settings', 'project.json');
                let port = 7456; // Default port for Cocos Creator preview server
                if (fs.existsSync(projectJsonPath)) {
                    try {
                        const content = fs.readFileSync(projectJsonPath, 'utf8');
                        const projectJson = JSON.parse(content);
                        if (projectJson['preview-port'] !== null && projectJson['preview-port'] !== undefined) {
                            port = projectJson['preview-port'];
                        }
                    }
                    catch (parseErr) {
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
            }
            catch (err) {
                resolve({ success: false, error: err.message });
            }
        });
    }
    async getServerStatus() {
        return new Promise(async (resolve) => {
            var _a;
            try {
                // Gather comprehensive server information
                // Use Promise.all with catch to handle errors individually
                const [ipListResult, portResult] = await Promise.all([
                    this.queryServerIPList().catch((err) => ({
                        success: false,
                        error: err.message
                    })),
                    this.queryServerPort().catch((err) => ({
                        success: false,
                        error: err.message
                    }))
                ]);
                const status = {
                    timestamp: new Date().toISOString(),
                    serverRunning: true
                };
                if (ipListResult.success) {
                    status.availableIPs = ipListResult.data.ipList;
                    status.ipCount = ipListResult.data.count;
                }
                else {
                    status.availableIPs = [];
                    status.ipCount = 0;
                    status.ipError = ipListResult.error;
                }
                if (portResult.success) {
                    status.port = portResult.data.port;
                }
                else {
                    status.port = null;
                    status.portError = portResult.error;
                }
                // Add additional server info
                status.mcpServerPort = 3000; // Our MCP server port
                status.editorVersion = ((_a = Editor.versions) === null || _a === void 0 ? void 0 : _a.cocos) || 'Unknown';
                status.platform = process.platform;
                status.nodeVersion = process.version;
                resolve({
                    success: true,
                    data: status
                });
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to get server status: ${err.message}`
                });
            }
        });
    }
    async checkServerConnectivity(timeout = 5000) {
        return new Promise(async (resolve) => {
            const startTime = Date.now();
            try {
                // Test connectivity by checking if we can query server port
                // Use timeout to ensure we don't wait too long
                const testPromise = this.queryServerPort();
                const timeoutPromise = new Promise((_, reject) => {
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
            }
            catch (err) {
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
    async getNetworkInterfaces() {
        return new Promise(async (resolve) => {
            try {
                // Get network interfaces using Node.js os module
                const interfaces = os.networkInterfaces();
                const networkInfo = Object.entries(interfaces).map(([name, addresses]) => ({
                    name: name,
                    addresses: addresses.map((addr) => ({
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
            }
            catch (err) {
                resolve({
                    success: false,
                    error: `Failed to get network interfaces: ${err.message}`
                });
            }
        });
    }
}
exports.ServerTools = ServerTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL3NlcnZlci10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsZ0RBQWdEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHaEQsdUNBQXlCO0FBQ3pCLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFN0IsTUFBYSxXQUFXO0lBQ3BCLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLHNCQUFzQjtnQkFDNUIsV0FBVyxFQUFFLHNCQUFzQjtnQkFDbkMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxFQUFFO2lCQUNqQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLDZCQUE2QjtnQkFDbkMsV0FBVyxFQUFFLDJCQUEyQjtnQkFDeEMsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxFQUFFO2lCQUNqQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLG1CQUFtQjtnQkFDekIsV0FBVyxFQUFFLGtDQUFrQztnQkFDL0MsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxFQUFFO2lCQUNqQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLG1CQUFtQjtnQkFDekIsV0FBVyxFQUFFLDZDQUE2QztnQkFDMUQsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRSxFQUFFO2lCQUNqQjthQUNKO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLDJCQUEyQjtnQkFDakMsV0FBVyxFQUFFLDhDQUE4QztnQkFDM0QsV0FBVyxFQUFFO29CQUNULElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDUixPQUFPLEVBQUU7NEJBQ0wsSUFBSSxFQUFFLFFBQVE7NEJBQ2QsV0FBVyxFQUFF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QUM7SUFDUCxDQUFDO0NBQ0o7QUF2VUQsa0NBdVVDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGVzL2VkaXRvci0yeC5kLnRzXCIgLz5cblxuaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xSZXNwb25zZSwgVG9vbEV4ZWN1dG9yIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0ICogYXMgb3MgZnJvbSAnb3MnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNsYXNzIFNlcnZlclRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncXVlcnlfc2VydmVyX2lwX2xpc3QnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUXVlcnkgc2VydmVyIElQIGxpc3QnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7fVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3F1ZXJ5X3NvcnRlZF9zZXJ2ZXJfaXBfbGlzdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZXQgc29ydGVkIHNlcnZlciBJUCBsaXN0JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdxdWVyeV9zZXJ2ZXJfcG9ydCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdRdWVyeSBlZGl0b3Igc2VydmVyIGN1cnJlbnQgcG9ydCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZ2V0X3NlcnZlcl9zdGF0dXMnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnR2V0IGNvbXByZWhlbnNpdmUgc2VydmVyIHN0YXR1cyBpbmZvcm1hdGlvbicsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHt9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY2hlY2tfc2VydmVyX2Nvbm5lY3Rpdml0eScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDaGVjayBzZXJ2ZXIgY29ubmVjdGl2aXR5IGFuZCBuZXR3b3JrIHN0YXR1cycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RpbWVvdXQgaW4gbWlsbGlzZWNvbmRzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiA1MDAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdnZXRfbmV0d29ya19pbnRlcmZhY2VzJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dldCBhdmFpbGFibGUgbmV0d29yayBpbnRlcmZhY2VzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICBzd2l0Y2ggKHRvb2xOYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdxdWVyeV9zZXJ2ZXJfaXBfbGlzdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlTZXJ2ZXJJUExpc3QoKTtcbiAgICAgICAgICAgIGNhc2UgJ3F1ZXJ5X3NvcnRlZF9zZXJ2ZXJfaXBfbGlzdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlTb3J0ZWRTZXJ2ZXJJUExpc3QoKTtcbiAgICAgICAgICAgIGNhc2UgJ3F1ZXJ5X3NlcnZlcl9wb3J0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5xdWVyeVNlcnZlclBvcnQoKTtcbiAgICAgICAgICAgIGNhc2UgJ2dldF9zZXJ2ZXJfc3RhdHVzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRTZXJ2ZXJTdGF0dXMoKTtcbiAgICAgICAgICAgIGNhc2UgJ2NoZWNrX3NlcnZlcl9jb25uZWN0aXZpdHknOlxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNoZWNrU2VydmVyQ29ubmVjdGl2aXR5KGFyZ3MudGltZW91dCk7XG4gICAgICAgICAgICBjYXNlICdnZXRfbmV0d29ya19pbnRlcmZhY2VzJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXROZXR3b3JrSW50ZXJmYWNlcygpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgcXVlcnlTZXJ2ZXJJUExpc3QoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGludGVyZmFjZXMgPSBvcy5uZXR3b3JrSW50ZXJmYWNlcygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGlwTGlzdDogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICAgICAgICAgIC8vIEV4dHJhY3QgSVB2NCBhZGRyZXNzZXMgZnJvbSBhbGwgbmV0d29yayBpbnRlcmZhY2VzXG4gICAgICAgICAgICAgICAgT2JqZWN0LnZhbHVlcyhpbnRlcmZhY2VzKS5mb3JFYWNoKChhZGRyZXNzZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFkZHJlc3Nlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkcmVzc2VzLmZvckVhY2goKGFkZHIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPbmx5IGluY2x1ZGUgSVB2NCBhZGRyZXNzZXMgdGhhdCBhcmUgbm90IGludGVybmFsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkZHIuZmFtaWx5ID09PSAnSVB2NCcgJiYgIWFkZHIuaW50ZXJuYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXBMaXN0LnB1c2goYWRkci5hZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlwTGlzdDogaXBMaXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IGlwTGlzdC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnSVAgbGlzdCByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIHF1ZXJ5U29ydGVkU2VydmVySVBMaXN0KCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpcExpc3RSZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5U2VydmVySVBMaXN0KCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWlwTGlzdFJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGlwTGlzdFJlc3VsdC5lcnJvciB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnN0IGlwTGlzdCA9IGlwTGlzdFJlc3VsdC5kYXRhLmlwTGlzdCBhcyBzdHJpbmdbXTtcbiAgICAgICAgICAgICAgICBjb25zdCBzb3J0ZWRJUExpc3Q6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgICAgICAgICAvLyBQdXQgbG9jYWxob3N0IGZpcnN0IGlmIGl0IGV4aXN0c1xuICAgICAgICAgICAgICAgIGlmIChpcExpc3QuaW5jbHVkZXMoJzEyNy4wLjAuMScpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNvcnRlZElQTGlzdC5wdXNoKCcxMjcuMC4wLjEnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgb3RoZXIgSVBzLCBleGNsdWRpbmcgbG9jYWxob3N0XG4gICAgICAgICAgICAgICAgaXBMaXN0LmZvckVhY2goKGlwKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpcCAhPT0gJzEyNy4wLjAuMScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRlZElQTGlzdC5wdXNoKGlwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvcnRlZElQTGlzdDogc29ydGVkSVBMaXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHNvcnRlZElQTGlzdC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnU29ydGVkIElQIGxpc3QgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHsgc3VjY2VzczogZmFsc2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBxdWVyeVNlcnZlclBvcnQoKTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIFJlYWQgcHJldmlldy1wb3J0IGZyb20gc2V0dGluZ3MvcHJvamVjdC5qc29uXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdEpzb25QYXRoID0gcGF0aC5qb2luKEVkaXRvci5Qcm9qZWN0LnBhdGgsICdzZXR0aW5ncycsICdwcm9qZWN0Lmpzb24nKTtcblxuICAgICAgICAgICAgICAgIGxldCBwb3J0OiBudW1iZXIgPSA3NDU2OyAvLyBEZWZhdWx0IHBvcnQgZm9yIENvY29zIENyZWF0b3IgcHJldmlldyBzZXJ2ZXJcblxuICAgICAgICAgICAgICAgIGlmIChmcy5leGlzdHNTeW5jKHByb2plY3RKc29uUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMocHJvamVjdEpzb25QYXRoLCAndXRmOCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvamVjdEpzb24gPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvamVjdEpzb25bJ3ByZXZpZXctcG9ydCddICE9PSBudWxsICYmIHByb2plY3RKc29uWydwcmV2aWV3LXBvcnQnXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9ydCA9IHByb2plY3RKc29uWydwcmV2aWV3LXBvcnQnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAocGFyc2VFcnI6IGFueSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgSlNPTiBwYXJzaW5nIGZhaWxzLCB1c2UgZGVmYXVsdCBwb3J0XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9ydDogcG9ydCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYFVzaW5nIGRlZmF1bHQgcG9ydCAke3BvcnR9IChmYWlsZWQgdG8gcGFyc2UgcHJvamVjdC5qc29uOiAke3BhcnNlRXJyLm1lc3NhZ2V9KWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb3J0OiBwb3J0LFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYEVkaXRvciBzZXJ2ZXIgcHJldmlldyBwb3J0OiAke3BvcnR9YFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldFNlcnZlclN0YXR1cygpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gR2F0aGVyIGNvbXByZWhlbnNpdmUgc2VydmVyIGluZm9ybWF0aW9uXG4gICAgICAgICAgICAgICAgLy8gVXNlIFByb21pc2UuYWxsIHdpdGggY2F0Y2ggdG8gaGFuZGxlIGVycm9ycyBpbmRpdmlkdWFsbHlcbiAgICAgICAgICAgICAgICBjb25zdCBbaXBMaXN0UmVzdWx0LCBwb3J0UmVzdWx0XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeVNlcnZlcklQTGlzdCgpLmNhdGNoKChlcnI6IGFueSkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgIH0gYXMgVG9vbFJlc3BvbnNlKSksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlTZXJ2ZXJQb3J0KCkuY2F0Y2goKGVycjogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgfSBhcyBUb29sUmVzcG9uc2UpKVxuICAgICAgICAgICAgICAgIF0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICBzZXJ2ZXJSdW5uaW5nOiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmIChpcExpc3RSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuYXZhaWxhYmxlSVBzID0gaXBMaXN0UmVzdWx0LmRhdGEuaXBMaXN0O1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuaXBDb3VudCA9IGlwTGlzdFJlc3VsdC5kYXRhLmNvdW50O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5hdmFpbGFibGVJUHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLmlwQ291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMuaXBFcnJvciA9IGlwTGlzdFJlc3VsdC5lcnJvcjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocG9ydFJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1cy5wb3J0ID0gcG9ydFJlc3VsdC5kYXRhLnBvcnQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzLnBvcnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXMucG9ydEVycm9yID0gcG9ydFJlc3VsdC5lcnJvcjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBBZGQgYWRkaXRpb25hbCBzZXJ2ZXIgaW5mb1xuICAgICAgICAgICAgICAgIHN0YXR1cy5tY3BTZXJ2ZXJQb3J0ID0gMzAwMDsgLy8gT3VyIE1DUCBzZXJ2ZXIgcG9ydFxuICAgICAgICAgICAgICAgIHN0YXR1cy5lZGl0b3JWZXJzaW9uID0gKEVkaXRvciBhcyBhbnkpLnZlcnNpb25zPy5jb2NvcyB8fCAnVW5rbm93bic7XG4gICAgICAgICAgICAgICAgc3RhdHVzLnBsYXRmb3JtID0gcHJvY2Vzcy5wbGF0Zm9ybTtcbiAgICAgICAgICAgICAgICBzdGF0dXMubm9kZVZlcnNpb24gPSBwcm9jZXNzLnZlcnNpb247XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogc3RhdHVzXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogYEZhaWxlZCB0byBnZXQgc2VydmVyIHN0YXR1czogJHtlcnIubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgY2hlY2tTZXJ2ZXJDb25uZWN0aXZpdHkodGltZW91dDogbnVtYmVyID0gNTAwMCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBUZXN0IGNvbm5lY3Rpdml0eSBieSBjaGVja2luZyBpZiB3ZSBjYW4gcXVlcnkgc2VydmVyIHBvcnRcbiAgICAgICAgICAgICAgICAvLyBVc2UgdGltZW91dCB0byBlbnN1cmUgd2UgZG9uJ3Qgd2FpdCB0b28gbG9uZ1xuICAgICAgICAgICAgICAgIGNvbnN0IHRlc3RQcm9taXNlID0gdGhpcy5xdWVyeVNlcnZlclBvcnQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lb3V0UHJvbWlzZSA9IG5ldyBQcm9taXNlPG5ldmVyPigoXywgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVqZWN0KG5ldyBFcnJvcignQ29ubmVjdGlvbiB0aW1lb3V0JykpLCB0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGF3YWl0IFByb21pc2UucmFjZShbdGVzdFByb21pc2UsIHRpbWVvdXRQcm9taXNlXSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZVRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3RlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlVGltZTogcmVzcG9uc2VUaW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGltZW91dDogdGltZW91dCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBTZXJ2ZXIgY29ubmVjdGl2aXR5IGNvbmZpcm1lZCBpbiAke3Jlc3BvbnNlVGltZX1tc2BcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbm5lY3RlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZVRpbWU6IHJlc3BvbnNlVGltZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVvdXQ6IHRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGdldE5ldHdvcmtJbnRlcmZhY2VzKCk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBHZXQgbmV0d29yayBpbnRlcmZhY2VzIHVzaW5nIE5vZGUuanMgb3MgbW9kdWxlXG4gICAgICAgICAgICAgICAgY29uc3QgaW50ZXJmYWNlcyA9IG9zLm5ldHdvcmtJbnRlcmZhY2VzKCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBuZXR3b3JrSW5mbyA9IE9iamVjdC5lbnRyaWVzKGludGVyZmFjZXMpLm1hcCgoW25hbWUsIGFkZHJlc3Nlc106IFtzdHJpbmcsIGFueV0pID0+ICh7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGFkZHJlc3NlczogYWRkcmVzc2VzLm1hcCgoYWRkcjogYW55KSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWRkcmVzczogYWRkci5hZGRyZXNzLFxuICAgICAgICAgICAgICAgICAgICAgICAgZmFtaWx5OiBhZGRyLmZhbWlseSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGludGVybmFsOiBhZGRyLmludGVybmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2lkcjogYWRkci5jaWRyXG4gICAgICAgICAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICAgIC8vIEFsc28gdHJ5IHRvIGdldCBzZXJ2ZXIgSVBzIGZvciBjb21wYXJpc29uXG4gICAgICAgICAgICAgICAgY29uc3Qgc2VydmVySVBSZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5U2VydmVySVBMaXN0KCk7XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV0d29ya0ludGVyZmFjZXM6IG5ldHdvcmtJbmZvLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVyQXZhaWxhYmxlSVBzOiBzZXJ2ZXJJUFJlc3VsdC5zdWNjZXNzID8gc2VydmVySVBSZXN1bHQuZGF0YS5pcExpc3QgOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdOZXR3b3JrIGludGVyZmFjZXMgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGBGYWlsZWQgdG8gZ2V0IG5ldHdvcmsgaW50ZXJmYWNlczogJHtlcnIubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn0iXX0=