<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import ScadEditor from '$lib/components/ScadEditor.svelte';

	export let data;

	let modelViewer;
	// Multi-file project state (bound to ScadEditor).
	let files = data.project?.files ?? [{ path: 'main.scad', content: data.scad.content ?? '' }];
	let entryPath = data.project?.entryPath ?? 'main.scad';

	let isUpdating = false;
	let isSaving = false;
	let modelError = false;
	let useFirebaseModel = true; // Start with the saved Firebase model on load
	let currentPreviewBlob = null;
	let previewTimer;

	onMount(async () => {
		if (browser) await import('@google/model-viewer');
	});

	onDestroy(() => {
		if (currentPreviewBlob) URL.revokeObjectURL(currentPreviewBlob);
		clearTimeout(previewTimer);
	});

	$: computedModelSrc = modelError
		? '/models/error/error.glb'
		: (useFirebaseModel && data.scad.glbUrl
			? getGlbProxyUrl(data.scad.glbUrl)
			: currentPreviewBlob || (data.scad.glbUrl ? getGlbProxyUrl(data.scad.glbUrl) : ''));

	// Debounced live preview when the project changes.
	function onProjectChange() {
		clearTimeout(previewTimer);
		previewTimer = setTimeout(updateModel, 400);
	}

	async function updateModel() {
		if (isUpdating) return;
		const entryText = files.find((f) => f.path === entryPath)?.content ?? '';
		if (!entryText.trim()) return;
		isUpdating = true;
		try {
			const response = await fetch('/api/preview-glb', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ files, entryPath, scadId: data.scad.id })
			});
			const result = await response.json();
			if (result.success && result.glbData) {
				const binaryString = atob(result.glbData.replace(/\s/g, ''));
				const buf = new Uint8Array(binaryString.length);
				for (let i = 0; i < binaryString.length; i++) buf[i] = binaryString.charCodeAt(i);
				if (currentPreviewBlob) URL.revokeObjectURL(currentPreviewBlob);
				currentPreviewBlob = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
				useFirebaseModel = false;
				modelError = false;
			} else {
				modelError = true;
			}
		} catch (error) {
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
		// Download the entry file's source.
		const entryText = files.find((f) => f.path === entryPath)?.content ?? data.scad.content;
		const blob = new Blob([entryText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${data.scad.title.replace(/[^a-zA-Z0-9]/g, '_')}.scad`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function downloadGlb() {
		const glbSource = currentPreviewBlob || (data.scad.glbUrl ? getGlbProxyUrl(data.scad.glbUrl) : null);
		if (glbSource) {
			const a = document.createElement('a');
			a.href = glbSource;
			a.download = `${data.scad.title.replace(/[^a-zA-Z0-9]/g, '_')}.glb`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} else {
			alert('No 3D model available for download. Try generating a preview first.');
		}
	}

	function getGlbProxyUrl(glbUrl) {
		if (!glbUrl) return null;
		const match = glbUrl.match(/scads\/([^\.]+)\.glb/);
		return match ? `/api/glb/${match[1]}` : null;
	}

	function handleModelError() {
		if (useFirebaseModel && data.scad.glbUrl) {
			useFirebaseModel = false;
		} else {
			modelError = true;
		}
	}

	async function saveScad() {
		if (isSaving) return;
		isSaving = true;
		try {
			const formData = new FormData();
			formData.append('project', JSON.stringify({ files, entryPath }));
			formData.append('scadId', data.scad.id);

			const response = await fetch('?/saveScad', { method: 'POST', body: formData });
			const result = await response.json();

			// SvelteKit action responses are wrapped; handle both shapes.
			const ok = result.type === 'success' || result.status === 200;
			if (ok) {
				alert('SCAD file saved successfully!');
				data.scad.content = files.find((f) => f.path === entryPath)?.content ?? data.scad.content;
			} else {
				alert('Save failed: ' + (result.data?.error || result.error || 'Unknown error'));
			}
		} catch (error) {
			alert('Save failed: ' + error.message);
		} finally {
			isSaving = false;
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

	<div class="editor-viewer-layout">
		<div class="viewer-panel">
			<div class="model-container">
				{#if isUpdating}<div class="status-overlay updating">Updating...</div>{/if}
				{#if browser}
					<model-viewer
						bind:this={modelViewer}
						alt="OpenSCAD 3D Model Preview"
						src="{computedModelSrc}"
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
				{:else}
					<div class="loading">Loading 3D viewer...</div>
				{/if}
			</div>
		</div>

		<div class="editor-panel">
			<ScadEditor bind:files bind:entryPath on:change={onProjectChange} />

			<div class="editor-footer">
				<button on:click={saveScad} class="save-btn" disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Changes'}
				</button>
				<button on:click={downloadScad} class="download-btn">Download .scad file</button>
				<button on:click={downloadGlb} class="download-btn">Download .glb file</button>
			</div>
		</div>
	</div>

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
				<div class="stat"><span class="stat-label">Downloads:</span><span class="stat-value">{data.scad.downloadCount}</span></div>
				<div class="stat"><span class="stat-label">File Size:</span><span class="stat-value">{formatFileSize(data.scad.fileSize)}</span></div>
				<div class="stat"><span class="stat-label">Likes:</span><span class="stat-value">{data.stats.likes}</span></div>
				<div class="stat"><span class="stat-label">Dislikes:</span><span class="stat-value">{data.stats.dislikes}</span></div>
			</div>
		</div>
	</div>
</div>

<style>
	.container { max-width: 1400px; margin: 0 auto; padding: 1rem; }
	.back-link { color: #007acc; text-decoration: none; margin-bottom: 1rem; display: inline-block; }
	.back-link:hover { text-decoration: underline; }
	.header h1 { margin: 0.5rem 0; color: #333; }
	.meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; }
	.meta span { margin: 0 0.5rem; }
	.meta span:first-child { margin-left: 0; }

	.editor-viewer-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 2rem;
		min-height: 80vh;
	}
	.viewer-panel { order: 2; }
	.editor-panel { order: 1; }
	.editor-panel, .viewer-panel {
		display: flex;
		flex-direction: column;
		background: white;
		border-radius: 8px;
		border: 1px solid #ddd;
		overflow: hidden;
		min-width: 0;
	}
	.editor-footer {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f8f9fa;
		border-top: 1px solid #ddd;
	}
	.status-overlay {
		position: absolute;
		top: 10px;
		right: 10px;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.9);
		border-radius: 4px;
		font-size: 0.9rem;
		z-index: 1000;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.status-overlay.updating { background: rgba(0, 122, 204, 0.1); border: 1px solid #007acc; color: #007acc; }
	.save-btn { background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem; font-weight: 500; }
	.save-btn:hover:not(:disabled) { background: #218838; }
	.save-btn:disabled { background: #6c757d; cursor: not-allowed; }
	.download-btn { background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
	.download-btn:hover { background: #0056b3; }
	.model-container { flex: 1; background: #f5f5f5; position: relative; min-height: 500px; max-height: 70vh; }
	model-viewer { width: 100%; height: 100%; background-color: #eee; }
	.loading { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #666; background-color: #eee; }

	.bottom-section { display: flex; flex-direction: column; gap: 2rem; }
	.description-card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 2rem; }
	.description-card h2 { color: #333; margin: 0 0 1rem 0; }
	.description-card p { line-height: 1.6; color: #555; margin: 0; }
	.info-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
	.stats-card, .tags-card, .author-card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; }
	.stats-card h3, .tags-card h3, .author-card h3 { margin: 0 0 1rem 0; color: #333; }
	.stat { display: flex; justify-content: space-between; margin: 0.5rem 0; }
	.stat-label { color: #666; }
	.stat-value { font-weight: bold; color: #333; }
	.tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.tag { background: #007acc; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem; }
	.join-date { color: #666; font-size: 0.9rem; margin: 0.5rem 0 0 0; }

	@media (max-width: 1024px) {
		.editor-viewer-layout { grid-template-columns: 1fr; gap: 1rem; }
		.viewer-panel { order: 1; }
		.editor-panel { order: 2; }
		.info-cards { grid-template-columns: 1fr; }
		.model-container { max-height: none; }
	}
	@media (max-width: 768px) {
		.container { padding: 0.5rem; }
		.editor-footer { flex-direction: column; gap: 0.5rem; padding: 0.75rem; }
		.model-container { min-height: 400px; }
	}
</style>
