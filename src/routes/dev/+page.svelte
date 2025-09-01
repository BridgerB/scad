<script>
	import { enhance } from '$app/forms';

	let seedCount = 10;
</script>

<div class="container">
	<h1>Development Tools</h1>
	
	<div class="section">
		<h2>Database Seeding</h2>
		<form method="POST" action="?/seed" use:enhance>
			<div class="form-group">
				<label for="count">Number of SCADs to generate:</label>
				<input type="number" id="count" name="count" bind:value={seedCount} min="1" max="100" />
			</div>
			<button type="submit" class="seed-button">Seed Database</button>
		</form>
	</div>
</div>

<style>
	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.section {
		margin: 2rem 0;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		background: #f9f9f9;
	}

	.form-group {
		margin: 1rem 0;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: bold;
	}

	input[type="number"] {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		width: 100px;
	}

	.seed-button {
		background: #007acc;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		margin-left: 1rem;
	}

	.seed-button:hover {
		background: #005a9e;
	}
</style>