# HopeFlow Toolbox

HopeFlow Toolbox is an Adobe Illustrator CEP plugin focused on repetitive production work.

- 85+ tools across alignment, batch actions, color, text, export, measurement, path and nesting workflows
- Supports Windows and macOS
- Works with Illustrator CS6 and newer

## Links

- Docs: [https://hanshaoui.github.io/hopeflow-docs/](https://hanshaoui.github.io/hopeflow-docs/)
- Latest release: [v3.1.2](https://github.com/hanshaoUi/hopeflow-toolbox/releases/tag/v3.1.2)
- Download zip: [HopeFlow-Toolbox-v3.1.2.zip](https://github.com/hanshaoUi/hopeflow-toolbox/releases/download/v3.1.2/HopeFlow-Toolbox-v3.1.2.zip)

## Installation

1. Download the latest release zip.
2. Extract `HopeFlow-Toolbox-v3.1.2.zip`.
3. Run `install.bat` on Windows or `install.sh` on macOS.
4. Restart Illustrator.
5. Open `Window > Extensions > HopeFlow Toolbox`.

Detailed instructions are in the docs site:

- Windows: [Install guide](https://hanshaoui.github.io/hopeflow-docs/guide/install-windows)
- macOS: [Install guide](https://hanshaoui.github.io/hopeflow-docs/guide/install-macos)
- Uninstall: [Uninstall guide](https://hanshaoui.github.io/hopeflow-docs/guide/uninstall)

## Development

Requirements:

- Node.js 20+
- npm
- Adobe Illustrator with CEP enabled

Install dependencies:

```bash
npm install
```

Run development mode:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Useful commands:

```bash
npm run lint
npm run typecheck
```

## Repository Layout

```text
CSXS/          CEP manifest
build/         Webpack config and packaging scripts
dist/          Built panel assets
src/           Panel source, registry and Illustrator scripts
install.bat    Windows installer helper
install.sh     macOS installer helper
```

## License

MIT
