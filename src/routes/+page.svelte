<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	
	export let data;
	
	let searchQuery = $page.url.searchParams.get('search') || '';
	
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
</script>

<div class="container">
	<h1>OpenSCAD Files</h1>
	
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
			<div class="card">
				{#if scad.firstPhoto}
					<img src={scad.firstPhoto} alt={scad.title} />
				{:else}
					<div class="no-image">No image</div>
				{/if}
				<div class="card-content">
					<h3><a href="/{scad.id}">{scad.title}</a></h3>
					<p>{scad.description || 'No description'}</p>
					<div class="card-meta">
						<span>by {scad.username}</span>
						<span>{scad.downloadCount} downloads</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
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
	}

	.card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0,0,0,0.2);
	}

	.card img {
		width: 100%;
		height: 200px;
		object-fit: cover;
	}

	.no-image {
		width: 100%;
		height: 200px;
		background: #f5f5f5;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #999;
	}

	.card-content {
		padding: 1rem;
	}

	.card-content h3 {
		margin: 0 0 0.5rem 0;
	}

	.card-content h3 a {
		text-decoration: none;
		color: #333;
	}

	.card-content h3 a:hover {
		color: #0066cc;
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
</style>
