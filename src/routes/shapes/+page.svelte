<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { shapes } from '$lib/shapes';

	onMount(async () => {
		if (browser) {
			await import('@google/model-viewer');
		}
	});
</script>

<svelte:head>
	<title>Shapes — OpenSCAD Files</title>
</svelte:head>

<div class="shapes-page">
	<div class="intro">
		<h1>Shapes</h1>
		<p>Start from a primitive. Pick one to open the editor prefilled with its code.</p>
	</div>

	<div class="cards-grid">
		{#each shapes as shape}
			<a class="card" href={`/create?shape=${shape.id}`}>
				<div class="model-container">
					{#if browser}
						<model-viewer
							alt="{shape.name} preview"
							src={`/shapes/${shape.id}.glb`}
							shadow-intensity="1"
							auto-rotate
							auto-rotate-delay="0"
							rotation-per-second="60deg"
							loading="lazy"
						></model-viewer>
					{:else}
						<div class="no-model">Loading 3D viewer…</div>
					{/if}
				</div>
				<div class="card-content">
					<h3>{shape.name}</h3>
					<p>{shape.description}</p>
					<span class="use-link">Use this shape →</span>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.shapes-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.intro h1 {
		margin: 0 0 0.25rem;
		color: #333;
	}

	.intro p {
		margin: 0 0 1.5rem;
		color: #666;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1.5rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		border: 1px solid #e1e5e9;
		border-radius: 10px;
		overflow: hidden;
		background: white;
		text-decoration: none;
		color: inherit;
		transition: box-shadow 0.2s, transform 0.2s;
	}

	.card:hover {
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
		transform: translateY(-2px);
	}

	.model-container {
		width: 100%;
		height: 200px;
		background: #f7f8fa;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.model-container model-viewer {
		width: 100%;
		height: 100%;
	}

	.no-model {
		color: #999;
		font-size: 0.9rem;
	}

	.card-content {
		padding: 1rem;
	}

	.card-content h3 {
		margin: 0 0 0.35rem;
		color: #333;
	}

	.card-content p {
		margin: 0 0 0.75rem;
		color: #666;
		font-size: 0.9rem;
		min-height: 2.4em;
	}

	.use-link {
		color: #007bff;
		font-weight: 600;
		font-size: 0.9rem;
	}
</style>
