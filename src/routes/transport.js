import express from 'express';
import { transportService } from '../services/transportService.js';
import { logger } from '../services/logger.js';

const router = express.Router();

/**
 * SSE (Server-Sent Events) 端点
 * 路径: /sse
 * 用于建立SSE连接，AI客户端可以通过此端点接收服务器推送的消息
 */
router.get('/sse', (req, res) => {
    logger.info('SSE connection request received');
    transportService.handleSSEConnection(req, res);
});

/**
 * SSE JSON-RPC 端点
 * 路径: POST /sse/rpc
 * 用于通过SSE发送JSON-RPC请求
 */
router.post('/sse/rpc', async (req, res) => {
    logger.info('SSE JSON-RPC request received', { body: req.body });
    await transportService.handleSSEJsonRpc(req, res);
});

/**
 * HTTP JSON-RPC 端点
 * 路径: POST /mcp
 * 标准的MCP JSON-RPC接口，AI客户端可以直接发送JSON-RPC请求
 */
router.post('/mcp', async (req, res) => {
    logger.info('HTTP JSON-RPC request received', { body: req.body });
    await transportService.handleHttpJsonRpc(req, res);
});

/**
 * 获取传输层连接统计信息
 * 路径: GET /transport/stats
 */
router.get('/transport/stats', (req, res) => {
    try {
        const stats = transportService.getConnectionStats();
        logger.info('Transport stats requested', stats);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error getting transport stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get transport statistics',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 健康检查端点
 * 路径: GET /transport/health
 */
router.get('/transport/health', (req, res) => {
    res.json({
        status: 'healthy',
        transports: {
            sse: 'available',
            http_jsonrpc: 'available', 
            websocket: 'available'
        },
        timestamp: new Date().toISOString()
    });
});

/**
 * 传输层信息端点
 * 路径: GET /transport/info
 */
router.get('/transport/info', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    res.json({
        name: 'MCP Manager Transport Layer',
        version: '1.0.0',
        endpoints: {
            sse: {
                url: `${baseUrl}/sse`,
                description: 'Server-Sent Events endpoint for real-time communication',
                methods: ['GET']
            },
            sse_rpc: {
                url: `${baseUrl}/sse/rpc`,
                description: 'JSON-RPC over SSE endpoint',
                methods: ['POST']
            },
            http_jsonrpc: {
                url: `${baseUrl}/mcp`,
                description: 'Standard HTTP JSON-RPC endpoint',
                methods: ['POST']
            },
            websocket: {
                url: `${baseUrl.replace('http', 'ws')}/ws`,
                description: 'WebSocket endpoint for bidirectional communication',
                methods: ['WebSocket']
            }
        },
        capabilities: {
            tools: true,
            resources: false,
            prompts: false
        },
        protocolVersion: '2024-11-05'
    });
});

export default router;