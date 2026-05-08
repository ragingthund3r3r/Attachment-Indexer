# Attachment Indexer

A simple Obsidian plugin for creating and managing index notes for attachments (images, PDFs, etc.).

Each index note includes:
- Frontmatter metadata
- A reference to the attachment
- An embedded preview

---

## Features

- Create index notes for attachments automatically
- Skip selected folders during indexing
- Choose where index notes are stored
- Optional auto-indexing for new attachments
- Prevent duplicate index notes

---

## Installation

### Development Setup

```bash
npm install
npm run build
```

Copy these files into:

```text
.obsidian/plugins/Attachment-Indexer/
```

Files:
- `main.js`
- `manifest.json`

Then enable the plugin in:

```text
Settings → Community Plugins
```

---

## Development

### Watch Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

Generated files:
- `main.js`
- `manifest.json`

---

## Settings

### Excluded Folders
Folders to skip during indexing.

Example:
```text
Templates/
Archive/
```

### Index Output Folder
Folder where index notes are created.

Example:
```text
attachments/index
```

If empty, notes are created in the vault root.

### Prevent Indexing New Attachments
Disable automatic indexing for newly added files.

---

## Commands

### Create Index Files for all Attachments in the Vault

Scans the vault and creates missing index notes for supported attachments.

Command ID:
```text
index-all-attachments
```

---

## Index Note Format

Generated notes contain:

```yaml
---
attachmentIndex: true
attachment: "[[path/to/file]]"
created:
modified:
---
```

Preview embed:

```markdown
![[path/to/file]]
```

---

## Notes

- Index notes are regular Markdown files
- Duplicate index files are automatically avoided
- Works with images, PDFs, and other Obsidian-supported attachments