<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { enhance } from '$app/forms';
    
    export let data;
    export let form;
    
    let modelViewer;
    let scadContent = data.scadContent;
    let isUpdating = false;
    let lastUpdate = '';
    
    onMount(async () => {
        if (browser) {
            await import('@google/model-viewer');
        }
    });
    
    
    // Manual update function
    async function updateModel() {
        if (isUpdating) return;
        
        isUpdating = true;
        try {
            const formData = new FormData();
            formData.append('scadContent', scadContent);
            
            const response = await fetch('?/updateScad', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.type === 'success') {
                // Force reload the model viewer by updating the src with timestamp
                const timestamp = Date.now();
                if (modelViewer) {
                    modelViewer.src = `/models/generated/output.glb?t=${timestamp}`;
                }
                lastUpdate = new Date().toLocaleTimeString();
            } else {
                console.error('Update failed:', result.data?.error);
                alert('Update failed: ' + (result.data?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('Update failed: ' + error.message);
        } finally {
            isUpdating = false;
        }
    }
    
    // Reactive statement - updates model whenever scadContent changes
    $: if (scadContent !== data.scadContent && scadContent.trim()) {
        updateModel();
    }

    // React to form updates
    $: if (form?.success) {
        const timestamp = Date.now();
        if (modelViewer) {
            modelViewer.src = `/models/generated/output.glb?t=${timestamp}`;
        }
        lastUpdate = new Date().toLocaleTimeString();
    }
</script>

<svelte:head>
    <title>3D Model Viewer - OpenSCAD Files</title>
</svelte:head>

<div class="container">
    <h1>OpenSCAD Live Editor</h1>
    
    <div class="layout">
        <!-- Code Editor Panel - Left Side -->
        <div class="editor-panel">
            <div class="editor-header">
                <h2>SCAD Code</h2>
                <div class="editor-controls">
                    {#if isUpdating}
                        <span class="status updating">Updating...</span>
                    {:else if lastUpdate}
                        <span class="status updated">Last update: {lastUpdate}</span>
                    {:else}
                        <span class="status">Ready</span>
                    {/if}
                </div>
            </div>
            
            <form method="POST" action="?/updateScad" use:enhance>
                <textarea 
                    name="scadContent"
                    bind:value={scadContent}
                    class="code-editor"
                    placeholder="Enter your OpenSCAD code here..."
                    spellcheck="false"
                ></textarea>
                <noscript>
                    <button type="submit" class="fallback-submit">Update Model</button>
                </noscript>
            </form>
        </div>
        
        <!-- Model Viewer Panel - Right Side -->
        <div class="viewer-panel">
            <div class="viewer-header">
                <h2>3D Preview</h2>
                {#if form?.error}
                    <div class="error-message">
                        Error: {form.error}
                    </div>
                {:else if form?.success}
                    <div class="success-message">
                        {form.message}
                    </div>
                {/if}
            </div>
            
            <div class="model-container">
                {#if browser}
                    <model-viewer
                        bind:this={modelViewer}
                        alt="OpenSCAD 3D Model Preview"
                        src="/models/generated/output.glb"
                        ar
                        environment-image="/environments/default.hdr"
                        shadow-intensity="1"
                        camera-controls
                        touch-action="pan-y"
                        auto-rotate
                        exposure="1"
                        skybox-image="/environments/default.hdr"
                        loading="lazy"
                    ></model-viewer>
                {:else}
                    <div class="loading">Loading 3D viewer...</div>
                {/if}
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

    h1 {
        color: #333;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .layout {
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

    .editor-controls, .viewer-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .editor-panel form {
        display: flex;
        flex: 1;
        flex-direction: column;
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

    .update-btn {
        padding: 0.5rem 1rem;
        background: #007acc;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .update-btn:hover {
        background: #0056b3;
    }

    .update-btn:disabled {
        background: #6c757d;
        cursor: not-allowed;
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

    .fallback-submit {
        display: none;
        margin: 1rem;
        padding: 0.5rem 1rem;
        background: #007acc;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
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

    .error-message {
        color: #dc3545;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 0.5rem;
        font-size: 0.9rem;
    }

    .success-message {
        color: #155724;
        background: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 4px;
        padding: 0.5rem;
        font-size: 0.9rem;
    }

    @media (max-width: 1024px) {
        .layout {
            grid-template-columns: 1fr;
            gap: 1rem;
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

    /* Syntax highlighting for SCAD (basic) */
    .code-editor {
        tab-size: 4;
        -moz-tab-size: 4;
        -o-tab-size: 4;
    }

    /* No JavaScript fallback */
    noscript .fallback-submit {
        display: block;
    }
</style>
