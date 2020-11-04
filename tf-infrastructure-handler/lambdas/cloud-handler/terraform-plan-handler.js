const request = require('request');

// This will send a request to Terraform Cloud to trigger a new plan
async function sendTerraformRequest(jsonRequest, actionType, workspaceName, organisationName) {
    return new Promise((resolve) => {
        request({
            url: 'https://app.terraform.io/api/v2/runs',
            method: 'POST',
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${process.env.TF_CLOUD_TEAM_KEY}`
            },
            body: jsonRequest
        }, (error, response, body) => {
            if (error) {
                console.error(body);
                resolve(body);
            } else if (response.statusCode != 201) {
                console.error(`HTTP Error: ${response.statusCode} - ${response.statusMessage}\n${body}`);
                resolve(response);
            } else {
                const jsonBody = JSON.parse(body);
                // const run_id = jsonBody.data.id
                // const urlLogs = `https://app.terraform.io/app/${organisationName}/workspaces/${workspaceName}/runs/${run_id}`;
                resolve(jsonBody);
            }
        });
    });
}

// This will create the json body object required by Terraform Cloud to create a new run.
exports.createJsonPlanMessage = async function(isDestroy, message, workspaceId, actionType, workspaceName, organisationName) {
    return new Promise((resolve) => {
        let jsonObject = {
            'data': {
                'attributes': {
                    'isDestroy': isDestroy,
                    'message': message
                },
                'type': 'runs',
                'relationships': {
                    'workspace': {
                        'data': {
                            'type': 'workspace',
                            'id': workspaceId,
                        }
                    }
                }
            }
        };
        let returnValue = (JSON.stringify(jsonObject));
        const sendTerraformApi = sendTerraformRequest(returnValue, actionType, workspaceName, organisationName);
        sendTerraformApi.then((result) => {
            resolve(result);
        });
    });
}