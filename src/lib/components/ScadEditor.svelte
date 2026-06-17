<script>
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	// Bindable project state.
	export let files = []; // [{ path, content }]
	export let entryPath = '';

	const dispatch = createEventDispatcher();

	let activePath = entryPath || files[0]?.path || '';
	let collapsed = {}; // { [dirPath]: true }

	let editorContainer;
	let editorView;
	let cm; // { EditorView, basicSetup, EditorState, oneDark, cpp }

	onMount(async () => {
		if (!browser) return;
		const [editor, state, dark, lang] = await Promise.all([
			import('codemirror'),
			import('@codemirror/state'),
			import('@codemirror/theme-one-dark'),
			import('@codemirror/lang-cpp')
		]);
		cm = {
			EditorView: editor.EditorView,
			basicSetup: editor.basicSetup,
			EditorState: state.EditorState,
			oneDark: dark.oneDark,
			cpp: lang.cpp
		};
		if (!activePath) activePath = entryPath || files[0]?.path || '';
		mountEditor();
	});

	onDestroy(() => editorView?.destroy());

	function makeState(doc) {
		return cm.EditorState.create({
			doc,
			extensions: [
				cm.basicSetup,
				cm.oneDark,
				cm.cpp(),
				cm.EditorView.updateListener.of((u) => {
					if (u.docChanged) onDocChange(u.state.doc.toString());
				})
			]
		});
	}

	function mountEditor() {
		const f = files.find((x) => x.path === activePath) || files[0];
		activePath = f?.path || '';
		editorView = new cm.EditorView({ state: makeState(f?.content ?? ''), parent: editorContainer });
	}

	function onDocChange(text) {
		const f = files.find((x) => x.path === activePath);
		if (!f) return;
		f.content = text;
		files = files; // trigger reactivity
		dispatch('change');
	}

	function selectFile(path) {
		if (path === activePath || !editorView) return;
		activePath = path;
		const f = files.find((x) => x.path === path);
		editorView.setState(makeState(f?.content ?? ''));
	}

	function toggleDir(dirPath) {
		collapsed = { ...collapsed, [dirPath]: !collapsed[dirPath] };
	}

	function normalizePath(p) {
		return p.replace(/\\/g, '/').trim().replace(/^\/+/, '');
	}

	function addFile() {
		let path = prompt('New file path (e.g. lib/helpers.scad):');
		if (!path) return;
		path = normalizePath(path);
		if (!path) return;
		if (!/^[A-Za-z0-9._/ -]+$/.test(path) || path.split('/').includes('..')) {
			alert('Invalid path.');
			return;
		}
		if (!/\.scad$/i.test(path)) path += '.scad';
		if (files.some((f) => f.path === path)) {
			alert('A file with that path already exists.');
			return;
		}
		files = [...files, { path, content: `// ${path}\n` }];
		dispatch('change');
		// select after the DOM/editor exists
		queueSelect(path);
	}

	function queueSelect(path) {
		if (editorView) selectFile(path);
		else activePath = path;
	}

	function renameFile(path) {
		let next = prompt('Rename file to:', path);
		if (!next) return;
		next = normalizePath(next);
		if (!/\.scad$/i.test(next)) next += '.scad';
		if (next === path) return;
		if (!/^[A-Za-z0-9._/ -]+$/.test(next) || next.split('/').includes('..')) {
			alert('Invalid path.');
			return;
		}
		if (files.some((f) => f.path === next)) {
			alert('A file with that path already exists.');
			return;
		}
		files = files.map((f) => (f.path === path ? { ...f, path: next } : f));
		if (entryPath === path) entryPath = next;
		if (activePath === path) activePath = next;
		dispatch('change');
	}

	function deleteFile(path) {
		if (files.length <= 1) {
			alert('A project needs at least one file.');
			return;
		}
		if (path === entryPath) {
			alert('Cannot delete the entry file. Set another file as entry first.');
			return;
		}
		if (!confirm(`Delete ${path}?`)) return;
		files = files.filter((f) => f.path !== path);
		if (activePath === path) {
			activePath = files[0]?.path || '';
			if (editorView) selectFile(activePath);
		}
		dispatch('change');
	}

	function setEntry(path) {
		entryPath = path;
		dispatch('change');
	}

	// Build a depth-annotated, collapse-aware row list from the flat file paths.
	function buildRows(fileList, collapsedMap) {
		const root = { dirs: {}, files: [] };
		for (const f of fileList) {
			const parts = f.path.split('/');
			let node = root;
			for (let i = 0; i < parts.length - 1; i++) {
				node.dirs[parts[i]] ||= { dirs: {}, files: [] };
				node = node.dirs[parts[i]];
			}
			node.files.push({ name: parts[parts.length - 1], path: f.path });
		}
		const rows = [];
		const walk = (node, prefix, depth) => {
			for (const d of Object.keys(node.dirs).sort()) {
				const dirPath = prefix ? `${prefix}/${d}` : d;
				rows.push({ type: 'folder', name: d, path: dirPath, depth });
				if (!collapsedMap[dirPath]) walk(node.dirs[d], dirPath, depth + 1);
			}
			for (const f of node.files.sort((a, b) => a.name.localeCompare(b.name))) {
				rows.push({ type: 'file', name: f.name, path: f.path, depth });
			}
		};
		walk(root, '', 0);
		return rows;
	}

	$: rows = buildRows(files, collapsed);
