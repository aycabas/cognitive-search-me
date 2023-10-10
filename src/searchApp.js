const axios = require("axios");
const querystring = require("querystring");
const { TeamsActivityHandler, CardFactory } = require("botbuilder");
const { doPureVectorSearch, doSemanticHybridSearch, doVectorSearchWithFilter } = require("./cogSearch");

class SearchApp extends TeamsActivityHandler {
  constructor() {
    super();
  }

  // Message extension Code
  // Search.
  async handleTeamsMessagingExtensionQuery(context, query) {
    const searchQuery = query.parameters[0].value;
    const response = await doPureVectorSearch(searchQuery);
    const attachments = [];

    for await (const result of response.results) {
      console.log(`Gate Name: ${result.document.GateName}`);
      console.log(`Score: ${result.score}`);
      console.log(`Terminal: ${result.document.Terminal}`);
      console.log(`Airline: ${result.document.Airline}`);
      console.log(`\n`);
      const adaptiveCard = CardFactory.adaptiveCard({
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.4",
        body: [
          {
            type: "TextBlock",
            text: `${result.document.GateName}`,
            wrap: true,
            size: "Large",
          },
          {
            type: "TextBlock",
            text: `${result.document.Terminal}`,
            wrap: true,
            size: "Small",
          },
        ],
      });
      const preview = CardFactory.heroCard(result.document.GateName, result.document.Terminal, ['https://icon-library.com/images/cloud-icon-png/cloud-icon-png-12.jpg']);
      const attachment = { ...adaptiveCard, preview };
      attachments.push(attachment);
    }

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments: attachments,
      },
    };
  }
}

module.exports.SearchApp = SearchApp;
