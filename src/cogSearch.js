const axios = require("axios");
const fs = require("fs");
const {
  SearchClient,
  AzureKeyCredential,
} = require("@azure/search-documents");
const config = require("./config");

// Try multilingual
//const query = "yazılım geliştiriciler için ürünler";
async function doPureVectorSearch(query) {

  const searchServiceEndpoint = config.AZURE_SEARCH_ENDPOINT;
  const searchServiceApiKey = config.AZURE_SEARCH_ADMIN_KEY;
  const searchIndexName = config.AZURE_SEARCH_INDEX_NAME;

  const searchClient = new SearchClient(
    searchServiceEndpoint,
    searchIndexName,
    new AzureKeyCredential(searchServiceApiKey)
  );

  //const query = "tools for software development";
  const response = await searchClient.search(undefined, {
    //Cross field vector search
    vector: {
      value: await generateEmbeddings(query),
      kNearestNeighborsCount: 3,
      fields: ["contentVector"],
    },
    select: ["title", "content", "category"],
  });
  return response;
}

async function doPureVectorSearchMultilingual(query) {

  const searchServiceEndpoint = config.AZURE_SEARCH_ENDPOINT;
  const searchServiceApiKey = config.AZURE_SEARCH_ADMIN_KEY;
  const searchIndexName = config.AZURE_SEARCH_INDEX_NAME;

  const searchClient = new SearchClient(
    searchServiceEndpoint,
    searchIndexName,
    new AzureKeyCredential(searchServiceApiKey)
  );

  // e.g 'tools for software development' in Dutch)
  //const query = "yazılım geliştiriciler için ürünler";
  const response = await searchClient.search(undefined, {
    vector: {
      value: await generateEmbeddings(query),
      kNearestNeighborsCount: 3,
      fields: ["contentVector"],
    },
    select: ["title", "content", "category"],
  });

  console.log(`\nPure vector search (multilingual) results:`);
  for await (const result of response.results) {
    console.log(`Title: ${result.document.title}`);
    console.log(`Score: ${result.score}`);
    console.log(`Content: ${result.document.content}`);
    console.log(`Category: ${result.document.category}`);
    console.log(`\n`);
  }

  return response;
}

async function doCrossFieldVectorSearch(query) {

  const searchServiceEndpoint = config.AZURE_SEARCH_ENDPOINT;
  const searchServiceApiKey = config.AZURE_SEARCH_ADMIN_KEY;
  const searchIndexName = config.AZURE_SEARCH_INDEX_NAME;

  const searchClient = new SearchClient(
    searchServiceEndpoint,
    searchIndexName,
    new AzureKeyCredential(searchServiceApiKey)
  );

  //const query = "tools for software development";
  const response = await searchClient.search(undefined, {
    vector: {
      value: await generateEmbeddings(query),
      kNearestNeighborsCount: 3,
      fields: ["titleVector", "contentVector"],
    },
    select: ["title", "content", "category"],
  });

    return response;
}

async function doVectorSearchWithFilter(query) {

  const searchServiceEndpoint = config.AZURE_SEARCH_ENDPOINT;
  const searchServiceApiKey = config.AZURE_SEARCH_ADMIN_KEY;
  const searchIndexName = config.AZURE_SEARCH_INDEX_NAME;

  const searchClient = new SearchClient(
    searchServiceEndpoint,
    searchIndexName,
    new AzureKeyCredential(searchServiceApiKey)
  );

  //const query = "tools for software development";
  const response = await searchClient.search(undefined, {
    vector: {
      value: await generateEmbeddings(query),
      kNearestNeighborsCount: 3,
      fields: ["contentVector"],
    },
    filter: "category eq 'Developer Tools'",
    select: ["title", "content", "category"],
  });

    return response;
}

async function doHybridSearch(query) {

  const searchServiceEndpoint = config.AZURE_SEARCH_ENDPOINT;
  const searchServiceApiKey = config.AZURE_SEARCH_ADMIN_KEY;
  const searchIndexName = config.AZURE_SEARCH_INDEX_NAME;

  const searchClient = new SearchClient(
    searchServiceEndpoint,
    searchIndexName,
    new AzureKeyCredential(searchServiceApiKey)
  );

  //const query = "scalable storage solution";
  const response = await searchClient.search(query, {
    vector: {
      value: await generateEmbeddings(query),
      kNearestNeighborsCount: 3,
      fields: ["contentVector"],
    },
    select: ["title", "content", "category"],
    top: 3,
  });

  console.log(`\nHybrid search results:`);
  for await (const result of response.results) {
    console.log(`Title: ${result.document.title}`);
    console.log(`Score: ${result.score}`);
    console.log(`Content: ${result.document.content}`);
    console.log(`Category: ${result.document.category}`);
    console.log(`\n`);
  }

    return response;
}

async function doSemanticHybridSearch(query) {

  const searchServiceEndpoint = config.AZURE_SEARCH_ENDPOINT;
  const searchServiceApiKey = config.AZURE_SEARCH_ADMIN_KEY;
  const searchIndexName = config.AZURE_SEARCH_INDEX_NAME;

  const searchClient = new SearchClient(
    searchServiceEndpoint,
    searchIndexName,
    new AzureKeyCredential(searchServiceApiKey)
  );

  //const query = "what is azure sarch?";
  const response = await searchClient.search(query, {
    vector: {
      value: await generateEmbeddings(query),
      kNearestNeighborsCount: 3,
      fields: ["contentVector"],
    },
    select: ["title", "content", "category"],
    queryType: "semantic",
    queryLanguage: "en-us",
    semanticConfiguration: "my-semantic-config",
    captions: "extractive",
    answers: "extractive",
    top: 3,
  });

  console.log(`\nSemantic Hybrid search results:`);
  for await (const answer of response.answers) {
    if (answer.highlights) {
      console.log(`Semantic answer: ${answer.highlights}`);
    } else {
      console.log(`Semantic answer: ${answer.text}`);
    }

    console.log(`Semantic answer score: ${answer.score}\n`);
  }

  for await (const result of response.results) {
    console.log(`Title: ${result.document.title}`);
    console.log(`Content: ${result.document.content}`);
    console.log(`Category: ${result.document.category}`);

    if (result.captions) {
      const caption = result.captions[0];
      if (caption.highlights) {
        console.log(`Caption: ${caption.highlights}`);
      } else {
        console.log(`Caption: ${caption.text}`);
      }
    }

    console.log(`\n`);
    return response;
  }
}

async function generateEmbeddings(text) {
  // Set Azure OpenAI API parameters from environment variables
  const apiKey = config.AZURE_OPENAI_API_KEY;
  const apiBase = `https://${config.AZURE_OPENAI_SERVICE_NAME}.openai.azure.com`;
  const apiVersion = config.AZURE_OPENAI_API_VERSION;
  const deploymentName = config.AZURE_OPENAI_DEPLOYMENT_NAME;

  const response = await axios.post(
    `${apiBase}/openai/deployments/${deploymentName}/embeddings?api-version=${apiVersion}`,
    {
      input: text,
      engine: "text-embedding-ada-002",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
    }
  );

  const embeddings = response.data.data[0].embedding;
  return embeddings;
}
  
module.exports = { doPureVectorSearch, doPureVectorSearchMultilingual, doCrossFieldVectorSearch, doVectorSearchWithFilter, doHybridSearch, doSemanticHybridSearch};
