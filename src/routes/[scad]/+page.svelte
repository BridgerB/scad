<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let data;

	let modelViewer;
	let scadContent = data.scad.content;
	let isUpdating = false;
	let lastUpdate = '';
	let modelError = false;
	let lastProcessedContent = data.scad.content;
	let modelUpdateTime = Date.now(); // For cache busting
	let useFirebaseModel = true; // Start with Firebase model on page load
	
	onMount(async () => {
		if (browser) {
			await import('@google/model-viewer');
		}
	});

	// Reactive statement - updates model whenever scadContent changes
	$: if (scadContent !== lastProcessedContent && scadContent.trim()) {
		updateModel();
	}

	// Manual update function
	async function updateModel() {
		if (isUpdating) return;
		
		isUpdating = true;
		try {
			const formData = new FormData();
			formData.append('scadContent', scadContent);
			formData.append('scadId', data.scad.id);
			
			const response = await fetch('?/updateScad', {
				method: 'POST',
				body: formData
			});
			
			const result = await response.json();
			
			if (result.type === 'success') {
				// Force reload the model viewer by updating the cache buster
				modelUpdateTime = Date.now();
				useFirebaseModel = false; // Use local model after successful generation
				modelError = false;
				lastUpdate = new Date().toLocaleTimeString();
				// Update lastProcessedContent to current content
				lastProcessedContent = scadContent;
				
				// Force the model-viewer to reload by directly updating its src
				// Add a small delay to ensure file is fully written
				setTimeout(() => {
					if (modelViewer) {
						const newSrc = `/models/previews/${data.scad.id}.glb?t=${modelUpdateTime}`;
						console.log('Updating model-viewer src to:', newSrc);
						modelViewer.src = newSrc;
					}
				}, 100);
			} else {
				console.error('Update failed:', result.data?.error);
				alert('Update failed: ' + (result.data?.error || 'Unknown error'));
				modelError = true;
			}
		} catch (error) {
			console.error('Update error:', error);
			alert('Update failed: ' + error.message);
			modelError = true;
		} finally {
			isUpdating = false;
		}
	}

	function formatFileSize(bytes) {
		if (!bytes) return 'Unknown';
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
	}

	function formatDate(dateString) {
		return new Date(dateString).toLocaleDateString();
	}

	function downloadScad() {
		const blob = new Blob([data.scad.content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${data.scad.title.replace(/[^a-zA-Z0-9]/g, '_')}.scad`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// Extract GLB ID from Firebase Storage URL
	function getGlbProxyUrl(glbUrl) {
		if (!glbUrl) return null;
		// Extract the filename from the Firebase URL
		// URL format: https://storage.googleapis.com/.../scads/UUID.glb
		const match = glbUrl.match(/scads\/([^\.]+)\.glb/);
		if (match) {
			return `/api/glb/${match[1]}`;
		}
		return null;
	}

	// Handle model loading errors with fallback
	function handleModelError() {
		if (useFirebaseModel && data.scad.glbUrl) {
			// Firebase model failed - try local preview
			console.log('Firebase GLB failed, trying local preview...');
			useFirebaseModel = false;
		} else {
			// Both Firebase and local failed
			console.log('Both Firebase and local GLB failed');
			modelError = true;
		}
	}

	// Save to database and Firebase Storage
	async function saveScad() {
		if (isUpdating) return;
		
		isUpdating = true;
		try {
			const formData = new FormData();
			formData.append('scadContent', scadContent);
			formData.append('scadId', data.scad.id);
			
			const response = await fetch('?/saveScad', {
				method: 'POST',
				body: formData
			});
			
			const result = await response.json();
			
			if (result.type === 'success') {
				alert('SCAD file saved successfully!');
				// Update the page data to reflect the saved content
				data.scad.content = scadContent;
				lastProcessedContent = scadContent;
			} else {
				console.error('Save failed:', result.data?.error);
				alert('Save failed: ' + (result.data?.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Save error:', error);
			alert('Save failed: ' + error.message);
		} finally {
			isUpdating = false;
		}
	}
</script>

<svelte:head>
	<title>{data.scad.title} - OpenSCAD Files</title>
</svelte:head>

<div class="container">
	<div class="header">
		<a href="/" class="back-link">← Back to Home</a>
		<h1>{data.scad.title}</h1>
		<div class="meta">
			<span>by {data.scad.username}</span>
			<span>•</span>
			<span>{formatDate(data.scad.createdAt)}</span>
			<span>•</span>
			<span>{data.scad.downloadCount} downloads</span>
		</div>
	</div>

	<!-- Split Panel Layout - Top Section -->
	<div class="editor-viewer-layout">
		<!-- Code Editor Panel - Left Side -->
		<div class="editor-panel">
			<div class="editor-header">
				<h2>OpenSCAD Code</h2>
				<div class="editor-controls">
					<button on:click={saveScad} class="save-btn" disabled={isUpdating}>
						{isUpdating ? 'Saving...' : 'Save Changes'}
					</button>
					<button on:click={downloadScad} class="download-btn">
						Download .scad file
					</button>
				</div>
			</div>
			
			<textarea 
				bind:value={scadContent}
				class="code-editor"
				placeholder="Enter your OpenSCAD code here..."
				spellcheck="false"
			></textarea>
		</div>
		
		<!-- Model Viewer Panel - Right Side -->
		<div class="viewer-panel">
			<div class="viewer-header">
				<h2>3D Preview</h2>
				<div class="viewer-controls">
					{#if isUpdating}
						<span class="status updating">Updating...</span>
					{:else if lastUpdate}
						<span class="status updated">Last update: {lastUpdate}</span>
					{:else}
						<span class="status">Ready</span>
					{/if}
				</div>
			</div>
			
			<div class="model-container">
				{#if browser}
					{#if modelError}
						<div class="model-error">
							<p>3D model failed to load</p>
							<p class="error-hint">Try modifying the code to regenerate the model</p>
						</div>
					{:else}
						<model-viewer
							bind:this={modelViewer}
							alt="OpenSCAD 3D Model Preview"
							src="{useFirebaseModel && data.scad.glbUrl ? getGlbProxyUrl(data.scad.glbUrl) : `/models/previews/${data.scad.id}.glb?t=${modelUpdateTime}`}"
							ar
							environment-image="/environments/default.hdr"
							shadow-intensity="1"
							camera-controls
							touch-action="pan-y"
							auto-rotate
							exposure="1"
							skybox-image="/environments/default.hdr"
							loading="lazy"
							on:error={handleModelError}
						></model-viewer>
					{/if}
				{:else}
					<div class="loading">Loading 3D viewer...</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Bottom Section - Description and Info Cards -->
	<div class="bottom-section">
		{#if data.scad.description}
			<div class="description-card">
				<h2>Description</h2>
				<p>{data.scad.description}</p>
			</div>
		{/if}

		<div class="info-cards">
			<div class="author-card">
				<h3>Author</h3>
				<p>{data.scad.username}</p>
				<p class="join-date">Joined {formatDate(data.scad.createdAt)}</p>
			</div>

			{#if data.scad.tags.length > 0}
				<div class="tags-card">
					<h3>Tags</h3>
					<div class="tags">
						{#each data.scad.tags as tag}
							<span class="tag">{tag}</span>
						{/each}
					</div>
				</div>
			{/if}

			<div class="stats-card">
				<h3>Statistics</h3>
				<div class="stat">
					<span class="stat-label">Downloads:</span>
					<span class="stat-value">{data.scad.downloadCount}</span>
				</div>
				<div class="stat">
					<span class="stat-label">File Size:</span>
					<span class="stat-value">{formatFileSize(data.scad.fileSize)}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Likes:</span>
					<span class="stat-value">{data.stats.likes}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Dislikes:</span>
					<span class="stat-value">{data.stats.dislikes}</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
	}

	.back-link {
		color: #007acc;
		text-decoration: none;
		margin-bottom: 1rem;
		display: inline-block;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.header h1 {
		margin: 0.5rem 0;
		color: #333;
	}

	.meta {
		color: #666;
		font-size: 0.9rem;
		margin-bottom: 2rem;
	}

	.meta span {
		margin: 0 0.5rem;
	}

	.meta span:first-child {
		margin-left: 0;
	}

	/* Split Panel Layout - Top Section */
	.editor-viewer-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 2rem;
		min-height: 80vh;
	}

	.editor-panel, .viewer-panel {
		display: flex;
		flex-direction: column;
		background: white;
		border-radius: 8px;
		border: 1px solid #ddd;
		overflow: hidden;
	}

	.editor-header, .viewer-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f8f9fa;
		border-bottom: 1px solid #ddd;
		min-height: 60px;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.editor-header h2, .viewer-header h2 {
		margin: 0;
		font-size: 1.2rem;
		color: #333;
	}

	.editor-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.viewer-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.status {
		font-size: 0.9rem;
		color: #666;
	}

	.status.updating {
		color: #007acc;
	}

	.status.updated {
		color: #28a745;
	}

	.save-btn {
		background: #28a745;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: background 0.2s;
	}

	.save-btn:hover:not(:disabled) {
		background: #218838;
	}

	.save-btn:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.download-btn {
		background: #007bff;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.download-btn:hover {
		background: #0056b3;
	}

	.code-editor {
		flex: 1;
		resize: none;
		border: none;
		padding: 1rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 14px;
		line-height: 1.5;
		background: #1e1e1e;
		color: #d4d4d4;
		outline: none;
		white-space: pre;
		overflow-wrap: normal;
		overflow-x: auto;
	}

	.code-editor::placeholder {
		color: #6a9955;
	}

	.model-container {
		flex: 1;
		background: #f5f5f5;
		position: relative;
		min-height: 500px;
	}

	model-viewer {
		width: 100%;
		height: 100%;
		background-color: #eee;
	}

	.loading {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		color: #666;
		background-color: #eee;
	}

	.model-error {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
		color: #721c24;
		text-align: center;
	}

	.model-error p {
		margin: 0.5rem 0;
	}

	.error-hint {
		font-size: 0.9rem;
		color: #856404;
	}

	/* Bottom Section */
	.bottom-section {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.description-card {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 2rem;
	}

	.description-card h2 {
		color: #333;
		margin: 0 0 1rem 0;
	}

	.description-card p {
		line-height: 1.6;
		color: #555;
		margin: 0;
	}

	.info-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.stats-card, .tags-card, .author-card {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.stats-card h3, .tags-card h3, .author-card h3 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.stat {
		display: flex;
		justify-content: space-between;
		margin: 0.5rem 0;
	}

	.stat-label {
		color: #666;
	}

	.stat-value {
		font-weight: bold;
		color: #333;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		background: #007acc;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.8rem;
	}

	.join-date {
		color: #666;
		font-size: 0.9rem;
		margin: 0.5rem 0 0 0;
	}

	@media (max-width: 1024px) {
		.editor-viewer-layout {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		
		.info-cards {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: 0.5rem;
		}
		
		.editor-header, .viewer-header {
			flex-direction: column;
			gap: 0.5rem;
			padding: 0.75rem;
		}
		
		.editor-controls {
			gap: 0.5rem;
		}
		
		.model-container {
			min-height: 400px;
		}
	}
</style>