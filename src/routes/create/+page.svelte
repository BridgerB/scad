<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	export let form;

	let title = '';
	let description = '';
	let content = `// 1. Sphere
sphere(10);

// 2. Cube
// cube(15);

// 3. Cylinder
// cylinder(h=20, r=8);

// 4. Cone (cylinder with different top/bottom radii)
// cylinder(h=15, r1=10, r2=0);

// 5. Rounded cube
// minkowski() {
//     cube([20, 20, 20]);
//     sphere(2);
// }`;
	let tags = '';
	let username = '';
	let isSubmitting = false;
	let modelViewer;
	let hasPreview = false;
	let isGeneratingPreview = false;
	let lastPreviewContent = '';
	let editorView;
	let editorContainer;

	onMount(async () => {
		if (browser) {
			await import('@google/model-viewer');
			await setupCodeMirror();
		}
	});

	async function setupCodeMirror() {
		const { EditorView, basicSetup } = await import('codemirror');
		const { EditorState } = await import('@codemirror/state');
		const { oneDark } = await import('@codemirror/theme-one-dark');
		const { cpp } = await import('@codemirror/lang-cpp');

		const startState = EditorState.create({
			doc: content,
			extensions: [
				basicSetup,
				oneDark,
				cpp(), // Use C++ syntax highlighting for OpenSCAD
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						content = update.state.doc.toString();
					}
				})
			]
		});

		editorView = new EditorView({
			state: startState,
			parent: editorContainer
		});
	}

	// Generate preview when content changes (with debounce)
	let previewTimeout;
	$: if (content !== lastPreviewContent && content.trim()) {
		clearTimeout(previewTimeout);
		previewTimeout = setTimeout(() => {
			generatePreview();
		}, 1000); // 1 second debounce
	}

	async function generatePreview() {
		if (isGeneratingPreview || !content.trim()) return;
		
		isGeneratingPreview = true;
		try {
			const formData = new FormData();
			formData.append('scadContent', content);
			
			const response = await fetch('?/preview', {
				method: 'POST',
				body: formData
			});
			
			const result = await response.json();
			
			if (result.type === 'success') {
				// Force reload the model viewer
				if (modelViewer) {
					modelViewer.src = `/models/previews/temp.glb?t=${Date.now()}`;
				}
				hasPreview = true;
				lastPreviewContent = content;
			} else {
				console.error('Preview generation failed:', result.data?.error);
				hasPreview = false;
			}
		} catch (error) {
			console.error('Preview error:', error);
			hasPreview = false;
		} finally {
			isGeneratingPreview = false;
		}
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
					<input
						type="text"
						id="title"
						name="title"
						bind:value={title}
						required
						placeholder="Enter a title for your SCAD file"
					/>
					{#if form?.errors?.title}
						<div class="error">{form.errors.title}</div>
					{/if}
				</div>

				<div class="form-group">
					<label for="username">Your Name *</label>
					<input
						type="text"
						id="username"
						name="username"
						bind:value={username}
						required
						placeholder="Enter your name"
					/>
					{#if form?.errors?.username}
						<div class="error">{form.errors.username}</div>
					{/if}
				</div>

				<div class="form-group">
					<label for="description">Description</label>
					<textarea
						id="description"
						name="description"
						bind:value={description}
						rows="3"
						placeholder="Describe your SCAD file (optional)"
					></textarea>
					{#if form?.errors?.description}
						<div class="error">{form.errors.description}</div>
					{/if}
				</div>

				<div class="form-group">
					<label for="tags">Tags</label>
					<input
						type="text"
						id="tags"
						name="tags"
						bind:value={tags}
						placeholder="Enter tags separated by commas"
					/>
					<div class="help-text">Separate multiple tags with commas</div>
					{#if form?.errors?.tags}
						<div class="error">{form.errors.tags}</div>
					{/if}
				</div>

				<div class="form-group">
					<label for="content">OpenSCAD Code *</label>
					<div 
						bind:this={editorContainer}
						class="code-editor-container"
					></div>
					<input type="hidden" name="content" bind:value={content} required />
					{#if form?.errors?.content}
						<div class="error">{form.errors.content}</div>
					{/if}
				</div>

				<div class="form-actions">
					<button type="submit" disabled={isSubmitting || !title.trim() || !content.trim() || !username.trim()}>
						{isSubmitting ? 'Creating...' : 'Create SCAD File'}
					</button>
				</div>

				{#if form?.message}
					<div class="success">{form.message}</div>
				{/if}
				{#if form?.error}
					<div class="error">{form.error}</div>
				{/if}
			</div>

			<!-- Preview Panel -->
			<div class="preview-panel">
				<div class="preview-header">
					<h2>3D Preview</h2>
					<div class="preview-status">
						{#if isGeneratingPreview}
							<span class="status generating">Generating preview...</span>
						{:else if hasPreview}
							<span class="status ready">Preview ready</span>
						{:else}
							<span class="status">Type code to see preview</span>
						{/if}
					</div>
				</div>
				
				<div class="model-container">
					{#if browser && hasPreview}
						<model-viewer
							bind:this={modelViewer}
							alt="OpenSCAD 3D Model Preview"
							src="/models/previews/temp.glb"
							ar
							environment-image="/environments/default.hdr"
							shadow-intensity="1"
							camera-controls
							touch-action="pan-y"
							auto-rotate
							exposure="1"
							skybox-image="/environments/default.hdr"
							loading="lazy"
							on:error={() => { hasPreview = false; }}
						></model-viewer>
					{:else if browser && isGeneratingPreview}
						<div class="loading">Generating 3D preview...</div>
					{:else if browser}
						<div class="no-preview">
							<p>3D preview will appear here</p>
							<p class="hint">Start typing OpenSCAD code to see the preview</p>
						</div>
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

	.back-link:hover {
		text-decoration: underline;
	}

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

	.code-editor-container {
		border: 1px solid #ddd;
		border-radius: 4px;
		overflow: hidden;
		min-height: 400px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.code-editor-container :global(.cm-editor) {
		min-height: 400px;
		font-size: 14px;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.code-editor-container :global(.cm-focused) {
		outline: none;
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

	.form-actions button:hover:not(:disabled) {
		background: #218838;
	}

	.form-actions button:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	/* Preview Panel */
	.preview-panel {
		background: white;
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f8f9fa;
		border-bottom: 1px solid #ddd;
	}

	.preview-header h2 {
		margin: 0;
		font-size: 1.2rem;
		color: #333;
	}

	.preview-status .status {
		font-size: 0.9rem;
		color: #666;
	}

	.preview-status .status.generating {
		color: #007acc;
	}

	.preview-status .status.ready {
		color: #28a745;
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

	.loading, .no-preview {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #666;
	}

	.no-preview p {
		margin: 0.5rem 0;
		text-align: center;
	}

	.hint {
		font-size: 0.9rem;
		color: #999;
	}

	@media (max-width: 1024px) {
		.form-layout {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.model-container {
			min-height: 300px;
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: 0.5rem;
		}
		
		.preview-header {
			flex-direction: column;
			gap: 0.5rem;
			text-align: center;
		}
	}
</style>