<script>
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let form;

	let title = '';
	let description = '';
	let content = `// 1. Sphere
// sphere(10);

// 2. Cube
// cube(15);

// 3. Cylinder
cylinder(h=20, r=8);

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
	let isUpdating = false;
	let lastUpdate = '';
	let modelError = false;
	let lastProcessedContent = content;
	let modelUpdateTime = Date.now(); // For cache busting
	let useFirebaseModel = false; // Start with preview generation on create page
	let editorView;
	let editorContainer;
	let currentPreviewBlob = null; // Store current preview GLB blob

	onMount(async () => {
		if (browser) {
			await import('@google/model-viewer');
			await setupCodeMirror();
		}
	});

	onDestroy(() => {
		// Clean up blob URL to prevent memory leaks
		if (currentPreviewBlob) {
			URL.revokeObjectURL(currentPreviewBlob);
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

	// Reactive statement - updates model whenever content changes
	$: if (content !== lastProcessedContent && content.trim()) {
		updateModel();
	}

	// Manual update function
	async function updateModel() {
		if (isUpdating) return;
		
		isUpdating = true;
		try {
			const response = await fetch('/api/preview-glb', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					scadContent: content,
					scadId: 'temp-create'
				})
			});
			
			const result = await response.json();
			
			if (result.success) {
				// Convert base64 GLB data to blob and create object URL
				try {
					// Debug: check the structure of the response
					console.log('Server response:', result);
					
					const glbData = result.glbData;
					if (!glbData) {
						throw new Error('No GLB data in response');
					}
					
					// Clean the base64 string and decode properly
					const cleanBase64 = glbData.replace(/\s/g, '');
					const binaryString = atob(cleanBase64);
					const glbBuffer = new Uint8Array(binaryString.length);
					for (let i = 0; i < binaryString.length; i++) {
						glbBuffer[i] = binaryString.charCodeAt(i);
					}
					
					// Clean up previous blob URL
					if (currentPreviewBlob) {
						URL.revokeObjectURL(currentPreviewBlob);
					}
					
					// Create new blob and URL
					const glbBlob = new Blob([glbBuffer], { type: 'model/gltf-binary' });
					currentPreviewBlob = URL.createObjectURL(glbBlob);
					
					// Update model viewer with new preview
					modelUpdateTime = Date.now();
					useFirebaseModel = false; // Use in-memory preview
					modelError = false;
					lastUpdate = new Date().toLocaleTimeString();
					lastProcessedContent = content;
					
					// Update model viewer immediately
					if (modelViewer) {
						console.log('Updating model-viewer with in-memory GLB preview');
						console.log('Blob URL:', currentPreviewBlob);
						modelViewer.src = currentPreviewBlob;
						// Force refresh
						modelViewer.addEventListener('load', () => {
							console.log('Model loaded successfully!');
						});
						modelViewer.addEventListener('error', (e) => {
							console.error('Model load error:', e);
						});
					}
				} catch (decodeError) {
					console.error('Failed to decode GLB data:', decodeError);
					modelError = true;
				}
			} else {
				console.error('Update failed:', result.error);
				modelError = true;
			}
		} catch (error) {
			console.error('Update error:', error);
			modelError = true;
		} finally {
			isUpdating = false;
		}
	}

	// Handle model loading errors with fallback
	function handleModelError() {
		console.log('Model loading failed');
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
				<div class="model-container">
					{#if isUpdating}
						<div class="status-overlay updating">Updating...</div>
					{/if}
					
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
								src="{currentPreviewBlob || '/models/cylinder.glb'}"
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


	.model-container {
		flex: 1;
		background: #f5f5f5;
		position: relative;
		min-height: 500px;
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
	}
</style>