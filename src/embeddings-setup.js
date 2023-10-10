const axios = require("axios");
const fs = require("fs");
const {
  SearchIndexClient,
  SearchClient,
  AzureKeyCredential,
} = require("@azure/search-documents");
const config = require("./config");
const textData = "./data/text-sample.json";
const docsVectors = "./output/docVectors.json";
const queryVector = "./output/queryVector.json";
//Set Azure Cognitive Search parameters from environment variables
const searchServiceEndpoint =config.AZURE_SEARCH_ENDPOINT;
const searchServiceApiKey = config.AZURE_SEARCH_ADMIN_KEY;
const searchIndexName = config.AZURE_SEARCH_INDEX_NAME;
// Set Azure OpenAI API parameters from environment variables
const apiKey = config.AZURE_OPENAI_API_KEY;
const apiBase = config.AZURE_SEARCH_ENDPOINT;
const apiVersion = config.AZURE_OPENAI_API_VERSION;
const deploymentName = config.AZURE_OPENAI_DEPLOYMENT_NAME;

async function setup() {
  // Create Azure Cognitive Search index
  try {
    await createSearchIndex();
  } catch (err) {
    console.log(`Failed to create ACS index: ${err.message}`);
  }

  // Generate document embeddings and upload to Azure Cognitive Search
  try {
    const docs = await generateDocumentEmbeddings();
    await uploadDocuments(docs);
  } catch (err) {
    console.log(`Failed to generate embeddings and upload documents to ACS: ${err.message}`);
  }

  // User input query
  const userQuery = "what azure services support full text search";

  // Generate embedding for the user query
  console.log("Generating query embedding with Azure OpenAI...");
  const queryEmbedding = await generateQueryAIEmbedding(userQuery);
  console.log("Query embedding:", queryEmbedding);

  // Output query embedding to queryVector.json file
  fs.writeFileSync(queryVector, JSON.stringify(queryEmbedding));
  console.log("Success! See output/queryVector.json");
}

async function generateDocumentEmbeddings() {
    console.log("Reading data/text-sample.json...");
    const inputData = JSON.parse(
      fs.readFileSync(textData, "utf-8")
    );
  
    console.log("Generating embeddings with Azure OpenAI...");
    const outputData = [];
    for (const item of inputData) {
      const titleEmbeddings = await generateEmbeddings(item.title);
      const contentEmbeddings = await generateEmbeddings(item.content);
  
      outputData.push({
        ...item,
        titleVector: titleEmbeddings,
        contentVector: contentEmbeddings,
      });
    }
  
    fs.writeFileSync(docsVectors, JSON.stringify(outputData));
  
    return outputData;
  }
  
async function createSearchIndex() {
    
    const indexClient = new SearchIndexClient(
      searchServiceEndpoint,
      new AzureKeyCredential(searchServiceApiKey)
    );
  
    const index = {
      name: searchIndexName,
      fields: [
        {
          name: "id",
          type: "Edm.String",
          key: true,
          sortable: true,
          filterable: true,
          facetable: true,
        },
        { name: "title", type: "Edm.String", searchable: true },
        { name: "content", type: "Edm.String", searchable: true },
        {
          name: "category",
          type: "Edm.String",
          filterable: true,
          searchable: true,
        },
        {
          name: "titleVector",
          type: "Collection(Edm.Single)",
          searchable: true,
          vectorSearchDimensions: 1536,
          vectorSearchConfiguration: "my-vector-config",
        },
        {
          name: "contentVector",
          type: "Collection(Edm.Single)",
          searchable: true,
          vectorSearchDimensions: 1536,
          vectorSearchConfiguration: "my-vector-config",
        },
      ],
      vectorSearch: {
        algorithmConfigurations: [
          {
            name: "my-vector-config",
            kind: "hnsw",
            parameters: {
              m: 4,
              efConstruction: 400,
              efSearch: 500,
              metric: "cosine",
            },
          },
        ],
      },
      semanticSettings: {
        configurations: [
          {
            name: "my-semantic-config",
            prioritizedFields: {
              prioritizedContentFields: [{ name: "content" }],
              prioritizedKeywordsFields: [{ name: "category" }],
              titleField: {
                name: "title",
              },
            },
          },
        ],
      },
    };
  
    console.log("Creating ACS index...");
   // if(indexClient.searchIndexName(searchIndexName) == null) {
    await indexClient.createOrUpdateIndex(index);
    //}
  }
  
async function uploadDocuments(docs) {
  
    const searchClient = new SearchClient(
      searchServiceEndpoint,
      searchIndexName,
      new AzureKeyCredential(searchServiceApiKey)
    );
  
    console.log("Uploading documents to ACS index...");
    await searchClient.uploadDocuments(docs);
  }

// Function to generate query embeddings using Azure Open AI
async function generateQueryAIEmbedding(input) {
  
    try {
      const response = await axios.post(
        `${apiBase}/openai/deployments/${deploymentName}/embeddings?api-version=${apiVersion}`,
        {
          input,
          engine: "text-embedding-ada-002",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": apiKey,
          },
        }
      );
  
      const embedding = response.data.data[0].embedding;
      return embedding;
    } catch (error) {
      console.error("Error generating query embedding: ", error.message);
      throw error;
    }
  }

async function generateEmbeddings(text) {

  
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
setup();