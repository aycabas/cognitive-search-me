const axios = require("axios");
const fs = require("fs");
const {
  SearchIndexClient,
  SearchClient,
  AzureKeyCredential,
} = require("@azure/search-documents");
const config = require("./config");
const textData = "./data/gate_optimizer_mock_data.json";
const docsVectors = "./output/docVectors.json";
const queryVector = "./output/queryVector.json";
//Set Azure Cognitive Search parameters from environment variables
const searchServiceEndpoint ="";
const searchServiceApiKey = "";
const searchIndexName = "";
// Set Azure OpenAI API parameters from environment variables
const apiKey = "";
const apiBase = "";
const apiVersion = "2023-05-15";
const deploymentName = "";

async function setup() {
  // Create Azure Cognitive Search index
  try {
    await createSearchIndex();
  } catch (err) {
    console.log(`Failed to create ACS index: ${err.message}`);
  }

  // Generate document embeddings and upload to Azure Cognitive Search
  try {
    // Generate document embeddings
    console.log("Generating document embeddings...");
    const docs = await generateDocumentEmbeddings();
      console.log("Document embeddings generated! ");
    // Upload documents to Azure Cognitive Search
    await uploadDocuments(docs);
  } catch (err) {
    console.log(`Failed to generate embeddings and upload documents to ACS: ${err.message}`);
  }

  // User input query
  const userQuery = "Terminal B";

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
  
    console.log("Generating embeddings in generateDocumentEmbeddings...");
    const outputData = [];
    for (const item of inputData) {
      const GateNameEmbeddings = await generateEmbeddings(item.GateName);
      const TerminalEmbeddings = await generateEmbeddings(item.Terminal);
      const AirlineEmbeddings = await generateEmbeddings(item.Airline);
  
      outputData.push({
        ...item,
        GaterNameVector: GateNameEmbeddings,
        TerminalVector: TerminalEmbeddings,
        AirlineVector: AirlineEmbeddings
      });
    }
    console.log("Embeddings generated! "+outputData);
    fs.writeFileSync(docsVectors, JSON.stringify(outputData));
  
    return outputData;
  }
  
async function createSearchIndex() {
    
    const indexClient = new SearchIndexClient(
      searchServiceEndpoint,
      new AzureKeyCredential(searchServiceApiKey)
    );
  
    // https://learn.microsoft.com/en-us/azure/search/search-what-is-an-index
    const index = {
      name: searchIndexName,
      fields: [
        { name: "GateID", type: "Edm.String", searchable: true },
        {
          name: "GateName",
          type: "Edm.String",
          key: true,
          sortable: true,
          filterable: true,
          facetable: true,
        },
        { name: "Terminal", type: "Edm.String", searchable: true, filterable: true },
        { name: "Airline", type: "Edm.String", searchable: true , filterable: true},
        { name: "FlightType", type: "Edm.String", searchable: true },
        { name: "ScheduledDepartureTime", type: "Edm.String", filterable: true },
        { name: "ActualDepartureTime", type: "Edm.String", filterable: true },
        { name: "ScheduledArrivalTime", type: "Edm.String", filterable: true},
        { name: "ActualArrivalTime", type: "Edm.String", filterable: true },
        { name: "Status", type: "Edm.String", searchable: true },
        { name: "OccupancyDuration", type: "Edm.String", searchable: true },
        { name: "CleaningStatus", type: "Edm.String", searchable: true },
        { name: "MaintenanceStatus", type: "Edm.String", searchable: true },
        { name: "CommentsNotes", type: "Edm.String", searchable: true,  filterable: true },
        { name: "Priority", type: "Edm.String", searchable: true },
        { name: "AssignedStaff", type: "Edm.String", searchable: true },
        { name: "GateCapacity", type: "Edm.Int32" },
        { name: "AircraftType", type: "Edm.String", searchable: true },
        { name: "GateResources", type: "Collection(Edm.String)", searchable: true },
        { name: "TurnaroundTime", type: "Edm.String", searchable: true },
        { name: "AircraftStandby", type: "Edm.Boolean" },
        { name: "GateRestrictions", type: "Edm.String", searchable: true },
        {
          name: "GateNameVector",
          type: "Collection(Edm.Single)",
          searchable: true,
          vectorSearchDimensions: 1536,
          vectorSearchConfiguration: "my-vector-config",
        },
        {
          name: "TerminalVector",
          type: "Collection(Edm.Single)",
          searchable: true,
          vectorSearchDimensions: 1536,
          vectorSearchConfiguration: "my-vector-config",
        },
        {
          name: "AirlineVector",
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
              prioritizedContentFields: [{ name: "Terminal" }, { name: "Airline" }],
              prioritizedKeywordsFields: [{ name: "CommentsNotes" }],
              titleField: {
                name: "GateName",
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

  console.log("Generating embeddings in generateEmbeddings...");
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