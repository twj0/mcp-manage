import WebSocket, { WebSocketServer } from 'ws';
import { logger } from './logger.js';
import { McpManagerService } from './mcpService.js';

// 创建MCP服务实例
const mcpService = new McpManagerService();

/**
 * MCP传输层服务 - 支持SSE、HTTP JSON-RPC和WebSocket
 */
class TransportService {
    constructor() {
        this.sseClients = new Map(); // SSE客户端连接
        this.wsClients = new Map();  // WebSocket客户端连接
        this.requestId = 0;
    }

    /**
     * 生成唯一请求ID
     */
    generateRequestId() {
        return ++this.requestId;
    }

    /**
     * 验证JSON-RPC请求格式
     */
    validateJsonRpcRequest(request) {
        if (!request || typeof request !== 'object') {
            return false;
        }
        
        return request.jsonrpc === '2.0' && 
               request.method && 
               typeof request.method === 'string' &&
               request.id !== undefined;
    }

    /**
     * 创建JSON-RPC响应
     */
    createJsonRpcResponse(id, result = null, error = null) {
        const response = {
            jsonrpc: '2.0',
            id
        };

        if (error) {
            response.error = {
                code: error.code || -32603,
                message: error.message || 'Internal error',
                data: error.data
            };
        } else {
            response.result = result;
        }

        return response;
    }

