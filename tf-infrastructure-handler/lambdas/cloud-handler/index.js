const request = require('request');
const terraformVariableHandler = require('./terraform-variable-handler.js');
const terraformPlanHandler = require('./terraform-plan-handler.js');

const countIdVariable = 'var-RhaGdHxoLcdUNcai';
const instanceTypeIdVariable = 'var-U9ynroyeDn4cKn9d';
const softwareDependencyIdVariable = 'var-dHm59LzkSVwonRux';
const gitUrlVaribaleId = 'var-LpXpXnSaTaPr3bVF';
const apiUrlVaribaleId = 'var-2R9GkgVai7uxjDMa'

const organisationName = 'ECSD-DPG';
const vpcWorkSpaceName = 'playground-infra-ui-vpc';
const guacamoleWorkspaceName = 'playground-infra-ui-guacamole';
const nachosWorkspaceName = 'playground-infra-ui-nachos';

const vpcWorkspaceId = 'ws-9cNPf39s4376pbUo';
const guacamoleWorkspaceId = 'ws-hWpUnDGGwV5zmyqH';
const nachosWorkspaceId = 'ws-mcuoVvqo9BiZQUnP';

const applyTerraformMessage = 'Apply Plan From Lambda function.';
const destroyTerraformMessage = 'Destroy Plan From Lambda function.'

const apiUrl = process.env.API_GATEWAY_URL;

// This will send a request to Terraform Cloud to accept the plan for a run.
async function applyCancelRequest(run_id) {
    return new Promise((resolve) => {
        console.log('Executing canelling run.');
        let jsonObject = {
            "comment": "This run was cancelled by Lambda due to not originally being executed from Lambda."
        };

        let jsonResponse = (JSON.stringify(jsonObject));

        request({
            url: `https://app.terraform.io/api/v2/runs/${run_id}/actions/cancel`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${process.env.TF_CLOUD_TEAM_KEY}`
            },
            body: jsonResponse
        }, (error, response, body) => {
            if (error) {
                console.error(body);
                resolve('Error');
            } else {
                resolve('success');
            }
        });
    });
}

// This will send a request to Terraform Cloud to accept the plan for a run.
async function applyRunRequest(run_id) {
    return new Promise((resolve) => {

        let jsonObject = {
            "comment": "Confirmation from Lambda Function."
        };

        let jsonResponse = (JSON.stringify(jsonObject));

        request({
            url: `https://app.terraform.io/api/v2/runs/${run_id}/actions/apply`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${process.env.TF_CLOUD_TEAM_KEY}`
            },
            body: jsonResponse
        }, (error, response, body) => {
            if (error) {
                console.error(body);
                resolve('Error');
            } else {
                resolve('success');
            }
        });
    });
}

// This will run plans on each Terraform Cloud workspace in sequential order.
async function terraformPlanCreator(terraformPlanType, workspaceId, workSpaceName, organisationName) {
    return new Promise((resolve) => {
        if (terraformPlanType == 'create') {
            const actionType = 'Apply Plan';
            const startPlanHandler = terraformPlanHandler.createJsonPlanMessage('false', applyTerraformMessage, workspaceId, actionType, workSpaceName, organisationName);
            startPlanHandler.then((result) => {
                console.log(result);
                resolve(result);
            });
        } else if (terraformPlanType == 'destroy') {
            const actionType = 'Destroy Plan';
            const startPlanHandler = terraformPlanHandler.createJsonPlanMessage('true', destroyTerraformMessage, workspaceId, actionType, workSpaceName, organisationName);
            startPlanHandler.then((result) => {
                console.log(result);
                resolve(result);
            });
        } else {
            resolve('Invalid Terraform Action');
        }
    });
}


// This will update each Terraform variable in sequential order.
async function updateTerraformVariables(count, instanceType, softwareDependency, gitUrl) {
    return new Promise((resolve) => {
        const updateCountVariable = terraformVariableHandler.createJsonVariableMessage(countIdVariable, 'count', count);
        console.log('Updating COUNT variable');
        updateCountVariable.then((result) => {
            if (result == 'success') {
                console.log(`Successfully updated COUNT variable to ${count}`);
                const updateInstanceTypeVariable = terraformVariableHandler.createJsonVariableMessage(instanceTypeIdVariable, 'instance_type', instanceType);
                console.log('Updating INSTANCE-TYPE variable');
                updateInstanceTypeVariable.then((result) => {
                    if (result == 'success') {
                        console.log(`Successfully updated INSTANCE-TYPE variable to ${instanceType}`);
                        const updateSoftwareDependencyVariable = terraformVariableHandler.createJsonVariableMessage(softwareDependencyIdVariable, 'softwares_dependency', softwareDependency);
                        console.log('Updating SOFTWARE-DEPENDENCY variable');
                        updateSoftwareDependencyVariable.then((result) => {
                            if (result == 'success') {
                                console.log(`Successfully updated SOFTWARE-DEPENDENCY variable to ${softwareDependency}`);
                                const updateGitUrlVariable = terraformVariableHandler.createJsonVariableMessage(gitUrlVaribaleId, 'git_url', gitUrl);
                                console.log('Updating GIT_URL variable');
                                updateGitUrlVariable.then((result) => {
                                    if (result == 'success') {
                                        console.log(`Successfully updated GIT_URL variable to ${gitUrl}`);
                                        const updateApiUrlVariable = terraformVariableHandler.createJsonVariableMessage(apiUrlVaribaleId, 'api_url', apiUrl);
                                        console.log('Updating API URL variable');
                                        updateApiUrlVariable.then((result) => {
                                            if (result == 'success') {
                                                console.log(`Successfully updated API_URL variable to ${apiUrl}`);
                                                resolve('success');
                                            } else {
                                                resolve(result);
                                            }
                                        });
                                    } else {
                                        resolve(result);
                                    }
                                });
                            } else {
                                resolve(result);
                            }
                        });
                    } else {
                        resolve(result);
                    }
                });
            } else {
                resolve(result);
            }
        });
    });
}

