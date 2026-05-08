import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings, MyPluginSettingTab} from "./settings";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new MyPluginSettingTab(this.app, this));

		this.addCommand({
			id: 'index-all-attachments',
			name: 'Create Index Files for all Attachments in the Vault',
			callback: () => this.indexAllAttachments()
		});
	}

	onunload() {
	}
async indexAllAttachments() {
	const files = this.app.vault.getFiles();

	// Build excluded folder list from settings (one path per line)
	const excludedFolders = (this.settings?.excludedFolders || '')
		.split(/\r?\n/)
		.map(s => s.trim())
		.filter(Boolean)
		.map(p => p.replace(/^\/+|\/+$/g, ''));

		// Single output folder for created index files (trim slashes)
		const indexFolder = (this.settings?.indexFolder || '').trim().replace(/^\/+|\/+$/g, '');

		// Ensure the index output folder exists if configured
		if (indexFolder) {
			try {
				if (!this.app.vault.getAbstractFileByPath(indexFolder)) {
					await this.app.vault.createFolder(indexFolder);
				}
			} catch (err) {
				console.warn(`Could not create index folder "${indexFolder}"`, err);
			}
		}

	const attachments = [];
	const indexFiles = [];

	for (const file of files) {
		// Skip files that live under any excluded folder
		if (excludedFolders.some(ex => file.path.startsWith(ex))) {
			continue;
		}
		if (file.extension !== 'md') {
			attachments.push(file);
			continue;
		}

		const cache = this.app.metadataCache.getFileCache(file);

		if (cache?.frontmatter?.attachmentIndex === true) {
			indexFiles.push(file);
		}
	}

	// Convert to Set for efficient removal
	const remainingAttachments = new Set(attachments);

	for (const indexFile of indexFiles) {
		const cache = this.app.metadataCache.getFileCache(indexFile);

		if (!cache) {
			console.warn(`No cache found for ${indexFile.path}`);
			continue;
		}

		// -----------------------------
		// Validate embeds
		// -----------------------------
		const embeds = cache.embeds ?? [];

		if (embeds.length !== 1) {
			console.warn(
				`${indexFile.path} must contain exactly one embedded file`
			);
			continue;
		}

		const embed = embeds[0];

		if (!embed) {
			console.warn(`${indexFile.path} embed could not be read`);
			continue;
		}

		const embeddedPath = embed.link;

		// Resolve embedded file
		const embeddedFile =
			this.app.metadataCache.getFirstLinkpathDest(
				embeddedPath,
				indexFile.path
			);

		if (!embeddedFile) {
			console.warn(
				`Could not resolve embedded file "${embeddedPath}" in ${indexFile.path}`
			);
			continue;
		}

		// -----------------------------
		// Validate frontmatter
		// -----------------------------
		const attachmentField = cache.frontmatter?.attachment;

		if (!attachmentField) {
			console.warn(
				`${indexFile.path} is missing frontmatter field "attachment"`
			);
			continue;
		}

		const normalizedAttachmentField = attachmentField
			.replace(/^\[\[/, '')
			.replace(/\]\]$/, '');

		const frontmatterFile =
			this.app.metadataCache.getFirstLinkpathDest(
				normalizedAttachmentField,
				indexFile.path
			);

		if (!frontmatterFile) {
			console.warn(
				`Could not resolve frontmatter attachment "${attachmentField}" in ${indexFile.path}`
			);
			continue;
		}

		// -----------------------------
		// Verify both references match
		// -----------------------------
		if (embeddedFile.path !== frontmatterFile.path) {
			console.warn(
				`${indexFile.path} has mismatched embed and frontmatter attachment`
			);
			continue;
		}

		// -----------------------------
		// Remove from attachment list
		// -----------------------------
		remainingAttachments.delete(embeddedFile);
	}

	// -----------------------------
	// Create missing index files
	// -----------------------------
	for (const attachment of remainingAttachments) {
		// const attachmentType = attachment.extension.toUpperCase();
		const attachmentType =attachment.extension.charAt(0).toUpperCase() + attachment.extension.slice(1).toLowerCase();

		const baseName = `${attachmentType}- ${attachment.basename}`;

		let fileName = `${baseName}.md`;
		let counter = 1;

		// Ensure unique filename (check within configured folder if present)
		let candidatePath = indexFolder ? `${indexFolder}/${fileName}` : fileName;
		while (this.app.vault.getAbstractFileByPath(candidatePath)) {
			fileName = `${baseName} ${counter}.md`;
			counter++;
			candidatePath = indexFolder ? `${indexFolder}/${fileName}` : fileName;
		}

		// Escape attachment path for wikilink/frontmatter
		const attachmentLink = attachment.path;

		const created = Date.now();
		const content = `---
attachmentIndex: true
attachment: "[[${attachmentLink}]]"
created: "${created}"
modified: "${created}"
---

![[${attachmentLink}]]
	`;

		try {
			await this.app.vault.create(candidatePath, content);

			console.log(
				`Created attachment index "${candidatePath}" for "${attachment.path}"`
			);
		} catch (err) {
			console.error(
				`Failed to create attachment index for "${attachment.path}"`,
				err
			);
		}
	}

	console.log(
		`Remaining attachments (${remainingAttachments.size}):`,
		Array.from(remainingAttachments)
	);
}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
