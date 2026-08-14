# 4n6 App Finder

Have you ever been asked the question: "Can you extract data from *some_app*?"

This common inquiry among forensic examiners led to the creation of the 4n6 App Finder. The project is primarily focused on mobile applications, but some of the tools provide details about desktop apps in their documentation as well.

## Using the Project

Check out the live build at https://4n6appfinder.habben.net

This project was not meant to be run by anyone on local computers and is designed to run from a live web server. Simply click the link above to get going.

## Vercel Deployment

The production site is a static Vite app on Vercel. No server functions are required for the public search UI.

## Data layout

| File | Role |
|---|---|
| `public/apps-core.json` | Canonical app catalog (name, icon, stores, notes, true aliases) |
| `public/tools.json` | Forensic tools, plus pointers to each tool’s artifact dump and map file |
| `public/artifacts-*.json` | Vendor snapshots of what each tool documents |
| `public/maps/{tool}.json` | Join table: `{ "artifact name": "canonical appName" }` |

Search loads the catalog, `tools.json`, and the map files. Artifact dumps are fetched only when an app is opened or when browsing Admin artifact lists.

`alternateNames` on an app is for real aliases (renames, leftover bundle IDs), not tool documentation titles. Those titles live in the per-tool map so Git diffs stay small and each tool can be mapped independently.

## Contributing

We welcome contributions to make this project more comprehensive and accurate.

1. **Update the core apps catalog** in `public/apps-core.json` if an app or its metadata is missing or outdated. Use `alternateNames` only for aliases that are not a tool’s artifact title (for example `Runtastic` after a rename, when it is not already in a map).
2. **Map tool artifacts** by adding entries to that tool’s file under `public/maps/`. Keys are the tool’s `appNameKey` values from its artifact JSON; values are the catalog `appName`.
3. **Add a new forensic tool** with a `tools.json` row, an `artifacts-*.json` snapshot, and a `maps/{tool}.json` file. Exact catalog `appName` matches and names already used in other maps are good first mapping candidates; review the rest.

Submit a pull request with those file changes.

## Core Apps Database Structure

Each record in the `apps-core.json` file represents an app and follows this structure:

- `appName`: The official name of the app.
- `icon`: Filename of an icon image in `public/app-icons/`.
- `websiteUrl`: Official website of the app.
- `category`: App category label.
- `appleStoreUrl` / `googlePlayUrl`: Store listings when known.
- `notes`: Any additional information or context about the app.
- `alternateNames`: (Array of Strings) Other names the app might go by that are **not** tool artifact titles.

## Tool Record Structure

Each tool record in the `tools.json` file follows this structure:

- `toolShortName`: A short name identifier for the forensic tool.
- `toolLongName`: The full name of the forensic tool.
- `website`: URL to the tool's homepage or information page.
- `toolVersion`: Version of the tool for artifacts in the database from this tool.
- `toolReleaseDate`: Release date of the tool for artifacts in the database from this tool.
- `icon`: Filename for the tool's icon image. (image file goes in public folder named `tool-logo-[name].png`)
- `artifactListFile`: Filename of the JSON file containing the tool's artifact list. (JSON file placed in `public` folder named `artifacts-[name].json`)
- `mapFile`: Filename of the JSON map joining artifact names to catalog apps. (JSON file placed in `public/maps/` named `{tool}.json`)
- `appNameKey`: Key used in the artifact list JSON file to represent the tool's version of the app name.
- `platformKey`: Key used in the artifact list JSON file for the vendor platform/OS string (currently `Platform` for every tool).
- `documentationLocation`: Location where the tool's supported apps/artifacts documentation can be found.
- `extractionNotes`: Any additional notes regarding the extraction of the artifact information from the tool.

Map files are sorted JSON objects. The value is a catalog `appName`, or an array of names when one artifact covers several apps:

```json
{
  "Runtastic": "Adidas Running / Runtastic",
  "WhatsApp - Messages": "WhatsApp Messenger",
  "Chromium Based Browser": ["Google Chrome", "Brave Browser", "Microsoft Edge"]
}
```
