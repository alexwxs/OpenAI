'use strict';

const { OpenAI } = require('openai');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const port = 1339;

const openAIConfig = {
    organization: 'org-XPt4NWJfMGbWuUcJpa3XybdO',
    apiKey: process.env.OPENAI_API_KEY,
};

const openai = new OpenAI({ apiKey: openAIConfig.apiKey });

app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generateCompletion', async (req, res) => {
    console.log('Request Received: ' + req.url);
    try {
        const requestData = req.body;

        if (!requestData || !requestData.messages || requestData.messages.length === 0) {
            throw new Error('Invalid or missing conversation context');
        }

        const completion = await openai.chat.completions.create({
            messages: requestData.messages,
            model: "gpt-3.5-turbo",
        });

        const completionContent = completion.choices[0].message.content;
        if (completionContent) {
            console.log('Completion Content Received');
        }
        res.status(200).json({ completionContent });
    } catch (error) {
        console.error('Error during completion generation:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
