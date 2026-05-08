import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings} from "./settings";

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'dummy-command',
			name: 'Dummy Command',
			callback: () => this.dummyFunction()
		});
	}

	onunload() {
	}
async dummyFunction() {
	const files = this.app.vault.getFiles();

	const attachments = [];
	const indexFiles = [];

	for (const file of files) {
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

		// Ensure unique filename
		while (this.app.vault.getAbstractFileByPath(fileName)) {
			fileName = `${baseName} ${counter}.md`;
			counter++;
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
			await this.app.vault.create(fileName, content);

			console.log(
				`Created attachment index "${fileName}" for "${attachment.path}"`
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
