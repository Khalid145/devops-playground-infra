const request = require('request');

// This will send a request to Terraform Cloud to trigger a new plan
async function sendTerraformVariableRequest(jsonRequest, variableId) {
    return new Promise((resolve) => {
        request({
            url: `https://app.terraform.io/api/v2/vars/${variableId}`,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${process.env.TF_CLOUD_TEAM_KEY}`
            },
            body: jsonRequest
        }, (error, response, body) => {
            if (error) {
                console.error(body);
                resolve(body);
            } else if (response.statusCode == 500) {
                console.error(body);
                resolve(body);
            } else {
                const jsonBody = JSON.parse(body);
                // console.log(jsonBody);
                resolve('success');
            }
        });
    });
}

// This will create the json body object required by Terraform Cloud to update Terraform Variables.
exports.createJsonVariableMessage = async function(variableId, variableKey, variableName) {
    return new Promise((resolve) => {
        let jsonObject = {
            'data': {
                "id": variableId,
                "attributes": {
                    "key": variableKey,
                    "value": variableName,
                    "category": "terraform",
                    "hcl": false,
                    "sensitive": false
                }
            }
        };
        let returnValue = (JSON.stringify(jsonObject));
        const sendTerraformVariableRequestApi = sendTerraformVariableRequest(returnValue, variableId);
        sendTerraformVariableRequestApi.then((result) => {
            resolve(result);
        });
    });
}