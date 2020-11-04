const request = require('request');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
var docClient = new AWS.DynamoDB.DocumentClient();
const uuidv4 = require('uuid/v4');

const vpcWorkspaceId = 'ws-9cNPf39s4376pbUo';
const nachosWorkspaceId = 'ws-mcuoVvqo9BiZQUnP';

const applyTerraformMessage = 'Apply Plan From Lambda function.';
const destroyTerraformMessage = 'Destroy Plan From Lambda function.'

const cloudEventdbTableName = process.env.EVENT_DB_TABLE_NAME;
const cloudInstancedbTableName = process.env.INSTANCE_DB_TABLE_NAME;

const instanceRootUsername = 'playground';
const instanceRootPassword = 'PandaPlay.19';

const guacamoleWebClientUrl = 'http://guacamole.ldn.devopsplayground.com/';

const API_URL = process.env.API_GATEWAY_URL;

const terraformLambdaHanderUrl = API_URL;

// This will send a request to Terraform Cloud to get the latest state file URL for the nachos workspace.
async function addInstanceDetailToDb(jsonResponse) {
    return new Promise((resolve) => {
        console.log('Insert Instance Details to DB.');

        const instanceUrl = jsonResponse.modules[0].outputs.fqdns.value;
        const instanceIp = jsonResponse.modules[0].outputs.ips.value;
        const tag_name_array = jsonResponse.modules[3];

        if (instanceUrl.length == instanceIp.length) {
            var instance_id = 0;
            for (var i = 0; i < instanceUrl.length; i++) {
                instance_id++;
                var instance_tag;

                var params = {
                    TableName: cloudInstancedbTableName,
                    Key: {
                        "public_ip": instanceIp[i],
                    },
                    UpdateExpression: "set instance_id = :instance_id, instance_url=:instance_url, instance_ip=:instance_ip, instance_root_username=:instance_root_username, instance_root_password=:instance_root_password, allocation=:allocation",
                    ExpressionAttributeValues: {
                        ':instance_id': instance_id.toString(),
                        ':instance_url': `${instanceUrl[i]}/wetty`,
                        ':instance_ip': instanceIp[i],
                        ':instance_root_username': instanceRootUsername,
                        ':instance_root_password': instanceRootPassword,
                        ':allocation': '-'

                    },
                    ReturnValues: "UPDATED_NEW"
                };

                docClient.update(params, function(err, data) {
                    if (err) {
                        console.log(err); // an error occurred
                        resolve(err);
                    } else {
                        console.log(data);
                        console.log('Completed Instance List');
                        resolve('Completed');
                    }
                });
            }
            console.log('Completed Instance List');
            resolve('Completed');
        } else {
            console.log(`Instance Url Count: ${instanceUrl.length}`);
            console.log(`Instance IP Count: ${instanceIp.length}`);
            resolve('Invalid number of Instance URL or Instance IP')
        }
    });
}

// This will download the Terraform State file and add the instance details to an array.
async function retrieveInstanceDetails(stateFileUrl) {
    console.log('Retrieve State File');
    return new Promise((resolve) => {
        request({
            url: stateFileUrl,
            method: 'GET',
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${process.env.TF_CLOUD_TEAM_KEY}`
            },
        }, (error, response, body) => {
            if (error) {
                console.error(body);
                resolve('Error');
            } else {
                const jsonResponse = JSON.parse(body);
                resolve(addInstanceDetailToDb(jsonResponse));
            }
        });
    });
}

// This will send a request to Terraform Cloud to get the latest state file URL for the nachos workspace.
async function getCurrentStateVersion(nachosWorkspaceId) {
    return new Promise((resolve) => {
        request({
            url: `https://app.terraform.io/api/v2/workspaces/${nachosWorkspaceId}/current-state-version`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${process.env.TF_CLOUD_TEAM_KEY}`
            },
        }, (error, response, body) => {
            if (error) {
                //console.error(body);
                resolve('Error');
            } else {
                let jsonResponse = JSON.parse(body);
                const stateFileUrl = jsonResponse.data.attributes['hosted-state-download-url'];
                resolve(retrieveInstanceDetails(stateFileUrl));
            }
        });
    });
}

