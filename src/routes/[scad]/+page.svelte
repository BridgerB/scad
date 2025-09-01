<script>
	export let data;

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

	<div class="content-grid">
		<div class="main-content">
			{#if data.photos.length > 0}
				<div class="photo-gallery">
					{#each data.photos as photo}
						<div class="photo">
							<img src={photo.url} alt={photo.description || data.scad.title} />
							{#if photo.description}
								<p class="photo-caption">{photo.description}</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			{#if data.scad.description}
				<div class="description">
					<h2>Description</h2>
					<p>{data.scad.description}</p>
				</div>
			{/if}

			<div class="code-section">
				<div class="code-header">
					<h2>OpenSCAD Code</h2>
					<button on:click={downloadScad} class="download-btn">
						Download .scad file
					</button>
				</div>
				<pre class="code-block"><code>{data.scad.content}</code></pre>
			</div>
		</div>

		<div class="sidebar">
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

			<div class="author-card">
				<h3>Author</h3>
				<p>{data.scad.username}</p>
				<p class="join-date">Joined {formatDate(data.scad.createdAt)}</p>
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
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
	}

	.meta span {
		margin: 0 0.5rem;
	}

	.meta span:first-child {
		margin-left: 0;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 2rem;
		margin-top: 2rem;
	}

	.photo-gallery {
		margin-bottom: 2rem;
	}

	.photo {
		margin-bottom: 1rem;
	}

	.photo img {
		width: 100%;
		height: 300px;
		object-fit: cover;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.photo-caption {
		margin: 0.5rem 0 0 0;
		color: #666;
		font-size: 0.9rem;
		font-style: italic;
	}

	.description {
		margin-bottom: 2rem;
	}

	.description h2 {
		color: #333;
		margin-bottom: 1rem;
	}

	.description p {
		line-height: 1.6;
		color: #555;
	}

	.code-section {
		margin-bottom: 2rem;
	}

	.code-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.code-header h2 {
		margin: 0;
		color: #333;
	}

	.download-btn {
		background: #28a745;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.download-btn:hover {
		background: #218838;
	}

	.code-block {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 4px;
		padding: 1rem;
		overflow-x: auto;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.stats-card, .tags-card, .author-card {
		background: #f9f9f9;
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

	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
		
		.code-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
	}
</style>