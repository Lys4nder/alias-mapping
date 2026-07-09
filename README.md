# Alias View
Alias View is a Visual Studio Code extension that enhances your coding experience by displaying variable aliases as ghost text in your editor. This is particularly useful for understanding codebases with complex alias mappings or when working with large projects.

---

## Features

- **Alias Mapping Visualization**: Automatically displays aliases for variables as ghost text next to their occurrences in the code.
- **Customizable Alias Mapping**: Define your alias mappings in a `.vscode/alias-mapping.json` file.
- **Toggle Aliases**: Quickly enable or disable alias visualization with a single command.

---

### Example

Here’s how it looks in action:

---

## Requirements

- Visual Studio Code version `1.99.0` or higher.
- A `.vscode/alias-mapping.json` file in your project root containing alias mappings in the following format:

    ```json
    {
        "originalVariable": "aliasName",
        "anotherVariable": "anotherAlias"
    }
    ```

---

## Commands

This extension provides the following commands:

- **Toggle Aliases**: `aliasView.toggleAliases`  
    Enable or disable alias visualization in the editor.
- **Open Alias Mapping File**: `aliasView.openAliasFile`  
    Create (if missing) and open the workspace alias mapping file.
- **Hide**: `aliasView.hideAliases`  
    Disable alias visualization for the current workspace.

---

## Extension Settings

- `aliasView.enabled` (boolean): Enable or disable aliases.
- `aliasView.mappingFile` (string): Relative workspace path to the mapping file.
- `aliasView.prefix` (string): Prefix shown before each alias.
- `aliasView.ghostTextColor` (string): Alias ghost text color.
- `aliasView.ghostTextMargin` (string): Alias ghost text margin.
- `aliasView.refreshOnType` (boolean): Recompute while typing.
- `aliasView.refreshOnSave` (boolean): Recompute on save.
- `aliasView.debounceMs` (number): Debounce delay for updates.
- `aliasView.silentWarnings` (boolean): Log diagnostics silently instead of popup warnings.

---

## Known Issues

- If the mapping file is missing or invalid, diagnostics are silent by default (`aliasView.silentWarnings: true`).
- Large files with many aliases may experience slight performance degradation.

---

## Release Notes

### 1.0.0

- Initial release of Alias View.
- Added support for alias mapping visualization.
- Added the Toggle Aliases command.

---

## Contributing

Contributions are welcome! If you’d like to report a bug, suggest a feature, or contribute code, please visit the [GitHub repository](#).

---

## Enjoy coding with Alias View!