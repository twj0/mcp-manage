let mcpServers = {};
let originalConfig = {};
let toolsList = [];
let serverToDelete = null;
let templates = {};
let mcpRegistry = {};

// API endpoints
const API = {
    CURSOR_CONFIG: '/api/cursor-config',
    CLAUDE_CONFIG: '/api/claude-config',
    TOOLS: '/api/tools',
    SAVE_CONFIGS: '/api/save-configs',
    TEMPLATES: '/templates.json',
    REGISTRY: '/mcp-registry.json'
};

function showMessage(message, isError = true) {
    const messageDiv = document.getElementById(isError ? 'errorMessage' : 'successMessage');
    const otherDiv = document.getElementById(isError ? 'successMessage' : 'errorMessage');
    
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    otherDiv.style.display = 'none';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 10000); // Show for 10 seconds
}

async function fetchWithTimeout(url, options = {}) {
    const timeout = options.timeout || 5000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    console.log('Fetching:', url, options);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        return data;
    } catch (error) {
        clearTimeout(id);
        console.error('Fetch error:', error);
        throw error;
    }
}

async function loadConfigs() {
    console.log('Loading configurations...');
    try {
        // Load templates and registry first
        await loadTemplates();
        await loadRegistry();
        
        // Load cursor config first
        console.log('Fetching cursor config from:', API.CURSOR_CONFIG);
        const cursorConfig = await fetchWithTimeout(API.CURSOR_CONFIG);
        console.log('Received cursor config:', cursorConfig);
        
        if (!cursorConfig.mcpServers) {
            throw new Error('Invalid config format: missing mcpServers');
        }
        
        mcpServers = cursorConfig.mcpServers;
        originalConfig = JSON.parse(JSON.stringify(mcpServers));
        
        console.log('Loaded servers:', Object.keys(mcpServers));
        
        // Render initial view
        renderServers();

        // Load tools in background
        try {
            console.log('Fetching tools from:', API.TOOLS);
            toolsList = await fetchWithTimeout(API.TOOLS);
            console.log('Loaded tools:', toolsList);
            renderTools();
        } catch (error) {
            console.error('Error loading tools:', error);
            showMessage('Failed to load tools. Server list may be incomplete.');
        }
    } catch (error) {
        console.error('Error loading configs:', error);
        showMessage('Failed to load server configurations. Please refresh the page.');
    }
}

async function loadRegistry() {
    try {
        const response = await fetchWithTimeout(API.REGISTRY);
        mcpRegistry = response || {};
        console.log('Loaded MCP registry:', Object.keys(mcpRegistry));
    } catch (error) {
        console.error('Error loading MCP registry:', error);
        mcpRegistry = {};
    }
}