async function destroyConfirmationFlowHandler(run_id, workspace) {
    return new Promise((resolve) => {
        const applyRunRequestResult = applyRunRequest(run_id);
        applyRunRequestResult.then((result) => {
            console.log(result);
            if (workspace == nachosWorkspaceId) {
                const guacamoleTerraformPlanCreatorResult = terraformPlanCreator('destroy', guacamoleWorkspaceId, guacamoleWorkspaceName, organisationName);
                guacamoleTerraformPlanCreatorResult.then((result) => {
                    console.log(result);
                    resolve(result);
                });
            } else if (workspace == guacamoleWorkspaceId) {
                const vpcTerraformPlanCreatorResult = terraformPlanCreator('destroy', vpcWorkspaceId, vpcWorkSpaceName, organisationName);
                vpcTerraformPlanCreatorResult.then((result) => {
                    console.log(result);
                    resolve('Destroyed');
                });
            } else if (workspace == vpcWorkspaceId) {
                resolve('Destroyed');
            } else {
                resolve('Invalid Workspace Argument');

            }
        });
    });
}

async function applyConfirmationFlowHandler(run_id, workspace) {
    return new Promise((resolve) => {
        const applyRunRequestResult = applyRunRequest(run_id);
        applyRunRequestResult.then((result) => {
            console.log('Created VPC Plan')
            if (workspace == vpcWorkspaceId) {
                const guacamoleTerraformPlanCreatorResult = terraformPlanCreator('create', guacamoleWorkspaceId, guacamoleWorkspaceName, organisationName);
                guacamoleTerraformPlanCreatorResult.then((result) => {
                    console.log('Created Guac Plan')
                    console.log('Pausing for 20 seconds to allow Guacamole to accept HTTP request');
                    setTimeout(function() {
                        resolve(result);
                    }, 20000);
                });
            } else if (workspace == guacamoleWorkspaceId) {
                const nachosTerraformPlanCreatorResult = terraformPlanCreator('create', nachosWorkspaceId, nachosWorkspaceName, organisationName);
                nachosTerraformPlanCreatorResult.then((result) => {
                    console.log('Created Nachos Plan')
                    resolve(result);
                });

            } else if (workspace == nachosWorkspaceId) {
                resolve('Complete');
            } else {
                resolve('Invalid Workspace Argument');

            }
        });
    });
}


exports.handler = function(event, context, callback) {
    console.log(event.plan);
    if (event.plan.type == undefined) {
        callback('Missing Terraform Arguments');
    } else {
        const terraformPlanType = event.plan.type;
        if (terraformPlanType == 'create') {
            return new Promise((resolve) => {
                if (event.plan.variables.count == undefined || event.plan.variables.instancetype == undefined || event.plan.variables.software == undefined) {
                    callback('Missing arguments');
                } else {
                    const { count } = event.plan.variables;
                    const { instancetype } = event.plan.variables;
                    const { software } = event.plan.variables;
                    const { giturl } = event.plan.variables;
                    const updateTerraformVariablesResult = updateTerraformVariables(count, instancetype, software, giturl);
                    updateTerraformVariablesResult.then((result) => {
                        const startCreateTerraformPlanFlow = terraformPlanCreator(terraformPlanType, vpcWorkspaceId, vpcWorkSpaceName, organisationName);
                        startCreateTerraformPlanFlow.then((result) => {
                            callback(null, result)
                        });
                    });
                }
            });
        } else if (terraformPlanType == "confirmation") {
            const { run_id } = event.plan;
            const { workspace_id } = event.plan;
            const { overall_plan } = event.plan;
            console.log(overall_plan);
            return new Promise((resolve) => {
                if (overall_plan == applyTerraformMessage) {
                    const applyConfirmationFlowHandlerResult = applyConfirmationFlowHandler(run_id, workspace_id);
                    applyConfirmationFlowHandlerResult.then((result) => {
                        callback(null, result);
                    });
                } else if (overall_plan == destroyTerraformMessage) {
                    const destroyConfirmationFlowHandlerResult = destroyConfirmationFlowHandler(run_id, workspace_id);
                    destroyConfirmationFlowHandlerResult.then((result) => {
                        callback(null, result);
                    });
                } else {
                    callback('Invalid Next Plan');
                }
            });
        } else if (terraformPlanType == "destroy") {
            const startDestroyTerraformPlanFlow = terraformPlanCreator(terraformPlanType, nachosWorkspaceId, nachosWorkspaceName, organisationName);
            startDestroyTerraformPlanFlow.then((result) => {
                callback(null, result)
            });
        } else if (terraformPlanType == "cancel") {
            console.log('Cancelling Run');
            const { run_id } = event.plan;
            console.log(run_id);
            const applyCancelRequestResult = applyCancelRequest(run_id);
            applyCancelRequestResult.then((result) => {
                if (result == 'success') {
                    callback(null, `Cancelled Run: ${run_id}`);
                } else {
                    callback(result);
                }
            });
        } else {
            callback('Invalid Action');
        }
    }
};