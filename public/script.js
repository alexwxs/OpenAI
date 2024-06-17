// script.js

const conversationContext = [];
const maxConversationMessages = 50;
let selectedFileRow = null;
let selectedFileId = null;
let selectedFileName = null;
let file_ids = [];
const deleteFileBtn = document.getElementById('deleteFileBtn');
let generateCompletionBtn = document.getElementById('generateCompletionBtn');

function generateCompletion() {
    const completionContentContainer = document.getElementById('completionContent');
    const userPromptInput = document.getElementById('userPromptInput').value.trim();
    const conversationContainer = document.getElementById('conversation');

    if (!userPromptInput) {
        completionContentContainer.innerHTML = 'Please enter a prompt';
        return;
    }

    completionContentContainer.innerHTML = 'Please wait ...';
    generateCompletionBtn.textContent = 'Please wait ...';
    // Update: Pass only the last message to the server
    // TODO  file_ids should be managed by assisstant in 2.0
   // const lastUserMessage = { role: 'user', content: userPromptInput, file_ids: file_ids };
    const lastUserMessage = { role: 'user', content: userPromptInput};
    conversationContext.push(lastUserMessage);

    // Trim or omit messages if the conversation exceeds the maximum number of messages
    if (conversationContext.length > maxConversationMessages) {
        conversationContext.shift(); // Remove the oldest message
    }

    // Update: Send only the last message to the server
    const requestBody = { lastMessage: lastUserMessage };

    axios.post('/generateCompletion', requestBody)
        .then(function (response) {
            // Handle success
            const completionContent = response.data.content;
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
            generateCompletionBtn.textContent = 'Error occured, please retry ...';
        });
}


function updateConversationUI(container, conversation) {
    container.innerHTML = '';

    conversation.forEach(function (message) {
        if (message.role === 'user') {
            updateConversationUser(container, message);
        } else if (message.role === 'assistant') {
            updateConversationAssistant(container, message);
        }
    });

    addPromptInputAndButton(container);
}

function addPromptInputAndButton(container) {
    // Add userPromptInput
    const userInputTextarea = document.createElement('textarea');
    userInputTextarea.id = 'userPromptInput';
    userInputTextarea.placeholder = 'Enter your prompt text';
    userInputTextarea.rows = 3;
    userInputTextarea.className = 'form-control mb-3'; // Set the value if needed
    container.appendChild(userInputTextarea);

    // Add Ask OpenAI Assistant button
    const askButton = document.createElement('button');
    askButton.onclick = generateCompletion;
    askButton.className = 'btn btn-success mt-3';
    askButton.textContent = 'Ask OpenAI Assistant';
    container.appendChild(askButton);
    generateCompletionBtn = askButton;
}

function updateConversationUser(container, message) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card bg-light mb-3';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    const cardText = document.createElement('p');
    cardText.className = 'card-text text-primary';
    cardText.textContent = message.content;

    cardBody.appendChild(cardText);
    cardDiv.appendChild(cardBody);
    container.appendChild(cardDiv);
}

function updateConversationAssistant(container, message) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card bg-secondary-light mb-3';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    // Split the message content by consecutive backticks
    const contentParts = message.content.split('```');

    // Iterate through the content parts and create cards
    contentParts.forEach((part, index) => {
        if (index % 2 === 0) {
            // Even index parts are outside backticks and should be added as text content
            const cardText = document.createElement('p');
            cardText.className = 'card-text text-secondary';
            // Replace spaces with non-breaking spaces
            cardText.innerHTML = part.replace(/ /g, '&nbsp;');
            cardBody.appendChild(cardText);
        } else {
            // Odd index parts are inside backticks and should be added as code content
            const codeElement = document.createElement('code');
            // Replace spaces with non-breaking spaces within code
            codeElement.innerHTML = part.replace(/ /g, '&nbsp;');
            // Replace '\n' with '<br>' for line breaks within code
            codeElement.innerHTML = codeElement.innerHTML.replace(/\n/g, '<br>');
            cardBody.appendChild(codeElement);
        }
    });

    cardDiv.appendChild(cardBody);
    container.appendChild(cardDiv);
}

document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Upload file
        const response = await axios.post('/upload', formData);
        const fileId = response.data.fileId;

        // Display success message
        alert('File uploaded successfully!');

        // Fetch and display the updated file list
        await updateFileList();

    } catch (error) {
        // Handle upload error
        console.error('Error during file upload:', error.message);
        alert('Error uploading file: ' + (error.response.data.message || 'Unknown Error'));
    }
});

