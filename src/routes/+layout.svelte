<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();
	
	// Helper function to check if current route matches
	const currentPath = $derived($page.url.pathname);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app">
	<header class="app-header">
		<div class="header-container">
			<a href="/" class="logo-link">
				<h1>OpenSCAD Files</h1>
			</a>
			
			<nav class="main-nav">
				<a href="/" class="nav-link" class:active={currentPath === '/'}>Home</a>
				<a href="/reports" class="nav-link" class:active={currentPath === '/reports'}>Reports</a>
				<a href="/admin" class="nav-link" class:active={currentPath.startsWith('/admin')}>Admin</a>
				<a href="/dev" class="nav-link" class:active={currentPath.startsWith('/dev')}>Dev</a>
				<a href="https://github.com/BridgerB/scad" target="_blank" rel="noopener noreferrer" class="github-link" title="View Source Code">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
					</svg>
				</a>
			</nav>
		</div>
	</header>

	<main class="main-content">
		{@render children?.()}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		background: white;
		border-bottom: 1px solid #e1e5e9;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo-link {
		text-decoration: none;
		color: inherit;
		transition: opacity 0.2s;
	}
	
	.logo-link:hover {
		opacity: 0.8;
	}

	.logo-link h1 {
		color: #333;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.main-nav {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	.nav-link {
		color: #666;
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		transition: all 0.2s;
	}

	.nav-link:hover {
		color: #007bff;
		background: rgba(0, 123, 255, 0.1);
	}

	.nav-link.active {
		color: #007bff;
		background: rgba(0, 123, 255, 0.1);
		font-weight: 600;
	}

	.github-link {
		color: #666;
		padding: 0.5rem;
		border-radius: 6px;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		text-decoration: none;
	}

	.github-link:hover {
		color: #333;
		background: rgba(0, 0, 0, 0.05);
		transform: scale(1.1);
	}

	.main-content {
		flex: 1;
	}

	@media (max-width: 768px) {
		.header-container {
			padding: 1rem;
			flex-direction: column;
			gap: 1rem;
		}

		.logo-link h1 {
			font-size: 1.25rem;
		}

		.main-nav {
			gap: 1rem;
			flex-wrap: wrap;
			justify-content: center;
		}

		.nav-link {
			padding: 0.4rem 0.8rem;
			font-size: 0.9rem;
		}
	}
</style>
