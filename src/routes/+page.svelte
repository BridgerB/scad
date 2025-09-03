<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	export let data;
	
	let searchQuery = $page.url.searchParams.get('search') || '';
	
	onMount(async () => {
		if (browser) {
			await import('@google/model-viewer');
		}
	});
	
	function handleSearch() {
		if (searchQuery.trim()) {
			goto(`?search=${encodeURIComponent(searchQuery.trim())}`);
		} else {
			goto('/');
		}
	}
	
	function handleKeydown(event) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}

	function navigateToScad(scadId) {
		goto(`/${scadId}`);
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
</script>

<div class="container">
	<h1>OpenSCAD Files</h1>
	
	<div class="create-section">
		<a href="/create" class="create-button">
			<span class="create-icon">+</span>
			ADD SCAD
		</a>
	</div>
	
	<div class="search-box">
		<input 
			type="text" 
			placeholder="Search SCAD files..." 
			bind:value={searchQuery}
			on:keydown={handleKeydown}
		/>
		<button on:click={handleSearch} class="search-button">Search</button>
	</div>

	<div class="cards-grid">
		{#each data.scads as scad}
			<div class="card" on:click={() => navigateToScad(scad.id)}>
				<div class="model-container">
					{#if browser && scad.glbUrl && getGlbProxyUrl(scad.glbUrl)}
						<model-viewer
							alt="{scad.title} 3D Model"
							src="{getGlbProxyUrl(scad.glbUrl)}"
							environment-image="/environments/default.hdr"
							shadow-intensity="1"
							auto-rotate
							auto-rotate-delay="0"
							rotation-per-second="60deg"
							loading="lazy"
							on:error={(event) => {
								// Fallback to no-model state on error
								const container = event.target.closest('.model-container');
								if (container) {
									container.innerHTML = '<div class="no-model">3D model unavailable</div>';
								}
							}}
						></model-viewer>
					{:else if browser && !scad.glbUrl}
						<div class="no-model">3D model unavailable</div>
					{:else}
						<div class="no-model">Loading 3D viewer...</div>
					{/if}
				</div>
				<div class="card-content">
					<h3>{scad.title}</h3>
					<p>{scad.description || 'No description'}</p>
					<div class="card-meta">
						<span>by {scad.username}</span>
						<span>{scad.downloadCount} downloads</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if data.pagination.totalPages > 1}
		<div class="pagination">
			<div class="pagination-info">
				Showing {(data.pagination.currentPage - 1) * 25 + 1}-{Math.min(data.pagination.currentPage * 25, data.pagination.totalCount)} of {data.pagination.totalCount} results
			</div>
			
			<div class="pagination-controls">
				{#if data.pagination.currentPage > 1}
					<a href="?{new URLSearchParams({ 
						...(data.searchQuery && { search: data.searchQuery }), 
						page: '1' 
					}).toString()}" class="page-btn">First</a>
				{/if}

				{#if data.pagination.hasPrevPage}
					<a href="?{new URLSearchParams({ 
						...(data.searchQuery && { search: data.searchQuery }), 
						page: String(data.pagination.currentPage - 1) 
					}).toString()}" class="page-btn">← Previous</a>
				{/if}

				{#each Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
					const start = Math.max(1, data.pagination.currentPage - 2);
					const end = Math.min(data.pagination.totalPages, start + 4);
					return start + i;
				}).filter(page => page <= data.pagination.totalPages) as pageNum}
					{#if pageNum === data.pagination.currentPage}
						<span class="page-btn current">{pageNum}</span>
					{:else}
						<a href="?{new URLSearchParams({ 
							...(data.searchQuery && { search: data.searchQuery }), 
							page: String(pageNum) 
						}).toString()}" class="page-btn">{pageNum}</a>
					{/if}
				{/each}

				{#if data.pagination.hasNextPage}
					<a href="?{new URLSearchParams({ 
						...(data.searchQuery && { search: data.searchQuery }), 
						page: String(data.pagination.currentPage + 1) 
					}).toString()}" class="page-btn">Next →</a>
				{/if}

				{#if data.pagination.currentPage < data.pagination.totalPages}
					<a href="?{new URLSearchParams({ 
						...(data.searchQuery && { search: data.searchQuery }), 
						page: String(data.pagination.totalPages) 
					}).toString()}" class="page-btn">Last</a>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.create-section {
		margin: 2rem 0;
		text-align: center;
	}

	.create-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		background: #28a745;
		color: white;
		text-decoration: none;
		padding: 1rem 2rem;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 600;
		transition: all 0.2s;
		box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
	}

	.create-button:hover {
		background: #218838;
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
	}

	.create-icon {
		font-size: 1.5rem;
		font-weight: bold;
		line-height: 1;
	}

	.search-box {
		margin: 2rem 0;
		display: flex;
		gap: 0.5rem;
	}

	.search-box input {
		flex: 1;
		padding: 1rem;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.search-button {
		background: #007acc;
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.search-button:hover {
		background: #005a9e;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	.card {
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		transition: transform 0.2s;
		cursor: pointer;
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0,0,0,0.2);
	}

	.model-container {
		width: 100%;
		height: 200px;
		background: #f5f5f5;
		position: relative;
	}

	.model-container model-viewer {
		width: 100%;
		height: 100%;
		background-color: #eee;
	}

	.no-model {
		width: 100%;
		height: 200px;
		background: #f5f5f5;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
		font-size: 0.9rem;
	}

	.card-content {
		padding: 1rem;
	}

	.card-content h3 {
		margin: 0 0 0.5rem 0;
	}


	.card-content p {
		color: #666;
		margin: 0 0 1rem 0;
		font-size: 0.9rem;
	}

	.card-meta {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: #888;
	}

	.pagination {
		margin-top: 2rem;
		text-align: center;
	}

	.pagination-info {
		margin-bottom: 1rem;
		color: #666;
		font-size: 0.9rem;
	}

	.pagination-controls {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.page-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		background: white;
		color: #333;
		text-decoration: none;
		border-radius: 4px;
		font-size: 0.9rem;
		transition: all 0.2s;
	}

	.page-btn:hover {
		background: #f5f5f5;
		border-color: #007acc;
	}

	.page-btn.current {
		background: #007acc;
		color: white;
		border-color: #007acc;
		cursor: default;
	}

	@media (max-width: 768px) {
		.pagination-controls {
			font-size: 0.8rem;
		}
		
		.page-btn {
			padding: 0.4rem 0.8rem;
			font-size: 0.8rem;
		}
	}
</style>
