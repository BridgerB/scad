<script>
	import { enhance } from '$app/forms';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import ScadEditor from '$lib/components/ScadEditor.svelte';

	export let form;
	export let data;

	let title = '';
	let description = '';
	let tags = '';
	let username = '';
	let isSubmitting = false;

	// Multi-file project state (bound to ScadEditor).
	let files = data?.project?.files ?? [{ path: 'main.scad', content: '' }];
	let entryPath = data?.project?.entryPath ?? 'main.scad';

	let modelViewer;
	let isUpdating = false;
	let modelError = false;
	let currentPreviewBlob = null;
	let previewTimer;

	$: entryText = files.find((f) => f.path === entryPath)?.content ?? '';
	$: projectJson = JSON.stringify({ files, entryPath });

	onMount(async () => {
		if (browser) await import('@google/model-viewer');
	});

	onDestroy(() => {
		if (currentPreviewBlob) URL.revokeObjectURL(currentPreviewBlob);
		clearTimeout(previewTimer);
	});

	// Debounced live preview when the project changes (edits, add/remove, entry).
	function onProjectChange() {
		clearTimeout(previewTimer);
		previewTimer = setTimeout(updateModel, 400);
	}

	async function updateModel() {
		if (isUpdating || !entryText.trim()) return;
		isUpdating = true;
		try {
			const response = await fetch('/api/preview-glb', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ files, entryPath, scadId: 'temp-create' })
			});
			const result = await response.json();
			if (result.success && result.glbData) {
				const binaryString = atob(result.glbData.replace(/\s/g, ''));
				const buf = new Uint8Array(binaryString.length);
				for (let i = 0; i < binaryString.length; i++) buf[i] = binaryString.charCodeAt(i);
				if (currentPreviewBlob) URL.revokeObjectURL(currentPreviewBlob);
				currentPreviewBlob = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
				modelError = false;
				if (modelViewer) modelViewer.src = currentPreviewBlob;
			} else {
				console.error('Preview failed:', result.error);
				modelError = true;
			}
		} catch (error) {
			console.error('Preview error:', error);
			modelError = true;
		} finally {
			isUpdating = false;
		}
	}

	function handleModelError() {
		modelError = true;
	}

	function handleSubmit() {
		isSubmitting = true;
		return async ({ update }) => {
			isSubmitting = false;
			update();
		};
	}
</script>

<svelte:head>
	<title>Create New SCAD File - OpenSCAD Files</title>
</svelte:head>

<div class="container">
	<div class="header">
		<a href="/" class="back-link">← Back to Home</a>
		<h1>Create New SCAD File</h1>
	</div>

	<form method="POST" action="?/create" use:enhance={handleSubmit} class="create-form">
		<div class="form-layout">
			<!-- Form Fields Panel -->
			<div class="form-panel">
				<div class="form-group">
					<label for="title">Title *</label>
					<input type="text" id="title" name="title" bind:value={title} required
						placeholder="Enter a title for your SCAD file" />
					{#if form?.errors?.title}<div class="error">{form.errors.title}</div>{/if}
				</div>

				<div class="form-group">
					<label for="username">Your Name *</label>
					<input type="text" id="username" name="username" bind:value={username} required
						placeholder="Enter your name" />
					{#if form?.errors?.username}<div class="error">{form.errors.username}</div>{/if}
				</div>

				<div class="form-group">
					<label for="description">Description</label>
					<textarea id="description" name="description" bind:value={description} rows="3"
						placeholder="Describe your SCAD file (optional)"></textarea>
					{#if form?.errors?.description}<div class="error">{form.errors.description}</div>{/if}
				</div>

				<div class="form-group">
					<label for="tags">Tags</label>
					<input type="text" id="tags" name="tags" bind:value={tags}
						placeholder="Enter tags separated by commas" />
					<div class="help-text">Separate multiple tags with commas</div>
				</div>

				<div class="form-group">
					<label>OpenSCAD Project *</label>
					<ScadEditor bind:files bind:entryPath on:change={onProjectChange} />
					<input type="hidden" name="project" value={projectJson} />
					<div class="help-text">The file marked ● is the render entry point. Add files for includes.</div>
					{#if form?.errors?.content}<div class="error">{form.errors.content}</div>{/if}
				</div>

				<div class="form-actions">
					<button type="submit" disabled={isSubmitting || !title.trim() || !username.trim() || !entryText.trim()}>
						{isSubmitting ? 'Creating...' : 'Create SCAD File'}
					</button>
				</div>

				{#if form?.message}<div class="success">{form.message}</div>{/if}
				{#if form?.error}<div class="error">{form.error}</div>{/if}
			</div>

			<!-- Preview Panel -->
			<div class="preview-panel">
				<div class="model-container">
					{#if isUpdating}<div class="status-overlay updating">Updating...</div>{/if}
					{#if browser}
						<model-viewer
							bind:this={modelViewer}
							alt="OpenSCAD 3D Model Preview"
							src="{modelError ? '/models/error/error.glb' : (currentPreviewBlob || data?.initialPreview || '/models/cylinder.glb')}"
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
		</div>
	</form>
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

	.back-link:hover { text-decoration: underline; }

	.header h1 {
		margin: 0.5rem 0 2rem 0;
		color: #333;
	}

	.form-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		min-height: 80vh;
	}

	.form-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 0;
		overflow: hidden;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.form-group input,
	.form-group textarea {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: #007acc;
		box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
	}

	.help-text {
		font-size: 0.9rem;
		color: #666;
		margin-top: 0.25rem;
	}

	.error {
		color: #dc3545;
		font-size: 0.9rem;
		margin-top: 0.25rem;
	}

	.success {
		color: #28a745;
		font-size: 0.9rem;
		margin-top: 0.25rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.form-actions button {
		background: #28a745;
		color: white;
		border: none;
		padding: 0.75rem 2rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: background 0.2s;
	}

	.form-actions button:hover:not(:disabled) { background: #218838; }
	.form-actions button:disabled { background: #6c757d; cursor: not-allowed; }

	.preview-panel {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.model-container {
		flex: 1;
		background: #f5f5f5;
		position: relative;
		min-height: 500px;
		max-height: 70vh;
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

	.status-overlay.updating {
		background: rgba(0, 122, 204, 0.1);
		border: 1px solid #007acc;
		color: #007acc;
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
		color: #666;
	}

	@media (max-width: 1024px) {
		.form-layout {
			grid-template-columns: 1fr;
			gap: 1rem;
		}
		.model-container {
			min-height: 300px;
			max-height: none;
		}
	}

	@media (max-width: 768px) {
		.container { padding: 0.5rem; }
	}
</style>