    /**
     * 处理MCP请求
     */
    async processMcpRequest(request) {
        try {
            const { method, params = {}, id } = request;
            
            logger.info(`Processing MCP request: ${method}`, { id, params });

            switch (method) {
                case 'initialize':
                    return this.createJsonRpcResponse(id, {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {},
                            resources: {},
                            prompts: {}
                        },
                        serverInfo: {
                            name: 'mcp-manager',
                            version: '1.0.0'
                        }
                    });

                case 'tools/list':
                    const tools = await mcpService.getAllTools();
                    return this.createJsonRpcResponse(id, { tools });

                case 'tools/call':
                    const { name, arguments: args } = params;
                    if (!name) {
                        return this.createJsonRpcResponse(id, null, {
                            code: -32602,
                            message: 'Invalid params: missing tool name'
                        });
                    }
                    
                    const result = await mcpService.callTool(name, args || {});
                    return this.createJsonRpcResponse(id, result);

                case 'resources/list':
                    return this.createJsonRpcResponse(id, { resources: [] });

                case 'prompts/list':
                    return this.createJsonRpcResponse(id, { prompts: [] });

                default:
                    return this.createJsonRpcResponse(id, null, {
                        code: -32601,
                        message: `Method not found: ${method}`
                    });
            }
        } catch (error) {
            logger.error('Error processing MCP request:', error);
            return this.createJsonRpcResponse(request.id, null, {
                code: -32603,
                message: 'Internal error',
                data: error.message
            });
        }
    }

    /**
     * 处理SSE连接
     */
    handleSSEConnection(req, res) {
        const clientId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        logger.info(`New SSE connection: ${clientId}`);

        // 设置SSE响应头
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // 发送连接确认
        res.write(`data: ${JSON.stringify({
            type: 'connected',
            clientId,
            timestamp: new Date().toISOString()
        })}\n\n`);

        // 存储客户端连接
        this.sseClients.set(clientId, {
            res,
            connectedAt: new Date()
        });

        // 处理客户端断开连接
        req.on('close', () => {
            logger.info(`SSE client disconnected: ${clientId}`);
            this.sseClients.delete(clientId);
        });

        req.on('error', (error) => {
            logger.error(`SSE client error: ${clientId}`, error);
            this.sseClients.delete(clientId);
        });

        // 定期发送心跳
        const heartbeat = setInterval(() => {
            if (this.sseClients.has(clientId)) {
                try {
                    res.write(`data: ${JSON.stringify({
                        type: 'heartbeat',
                        timestamp: new Date().toISOString()
                    })}\n\n`);
                } catch (error) {
                    logger.error(`Error sending heartbeat to ${clientId}:`, error);
                    clearInterval(heartbeat);
                    this.sseClients.delete(clientId);
                }
            } else {
                clearInterval(heartbeat);
            }
        }, 30000); // 每30秒发送一次心跳
    }

    /**
     * 处理SSE的JSON-RPC请求
     */
    async handleSSEJsonRpc(req, res) {
        try {
            const request = req.body;
            
            if (!this.validateJsonRpcRequest(request)) {
                const error = this.createJsonRpcResponse(null, null, {
                    code: -32600,
                    message: 'Invalid Request'
                });
                return res.json(error);
            }

            const response = await this.processMcpRequest(request);
            res.json(response);

        } catch (error) {
            logger.error('Error handling SSE JSON-RPC:', error);
            const errorResponse = this.createJsonRpcResponse(null, null, {
                code: -32603,
                message: 'Internal error'
            });
            res.status(500).json(errorResponse);
        }
    }

    /**
     * 处理HTTP JSON-RPC请求
     */
    async handleHttpJsonRpc(req, res) {
        try {
            const request = req.body;
            
            if (!this.validateJsonRpcRequest(request)) {
                const error = this.createJsonRpcResponse(null, null, {
                    code: -32600,
                    message: 'Invalid Request'
                });
                return res.status(400).json(error);
            }

            const response = await this.processMcpRequest(request);
            res.json(response);

        } catch (error) {
            logger.error('Error handling HTTP JSON-RPC:', error);
            const errorResponse = this.createJsonRpcResponse(req.body?.id || null, null, {
                code: -32603,
                message: 'Internal error'
            });
            res.status(500).json(errorResponse);
        }
    }

    /**
     * 初始化WebSocket服务器
     */
    initializeWebSocketServer(server) {
        const wss = new WebSocketServer({ 
            server,
            path: '/ws'
        });

        wss.on('connection', (ws, req) => {
            const clientId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            logger.info(`New WebSocket connection: ${clientId}`);

            // 存储客户端连接
            this.wsClients.set(clientId, {
                ws,
                connectedAt: new Date()
            });

            // 发送连接确认
            ws.send(JSON.stringify({
                type: 'connected',
                clientId,
                timestamp: new Date().toISOString()
            }));

            // 处理消息
            ws.on('message', async (data) => {
                try {
                    const request = JSON.parse(data.toString());
                    
                    if (!this.validateJsonRpcRequest(request)) {
                        const error = this.createJsonRpcResponse(null, null, {
                            code: -32600,
                            message: 'Invalid Request'
                        });
                        ws.send(JSON.stringify(error));
                        return;
                    }

                    const response = await this.processMcpRequest(request);
                    ws.send(JSON.stringify(response));

                } catch (error) {
                    logger.error(`Error processing WebSocket message from ${clientId}:`, error);
                    const errorResponse = this.createJsonRpcResponse(null, null, {
                        code: -32700,
                        message: 'Parse error'
                    });
                    ws.send(JSON.stringify(errorResponse));
                }
            });

            // 处理连接关闭
            ws.on('close', () => {
                logger.info(`WebSocket client disconnected: ${clientId}`);
                this.wsClients.delete(clientId);
            });

            // 处理错误
            ws.on('error', (error) => {
                logger.error(`WebSocket client error: ${clientId}`, error);
                this.wsClients.delete(clientId);
            });

            // 定期发送心跳
            const heartbeat = setInterval(() => {
                if (this.wsClients.has(clientId) && ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.ping();
                    } catch (error) {
                        logger.error(`Error sending ping to ${clientId}:`, error);
                        clearInterval(heartbeat);
                        this.wsClients.delete(clientId);
                    }
                } else {
                    clearInterval(heartbeat);
                }
            }, 30000); // 每30秒发送一次心跳
        });

        logger.info('WebSocket server initialized on /ws');
        return wss;
    }

    /**
     * 获取连接统计信息
     */
    getConnectionStats() {
        return {
            sse: {
                count: this.sseClients.size,
                clients: Array.from(this.sseClients.keys())
            },
            websocket: {
                count: this.wsClients.size,
                clients: Array.from(this.wsClients.keys())
            }
        };
    }

    /**
     * 清理所有连接
     */
    cleanup() {
        logger.info('Cleaning up transport connections...');
        
        // 关闭所有SSE连接
        for (const [clientId, client] of this.sseClients) {
            try {
                client.res.end();
            } catch (error) {
                logger.error(`Error closing SSE client ${clientId}:`, error);
            }
        }
        this.sseClients.clear();

        // 关闭所有WebSocket连接
        for (const [clientId, client] of this.wsClients) {
            try {
                client.ws.close();
            } catch (error) {
                logger.error(`Error closing WebSocket client ${clientId}:`, error);
            }
        }
        this.wsClients.clear();

        logger.info('Transport cleanup completed');
    }
}

export const transportService = new TransportService();
export default transportService;