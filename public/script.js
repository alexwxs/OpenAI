// script.js

const conversationContext = [];
const maxConversationMessages = 50;
let selectedFileRow = null;
let selectedFileId = null;
let selectedFileName = null;
const deleteFileBtn = document.getElementById('deleteFileBtn');

function generateCompletion() {
    const completionContentContainer = document.getElementById('completionContent');
    const userPromptInput = document.getElementById('userPromptInput').value.trim();
    const conversationContainer = document.getElementById('conversation');

    if (!userPromptInput) {
        completionContentContainer.innerHTML = 'Please enter a prompt';
        return;
    }

    completionContentContainer.innerHTML = 'Please wait ...';

    // Update: Pass only the last message to the server
    const lastUserMessage = { role: 'user', content: userPromptInput };
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
        });
}


function updateConversationUIbak(container, conversation) {
    container.innerHTML = '';

    conversation.forEach(function (message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = message.role === 'user' ? 'user-message' : 'assistant-message';
        messageDiv.textContent = message.content;
        container.appendChild(messageDiv);
    });
}

function updateConversationUI(container, conversation) {
    container.innerHTML = '';

    conversation.forEach(function (message) {
        const cardDiv = document.createElement('div');
        cardDiv.className = message.role === 'user' ? 'card bg-light mb-3' : 'card bg-secondary-light mb-3';

        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const cardText = document.createElement('p');
        cardText.className = message.role === 'user' ? 'card-text text-primary' : 'card-text text-secondary';
        cardText.textContent = message.content;

        cardBody.appendChild(cardText);
        cardDiv.appendChild(cardBody);
        container.appendChild(cardDiv);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    axios.get('/onPageLoadAction')
        .then(response => console.log('Action on page load successful:', response.data))
        .catch(error => console.error('Error during page load action:', error.message));
});

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