function doSomeTest() {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/doSomeTest', true);
    var testResult = document.getElementById('testResult');
    testResult.innerHTML = 'Please wait ...';

    var promptInput = document.getElementById('promptInput').value; // Get the user-entered prompt text

    // Prepare the request body containing the user's entered prompt
    var requestBody = { prompt: promptInput };

    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    testResult.innerHTML = response.completionContent || 'Success'; // Display completion content or default
                } catch (error) {
                    testResult.innerHTML = 'Error in parsing server response';
                }
            } else {
                try {
                    var response = JSON.parse(xhr.responseText);
                    testResult.innerHTML = 'Error: ' + (response.error || 'Unknown Error');
                } catch (error) {
                    testResult.innerHTML = 'Error in parsing server error response';
                }
            }
        }
    };

    xhr.send(JSON.stringify(requestBody));
}