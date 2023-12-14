// ...

var conversationContext = []; // Array to store conversation messages

function doSomeTest() {
    var testResult = document.getElementById('testResult');
    var promptInput = document.getElementById('promptInput').value.trim();

    if (!promptInput) {
        testResult.innerHTML = 'Please enter a prompt';
        return;
    }

    testResult.innerHTML = 'Please wait ...';

    // Add the user's message to the conversation context
    conversationContext.push({ role: 'user', content: promptInput });

    var requestBody = { messages: conversationContext };

    axios.post('/doSomeTest', requestBody)
        .then(function (response) {
            // Handle success
            var completionContent = response.data.completionContent;
            testResult.innerHTML = completionContent || 'Success';

            // Add the AI's response to the conversation context
            conversationContext.push({ role: 'assistant', content: completionContent });
        })
        .catch(function (error) {
            // Handle error
            console.error('Error during test:', error.message);
            testResult.innerHTML = 'Error: ' + (error.response.data.error || 'Unknown Error');
        });
}
