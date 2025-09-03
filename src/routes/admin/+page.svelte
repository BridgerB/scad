<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import type { ActionResult } from '@sveltejs/kit';
  
  export let data: PageData;
  export let form: any;
  
  let selectedScads: string[] = [];
  let showBulkActions = false;
  let editingScad: string | null = null;
  let editTitle = '';
  let isBackupLoading = false;
  let backupError: string | null = null;
  
  $: showBulkActions = selectedScads.length > 0;
  
  function toggleScadSelection(scadId: string) {
    if (selectedScads.includes(scadId)) {
      selectedScads = selectedScads.filter(id => id !== scadId);
    } else {
      selectedScads = [...selectedScads, scadId];
    }
  }
  
  function toggleSelectAll() {
    if (selectedScads.length === data.scads.length) {
      selectedScads = [];
    } else {
      selectedScads = data.scads.map(scad => scad.id);
    }
  }
  
  function startEditTitle(scadId: string, currentTitle: string) {
    editingScad = scadId;
    editTitle = currentTitle;
  }
  
  function cancelEdit() {
    editingScad = null;
    editTitle = '';
  }
  
  function handleEditSubmit() {
    return async ({ result, update }) => {
      if (result.type === 'success') {
        // Reset edit mode on successful update
        editingScad = null;
        editTitle = '';
        // Refresh the page data to show updated title
        await update();
      }
    };
  }
  
  function formatDate(dateInput: string | Date) {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  function confirmDelete(scadTitle: string) {
    return confirm(`Are you sure you want to delete "${scadTitle}"? This action cannot be undone.`);
  }
  
  function confirmBulkDelete(count: number) {
    return confirm(`Are you sure you want to delete ${count} selected SCAD file${count > 1 ? 's' : ''}?`);
  }
  
  function confirmClearRatings() {
    return confirm('Are you sure you want to clear ALL SCAD ratings? This action cannot be undone!');
  }

  function confirmDeleteUser(username: string) {
    return confirm(`Are you sure you want to delete user "${username}" and ALL their SCAD files? This action cannot be undone!`);
  }
  
  function downloadBase64File(base64Data: string, filename: string, type: string) {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  function handleBackup() {
    isBackupLoading = true;
    backupError = null;

    return async ({ result }: { result: ActionResult }) => {
      isBackupLoading = false;

      if (result.type === 'failure') {
        backupError = 'Failed to create backup';
        return;
      }

      if (result.type === 'success' && result.data) {
        const data = result.data as {
          success: boolean;
          file: string;
          filename: string;
          type: string;
        };
        if (data.success) {
          downloadBase64File(data.file, data.filename, data.type);
        }
      }
    };
  }
</script>

<div class="admin-container">
  <div class="admin-header">
    <h1>🛠️ SCAD Admin Dashboard</h1>
    <p class="subtitle">Manage your OpenSCAD file sharing platform</p>
  </div>

  <!-- Success/Error Messages -->
  {#if form?.success}
    <div class="alert success">
      ✅ {form.message}
    </div>
  {/if}
  
  {#if form?.error}
    <div class="alert error">
      ❌ {form.error}
    </div>
  {/if}

  <!-- System Overview -->
  <div class="stats-section">
    <h2>System Overview</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{data.stats.totalScads}</div>
        <div class="stat-label">Total SCAD Files</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{data.stats.totalUsers}</div>
        <div class="stat-label">Total Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{data.stats.totalDownloads}</div>
        <div class="stat-label">Total Downloads</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{data.stats.scadsWithModels}</div>
        <div class="stat-label">Files with 3D Models</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{data.stats.totalPhotos}</div>
        <div class="stat-label">Total Photos</div>
      </div>
    </div>
  </div>

  <!-- SCAD File Management -->
  <div class="management-section">
    <div class="section-header">
      <h2>SCAD File Management</h2>
      <div class="header-actions">
        {#if showBulkActions}
          <form method="POST" action="?/bulkDelete" use:enhance class="bulk-form">
            {#each selectedScads as scadId}
              <input type="hidden" name="selectedScads" value={scadId} />
            {/each}
            <button type="submit" class="btn danger" 
                    on:click={(e) => { if (!confirmBulkDelete(selectedScads.length)) e.preventDefault(); }}>
              🗑️ Delete Selected ({selectedScads.length})
            </button>
          </form>
        {/if}
      </div>
    </div>

    <div class="scad-table-container">
      <table class="scad-table">
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox" 
                checked={selectedScads.length === data.scads.length && data.scads.length > 0}
                on:change={toggleSelectAll}
              />
            </th>
            <th>Title</th>
            <th>Author</th>
            <th>Downloads</th>
            <th>Size</th>
            <th>3D Model</th>
            <th>Public</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.scads as scad (scad.id)}
            <tr>
              <td>
                <input 
                  type="checkbox" 
                  checked={selectedScads.includes(scad.id)}
                  on:change={() => toggleScadSelection(scad.id)}
                />
              </td>
              <td class="title-cell">
                {#if editingScad === scad.id}
                  <form method="POST" action="?/editScadTitle" use:enhance={handleEditSubmit} class="edit-form">
                    <input type="hidden" name="scadId" value={scad.id} />
                    <input 
                      type="text" 
                      name="title" 
                      bind:value={editTitle}
                      class="edit-input"
                      maxlength="200"
                      required
                    />
                    <div class="edit-actions">
                      <button type="submit" class="btn small primary">💾 Save</button>
                      <button type="button" class="btn small secondary" on:click={cancelEdit}>❌ Cancel</button>
                    </div>
                  </form>
                {:else}
                  <span class="scad-title">{scad.title}</span>
                  {#if scad.description}
                    <small class="scad-description">{scad.description.slice(0, 50)}...</small>
                  {/if}
                {/if}
              </td>
              <td>{scad.username}</td>
              <td>{scad.downloadCount || 0}</td>
              <td>{scad.fileSize ? formatFileSize(scad.fileSize) : 'N/A'}</td>
              <td>
                {#if scad.glbUrl}
                  <span class="has-model">✅ Yes</span>
                {:else}
                  <span class="no-model">❌ No</span>
                {/if}
              </td>
              <td>
                <form method="POST" action="?/togglePublic" use:enhance class="inline-form">
                  <input type="hidden" name="scadId" value={scad.id} />
                  <input type="hidden" name="isPublic" value={scad.isPublic} />
                  <button 
                    type="submit" 
                    class="toggle-btn {scad.isPublic ? 'public' : 'private'}"
                  >
                    {scad.isPublic ? '🌐 Public' : '🔒 Private'}
                  </button>
                </form>
              </td>
              <td class="date-cell">{formatDate(scad.createdAt)}</td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <a href="/{scad.id}" class="btn small secondary">👁️ View</a>
                  <button 
                    type="button" 
                    class="btn small primary"
                    on:click={() => startEditTitle(scad.id, scad.title)}
                  >
                    ✏️ Edit
                  </button>
                  <form method="POST" action="?/deleteScad" use:enhance class="inline-form">
                    <input type="hidden" name="scadId" value={scad.id} />
                    <button 
                      type="submit" 
                      class="btn small danger"
                      on:click={(e) => { if (!confirmDelete(scad.title)) e.preventDefault(); }}
                    >
                      🗑️ Delete
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if data.scads.length === 0}
        <div class="empty-state">
          <p>No SCAD files found.</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Active Users -->
  <div class="users-section">
    <h2>Most Active Contributors</h2>
    <div class="users-table">
      {#each data.activeUsers as user (user.userId)}
        <div class="user-item">
          <div class="user-info">
            <span class="user-name">{user.username}</span>
            <span class="user-email">{user.email}</span>
            <span class="user-stats">{user.scadCount} files • {user.totalDownloads} downloads</span>
          </div>
          <div class="user-actions">
            <form method="POST" action="?/deleteUser" use:enhance class="inline-form">
              <input type="hidden" name="userId" value={user.userId} />
              <button 
                type="submit" 
                class="btn small danger"
                on:click={(e) => { if (!confirmDeleteUser(user.username)) e.preventDefault(); }}
              >
                🗑️ Delete User
              </button>
            </form>
          </div>
        </div>
      {/each}
      
      {#if data.activeUsers.length === 0}
        <div class="empty-users">
          <p>No active users found.</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Most Downloaded -->
  <div class="popular-section">
    <h2>Most Downloaded Files</h2>
    <div class="popular-list">
      {#each data.mostDownloaded as scad (scad.id)}
        <a href="/{scad.id}" class="popular-item popular-link">
          <div class="popular-content">
            <span class="popular-title">📁 {scad.title}</span>
            <span class="popular-author">by {scad.username}</span>
          </div>
          <div class="popular-downloads">{scad.downloadCount} downloads</div>
        </a>
      {/each}
      
      {#if data.mostDownloaded.length === 0}
        <div class="empty-popular">
          <p>No download data available.</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Database Backup -->
  <div class="backup-section">
    <h2>💾 Database Backup</h2>
    <div class="backup-content">
      <p class="backup-description">
        Download a complete backup of all SCAD data including files, users, photos, and ratings as CSV files in a ZIP archive.
      </p>
      
      <form method="POST" action="?/backup" use:enhance={handleBackup} class="backup-form">
        <button type="submit" disabled={isBackupLoading} class="btn primary backup-button">
          {#if isBackupLoading}
            📦 Creating Backup...
          {:else}
            💾 Download Database Backup
          {/if}
        </button>
      </form>

      {#if backupError}
        <div class="error-message">
          ❌ Error: {backupError}
        </div>
      {/if}
    </div>
  </div>

  <!-- System Maintenance -->
  <div class="maintenance-section">
    <h2>⚠️ System Maintenance</h2>
    <div class="maintenance-actions">
      <form method="POST" action="?/clearAllRatings" use:enhance>
        <button 
          type="submit" 
          class="btn danger"
          on:click={(e) => { if (!confirmClearRatings()) e.preventDefault(); }}
        >
          🧹 Clear All SCAD Ratings
        </button>
      </form>
      <p class="maintenance-note">
        ⚠️ Use with caution! This will permanently delete all SCAD rating data.
      </p>
    </div>
  </div>
</div>

<style>
  .admin-container {
    max-width: 1600px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .admin-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .admin-header h1 {
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

  .stats-section, .management-section, .users-section, .popular-section, .backup-section, .maintenance-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .stats-section h2, .management-section h2, .users-section h2, .popular-section h2, .backup-section h2, .maintenance-section h2 {
    color: #333;
    margin-top: 0;
    margin-bottom: 1.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .stat-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    border: 1px solid #e1e5e9;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #28a745;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    color: #666;
    font-size: 1rem;
    font-weight: 500;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .scad-table-container {
    overflow-x: auto;
  }

  .scad-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    font-size: 0.9rem;
  }

  .scad-table th, .scad-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e1e5e9;
  }

  .scad-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #333;
  }

  .title-cell {
    max-width: 250px;
  }

  .scad-title {
    font-weight: 500;
    color: #333;
    display: block;
  }

  .scad-description {
    color: #666;
    font-size: 0.8rem;
  }

  .date-cell {
    white-space: nowrap;
    color: #666;
    font-size: 0.8rem;
  }

  .actions-cell {
    white-space: nowrap;
  }

  .action-buttons {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    transition: all 0.2s;
  }

  .btn.small {
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
  }

  .btn.primary {
    background: #007bff;
    color: white;
  }

  .btn.primary:hover {
    background: #0056b3;
  }

  .btn.secondary {
    background: #6c757d;
    color: white;
  }

  .btn.secondary:hover {
    background: #545b62;
  }

  .btn.danger {
    background: #dc3545;
    color: white;
  }

  .btn.danger:hover {
    background: #c82333;
  }

  .toggle-btn {
    padding: 0.25rem 0.5rem;
    border: none;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn.public {
    background: #28a745;
    color: white;
  }

  .toggle-btn.private {
    background: #6c757d;
    color: white;
  }

  .has-model {
    color: #28a745;
    font-weight: 500;
  }

  .no-model {
    color: #dc3545;
    font-weight: 500;
  }

  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .edit-input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }

  .inline-form {
    display: inline;
  }

  .bulk-form {
    display: inline;
  }

  .users-table {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .user-name {
    font-weight: 500;
    color: #333;
  }

  .user-email {
    color: #666;
    font-size: 0.9rem;
  }

  .user-stats {
    color: #007bff;
    font-size: 0.8rem;
  }

  .popular-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .popular-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #28a745;
  }

  .popular-link {
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
  }

  .popular-link:hover {
    background: #e9ecef;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .popular-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .popular-title {
    font-weight: 500;
    color: #333;
  }

  .popular-author {
    color: #666;
    font-size: 0.9rem;
  }

  .popular-downloads {
    color: #28a745;
    font-weight: 600;
  }

  .maintenance-actions {
    text-align: center;
  }

  .maintenance-note {
    margin-top: 1rem;
    color: #666;
    font-size: 0.9rem;
  }

  /* Backup Section */
  .backup-content {
    text-align: center;
  }

  .backup-description {
    color: #666;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .backup-form {
    margin-bottom: 1rem;
  }

  .backup-button {
    min-width: 200px;
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
  }

  .error-message {
    background-color: #f8d7da;
    color: #721c24;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-top: 0.75rem;
    font-size: 0.875rem;
    border: 1px solid #f5c6cb;
  }

  .empty-state, .empty-users, .empty-popular {
    text-align: center;
    color: #666;
    padding: 2rem;
  }

  @media (max-width: 1200px) {
    .scad-table {
      font-size: 0.8rem;
    }

    .scad-table th, .scad-table td {
      padding: 0.5rem;
    }
  }

  @media (max-width: 768px) {
    .admin-container {
      padding: 1rem;
    }

    .admin-header h1 {
      font-size: 2rem;
    }

    .stats-grid {
      grid-template-columns: 1fr 1fr;
    }

    .section-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .action-buttons {
      flex-direction: column;
    }

    .user-item {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }

    .popular-item {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }
  }
</style>