async function sendLambdaResponseToHandler(run_id, workspace_id, organisation_name, run_message, trigger, run_status, actionType) {
    return new Promise((resolve) => {

        const jsonObject = {
            "plan": {
                "type": actionType,
                "run_id": `${run_id}`,
                "workspace_id": workspace_id,
                "overall_plan": run_message
            }
        };

        const jsonResponse = (JSON.stringify(jsonObject));

        request({
            url: terraformLambdaHanderUrl,
            method: 'POST',
            body: jsonResponse
        }, (error, response, body) => {
            if (error) {
                //console.error(body);
                resolve('Error');
            } else {
                resolve('success');
            }
        });
    });
}

async function saveToDb(statusParams) {
    return new Promise((resolve) => {
        console.log('Inserting into DB');

        ddb.putItem(statusParams, function(err, data) {
            if (err) {
                console.log("Error", err);
                resolve(err);
            } else {
                console.log("Success", data);
                resolve("success");
            }
        });
    });
}

async function createDbTable(params) {
    return new Promise((resolve) => {
        ddb.createTable(params, function(err, data) {
            if (err) {
                //console.log("Error", err);
                resolve('error');
            } else {
                console.log("Table Created");
                resolve('success');
            }
        });
    });
}

async function deleteDbTable(params) {
    return new Promise((resolve) => {
        ddb.deleteTable(params, function(err, data) {
            console.log(err);
            if (err && err.code === 'ResourceInUseException') {
                //console.log("Error: Table in use");
                resolve(err);
            } else {
                //console.log("Success", data);
                resolve('success');
            }
        });
    });
}

async function checkDbState(run_id, run_message, run_created_by, workspace_id, workspace_name, organization_name, message, trigger, run_status, run_updated_at) {
    return new Promise((resolve) => {
        if (workspace_id == vpcWorkspaceId && run_message == applyTerraformMessage && trigger == 'run:created') {
            console.log('Fresh terraform start');
            const deleteEventParams = {
                TableName: cloudEventdbTableName
            };
            const deleteEventsDbTableResult = deleteDbTable(deleteEventParams);
            deleteEventsDbTableResult.then((result) => {
                console.log(result);
                // Wait 10 seconds for DB to delete
                setTimeout(function() {
                    const createEventParams = {
                        AttributeDefinitions: [{
                                AttributeName: 'unique_id',
                                AttributeType: 'S'
                            },
                            {
                                AttributeName: 'run_updated_at',
                                AttributeType: 'S'
                            }
                        ],
                        KeySchema: [{
                                AttributeName: 'unique_id',
                                KeyType: 'HASH'
                            },
                            {
                                AttributeName: 'run_updated_at',
                                KeyType: 'RANGE'
                            }
                        ],
                        ProvisionedThroughput: {
                            ReadCapacityUnits: 5,
                            WriteCapacityUnits: 5
                        },
                        TableName: cloudEventdbTableName,
                    };
                    const createEventDbTableResult = createDbTable(createEventParams);
                    createEventDbTableResult.then((result) => {
                        // if (result == 'success') {
                        const createInstanceParams = {
                            AttributeDefinitions: [{
                                AttributeName: 'public_ip',
                                AttributeType: 'S'
                            }],
                            KeySchema: [{
                                AttributeName: 'public_ip',
                                KeyType: 'HASH'
                            }],
                            ProvisionedThroughput: {
                                ReadCapacityUnits: 10,
                                WriteCapacityUnits: 5
                            },
                            TableName: cloudInstancedbTableName,
                        };
                        const createInstanceDbTableResult = createDbTable(createInstanceParams);
                        createInstanceDbTableResult.then((result) => {
                            if (result == 'success') {
                                const insertStatusParams = {
                                    TableName: cloudEventdbTableName,
                                    Item: {
                                        'unique_id': { S: uuidv4() },
                                        'run_id': { S: run_id },
                                        'run_message': { S: run_message },
                                        'run_created_by': { S: run_created_by },
                                        'workspace_id': { S: workspace_id },
                                        'workspace_name': { S: workspace_name },
                                        'organization_name': { S: organization_name },
                                        'message': { S: message },
                                        'trigger': { S: trigger },
                                        'run_status': { S: run_status },
                                        'run_updated_at': { S: run_updated_at }
                                    }
                                };
                                setTimeout(function() {
                                    console.log('Wait 5 seconds before inserting status to DB');
                                    const saveStatusToDbResult = saveToDb(insertStatusParams);
                                    saveStatusToDbResult.then((result) => {
                                        resolve(result);
                                    });
                                }, 5000);
                            } else {
                                resolve(result);
                            }
                        });
                        // } else {
                        //     resolve(result);
                        // }
                    });
                }, 10000);
            });
        } else {
            console.log('Not a fresh terraform start');
            if (workspace_id == nachosWorkspaceId && run_status == 'applied' && run_message == destroyTerraformMessage) {
                console.log('Delete Instance DB');
                const deleteInstanceParams = {
                    TableName: cloudInstancedbTableName
                };
                const deleteInstanceDbTableResult = deleteDbTable(deleteInstanceParams);
                deleteInstanceDbTableResult.then((result) => {
                    console.log('Instance DB Deleted');
                });
            }
            console.log('Inserting');
            const statusParams = {
                TableName: cloudEventdbTableName,
                Item: {
                    'unique_id': { S: uuidv4() },
                    'run_id': { S: run_id },
                    'run_message': { S: run_message },
                    'run_created_by': { S: run_created_by },
                    'workspace_id': { S: workspace_id },
                    'workspace_name': { S: workspace_name },
                    'organization_name': { S: organization_name },
                    'message': { S: message },
                    'trigger': { S: trigger },
                    'run_status': { S: run_status },
                    'run_updated_at': { S: run_updated_at }
                }
            };
            var timeoutDuration = 5000;
            if (workspace_id == vpcWorkspaceId && run_message == applyTerraformMessage && run_status == 'planning') {
                timeoutDuration = 15000;
            }
            // Wait 5000 to 10,000 micro-seconds before inserting into DB
            setTimeout(function() {
                const saveStatusToDbResult = saveToDb(statusParams);
                saveStatusToDbResult.then((result) => {
                    resolve(result);
                });
            }, timeoutDuration);
        }
    });
}

