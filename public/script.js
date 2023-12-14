// script.js

const conversationContext = [];
const maxConversationMessages = 50;

function generateCompletion() {
    const completionContentContainer = document.getElementById('completionContent');
    const userPromptInput = document.getElementById('userPromptInput').value.trim();
    const conversationContainer = document.getElementById('conversation');

    if (!userPromptInput) {
        completionContentContainer.innerHTML = 'Please enter a prompt';
        return;
    }

    completionContentContainer.innerHTML = 'Please wait ...';

    // Add the user's message to the conversation context
    conversationContext.push({ role: 'user', content: userPromptInput });

    // Trim or omit messages if the conversation exceeds the maximum number of messages
    if (conversationContext.length > maxConversationMessages) {
        conversationContext.shift(); // Remove the oldest message
    }

    const requestBody = { messages: conversationContext };

    axios.post('/generateCompletion', requestBody)
        .then(function (response) {
            // Handle success
            const completionContent = response.data.completionContent;
            completionContentContainer.innerHTML = completionContent || 'Success';

            // Add the AI's response to the conversation context
            conversationContext.push({ role: 'assistant', content: completionContent });

            // Update the conversation history in the UI
            updateConversationUI(conversationContainer, conversationContext);
        })
        .catch(function (error) {
            // Handle error
            console.error('Error during completion generation:', error.message);
            completionContentContainer.innerHTML = 'Error: ' + (error.response.data.error || 'Unknown Error');
        });
}

function updateConversationUI(container, conversation) {
    container.innerHTML = '';

    conversation.forEach(function (message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = message.role === 'user' ? 'user-message' : 'assistant-message';
        messageDiv.textContent = message.content;
        container.appendChild(messageDiv);
    });
}
