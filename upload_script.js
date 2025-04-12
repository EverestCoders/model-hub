// const fs = require('fs');
// const axios = require('axios');
// const FormData = require('form-data');
// const path = require('path');

// async function uploadModelWithMetadata() {
//   try {
//     // Create form data
//     const form = new FormData();
    
//     // Add all the metadata fields
//     form.append('name', 'Google/Flan-T5-small');
//     form.append('description', 'If you already know T5, FLAN-T5 is just better at everything. For the same number of parameters, these models have been fine-tuned on more than 1000 additional tasks covering also more languages. Here is the Github Repo https://github.com/google-research/t5x');
//     form.append('licenseType', 'Apache 2.0');
//     form.append('commercialUse', 'true');
//     form.append('attributionRequired', 'true');
//     form.append('royaltyPercentage', '0');
//     form.append('category', 'language, text, NLP, multilingual');
//     form.append('tags', 'NLP, AI, Google, Text');
//     form.append('parameters', '78000000');
    
//     // Add the model files
//     const tokenizerPath = path.join(__dirname, 'flanT5/tokenizer.json');
//     const modelPath = path.join(__dirname, 'flanT5/model.safetensors');
//     const configJsonPath = path.join(__dirname, 'flanT5/config.json');
//     const readmeMdPath = path.join(__dirname, 'flanT5/README.md');
//     const tokenizerConfigJsonPath = path.join(__dirname,'flanT5/tokenizer_config.json');
    

//     form.append('modelFile', fs.createReadStream(tokenizerPath), 'tokenizer.json');
//     form.append('modelFile', fs.createReadStream(modelPath), 'model.safetensors');
    
//     // Set headers
//     const headers = {
//       ...form.getHeaders(),
//       // Add any authentication headers if needed
//       // 'Authorization': 'Bearer your_token_here',
//     };
    
//     // Make the request
//     const response = await axios.post('http://localhost:3002/api/models', form, {
//       headers: headers,
//     });
    
//     console.log('Status:', response.status);
//     console.log('Response:', response.data);
//   } catch (error) {
//     console.error('Error:', error.message);
//     if (error.response) {
//       console.error('Response status:', error.response.status);
//       console.error('Response data:', error.response.data);
//     }
//   }
// }

// // Run the function
// uploadModelWithMetadata();

const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

async function uploadModelWithMetadata() {
  // Start timing
  const startTime = Date.now();
  console.log(`Starting upload at ${new Date(startTime).toISOString()}`);
  
  try {
    // Create form data
    const form = new FormData();
    
    // Add all the metadata fields
    form.append('name', 'google-bert/bert-base-uncased');
    form.append('description', 'BERT is a transformers model pretrained on a large corpus of English data in a self-supervised fashion. This means it was pretrained on the raw texts only, with no humans labeling them in any way (which is why it can use lots of publicly available data) with an automatic process to generate inputs and labels from those texts.');
    form.append('licenseType', 'Apache 2.0');
    form.append('commercialUse', 'true');
    form.append('attributionRequired', 'true');
    form.append('royaltyPercentage', '0');
    form.append('category', 'language, text, NLP');
    form.append('tags', 'NLP, AI, Google, Text');
    form.append('parameters', '110000000');
    
    // Folder containing model files
    const modelFolderPath = path.join(__dirname, 'flanT5');
    
    // Read all files from the folder
    console.log(`Reading files from ${modelFolderPath}`);
    const files = fs.readdirSync(modelFolderPath);
    
    // Add each file to the form
    files.forEach(file => {
      const filePath = path.join(modelFolderPath, file);
      // Check if it's a file (not a directory)
      if (fs.statSync(filePath).isFile()) {
        console.log(`Adding file: ${file}`);
        form.append('modelFile', fs.createReadStream(filePath), file);
      }
    });
    
    // Log when files are added
    console.log(`Files added to form at ${new Date().toISOString()}`);
    
    // Set headers
    const headers = {
      ...form.getHeaders(),
      // Add any authentication headers if needed
      // 'Authorization': 'Bearer your_token_here',
    };
    
    // Make the request
    console.log(`Sending request at ${new Date().toISOString()}`);
    const response = await axios.post('http://localhost:3002/api/models', form, {
      headers: headers,
    });
    console.log("response ---------------------------------------------------- \n",response);
    // End timing
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds
    
    console.log(`Request completed at ${new Date(endTime).toISOString()}`);
    console.log(`Total time taken: ${duration.toFixed(2)} seconds`);
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    // End timing even if there's an error
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds
    
    console.error(`Error occurred after ${duration.toFixed(2)} seconds`);
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run the function
uploadModelWithMetadata();