exports.handler = function(event, context, callback) {
    console.log(event);
    if (event == undefined) {
        callback('Invalid Body');
    } else {
        const { run_id } = event;
        const { run_message } = event;
        const { run_created_by } = event;
        const { workspace_id } = event;
        const { workspace_name } = event;
        const { organization_name } = event;
        const { message } = event.notifications[0];
        const { trigger } = event.notifications[0];
        const { run_status } = event.notifications[0];
        const { run_updated_at } = event.notifications[0];

        if (run_id == undefined || workspace_id == undefined || organization_name == undefined || run_message == undefined || trigger == undefined || run_status == undefined) {
            callback('Missing Arguments');
        } else {
            return new Promise((resolve) => {
                if (run_message == applyTerraformMessage || run_message == destroyTerraformMessage) {
                    console.log('Saving State to DB');
                    const checkDbStateResult = checkDbState(run_id, run_message, run_created_by, workspace_id, workspace_name, organization_name, message, trigger, run_status, run_updated_at);
                    checkDbStateResult.then((result) => {
                        if (result == 'success') {
                            if (trigger == 'run:needs_attention' || run_status == 'planned_and_finished') {
                                console.log('Sending Confirmation');
                                const sendLambdaResponseToHandlerResult = sendLambdaResponseToHandler(run_id, workspace_id, organization_name, run_message, trigger, run_status, "confirmation");
                                sendLambdaResponseToHandlerResult.then((result) => {
                                    callback(null, result);
                                });
                            } else if (workspace_id == nachosWorkspaceId && run_status == 'applied' && run_message == applyTerraformMessage) {
                                console.log('Getting State File');
                                const getCurrentStateVersionResult = getCurrentStateVersion(nachosWorkspaceId);
                                getCurrentStateVersionResult.then((result) => {
                                    callback(null, result);
                                });
                            }
                        } else {
                            callback(result);
                        }
                    });
                } else {
                    console.log('Sending Cancellation');
                    const sendCancelLambdaResponseToHandlerResult = sendLambdaResponseToHandler(run_id, workspace_id, organization_name, run_message, trigger, run_status, "cancel");
                    sendCancelLambdaResponseToHandlerResult.then((result) => {
                        callback(null, result);
                    });
                }
            });
        }
    }
};