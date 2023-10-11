# 4n6 App Finder

Have you ever been asked the question: "Can you extract data from *some_app*?" 

This common inquiry among forensic examiners led to the creation of the 4n6 App Finder. The project is primarily focused on mobile applications, but some of the tools provide details about desktop apps in their documentation as well. 

## Using the Project

Check out the live build [here](https://4n6appfinder.habben.net).

This project was not meant to be run on local computers and is designed to run from a live web server. Simply click the link above to get going.

## Contributing

We welcome contributions to make this project more comprehensive and accurate. Here are ways you can help:

1. **Update Core Apps Database**: 
    - Submit an issue or a pull request to update information in `apps-core.json` if an app or its data is missing or outdated.
2. **Map Unlinked Artifacts**:
    - Help map an unmapped artifact to an app by updating the `alternateNames` property in `apps-core.json`.
3. **Add New Forensic Tools**:
    - Know of a forensic tool not listed? Submit an issue to discuss its inclusion and how it supports artifact extraction.

Your insights and expertise will help make 4n6 App Finder a valuable resource for the digital forensics community!

## Core Apps Database Structure (`apps-core.json`)

Each record in the `apps-core.json` file represents an app and follows this structure:

- `appName`: (String) The official name of the app.
- `icon`: (String) Link to an icon image for the app.
- `appWebsite`: (String) Official website of the app.
- `appleStoreUrl`: (String) URLs to the app on various app stores.
- `googlePlayUrl`: (String) URLs to the app on various app stores.
- `notes`: (String) Any additional information or context about the app.
- `alternateNames`: (Array) Other names or aliases the app might go by.

This structure helps to organize information about each app in a consistent manner, making data retrieval straightforward.

## Tool Record Structure

Each tool record in the `tools.json` file follows this structure:

- `toolShortName`: A short name identifier for the forensic tool.
- `toolLongName`: The full name of the forensic tool.
- `website`: URL to the tool's homepage or information page.
- `toolVersion`: Version of the tool for artifacts in the database from this tool.
- `toolReleaseDate`: Release date of the tool for artifacts in the database from this tool.
- `icon`: Filename for the tool's icon image. (image file goes in public folder named `tool-logo-[name].png`)
- `artifactListFile`: Filename of the JSON file containing the tool's artifact list. (JSON file placed in `public` folder named `artifacts-[name].json`)
- `appNameKey`: Key used in the artifact list JSON file to represent the tools version of the app name.
- `documentationLocation`: Location where the tool's supported apps/artifacts documentation can be found.
- `extractionNotes`: Any additional notes regarding the extraction of the artifact information from the tool.

Each tool has its own associated artifact list file, which is referenced in the `artifactListFile` field. The `appNameKey` field specifies the key that is used within the artifact list file to identify the app name.
