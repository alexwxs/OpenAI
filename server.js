'use strict';

const { OpenAI } = require('openai');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const port = 1339;
const maxWaitTime = 30000; // 30 seconds
const fs = require('fs');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        // Rename the file with the thread ID and original file extension
        const fileName = file.originalname.replace(/\s/g, '');;
        cb(null, fileName);
    }
});
const upload = multer({ storage: storage });

let thread = null;

const openAIConfig = {
    organization: 'org-XPt4NWJfMGbWuUcJpa3XybdO',
    apiKey: process.env.OPENAI_API_KEY,
};

const openai = new OpenAI({ apiKey: openAIConfig.apiKey });

app.use(bodyParser.json());

// Serve static files directly without a custom route handler
app.use(express.static('public'));

// Custom route handler for serving index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/onPageLoadAction', async (req, res) => {
    try {
        const newThread = await openai.beta.threads.create();
        thread = newThread;
        console.log('Thread created successfully. Thread ID:', newThread.id);
        res.status(200).json({ message: 'Thread created successfully', threadId: newThread.id });
    } catch (error) {
        console.error('Error creating thread:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/generateCompletion', async (req, res) => {
    console.log('Request Received: ' + req.url);
    try {
        const assistant = await openai.beta.assistants.create({
            name: 'Code Interpreter',
            instructions: 'You are a code interpreter',
            tools: [{ type: 'code_interpreter' }],
            model: 'gpt-3.5-turbo-1106'
        });

        const lastUserMessage = req.body.lastMessage;

        if (!lastUserMessage || !lastUserMessage.content) {
            throw new Error('Invalid or missing user prompt');
        }
        await openai.beta.threads.messages.create(thread.id, lastUserMessage);

        let run = await openai.beta.threads.runs.create(
            thread.id,
            {
                assistant_id: assistant.id,
                instructions: 'You are a code interpreter'
            }
        );

        const startTime = Date.now();

        while (run.status !== 'completed' && (Date.now() - startTime) < maxWaitTime) {
            await sleep(1000); // Adjust the interval based on your needs
            run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }

        if (run.status !== 'completed') {
            throw new Error('Timeout waiting for assistant response');
        }

        const messages = await openai.beta.threads.messages.list(thread.id);
        const assistantResponseContent = messages.data[0].content[0].text.value;

        if (assistantResponseContent) {
            console.log('Assistant response Content Received');
        }

        res.status(200).json({ content: assistantResponseContent });
    } catch (error) {
        console.error('Error during assistant response generation:', error.message);
        res.status(500).json({ error: error.message });
    }
});


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const fileName = `${thread.id}${path.extname(file.originalname)}`;

        // Create a readable stream from the file
        const fileStream = fs.createReadStream(file.path);

        // Uploading the file to OpenAI
        console.log('Starting file upload to OpenAI');
        const fileForRetrieval = await openai.files.create({
            file: fileStream,
            purpose: 'assistants',
        });
        console.log(`File uploaded, ID: ${fileForRetrieval.id}`);

        // Respond with the file ID
        res.status(200).json({ success: true, fileId: fileForRetrieval.id });
    } catch (error) {
        // Log and respond to any errors during the upload process
        console.error('Error uploading file:', error);
        res.status(500).json({ success: false, message: 'Error uploading file' });
    }
});

// Route to get the list of files from OpenAI
app.get('/fileList', async (req, res) => {
    try {
        // Fetch the list of files from OpenAI
        const fileList = await openai.files.list();

        // Respond with the list of files
        res.status(200).json({ fileList });
    } catch (error) {
        console.error('Error fetching file list:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/deleteFile/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;

        // Implement logic to delete the file with fileId from your storage (e.g., OpenAI API)
        await openai.files.del(fileId);

        // Send a success response
        res.status(200).json({ success: true, message: `File ${fileId} deleted successfully` });
    } catch (error) {
        console.error('Error deleting file:', error.message);
        res.status(500).json({ success: false, message: 'Error deleting file' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
