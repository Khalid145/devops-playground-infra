const request = require('request');

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var docClient = new AWS.DynamoDB.DocumentClient();

const cloudEventdbTableName = process.env.EVENT_DB_TABLE_NAME;
const cloudInstancedbTableName = process.env.INSTANCE_DB_TABLE_NAME;
const cloudSoftwaredbTableName = process.env.SOFTWARE_DEPENDENCY_DB_TABLE_NAME;

const API_URL = process.env.API_GATEWAY_URL;
const terraformLambdaHanderUrl = API_URL;
//------------------------------------------------------------------------------------

// async function getUnAllocatedInstances() {
//     return new Promise((resolve) => {
//         const params = {
//             TableName: cloudInstancedbTableName,
//             FilterExpression: "#allocation = :allocation_val",
//             ExpressionAttributeNames: {
//                 "#allocation": "allocation",
//             },
//             ExpressionAttributeValues: { ":allocation_val": "-" },
//             ScanIndexForward: false,
//         };
//         docClient.scan(params, function(err, data) {
//             if (err) {
//                 //console.log(err)
//                 resolve('error');
//             } else {
//                 resolve(data.Items);
//             }
//         });
//     });
// }


async function sendTerraformAction(jsonResponse) {
    return new Promise((resolve) => {
        request({
            url: terraformLambdaHanderUrl,
            method: 'POST',
            body: jsonResponse
        }, (error, response, body) => {
            if (error) {
                //console.error(body);
                resolve('Error');
            } else {
                //console.log(body);
                resolve('Success')
            }
        });
    });
}

async function setAnsibleStatusDb(event) {
    return new Promise((resolve) => {
        console.log('Update Ansible')
        const { public_ip } = event.data;
        const { status } = event.data;
        console.log(public_ip);
        console.log(status);

        var params = {
            TableName: cloudInstancedbTableName,
            Key: {
                "public_ip": public_ip,
            },
            UpdateExpression: "set ansible_status = :ansible_status",
            ExpressionAttributeValues: {
                ":ansible_status": status
            },
            ReturnValues: "UPDATED_NEW"
        };

        docClient.update(params, function(err, data) {
            if (err) {
                console.log(err); // an error occurred
                resolve(err);
            } else {
                console.log(data);
                resolve(data);
            }
        });
    });
}

async function getCreatedInstances() {
    return new Promise((resolve) => {
        const params = {
            TableName: cloudInstancedbTableName,
            ScanIndexForward: true,
        };
        docClient.scan(params, function(err, data) {
            if (err) {
                console.log(err)
                resolve(err);
            } else {
                resolve(data.Items);
            }
        });
    });
}

async function insertSoftwareIntoDb(filename) {
    return new Promise((resolve) => {
        var params = {
            TableName: cloudSoftwaredbTableName,
            Item: {
                "filename": filename
            }
        }
        docClient.put(params, function(err, data) {
            if (err) {
                console.log("Error", err);
                resolve(err);
            } else {
                //console.log("Success", data);
                resolve("success");
            }
        });
    });
}

async function getSoftwareFilename() {
    return new Promise((resolve) => {
        const params = {
            TableName: cloudSoftwaredbTableName,
        }

        docClient.scan(params, function(err, data) {
            if (err) {
                //console.log(err)
                resolve('error');
            } else {
                resolve(data.Items);
            }
        });
    });
}

async function getTerraformEvents(workspace) {
    return new Promise((resolve) => {
        const params = {
            TableName: cloudEventdbTableName,
            FilterExpression: "#workspace_name = :workspace_name_val",
            ExpressionAttributeNames: {
                "#workspace_name": "workspace_name",
            },
            ExpressionAttributeValues: { ":workspace_name_val": workspace },
            ScanIndexForward: false,
        };
        docClient.scan(params, function(err, data) {
            if (err) {
                //console.log(err)
                resolve('error');
            } else {
                resolve(data.Items);
            }
        });
    });
}

async function createEventJsonResponse() {
    return new Promise((resolve) => {
        var vpcJson;
        var guacJson;
        var nachosJson;
        const getVpcTerraformEvents = getTerraformEvents('playground-infra-ui-vpc');;
        getVpcTerraformEvents.then((vpcresult) => {
            if (vpcresult == 'error') {
                resolve('error')
            } else {
                vpcJson = {
                    "vpc": {
                        "data": vpcresult
                    }
                }
            }
            const getGuacTerraformEvents = getTerraformEvents('playground-infra-ui-guacamole');;
            getGuacTerraformEvents.then((guacresult) => {
                if (guacresult == 'error') {
                    resolve('error')
                } else {
                    guacJson = {
                        "guacamole": {
                            "data": guacresult
                        }
                    }
                }
                const getNachosTerraformEvents = getTerraformEvents('playground-infra-ui-nachos');;
                getNachosTerraformEvents.then((nachosresult) => {
                    if (nachosresult == 'error') {
                        resolve('error')
                    } else {
                        nachosJson = {
                            "nachos": {
                                "data": nachosresult
                            }
                        }
                    }
                    const eventJson = Object.assign(vpcJson, guacJson, nachosJson);
                    resolve(eventJson);
                });
            });
        });
    });
}