</script>

<div class="scad-editor">
	<div class="file-tree">
		<div class="tree-header">
			<span>Files</span>
			<button type="button" class="icon-btn" title="Add file" on:click={addFile}>+</button>
		</div>
		<div class="tree-list">
			{#each rows as row (row.path)}
				{#if row.type === 'folder'}
					<div
						class="tree-row folder"
						style="padding-left: {row.depth * 12 + 8}px"
						role="button"
						tabindex="0"
						on:click={() => toggleDir(row.path)}
						on:keydown={(e) => e.key === 'Enter' && toggleDir(row.path)}
					>
						<span class="caret">{collapsed[row.path] ? '▸' : '▾'}</span>
						<span class="row-name">{row.name}/</span>
					</div>
				{:else}
					<div
						class="tree-row file"
						class:active={row.path === activePath}
						style="padding-left: {row.depth * 12 + 8}px"
						role="button"
						tabindex="0"
						on:click={() => selectFile(row.path)}
						on:keydown={(e) => e.key === 'Enter' && selectFile(row.path)}
					>
						<span class="row-name" title={row.path}>
							{row.name}
							{#if row.path === entryPath}<span class="entry-badge" title="Entry file">●</span>{/if}
						</span>
						<span class="row-actions">
							{#if row.path !== entryPath}
								<button type="button" class="mini" title="Set as entry" on:click|stopPropagation={() => setEntry(row.path)}>entry</button>
							{/if}
							<button type="button" class="mini" title="Rename" on:click|stopPropagation={() => renameFile(row.path)}>✎</button>
							<button type="button" class="mini" title="Delete" on:click|stopPropagation={() => deleteFile(row.path)}>🗑</button>
						</span>
					</div>
				{/if}
			{/each}
		</div>
	</div>
	<div class="code-pane" bind:this={editorContainer}></div>
</div>

<style>
	.scad-editor {
		display: flex;
		border: 1px solid #2b2b3a;
		border-radius: 8px;
		overflow: hidden;
		min-height: 360px;
		background: #282c34;
	}
	.file-tree {
		width: 200px;
		flex-shrink: 0;
		background: #21252b;
		color: #c8ccd4;
		border-right: 1px solid #181a1f;
		display: flex;
		flex-direction: column;
		font-size: 0.82rem;
	}
	.tree-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.4rem 0.6rem;
		border-bottom: 1px solid #181a1f;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 0.72rem;
		color: #8a909c;
	}
	.icon-btn {
		background: #2c313a;
		color: #c8ccd4;
		border: none;
		border-radius: 4px;
		width: 22px;
		height: 22px;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
	}
	.icon-btn:hover { background: #3a4150; }
	.tree-list { overflow-y: auto; flex: 1; padding: 0.25rem 0; }
	.tree-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 4px;
		padding: 3px 8px;
		cursor: pointer;
		white-space: nowrap;
	}
	.tree-row:hover { background: #2c313a; }
	.tree-row.file.active { background: #323a47; }
	.caret { width: 12px; display: inline-block; color: #8a909c; }
	.row-name { overflow: hidden; text-overflow: ellipsis; }
	.folder .row-name { color: #9aa4b2; }
	.entry-badge { color: #4ea1ff; margin-left: 4px; font-size: 0.7rem; }
	.row-actions { display: none; gap: 2px; }
	.tree-row.file:hover .row-actions { display: flex; }
	.mini {
		background: transparent;
		border: none;
		color: #8a909c;
		cursor: pointer;
		font-size: 0.72rem;
		padding: 0 3px;
		border-radius: 3px;
	}
	.mini:hover { color: #fff; background: #3a4150; }
	.code-pane { flex: 1; overflow: auto; min-width: 0; }
	.code-pane :global(.cm-editor) { height: 100%; }
</style>
