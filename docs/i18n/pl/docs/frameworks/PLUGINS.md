---
title: "System wtyczek CLI Xenia"
version: 3.8.40
lastUpdated: 2026-06-28
---

# System wtyczek CLI Xenia

Rozszerzaj CLI `xenia` bez modyfikowania jego rdzenia. Wtyczki stosują konwencję nazewnictwa `xenia-cmd-*`, podobnie jak `gh extension` lub `kubectl plugin`.

## Szybki start

```bash
# Install a plugin from npm
xenia plugin install stripe

# Install a local plugin in development
xenia plugin install ./my-plugin

# List installed plugins
xenia plugin list

# Scaffold a new plugin
xenia plugin scaffold myplugin
cd xenia-cmd-myplugin
xenia plugin install .
```

## Anatomia wtyczki

Wtyczka to pakiet npm o nazwie `xenia-cmd-<name>` (lub `@scope/xenia-cmd-<name>`).

```
xenia-cmd-myplugin/
├── package.json     # must have "type": "module" and "main": "index.mjs"
├── index.mjs        # exports register(program, ctx) + optional meta
└── README.md
```

### `package.json`

```json
{
  "name": "xenia-cmd-myplugin",
  "version": "0.1.0",
  "type": "module",
  "main": "index.mjs",
  "engines": { "xenia": ">=4.0.0" },
  "keywords": ["xenia-plugin", "xenia-cmd"]
}
```

### `index.mjs`

```js
export const meta = {
  name: "myplugin",
  version: "0.1.0",
  description: "My plugin for Xenia",
  xeniaApi: ">=4.0.0",
};

export function register(program, ctx) {
  program
    .command("myplugin")
    .description(meta.description)
    .option("-n, --name <name>")
    .action(async (opts, cmd) => {
      const gOpts = cmd.optsWithGlobals();
      const res = await ctx.apiFetch("/api/combos", {
        baseUrl: gOpts.baseUrl,
        apiKey: gOpts.apiKey,
      });
      const data = await res.json();
      ctx.emit(data, gOpts);
    });
}
```

## API kontekstu wtyczki

Obiekt `ctx` przekazywany do `register(program, ctx)`:

| Property                     | Type             | Description                                                 |
| ---------------------------- | ---------------- | ----------------------------------------------------------- |
| `ctx.apiFetch(path, opts)`   | `async function` | Uwierzytelniony fetch do serwera Xenia                      |
| `ctx.emit(data, opts)`       | `function`       | Wyjście w formacie table/json/jsonl/csv wg flagi `--output` |
| `ctx.t(key)`                 | `async function` | Wyszukiwanie tłumaczenia i18n                               |
| `ctx.withSpinner(label, fn)` | `async function` | Opakowuje async fn w spinner ora                            |
| `ctx.baseUrl`                | `string`         | Rozwiązany base URL                                         |
| `ctx.apiKey`                 | `string \| null` | Klucz API, jeśli podany                                     |

## Odkrywanie

Wtyczki są wykrywane z:

1. `~/.xenia/plugins/<name>/` — instalacje lokalne użytkownika
2. `XENIA_PLUGIN_PATH` env var — niestandardowy katalog

Błędy ładowania są przechwytywane i wypisywane jako ostrzeżenia — uszkodzona wtyczka nigdy nie zawiesza CLI.

## Bezpieczeństwo

Wtyczki działają z tymi samymi uprawnieniami procesu Node.js co `xenia`. Instaluj wtyczki wyłącznie ze źródeł, którym ufasz. `xenia plugin install` wyświetla wyraźne ostrzeżenie i wymaga `--yes` albo interaktywnego potwierdzenia.

## Publikowanie

1. Upewnij się, że `package.json` ma `"keywords": ["xenia-plugin"]`
2. `npm publish` jak zwykle
3. Użytkownicy odkrywają wtyczki przez `xenia plugin search <query>` (przeszukuje rejestr npm)

## Przykładowa wtyczka

Zobacz [`examples/xenia-cmd-hello/`](../../examples/xenia-cmd-hello/index.mjs) — minimalny działający przykład z `meta` + `register()`.
