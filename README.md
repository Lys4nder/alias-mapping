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

---

## Extension Settings

This extension does not currently add any custom settings. Future updates may include configuration options for alias styling and behavior.

---

## Known Issues

- If the `.vscode/alias-mapping.json` file is missing or invalid, the extension will display a warning message.
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

## License

This extension is licensed under the [MIT License](LICENSE).

---

## Enjoy coding with Alias View!