// Function to fetch and update the file list
async function updateFileList() {
    const fileListContainer = document.getElementById('fileListContainer');

    try {
        // Fetch the file list from the server
        const response = await axios.get('/fileList');
        const allFiles = response.data.fileList.data;
        // Filter files with status "processed"
        const fileList = allFiles.filter(file => file.status === 'processed');;
        fileListContainer.innerHTML = '';
        // Update the file list in the UI
        const tableHeaders = ['Filename', 'Created At'];
        generateTable(tableHeaders, fileList, fileListContainer, {
            'ID': fileObj => getProperty(fileObj, 'id'),
            'Filename': fileObj => getProperty(fileObj, 'filename'),
            'Created At': fileObj => {
                const timestamp = getProperty(fileObj, 'created_at') * 1000; // Convert to milliseconds
                return new Date(timestamp).toLocaleString();
            }
        }, fileListCallBack);
    } catch (error) {
        console.error('Error fetching file list:', error.message);
        // Handle error
    }
}

/**
 * Generates an HTML table dynamically.
 * @param {string[]} headerTexts - An array of header texts.
 * @param {Object[]} data - An array of objects containing data.
 * @param {HTMLElement} containerDiv - The container where the table will be appended.
 * @param {Object} [propertyMap={}] - An optional mapping of properties to custom display functions.
 * @param {function} [customCallback=() => {}] - An optional callback function for custom row processing.
 */
function generateTable(headers, data, containerDiv, propertyMap = {}, customCallBack = () => { }) {
    const table = document.createElement('table');

    // Create table header row
    const headerRow = table.insertRow();
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    // Create table rows with data
    data.forEach(item => {
        const row = table.insertRow();
        headers.forEach(prop => {
            const cell = row.insertCell();
            const value = propertyMap[prop] ? propertyMap[prop](item) : getProperty(item, prop);

            if (value instanceof Date) {
                cell.textContent = value.toLocaleString();
            } else {
                cell.textContent = value;
            }
        });

        customCallBack(row, item);
    });

    containerDiv.appendChild(table);
}

function getProperty(obj, prop) {
    // Handle nested properties using dot notation
    const props = prop.split('.');
    let value = obj;
    for (let i = 0; i < props.length; i++) {
        if (value[props[i]] !== undefined) {
            value = value[props[i]];
        } else {
            value = ''; // Property not found
            break;
        }
    }
    return value;
}

function fileListCallBack(row, item) {
    row.addEventListener('click', () => {
        if (selectedFileRow) {
            selectedFileRow.classList.remove('default', 'selected');
        }

        selectedFileId = item.id;
        selectedFileName = item.filename;
        deleteFileBtn.textContent = `Delete File - ${selectedFileName}`;
        deleteFileBtn.disabled = false;
        row.classList.add('selected');
        selectedFileRow = row;
    });
    // Double-click event
    row.addEventListener('dblclick', (event) => {
        event.preventDefault();

        const balloonText = file_ids.includes(item.id)
            ? `${item.filename} is already added to the conversation.`
            : `${item.filename} is added to the conversation.`;

        const balloon = createBalloon(balloonText);
        positionBalloon(balloon, row);
        document.body.appendChild(balloon);

        setTimeout(() => {
            balloon.remove();
        }, 3000);

        if (!file_ids.includes(item.id)) {
            file_ids.push(item.id);
        }
    });
}

// Helper function to create a balloon element
function createBalloon(text) {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    balloon.textContent = text;
    return balloon;
}

// Helper function to position the balloon near the row
function positionBalloon(balloon, row) {
    const rect = row.getBoundingClientRect();
    balloon.style.top = `${rect.top + window.scrollY}px`;
    balloon.style.left = `${rect.right + window.scrollX}px`;
}

function enableUploadButton() {
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');

    // Enable the button if a file is selected, otherwise disable it
    uploadButton.disabled = !fileInput.files || fileInput.files.length === 0;
}

async function deleteFile() {
    try {
        // Send a DELETE request to the server to delete the file
        const response = await axios.delete(`/deleteFile/${selectedFileId}`);

        // Check the response and handle accordingly
        if (response.data.success) {
            alert('File deleted successfully');
            // Call the function to update the file list
            updateFileList();
        } else {
            alert('Error deleting file:', response.data.message);
            // Handle error
        }
    } catch (error) {
        alert('Error deleting file:', error.message);
        // Handle error
    }
}

async function createNewThreadAndAssistant() {
    try {
        // Send a POST request to the server to create a new thread and assistant
        const response = await axios.post('/create-new-thread-and-assistant');

        // Update the UI with the new thread and assistant information
        updateUI();
    } catch (error) {
        console.error('Error creating new thread and assistant:', error);
    }
}

async function updateUI() {
    try {
        const response = await axios.get('/thread-and-assistant');
        const { threadId, assistantId } = response.data;

        // Update the thread ID and assistant ID in the UI
        document.getElementById('threadId').textContent = threadId;
        document.getElementById('assistantId').textContent = assistantId;
    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

document.addEventListener('DOMContentLoaded', updateUI);