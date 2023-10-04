# Message Extension with Vector Search (Azure Cognitive Search) and Azure OpenAI

This app template is a search-based [message extension](https://docs.microsoft.com/microsoftteams/platform/messaging-extensions/what-are-messaging-extensions?tabs=nodejs) that allows users to search an external system and share results through the compose message area of the Microsoft Teams client. You can now build and run your search-based message extensions in Teams, Outlook for Windows desktop and web experiences.

## Get started with the template

> **Prerequisites**
>
> To run the template in your local dev machine, you will need:
>
> - [Node.js](https://nodejs.org/), supported versions: 16, 18
> - A [Microsoft 365 account for development](https://docs.microsoft.com/microsoftteams/platform/toolkit/accounts)
> - [Set up your dev environment for extending Teams apps across Microsoft 365](https://aka.ms/teamsfx-m365-apps-prerequisites)
> Please note that after you enrolled your developer tenant in Office 365 Target Release, it may take couple days for the enrollment to take effect.
> - [Teams Toolkit Visual Studio Code Extension](https://aka.ms/teams-toolkit) version 5.0.0 and higher or [Teams Toolkit CLI](https://aka.ms/teamsfx-cli)
> - [Azure Subscription](https://portal.azure.com)

### Setup and vectorization
1. Create Azure OpenAI service on Azure with `text-embeddings-ada-002` deployment model: [Create and deploy an Azure OpenAI Service resource](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource?pivots=web-portal) 
1. Create Azure Cognitive Search on Azure: (Create an Azure Cognitive Search service in the portal)[https://learn.microsoft.com/en-us/azure/search/search-create-service-portal]
1. Go to `src > embeddings-setup.js` file in the project and replace the following environment variables with your Azure OpenAI and Cognitive Search variables:
   ```javascript
   //Set Azure Cognitive Search parameters from environment variables
   const searchServiceEndpoint = "<your-azure-search-service-endpoint>";
   const searchServiceApiKey = "<your-azure-search-service-api-key>";
   const searchIndexName = "<your-azure-search-index-name>";
   // Set Azure OpenAI API parameters from environment variables
   const apiKey = "<your-azure-openai-api-key>";
   const apiBase = `<your-azure-openai-api-endpoint>`;
   const apiVersion = "2023-05-15";
   const deploymentName = "<your-azure-openai-deployment-name>";
   ```
1. Run the following statement in the command line to generate embeddings for a documents payload for indexing and also generate an embedding for a vector query:
   ```bash
   node src/embeddings-setup.js
   ```

### Debug the message extension on Teams
1. Go to **env** folder in your project root and rename `.env.local.user.sample` to `.env.local.user`. Also rename `.env.local.sample` to `.env.local` and replace the the following environment variables with your Azure OpenAI and Cognitive Search variables:
   ```
   AZURE_OPENAI_SERVICE_NAME=
   AZURE_OPENAI_DEPLOYMENT_NAME=
   AZURE_OPENAI_API_VERSION=
   AZURE_OPENAI_API_KEY=
   AZURE_SEARCH_ENDPOINT=
   AZURE_SEARCH_ADMIN_KEY=
   AZURE_SEARCH_INDEX_NAME=
   ```
1. Select the Teams Toolkit icon on the left in the VS Code toolbar.
2. In the Account section, sign in with your [Microsoft 365 account](https://docs.microsoft.com/microsoftteams/platform/toolkit/accounts) if you haven't already.
3. Press F5 to start debugging which launches your app in Teams using a web browser. Select `Debug (Edge)` or `Debug (Chrome)`.
4. When Teams launches in the browser, select the Add button in the dialog to install your app to Teams.
5. To trigger the Message Extension, you can search for "tools for software development" or search in another language, this search should work multilingual.
6. To test out the filter capability with vector search, go to `src > searchApp.js` and replace `doPureVectorSearch` in line 15 with `doVectorSearchWithFilter`. Search for the same query as above and observe more refined answer in response.
7. To test out Hybrid search with vector and semantic, go to `src > searchApp.js` and replace `doPureVectorSearch` in line 15 with `doSemanticHybridSearch`. Search for "Scalable storage solutions" and observe refined answer in response.

**Congratulations**! You are running an application that can now search npm registries in Teams and Outlook.

![vectorsearch](https://github.com/aycabas/cognitive-search-me/assets/36196437/9702b24c-f57e-481a-83cc-9300925a798a)


## What's included in the template

| Folder       | Contents                                            |
| - | - |
| `.vscode/`    | VSCode files for debugging                          |
| `appPackage/` | Templates for the Teams application manifest        |
| `env/`        | Environment files                                   |
| `infra/`      | Templates for provisioning Azure resources          |
| `src/` | The source code for the search application |

The following files can be customized and demonstrate an example implementation to get you started.

| File                                 | Contents                                           |
| - | - |
|`src/searchApp.js`| Handles the business logic for this app template to query npm registry and return result list.|
|`src/index.js`| `index.js` is used to setup and configure the Message Extension.|
|`src/cogSearch.js`| Handles Vector Search functions to retreive response from Azure Cognitive Search.|
|`src/embeddings-setup.js`| `embeddings-setup` is used to setup and configure embeddings for Vector Search in Azure Cognitive Search.|

The following are Teams Toolkit specific project files. You can [visit a complete guide on Github](https://github.com/OfficeDev/TeamsFx/wiki/Teams-Toolkit-Visual-Studio-Code-v5-Guide#overview) to understand how Teams Toolkit works.

| File                                 | Contents                                           |
| - | - |
|`teamsapp.yml`|This is the main Teams Toolkit project file. The project file defines two primary things:  Properties and configuration Stage definitions. |
|`teamsapp.local.yml`|This overrides `teamsapp.yml` with actions that enable local execution and debugging.|

## Extend the template

Following documentation will help you to extend the template.

- [Add or manage the environment](https://learn.microsoft.com/microsoftteams/platform/toolkit/teamsfx-multi-env)
- [Create multi-capability app](https://learn.microsoft.com/microsoftteams/platform/toolkit/add-capability)
- [Add single sign on to your app](https://learn.microsoft.com/microsoftteams/platform/toolkit/add-single-sign-on)
- [Access data in Microsoft Graph](https://learn.microsoft.com/microsoftteams/platform/toolkit/teamsfx-sdk#microsoft-graph-scenarios)
- [Use an existing Azure Active Directory application](https://learn.microsoft.com/microsoftteams/platform/toolkit/use-existing-aad-app)
- [Customize the Teams app manifest](https://learn.microsoft.com/microsoftteams/platform/toolkit/teamsfx-preview-and-customize-app-manifest)
- Host your app in Azure by [provision cloud resources](https://learn.microsoft.com/microsoftteams/platform/toolkit/provision) and [deploy the code to cloud](https://learn.microsoft.com/microsoftteams/platform/toolkit/deploy)
- [Collaborate on app development](https://learn.microsoft.com/microsoftteams/platform/toolkit/teamsfx-collaboration)
- [Set up the CI/CD pipeline](https://learn.microsoft.com/microsoftteams/platform/toolkit/use-cicd-template)
- [Publish the app to your organization or the Microsoft Teams app store](https://learn.microsoft.com/microsoftteams/platform/toolkit/publish)
- [Develop with Teams Toolkit CLI](https://aka.ms/teamsfx-cli/debug)
- [Preview the app on mobile clients](https://github.com/OfficeDev/TeamsFx/wiki/Run-and-debug-your-Teams-application-on-iOS-or-Android-client)