async function createCorsResponse(bodyJson) {
    return new Promise((resolve) => {
        var responseCode = 200;
        var response = {
            statusCode: responseCode,
            headers: {
                "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS 
            },
            body: JSON.stringify(bodyJson)
        };
        resolve(response)
    })
};


exports.handler = function(event, context, callback) {
    // //console.log(event);
    if (event == undefined) {
        callback('Invalid Body');
    } else {
        if (event.path == 'event-list') {
            console.log('Getting Event List');
            const getTerraformEvents = createEventJsonResponse();;
            getTerraformEvents.then((eventResult) => {
                const createCorsResponseResult = createCorsResponse(eventResult);;
                createCorsResponseResult.then((eventResult) => {
                    callback(null, eventResult);
                })
            });
        } else if (event.path == 'instances-info') {
            console.log('Getting Instance Info');
            const getInstances = getCreatedInstances();
            getInstances.then((eventResult) => {
                //console.log(eventResult.statusCode);
                if (eventResult.statusCode == 400) {
                    eventResult = {
                        'message': 'No Data Avaiable ... Checking again'
                    }
                }
                const createCorsResponseResult = createCorsResponse(eventResult);;
                createCorsResponseResult.then((eventResult) => {
                    callback(null, eventResult);
                })
            });
        } else if (event.path == 'add-software-dependency') {
            const { fileName } = event.data;
            const insertSoftwareIntoDbResult = insertSoftwareIntoDb(fileName);;
            insertSoftwareIntoDbResult.then((result) => {
                const createCorsResponseResult = createCorsResponse(result);
                createCorsResponseResult.then((eventResult) => {
                    callback(null, eventResult)
                })
            });
        } else if (event.path == 'get-software-dependency') {
            const getSoftwareList = getSoftwareFilename();;
            getSoftwareList.then((result) => {
                //console.log(result);
                const createCorsResponseResult = createCorsResponse(result);
                createCorsResponseResult.then((eventResult) => {
                    callback(null, eventResult)
                })
            });

        } else if (event.path == 'create-infrastructure') {
            const { instanceQuantity } = event.data;
            const { instanceType } = event.data;
            const softwareDependency = `[${event.data.softwareDependency}]`;
            var { giturl } = event.data;
            if (giturl == "") {
                giturl = "not-provided";
            } else {
                const gitarray = giturl.split('https://');
                giturl = gitarray[1];
            }
            const jsonObject = {
                "plan": {
                    "type": "create",
                    "variables": {
                        "count": instanceQuantity,
                        "instancetype": instanceType,
                        "software": softwareDependency,
                        giturl
                    }
                }
            }
            const jsonResponse = (JSON.stringify(jsonObject));
            //console.log(jsonResponse);
            const sendTerraformActionResult = sendTerraformAction(jsonResponse);
            sendTerraformActionResult.then((actionResult) => {
                if (actionResult == 'Success') {
                    const createCorsResponseResult = createCorsResponse(actionResult);;
                    createCorsResponseResult.then((eventResult) => {
                        callback(null, eventResult);
                    })
                } else {
                    callback(actionResult);
                }
            });
        } else if (event.path == 'destroy-infrastructure') {
            const jsonObject = {
                "plan": {
                    "type": "destroy",
                }
            };
            const jsonResponse = (JSON.stringify(jsonObject));

            const sendTerraformActionResult = sendTerraformAction(jsonResponse);
            sendTerraformActionResult.then((actionResult) => {
                if (actionResult == 'Success') {
                    const createCorsResponseResult = createCorsResponse(actionResult);;
                    createCorsResponseResult.then((eventResult) => {
                        callback(null, eventResult);
                    })
                } else {
                    callback(actionResult);
                }
            });
        } else if (event.path == 'ansible-status') {
            console.log('Setting Ansible Status');
            if (event.data == undefined) {
                var response = {
                    "message": "Invalid data"
                }
                callback(response);
            } else {
                const setAnsibleStatusDbResult = setAnsibleStatusDb(event);;
                setAnsibleStatusDbResult.then((result) => {
                    callback(null, result);
                })
            }
            // } else if (event.path == 'allocate-instance') {
            //     const { participantName } = event.data;
            //     const { participantEmail } = event.data;

            //     const getUnAllocatedInstancesResult = getUnAllocatedInstances();
            //     getUnAllocatedInstancesResult.then((actionResult) => {

            //         console.log(actionResult);
            //         const instance = actionResult[0];

            //         const { instance_id } = instance;
            //         const { instance_url } = instance;
            //         const { instance_ip } = instance;
            //         const { username } = instance;
            //         const { password } = instance;
            //         const { guacamole_url } = instance;
            //         const { instance_root_username } = instance;
            //         const { instance_root_password } = instance;



            //         const createCorsResponseResult = createCorsResponse(actionResult);;
            //         createCorsResponseResult.then((eventResult) => {
            //             callback(null, eventResult);
            //         })
            //     });

        } else {
            callback('Invalid Path');
        }
    }
};