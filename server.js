'use strict';
const {OpenAI} = require('openai');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser'); // Import body-parser
const axios = require('axios');
const app = express();
const port = 1339;
const openAIConfig = {
    organization: "org-jhJjg4qxgeGnbpDbj7jEgRYy",
    apiKey: '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',
};

const openai = new OpenAI({ apiKey: openAIConfig.apiKey });

// Body-parser middleware to handle JSON data
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/doSomeTest', async (req, res) => {
    console.log('Request Received: ' + req.url);
    try {
        const requestData = req.body;

        if (!requestData || !requestData.prompt) {
            throw new Error('Invalid or missing prompt');
        }

        const prompt = requestData.prompt;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: `${prompt}` }],
            model: "gpt-3.5-turbo",
        });

        res.status(200).json({ openAIResponse: completion.choices[0].text });
    } catch (error) {
        console.error('Error during test:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
