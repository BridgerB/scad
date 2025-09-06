<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  
  export let data: PageData;
  export let form: any;
  
  let seedCount = 10;
  
  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
  }
  
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  function formatDate(dateInput: string | Date): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  }
</script>

<div class="dev-container">
  <div class="dev-header">
    <h1>🔧 Developer Dashboard</h1>
    <p class="subtitle">Development tools and system diagnostics for SCAD platform</p>
  </div>

  <!-- Status Messages -->
  {#if form?.success}
    <div class="alert success">
      ✅ {form.message}
      {#if form.response}
        <div class="response-text">Response: {form.response}</div>
      {/if}
    </div>
  {/if}
  
  {#if form?.error}
    <div class="alert error">
      ❌ {form.error}
    </div>
  {/if}

  <!-- System Status -->
  <div class="status-section">
    <h2>System Status</h2>
    <div class="status-grid">
      <div class="status-card">
        <div class="status-header">
          <h3>Database</h3>
          <div class="status-indicator {data.dbHealth.status}">
            {data.dbHealth.status === 'connected' ? '🟢' : '🔴'}
          </div>
        </div>
        <div class="status-details">
          {#if data.dbHealth.status === 'connected'}
            <p>Connected successfully</p>
            <small>Last check: {formatDate(data.dbHealth.timestamp || new Date().toISOString())}</small>
          {:else}
            <p>Connection error</p>
            <small class="error-text">{data.dbHealth.error}</small>
          {/if}
        </div>
      </div>

      <div class="status-card">
        <div class="status-header">
          <h3>Node.js</h3>
          <div class="status-indicator connected">🟢</div>
        </div>
        <div class="status-details">
          <p>Version: {data.systemInfo.nodeVersion}</p>
          <p>Platform: {data.systemInfo.platform}</p>
          <p>Environment: {data.systemInfo.environment}</p>
        </div>
      </div>

      <div class="status-card">
        <div class="status-header">
          <h3>Memory Usage</h3>
          <div class="status-indicator connected">📊</div>
        </div>
        <div class="status-details">
          <p>RSS: {formatBytes(data.systemInfo.memoryUsage.rss)}</p>
          <p>Heap Used: {formatBytes(data.systemInfo.memoryUsage.heapUsed)}</p>
          <p>Heap Total: {formatBytes(data.systemInfo.memoryUsage.heapTotal)}</p>
        </div>
      </div>

      <div class="status-card">
        <div class="status-header">
          <h3>Uptime</h3>
          <div class="status-indicator connected">⏱️</div>
        </div>
        <div class="status-details">
          <p class="uptime-value">{formatUptime(data.systemInfo.uptime)}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Database Info -->
  <div class="db-section">
    <h2>Database Statistics</h2>
    <div class="db-stats">
      <div class="db-stat">
        <span class="stat-label">SCAD Files:</span>
        <span class="stat-value">{data.tableStats.scads}</span>
      </div>
      <div class="db-stat">
        <span class="stat-label">Users:</span>
        <span class="stat-value">{data.tableStats.users}</span>
      </div>
      <div class="db-stat">
        <span class="stat-label">Photos:</span>
        <span class="stat-value">{data.tableStats.photos}</span>
      </div>
      <div class="db-stat">
        <span class="stat-label">Ratings:</span>
        <span class="stat-value">{data.tableStats.ratings}</span>
      </div>
    </div>
  </div>

  <!-- Development Tools -->
  <div class="tools-section">
    <h2>Development Tools</h2>
    <div class="tools-grid">
      <form method="POST" action="?/seed" use:enhance>
        <div class="seed-form">
          <label for="count">Number of SCADs:</label>
          <input type="number" id="count" name="count" bind:value={seedCount} min="1" max="100" />
        </div>
        <button type="submit" class="tool-btn primary">
          🌱 Seed Sample Data
        </button>
        <p class="tool-desc">Generate sample SCAD files with 3D models for testing</p>
      </form>

      <form method="POST" action="?/testFirebase" use:enhance>
        <button type="submit" class="tool-btn secondary">
          🔥 Test Firebase Storage
        </button>
        <p class="tool-desc">Verify Firebase Storage connection and GLB generation</p>
      </form>

    </div>
  </div>

  <!-- Recent Activity -->
  <div class="activity-section">
    <div class="activity-grid">
      <div class="activity-panel">
        <h3>Recent SCAD Files</h3>
        <div class="activity-list">
          {#each data.recentActivity.scads as scad (scad.id)}
            <div class="activity-item">
              <span class="activity-title">{scad.title}</span>
              <span class="activity-time">{formatDate(scad.createdAt || new Date())}</span>
              <button 
                class="copy-btn" 
                on:click={() => copyToClipboard(scad.id)}
                title="Copy ID"
              >
                📋
              </button>
            </div>
          {/each}
          {#if data.recentActivity.scads.length === 0}
            <p class="empty-message">No recent SCAD files</p>
          {/if}
        </div>
      </div>

      <div class="activity-panel">
        <h3>Recent Users</h3>
        <div class="activity-list">
          {#each data.recentActivity.users as user (user.id)}
            <div class="activity-item">
              <span class="activity-title">{user.username}</span>
              <span class="activity-time">{formatDate(user.createdAt || new Date())}</span>
              <button 
                class="copy-btn" 
                on:click={() => copyToClipboard(user.id)}
                title="Copy ID"
              >
                📋
              </button>
            </div>
          {/each}
          {#if data.recentActivity.users.length === 0}
            <p class="empty-message">No recent users</p>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Quick Links -->
  <div class="links-section">
    <h2>Quick Links</h2>
    <div class="links-grid">
      <a href="/" class="link-card">
        🏠 Home Page
      </a>
      <a href="/admin" class="link-card">
        🛠️ Admin Dashboard
      </a>
      <a href="/reports" class="link-card">
        📊 Analytics Reports
      </a>
    </div>
  </div>

  <!-- Environment Variables (filtered for security) -->
  <div class="env-section">
    <h2>Environment Info</h2>
    <div class="env-grid">
      <div class="env-item">
        <span class="env-key">NODE_ENV:</span>
        <span class="env-value">{data.systemInfo.environment}</span>
      </div>
      <div class="env-item">
        <span class="env-key">Platform:</span>
        <span class="env-value">{data.systemInfo.platform}</span>
      </div>
      <div class="env-item">
        <span class="env-key">Node Version:</span>
        <span class="env-value">{data.systemInfo.nodeVersion}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .dev-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  }

  .dev-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .dev-header h1 {
    color: #333;
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #666;
    font-size: 1.1rem;
    margin: 0;
  }

  .alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    font-weight: 500;
  }

  .alert.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .alert.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .response-text {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    font-family: monospace;
  }

  .status-section, .db-section, .tools-section, .activity-section, .links-section, .env-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e5e9;
  }

  .status-section h2, .db-section h2, .tools-section h2, .links-section h2, .env-section h2 {
    color: #333;
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .status-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e1e5e9;
  }

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .status-header h3 {
    margin: 0;
    color: #333;
    font-size: 1.1rem;
  }

  .status-indicator {
    font-size: 1.2rem;
  }

  .status-details p {
    margin: 0.5rem 0;
    color: #555;
    font-size: 0.9rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .status-details small {
    color: #666;
    font-size: 0.8rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    display: block;
  }

  .error-text {
    color: #dc3545;
    font-size: 0.75rem;
    line-height: 1.2;
    max-width: 100%;
    word-break: break-all;
  }

  .uptime-value {
    font-size: 1.2rem;
    font-weight: 600;
    color: #28a745;
  }

  .db-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .db-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 6px;
  }

  .stat-label {
    color: #666;
    font-weight: 500;
  }

  .stat-value {
    color: #28a745;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .tools-grid form {
    text-align: center;
  }

  .seed-form {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .seed-form label {
    color: #666;
    font-size: 0.9rem;
  }

  .seed-form input {
    width: 70px;
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: monospace;
  }

  .tool-btn {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 0.5rem;
  }

  .tool-btn.primary {
    background: #28a745;
    color: white;
  }

  .tool-btn.primary:hover {
    background: #218838;
  }

  .tool-btn.secondary {
    background: #007bff;
    color: white;
  }

  .tool-btn.secondary:hover {
    background: #0056b3;
  }

  .tool-btn.warning {
    background: #ffc107;
    color: #333;
  }

  .tool-btn.warning:hover {
    background: #e0a800;
  }

  .tool-btn.danger {
    background: #dc3545;
    color: white;
  }

  .tool-btn.danger:hover {
    background: #c82333;
  }

  .tool-desc {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .activity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }

  .activity-panel h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
  }

  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .activity-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #28a745;
  }

  .activity-title {
    font-weight: 500;
    color: #333;
    flex: 1;
  }

  .activity-time {
    color: #666;
    font-size: 0.8rem;
    margin-left: 1rem;
  }

  .copy-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    margin-left: 0.5rem;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .copy-btn:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .empty-message {
    color: #666;
    text-align: center;
    padding: 1rem;
    font-style: italic;
  }

  .links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .link-card {
    display: block;
    padding: 1.5rem;
    background: #f8f9fa;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    text-decoration: none;
    color: #333;
    text-align: center;
    font-weight: 500;
    transition: all 0.2s;
  }

  .link-card:hover {
    background: #e9ecef;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .env-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .env-item {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #6c757d;
  }

  .env-key {
    font-weight: 500;
    color: #555;
  }

  .env-value {
    color: #333;
    font-family: monospace;
  }

  @media (max-width: 768px) {
    .dev-container {
      padding: 1rem;
    }

    .dev-header h1 {
      font-size: 2rem;
    }

    .status-grid, .tools-grid, .activity-grid, .links-grid, .env-grid {
      grid-template-columns: 1fr;
    }

    .db-stats {
      grid-template-columns: 1fr 1fr;
    }

    .seed-form {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
</style>