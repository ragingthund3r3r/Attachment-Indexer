import {App, PluginSettingTab, Setting} from "obsidian";
import type MyPlugin from "./main";

export interface MyPluginSettings {
	excludedFolders: string;
	indexFolder: string;
	disableNewAttachments: boolean;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	excludedFolders: "",
	indexFolder: "",
	disableNewAttachments: false
}

export class MyPluginSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Excluded folders')
			.setDesc('Enter one folder path per line. Files located under these folders will be excluded from the indexing.')
			.addTextArea(text => text
				.setPlaceholder('path/to/folder\nanother/folder')
				.setValue(this.plugin.settings.excludedFolders)
				.onChange(async (value) => {
					this.plugin.settings.excludedFolders = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Index output folder')
			.setDesc('Folder path where created attachment index files will be stored (single path). Example: attachments/index')
			.addText(text => text
				.setPlaceholder('e.g., attachments/index')
				.setValue(this.plugin.settings.indexFolder)
				.onChange(async (value) => {
					this.plugin.settings.indexFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Prevent indexing new attachments')
			.setDesc('When enabled, newly added attachment files will not have index notes created automatically.')
			.addToggle(toggle => toggle
				.setValue(!!this.plugin.settings.disableNewAttachments)
				.onChange(async (value) => {
					this.plugin.settings.disableNewAttachments = value;
					await this.plugin.saveSettings();
				}));
	}
}