async function loadTemplates() {
    try {
        const response = await fetchWithTimeout(API.TEMPLATES);
        templates = response.templates || {};
        console.log('Loaded templates:', Object.keys(templates));
        
        // Populate template select
        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect) {
            templateSelect.innerHTML = '<option value="">Select a template...</option>';
            Object.entries(templates).forEach(([key, template]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = template.name;
                templateSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading templates:', error);
        templates = {};
    }
}

function showView(view, clickedTab) {
    console.log('Switching view to:', view);
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');

    // Update views
    document.getElementById('serversView').style.display = view === 'servers' ? 'grid' : 'none';
    document.getElementById('toolsView').style.display = view === 'tools' ? 'block' : 'none';
    document.getElementById('addView').style.display = view === 'add' ? 'block' : 'none';

    // Refresh tools view when switching to it
    if (view === 'tools') {
        renderTools();
    }
}

function renderServers() {
    console.log('Rendering servers view with servers:', Object.keys(mcpServers));
    const grid = document.getElementById('serversView');
    grid.innerHTML = '';

    // Sort servers alphabetically
    const sortedServers = Object.entries(mcpServers).sort(([a], [b]) => a.localeCompare(b));

    sortedServers.forEach(([name, config]) => {
        console.log('Rendering server:', name, config);
        const card = document.createElement('div');
        card.className = 'server-card';
        
        const serverPath = Array.isArray(config.args) ? config.args[0] : '';
        const envVars = config.env || {};
        
        // 获取注册表信息
        const registryInfo = mcpRegistry.servers && mcpRegistry.servers[name];
        const category = registryInfo?.category || 'other';
        const categoryInfo = mcpRegistry.categories && mcpRegistry.categories[category];
        const description = registryInfo?.description || config.description || '无描述';
        const useCases = registryInfo?.use_cases || [];
        const aiHint = registryInfo?.ai_usage_hint || '';
        const priority = registryInfo?.priority || 'medium';
        const status = registryInfo?.status || 'unknown';

        card.innerHTML = `
            <div class="server-header">
                <div class="server-title">
                    <span class="server-name">${name}</span>
                    ${categoryInfo ? `<span class="category-badge" style="background-color: ${categoryInfo.color}">
                        ${categoryInfo.icon} ${categoryInfo.name}
                    </span>` : ''}
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" ${config.disabled ? '' : 'checked'} 
                           onchange="toggleServer('${name}', this.checked)">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="server-details">
                <div class="server-description">${description}</div>
                <div class="server-path">${serverPath}</div>
                ${useCases.length > 0 ? `
                    <div class="use-cases">
                        <strong>使用场景:</strong>
                        <ul>${useCases.map(uc => `<li>${uc}</li>`).join('')}</ul>
                    </div>
                ` : ''}
                ${aiHint ? `
                    <div class="ai-hint">
                        <strong>AI 使用提示:</strong> ${aiHint}
                    </div>
                ` : ''}
                <div class="server-meta">
                    <span class="priority priority-${priority}">优先级: ${priority}</span>
                    <span class="status status-${status}">状态: ${status}</span>
                </div>
                ${Object.keys(envVars).length > 0 ? '<div class="env-vars">' + 
                    Object.entries(envVars).map(([key]) => 
                        `<div class="env-var">
                            <span>${key}</span>
                            <span>********</span>
                        </div>`
                    ).join('') + '</div>' : ''}
            </div>
            <div class="server-actions">
                <button class="action-btn edit-btn" onclick="editServer('${name}')">编辑</button>
                <button class="action-btn delete-btn" onclick="deleteServer('${name}')">删除</button>
                ${registryInfo ? `<button class="action-btn info-btn" onclick="showServerInfo('${name}')">详情</button>` : ''}
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function renderTools() {
    console.log('Rendering tools view');
    const toolsView = document.getElementById('toolsView');
    toolsView.innerHTML = '';

    if (!toolsList || toolsList.length === 0) {
        toolsView.innerHTML = '<div class="no-tools">No tools available or still loading...</div>';
        return;
    }

    // Group tools by server
    const toolsByServer = toolsList.reduce((acc, tool) => {
        if (!acc[tool.server]) {
            acc[tool.server] = [];
        }
        acc[tool.server].push(tool);
        return acc;
    }, {});

    // Create server sections
    Object.entries(toolsByServer).forEach(([server, tools]) => {
        const serverSection = document.createElement('div');
        serverSection.className = 'server-tools';
        
        const content = `
            <h2>${server}</h2>
            <div class="tools-grid">
                ${tools.map(tool => `
                    <div class="tool-card">
                        <div class="tool-name">${tool.name}</div>
                        <div class="tool-description">${tool.description || 'No description available'}</div>
                        <div class="tool-schema">
                            ${JSON.stringify(tool.inputSchema || {}, null, 2)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        serverSection.innerHTML = content;
        toolsView.appendChild(serverSection);
    });
}

function toggleServer(name, enabled) {
    console.log('Toggling server:', name, enabled);
    if (mcpServers[name]) {
        mcpServers[name].disabled = !enabled;
    }
}

async function saveChanges() {
    console.log('Saving changes...');
    try {
        const result = await fetchWithTimeout(API.SAVE_CONFIGS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ mcpServers })
        });

        originalConfig = JSON.parse(JSON.stringify(mcpServers));
        showMessage(result.message || 'Configurations saved successfully. Please restart Claude to apply changes.', false);
        
        // Refresh tools list to reflect enabled/disabled servers
        const updatedTools = await fetchWithTimeout(API.TOOLS);
        toolsList = updatedTools;
        if (document.getElementById('toolsView').style.display !== 'none') {
            renderTools();
        }
    } catch (error) {
        console.error('Error saving configs:', error);
        showMessage('Error saving configurations: ' + error.message);
    }
}

// Initialize the app
console.log('Initializing MCP Manager...');
window.onload = loadConfigs;

// Add Server Functions
function addEnvVar() {
    const envVarsContainer = document.getElementById('envVars');
    const envVarDiv = document.createElement('div');
    envVarDiv.className = 'env-var-input';
    envVarDiv.innerHTML = `
        <input type="text" placeholder="Variable name" class="env-key">
        <input type="text" placeholder="Variable value" class="env-value">
        <button type="button" onclick="removeEnvVar(this)">Remove</button>
    `;
    envVarsContainer.appendChild(envVarDiv);
}

function removeEnvVar(button) {
    button.parentElement.remove();
}

function toggleConfigMode() {
    const configMode = document.getElementById('configMode').value;
    const formInputMode = document.getElementById('formInputMode');
    const templateMode = document.getElementById('templateMode');
    const jsonInputMode = document.getElementById('jsonInputMode');
    const validateJsonBtn = document.getElementById('validateJsonBtn');
    
    // Hide all modes first
    formInputMode.style.display = 'none';
    templateMode.style.display = 'none';
    jsonInputMode.style.display = 'none';
    validateJsonBtn.style.display = 'none';
    
    if (configMode === 'json') {
        jsonInputMode.style.display = 'block';
        validateJsonBtn.style.display = 'inline-block';
        // Remove required attribute from form fields
        document.getElementById('serverCommand').removeAttribute('required');
        document.getElementById('serverArgs').removeAttribute('required');
    } else if (configMode === 'template') {
        templateMode.style.display = 'block';
        formInputMode.style.display = 'block';
        // Remove required attributes in template mode
        document.getElementById('serverCommand').removeAttribute('required');
        document.getElementById('serverArgs').removeAttribute('required');
    } else {
        formInputMode.style.display = 'block';
        // Add back required attributes
        updateRequiredFields();
    }
}

function toggleConnectionType() {
    const connectionType = document.getElementById('connectionType').value;
    const stdioConfig = document.getElementById('stdioConfig');
    const remoteConfig = document.getElementById('remoteConfig');
    
    if (connectionType === 'stdio') {
        stdioConfig.style.display = 'block';
        remoteConfig.style.display = 'none';
    } else {
        stdioConfig.style.display = 'none';
        remoteConfig.style.display = 'block';
        // Update auth type change handler
        document.getElementById('authType').addEventListener('change', toggleAuthConfig);
    }
    updateRequiredFields();
}

function toggleAuthConfig() {
    const authType = document.getElementById('authType').value;
    const authConfig = document.getElementById('authConfig');
    
    if (authType !== 'none') {
        authConfig.style.display = 'block';
        document.getElementById('authValue').setAttribute('required', 'required');
    } else {
        authConfig.style.display = 'none';
        document.getElementById('authValue').removeAttribute('required');
    }
}

function toggleCommandType() {
    const commandType = document.getElementById('commandType').value;
    const serverCommand = document.getElementById('serverCommand');
    const serverArgs = document.getElementById('serverArgs');
    
    // Auto-fill command based on type
    switch (commandType) {
        case 'node':
            serverCommand.value = 'node';
            serverArgs.placeholder = '/path/to/server.js\n--option=value';
            break;
        case 'python':
            serverCommand.value = 'python';
            serverArgs.placeholder = '/path/to/server.py\n--option=value';
            break;
        case 'uvx':
            serverCommand.value = 'uvx';
            serverArgs.placeholder = 'package-name\n--option=value';
            break;
        case 'docker':
            serverCommand.value = 'docker';
            serverArgs.placeholder = 'run\n--rm\n-i\nimage-name\n/path/to/server';
            break;
        case 'custom':
            serverCommand.value = '';
            serverArgs.placeholder = 'Custom arguments here';
            break;
    }
}

function updateRequiredFields() {
    const connectionType = document.getElementById('connectionType').value;
    const configMode = document.getElementById('configMode').value;
    
    if (configMode === 'form') {
        if (connectionType === 'stdio') {
            document.getElementById('serverCommand').setAttribute('required', 'required');
            document.getElementById('serverArgs').setAttribute('required', 'required');
            document.getElementById('serverUrl').removeAttribute('required');
        } else {
            document.getElementById('serverCommand').removeAttribute('required');
            document.getElementById('serverArgs').removeAttribute('required');
            document.getElementById('serverUrl').setAttribute('required', 'required');
        }
    }
}

function validateJson() {
    const jsonConfig = document.getElementById('jsonConfig').value;
    try {
        const parsed = JSON.parse(jsonConfig);
        showMessage('JSON is valid!', false);
        return true;
    } catch (error) {
        showMessage(`Invalid JSON: ${error.message}`);
        return false;
    }
}

function loadTemplate() {
    const templateKey = document.getElementById('templateSelect').value;
    const descriptionDiv = document.getElementById('templateDescription');
    
    if (!templateKey || !templates[templateKey]) {
        descriptionDiv.innerHTML = '';
        return;
    }
    
    const template = templates[templateKey];
    const config = template.config;
    
    // Show template description
    descriptionDiv.innerHTML = `
        <h4>${template.name}</h4>
        <p>${template.description}</p>
    `;
    
    // Auto-fill form based on template
    if (config.transport) {
        // Remote connection template
        document.getElementById('connectionType').value = config.transport;
        document.getElementById('serverUrl').value = config.url || '';
        
        if (config.auth) {
            document.getElementById('authType').value = config.auth.type;
            document.getElementById('authValue').value = config.auth.value;
        }
    } else {
        // Local process template
        document.getElementById('connectionType').value = 'stdio';
        document.getElementById('serverCommand').value = config.command || '';
        document.getElementById('serverArgs').value = Array.isArray(config.args) ? config.args.join('\n') : '';
        
        // Set command type based on command
        const command = config.command;
        if (command === 'node') {
            document.getElementById('commandType').value = 'node';
        } else if (command === 'python') {
            document.getElementById('commandType').value = 'python';
        } else if (command === 'uvx') {
            document.getElementById('commandType').value = 'uvx';
        } else if (command === 'docker') {
            document.getElementById('commandType').value = 'docker';
        } else {
            document.getElementById('commandType').value = 'custom';
        }
    }
    
    // Update UI
    toggleConnectionType();
    
    // Fill environment variables
    const envVarsContainer = document.getElementById('envVars');
    envVarsContainer.innerHTML = '';
    
    if (config.env && Object.keys(config.env).length > 0) {
        Object.entries(config.env).forEach(([key, value]) => {
            const envVarDiv = document.createElement('div');
            envVarDiv.className = 'env-var-input';
            envVarDiv.innerHTML = `
                <input type="text" placeholder="Variable name" class="env-key" value="${key}">
                <input type="text" placeholder="Variable value" class="env-value" value="${value}">
                <button type="button" onclick="removeEnvVar(this)">Remove</button>
            `;
            envVarsContainer.appendChild(envVarDiv);
        });
    } else {
        addEnvVar();
    }
}

function clearForm() {
    document.getElementById('addServerForm').reset();
    
    // Reset to default values
    document.getElementById('configMode').value = 'form';
    document.getElementById('connectionType').value = 'stdio';
    document.getElementById('commandType').value = 'node';
    document.getElementById('serverCommand').value = 'node';
    
    // Show/hide appropriate sections
    toggleConfigMode();
    toggleConnectionType();
    
    // Reset to one env var input
    const envVarsContainer = document.getElementById('envVars');
    envVarsContainer.innerHTML = `
        <div class="env-var-input">
            <input type="text" placeholder="Variable name" class="env-key">
            <input type="text" placeholder="Variable value" class="env-value">
            <button type="button" onclick="removeEnvVar(this)">Remove</button>
        </div>
    `;
}

function deleteServer(serverName) {
    serverToDelete = serverName;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    serverToDelete = null;
}

function confirmDelete() {
    if (serverToDelete && mcpServers[serverToDelete]) {
        delete mcpServers[serverToDelete];
        renderServers();
        showMessage(`Server "${serverToDelete}" deleted successfully. Don't forget to save changes.`, false);
    }
    closeDeleteModal();
}

function showServerInfo(serverName) {
    const registryInfo = mcpRegistry.servers && mcpRegistry.servers[serverName];
    if (!registryInfo) {
        showMessage('没有找到该服务器的详细信息');
        return;
    }
    
    const category = mcpRegistry.categories && mcpRegistry.categories[registryInfo.category];
    
    const infoHtml = `
        <h3>${registryInfo.name}</h3>
        <div class="server-info-section">
            <h4>基本信息</h4>
            <p><strong>类别:</strong> ${category ? category.icon + ' ' + category.name : registryInfo.category}</p>
            <p><strong>描述:</strong> ${registryInfo.description}</p>
            <p><strong>优先级:</strong> ${registryInfo.priority}</p>
            <p><strong>状态:</strong> ${registryInfo.status}</p>
        </div>
        
        ${registryInfo.capabilities ? `
        <div class="server-info-section">
            <h4>功能能力</h4>
            <ul>${registryInfo.capabilities.map(cap => `<li>${cap}</li>`).join('')}</ul>
        </div>
        ` : ''}
        
        ${registryInfo.use_cases ? `
        <div class="server-info-section">
            <h4>使用场景</h4>
            <ul>${registryInfo.use_cases.map(uc => `<li>${uc}</li>`).join('')}</ul>
        </div>
        ` : ''}
        
        ${registryInfo.ai_prompt_examples ? `
        <div class="server-info-section">
            <h4>AI 提示示例</h4>
            <ul>${registryInfo.ai_prompt_examples.map(example => `<li><code>${example}</code></li>`).join('')}</ul>
        </div>
        ` : ''}
        
        ${registryInfo.ai_usage_hint ? `
        <div class="server-info-section">
            <h4>使用提示</h4>
            <p>${registryInfo.ai_usage_hint}</p>
        </div>
        ` : ''}
        
        ${registryInfo.tags ? `
        <div class="server-info-section">
            <h4>标签</h4>
            <div class="tags">${registryInfo.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
        </div>
        ` : ''}
    `;
    
    // 创建模态窗口
    const modal = document.createElement('div');
    modal.className = 'modal info-modal';
    modal.innerHTML = `
        <div class="modal-content info-modal-content">
            ${infoHtml}
            <div class="modal-actions">
                <button onclick="closeInfoModal()">关闭</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // 全局函数
    window.closeInfoModal = () => {
        document.body.removeChild(modal);
        delete window.closeInfoModal;
    };
}

function editServer(serverName) {
    const server = mcpServers[serverName];
    if (!server) return;
    
    // Switch to add view
    document.querySelector('.tab:nth-child(3)').click();
    
    // Fill basic info
    document.getElementById('serverName').value = serverName;
    
    // Determine configuration mode
    if (server.transport) {
        // Remote connection
        document.getElementById('configMode').value = 'form';
        document.getElementById('connectionType').value = server.transport;
        document.getElementById('serverUrl').value = server.url || '';
        
        if (server.auth) {
            document.getElementById('authType').value = server.auth.type;
            document.getElementById('authValue').value = server.auth.value;
        }
    } else if (server.command) {
        // Local process
        document.getElementById('configMode').value = 'form';
        document.getElementById('connectionType').value = 'stdio';
        document.getElementById('serverCommand').value = server.command || '';
        document.getElementById('serverArgs').value = Array.isArray(server.args) ? server.args.join('\n') : '';
        
        // Try to detect command type
        const command = server.command;
        if (command === 'node') {
            document.getElementById('commandType').value = 'node';
        } else if (command === 'python') {
            document.getElementById('commandType').value = 'python';
        } else if (command === 'uvx') {
            document.getElementById('commandType').value = 'uvx';
        } else if (command === 'docker') {
            document.getElementById('commandType').value = 'docker';
        } else {
            document.getElementById('commandType').value = 'custom';
        }
    } else {
        // Complex configuration, use JSON mode
        document.getElementById('configMode').value = 'json';
        document.getElementById('jsonConfig').value = JSON.stringify(server, null, 2);
    }
    
    // Update UI based on selections
    toggleConfigMode();
    toggleConnectionType();
    toggleAuthConfig();
    
    // Fill environment variables
    const envVarsContainer = document.getElementById('envVars');
    envVarsContainer.innerHTML = '';
    
    if (server.env && Object.keys(server.env).length > 0) {
        Object.entries(server.env).forEach(([key, value]) => {
            const envVarDiv = document.createElement('div');
            envVarDiv.className = 'env-var-input';
            envVarDiv.innerHTML = `
                <input type="text" placeholder="Variable name" class="env-key" value="${key}">
                <input type="text" placeholder="Variable value" class="env-value" value="${value}">
                <button type="button" onclick="removeEnvVar(this)">Remove</button>
            `;
            envVarsContainer.appendChild(envVarDiv);
        });
    } else {
        addEnvVar();
    }
    
    // Change form title
    document.querySelector('.add-server-form h2').textContent = `Edit Server: ${serverName}`;
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addServerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const serverName = formData.get('serverName').trim();
        const configMode = formData.get('configMode');
        
        if (!serverName) {
            showMessage('Please enter a server name.');
            return;
        }
        
        let serverConfig;
        
        if (configMode === 'json') {
            // JSON input mode
            const jsonConfig = document.getElementById('jsonConfig').value.trim();
            if (!jsonConfig) {
                showMessage('Please enter JSON configuration.');
                return;
            }
            
            try {
                serverConfig = JSON.parse(jsonConfig);
            } catch (error) {
                showMessage(`Invalid JSON: ${error.message}`);
                return;
            }
        } else if (configMode === 'template') {
            // Template mode - process like form mode but allow template overrides
            const connectionType = formData.get('connectionType');
            
            if (connectionType === 'stdio') {
                const serverCommand = formData.get('serverCommand').trim();
                const serverArgs = formData.get('serverArgs').trim();
                
                if (!serverCommand) {
                    showMessage('Please select a template or fill in the command.');
                    return;
                }
                
                const args = serverArgs ? serverArgs.split('\n').filter(arg => arg.trim()).map(arg => arg.trim()) : [];
                
                serverConfig = {
                    command: serverCommand,
                    args: args
                };
            } else {
                // Remote connection
                const serverUrl = formData.get('serverUrl').trim();
                const authType = formData.get('authType');
                
                if (!serverUrl) {
                    showMessage('Please enter server URL.');
                    return;
                }
                
                serverConfig = {
                    transport: connectionType,
                    url: serverUrl
                };
                
                if (authType !== 'none') {
                    const authValue = formData.get('authValue');
                    if (authValue) {
                        serverConfig.auth = {
                            type: authType,
                            value: authValue
                        };
                    }
                }
            }
            
            // Add environment variables
            const env = {};
            const envInputs = document.querySelectorAll('.env-var-input');
            envInputs.forEach(envInput => {
                const key = envInput.querySelector('.env-key').value.trim();
                const value = envInput.querySelector('.env-value').value.trim();
                if (key && value) {
                    env[key] = value;
                }
            });
            
            if (Object.keys(env).length > 0) {
                serverConfig.env = env;
            }
        } else {
            // Form input mode
            const connectionType = formData.get('connectionType');
            
            if (connectionType === 'stdio') {
                // Local process configuration
                const serverCommand = formData.get('serverCommand').trim();
                const serverArgs = formData.get('serverArgs').trim();
                
                if (!serverCommand || !serverArgs) {
                    showMessage('Please fill in command and arguments.');
                    return;
                }
                
                // Parse arguments (one per line)
                const args = serverArgs.split('\n').filter(arg => arg.trim()).map(arg => arg.trim());
                
                serverConfig = {
                    command: serverCommand,
                    args: args
                };
            } else {
                // Remote connection configuration
                const serverUrl = formData.get('serverUrl').trim();
                const authType = formData.get('authType');
                
                if (!serverUrl) {
                    showMessage('Please enter server URL.');
                    return;
                }
                
                serverConfig = {
                    transport: connectionType,
                    url: serverUrl
                };
                
                // Add authentication if specified
                if (authType !== 'none') {
                    const authValue = formData.get('authValue');
                    if (!authValue) {
                        showMessage('Please enter authentication value.');
                        return;
                    }
                    
                    serverConfig.auth = {
                        type: authType,
                        value: authValue
                    };
                }
            }
            
            // Collect environment variables
            const env = {};
            const envInputs = document.querySelectorAll('.env-var-input');
            envInputs.forEach(envInput => {
                const key = envInput.querySelector('.env-key').value.trim();
                const value = envInput.querySelector('.env-value').value.trim();
                if (key && value) {
                    env[key] = value;
                }
            });
            
            if (Object.keys(env).length > 0) {
                serverConfig.env = env;
            }
        }
        
        // Add or update server
        mcpServers[serverName] = serverConfig;
        
        // Show success message
        const isEdit = document.querySelector('.add-server-form h2').textContent.includes('Edit');
        showMessage(`Server "${serverName}" ${isEdit ? 'updated' : 'added'} successfully. Don't forget to save changes.`, false);
        
        // Clear form and switch to servers view
        clearForm();
        document.querySelector('.add-server-form h2').textContent = 'Add New MCP Server';
        document.querySelector('.tab:first-child').click();
        
        // Re-render servers
        renderServers();
    });
});

// Export functions for global access
window.showView = showView;
window.toggleServer = toggleServer;
window.saveChanges = saveChanges;
