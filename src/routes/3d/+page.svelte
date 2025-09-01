<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    
    let modelViewer;
    
    onMount(async () => {
        if (browser) {
            await import('@google/model-viewer');
        }
    });
</script>

<svelte:head>
    <title>3D Model Viewer - OpenSCAD Files</title>
</svelte:head>

<div class="container">
    <h1>3D Model Viewer</h1>
    
    <div class="model-container">
        {#if browser}
            <model-viewer
                bind:this={modelViewer}
                alt="3D Model Preview"
                src="/models/default.glb"
                ar
                environment-image="/environments/default.hdr"
                poster="/models/poster.webp"
                shadow-intensity="1"
                camera-controls
                touch-action="pan-y"
                auto-rotate
                exposure="1"
                skybox-image="/environments/default.hdr"
            ></model-viewer>
        {:else}
            <div class="loading">Loading 3D viewer...</div>
        {/if}
    </div>
    
    <div class="info-panel">
        <h2>About This Viewer</h2>
        <p>This 3D model viewer allows you to:</p>
        <ul>
            <li>Rotate the model by dragging</li>
            <li>Zoom with the scroll wheel</li>
            <li>Pan by right-clicking and dragging</li>
            <li>View in AR (on supported devices)</li>
        </ul>
    </div>
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    h1 {
        color: #333;
        margin-bottom: 2rem;
    }

    .model-container {
        width: 100%;
        height: 600px;
        background: #f5f5f5;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 2rem;
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

    .info-panel {
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1.5rem;
    }

    .info-panel h2 {
        color: #333;
        margin-top: 0;
        margin-bottom: 1rem;
    }

    .info-panel ul {
        margin: 0;
        padding-left: 1.5rem;
    }

    .info-panel li {
        margin: 0.5rem 0;
        color: #555;
    }

    @media (max-width: 768px) {
        .model-container {
            height: 400px;
        }
    }
</style>
