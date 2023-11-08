function doSomeTest() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/doSomeTest', true);
    var testResult = document.getElementById('testResult');
    testResult.innerHTML = 'Please wait ...';

    // Prompt to be sent in the request body
    var promptText = "Write a short story about a detective investigating a mysterious disappearance.";

    // Prepare the request body containing the prompt
    var requestBody = { prompt: promptText };

    xhr.setRequestHeader('Content-Type', 'application/json'); // Set the Content-Type header

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    testResult.innerHTML = response.message || 'Success'; // Display success message or default
                } catch (error) {
                    testResult.innerHTML = 'Error in parsing server response';
                }
            } else {
                try {
                    var response = JSON.parse(xhr.responseText);
                    testResult.innerHTML = 'Error: ' + (response.error || 'Unknown Error'); // Display error message or default
                } catch (error) {
                    testResult.innerHTML = 'Error in parsing server error response';
                }
            }
        }
    };

    // Convert the JavaScript object to a JSON string and send it as the request body
    xhr.send(JSON.stringify(requestBody));
}