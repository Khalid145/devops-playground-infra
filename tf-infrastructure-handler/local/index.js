const request = require('request');
const argv = require('minimist')(process.argv.slice(2));

const countIdVariable = 'var-ynfSWi6t45YMtMjv';
const instanceTypeIdVariable = 'var-ZK5hBwxtAy9ADgLP';
const softwareDependencyIdVariable = 'var-cGmHxPfQ78sth5nd';

const organisationName = 'ECSD-DPG';
const vpcWorkSpaceName = 'playground-infra-ui-vpc';
const guacamoleWorkspaceName = 'playground-infra-ui-guacamole';
const nachosWorkspaceName = 'playground-infra-ui-nachos';

const vpcWorkspaceId = 'ws-aVx5XzJzWtU4eHoM';
const guacamoleWorkspaceId = 'ws-hWpUnDGGwV5zmyqH';
const nachosWorkspaceId = 'ws-B43J3PaVYL9uq6rr';

const guacamoleWebClientUrl = 'http://guacamole.ldn.devopsplayground.com/';

// This will download the Terraform State file and add the instance details to an array.
async function retrieveInstanceDetails (stateFileUrl){
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
        let jsonResponse=JSON.parse(body);
        const instanceUrl = jsonResponse.modules[0].outputs.fqdns.value;
        const instanceIp = jsonResponse.modules[0].outputs.ips.value;

        if (instanceUrl.length == instanceIp.length){
          var instanceList = [];
          for (var i = 0; i < instanceUrl.length; i++) { 
            instanceList.push([guacamoleWebClientUrl, `user${i+1}`, `password${i+1}`, instanceUrl[i], instanceIp[i]]);
          }
          console.log(instanceList)
          resolve(instanceList);
        } else {
          console.log(`Instance Url Count: ${instanceUrl.length}`);
          console.log(`Instance IP Count: ${instanceIp.length}`);
          resolve('Invalid number of Instance URL or Instance IP')
        }
      }
    });
  });
}

// This will send a request to Terraform Cloud to get the latest state file URL for the nachos workspace.
async function getCurrentStateVersion (nachosWorkspaceId){
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
        console.error(body);
        resolve('Error');
      } else {
        let jsonResponse=JSON.parse(body);
        const stateFileUrl = jsonResponse.data.attributes['hosted-state-download-url'];
        resolve(retrieveInstanceDetails(stateFileUrl));
      }
    });
  });
}

// This will send a request to Terraform Cloud to accept the plan for a run.
async function applyRunRequest (run_id){
  return new Promise((resolve) => {

    let jsonObject={
      "comment":"Confirmed by API"
    };

    let jsonResponse=(JSON.stringify(jsonObject));

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

// This is retrieve the current state of a run on Terraform Cloud
async function getRunRequest (run_id){
  return new Promise((resolve) => {

    request({
      url: `https://app.terraform.io/api/v2/runs/${run_id}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.TF_CLOUD_TEAM_KEY}`
      }
    }, (error, response, body) => {
      if (error) {
        console.error(body);
        resolve('Error');
      } else if (response.statusCode != 200) {
        console.error(`HTTP Error: ${response.statusCode} - ${response.statusMessage}\n${body}`);
        resolve('Error Status Code');
      } else {
        const jsonBody = JSON.parse(body);
        resolve(jsonBody);
      }
    });

  });
}

// This will check the state of a run and proceed to the next step
async function checkRunStatus (run_id, actionType, workspaceName){
  return new Promise((resolve) => {

    let previousRunStatus = 'old';
    let newRunStatus = 'new';

    // let counter = 500;

    const id = setInterval(() => {
      // counter -= 3;
      console.log(' ');
      console.log('-');
      console.log(`*** ${actionType} ${workspaceName} ***`);
      // console.log(`${counter} seconds remaining until timeout`);

      if (previousRunStatus != newRunStatus || previousRunStatus == 'planning' && newRunStatus == 'planning') {
        const getRunRequestApi = getRunRequest(run_id);
        getRunRequestApi.then((result) => {
          const currentRunStatus = result.data.attributes.status
          console.log(`Current Status: ${currentRunStatus}`);
          console.log(`Link to Live Terraform Logs: https://app.terraform.io/app/${organisationName}/workspaces/${workspaceName}/runs/${run_id}`)
          previousRunStatus = newRunStatus;
          newRunStatus = currentRunStatus;
        });
      } else {
        const applyRunRequestApi = applyRunRequest(run_id);
        applyRunRequestApi.then((result) => {
          if (result == 'success'){
            let previousRunStatus = 'old';
            let newRunStatus = 'new';
              if (previousRunStatus != newRunStatus || previousRunStatus == 'apply_queued' && newRunStatus == 'apply_queued'){
                const getRunRequestApi = getRunRequest(run_id);
                getRunRequestApi.then((result) => {
                const currentRunStatus = result.data.attributes.status;
                console.log(`Current Status: ${currentRunStatus}`);
                console.log(`Link to Live Terraform Logs: https://app.terraform.io/app/${organisationName}/workspaces/${workspaceName}/runs/${run_id}`)
                previousRunStatus = newRunStatus;
                newRunStatus = currentRunStatus;
                if (currentRunStatus == 'applied' || currentRunStatus == 'planned_and_finished' || currentRunStatus == 'errored'){
                  clearInterval(id);
                  resolve(currentRunStatus);
                }
               });
              } else {
                clearInterval(id);
                resolve(newRunStatus);
              }
            } else {
            clearInterval(id);
            resolve(result);
          }
        });
      }
    }, 3000);
  });
}

// This will send a request to Terraform Cloud to trigger a new plan
async function sendTerraformRequest (jsonRequest, actionType, workspaceName){
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
        const run_id = jsonBody.data.id
        const checkRunApi = checkRunStatus(run_id, actionType, workspaceName);
        checkRunApi.then((result) => {
          resolve(result);
        });
      }
    });
  });
}

// This will create the json body object required by Terraform Cloud to create a new run.
async function createJsonPlanMessage(isDestroy, message, workspaceId, actionType, workspaceName){
    return new Promise((resolve) => {
    let jsonObject={
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
    let returnValue=(JSON.stringify(jsonObject));
    const sendTerraformApi = sendTerraformRequest(returnValue, actionType, workspaceName);
            sendTerraformApi.then((result) => {
                resolve(result);
            });
    });
}

// This will run plans on each Terraform Cloud workspace in sequential order.
async function orderedTerraformProcess(isDestroy){
  return new Promise((resolve) => {
    if(isDestroy == 'false'){
      let type = 'Applying';
      const startVpc = createJsonPlanMessage(isDestroy, `test ${type} from api`, vpcWorkspaceId, type, vpcWorkSpaceName);
      startVpc.then((vpcResult) => {
        console.log(`Final Status: ${vpcResult}`);
        if (vpcResult == 'applied' || vpcResult == 'planned_and_finished'){
          const startGuac = createJsonPlanMessage(isDestroy, `test ${type} from api`, guacamoleWorkspaceId, type, guacamoleWorkspaceName);
          startGuac.then((guacResult) => {
            console.log(`Final Status: ${guacResult}`);
            if (guacResult == 'applied' || guacResult == 'planned_and_finished'){
              const startNachos = createJsonPlanMessage(isDestroy, `test ${type} from api`, nachosWorkspaceId, type, nachosWorkspaceName);
              startNachos.then((nachosResult) => {
                console.log(`Final Status: ${nachosResult}`);
                if (nachosResult == 'applied' || nachosResult == 'planned_and_finished'){
                  resolve(getCurrentStateVersion(nachosWorkspaceId));
                } else {
                  resolve('Unexpected problem from Terraform Cloud. Please check by logging into Terraform Cloud');
                }
              });
            } else {
              resolve('Unexpected problem from Terraform Cloud. Please check by logging into Terraform Cloud');
            }
          });
        } else {
          resolve('Unexpected problem from Terraform Cloud. Please check by logging into Terraform Cloud');
        }
      });
    } else {
      let type = 'Destroying';
      const startNachos = createJsonPlanMessage(isDestroy, `test ${type} from api`, nachosWorkspaceId, type, nachosWorkspaceName);
      startNachos.then((nachosResult) => {
        console.log(`Final Status: ${nachosResult}`);
        if (nachosResult == 'applied' || nachosResult == 'planned_and_finished'){
          const startGuac = createJsonPlanMessage(isDestroy, `test ${type} from api`, guacamoleWorkspaceId, type, guacamoleWorkspaceName);
          startGuac.then((guacResult) => {
            console.log(`Final Status: ${guacResult}`);
            if (guacResult == 'applied' || guacResult == 'planned_and_finished'){
              const startVpc = createJsonPlanMessage(isDestroy, `test ${type} from api`, vpcWorkspaceId, type, vpcWorkSpaceName);
              startVpc.then((vpcResult) => {
                console.log(`Final Status: ${vpcResult}`);
                if (vpcResult == 'applied' || vpcResult == 'planned_and_finished'){
                resolve(vpcResult);
                } else {
                  resolve('Unexpected problem from Terraform Cloud. Please check by logging into Terraform Cloud');
                }
              });
            } else {
              resolve('Unexpected problem from Terraform Cloud. Please check by logging into Terraform Cloud');
            }
          });
        } else {
          resolve('Unexpected problem from Terraform Cloud. Please check by logging into Terraform Cloud');
        }
      });
    }
  });
}

// This will send a request to Terraform Cloud to trigger a new plan
async function sendTerraformVariableRequest (jsonRequest, variableId){
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
async function createJsonVariableMessage(variableId, variableKey, variableName){
  return new Promise((resolve) => {
    let jsonObject={
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
    let returnValue=(JSON.stringify(jsonObject));
    const sendTerraformVariableRequestApi = sendTerraformVariableRequest(returnValue, variableId);
    sendTerraformVariableRequestApi.then((result) => {
      resolve(result);
    });
  });
}

// This will update each Terraform variable in sequential order.
async function updateTerraformVariables(count, instanceType, softwareDependency){
  return new Promise((resolve) => {
    console.log(' ');
    console.log('-');
    const updateCountVariable = createJsonVariableMessage(countIdVariable, 'count', count);
    console.log('Updating COUNT variable');
    updateCountVariable.then((result) => {
      // console.log(result);
      if (result == 'success') {
        console.log(`Successfully updated COUNT variable to ${count}`);
        console.log(' ');
        console.log('-');
        const updateInstanceTypeVariable = createJsonVariableMessage(instanceTypeIdVariable, 'instance_type', instanceType);
        console.log('Updating INSTANCE-TYPE variable');
        updateInstanceTypeVariable.then((result) => {
          // console.log(result);
          if(result == 'success') {
            console.log(`Successfully updated INSTANCE-TYPE variable to ${instanceType}`);
            console.log(' ');
            console.log('-');
            const updateSoftwareDependencyVariable = createJsonVariableMessage(softwareDependencyIdVariable, 'softwares_dependency', softwareDependency);
            console.log('Updating SOFTWARE-DEPENDENCY variable');
            updateSoftwareDependencyVariable.then((result) => {
              // console.log(result);
              if(result == 'success') {
                console.log(`Successfully updated SOFTWARE-DEPENDENCY variable to ${softwareDependency}`);
                console.log(' ');
                console.log('-');
                resolve(orderedTerraformProcess('false'));
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

// This will check the type of action that needs to be executed on Terraform Cloud.
async function checkTerraformActionType(terraformAction, count, instanceType, softwareDependency){
  return new Promise((resolve) => {
    console.log(' ');
    console.log('***');
    if(terraformAction == 'false'){
      console.log('Creating Terraform Infrastructure');
      console.log('***');
      resolve(updateTerraformVariables(count, instanceType, softwareDependency));
    } else if (terraformAction == 'true'){
      console.log('Destroying Terraform Infrastructure');
      console.log('***');
      resolve(resolve(orderedTerraformProcess(terraformAction)))
    } else {
      resolve('Invalid Terraform Action');
    }
  });
}

// This will retrieve arguments from the command line.
async function retrieveArguments(){
  return new Promise((resolve) => {
    if(argv.destroy == undefined || argv.count == undefined || argv.type == undefined || argv.software == undefined) {
      resolve('Missing arguments');
    } else {
      const isDestroy = argv.destroy;
      const count = argv.count;
      const instanceType = argv.type;
      const softwareDependency = argv.software;
      const checkTerraformAction = checkTerraformActionType(isDestroy, count.toString(), instanceType, softwareDependency);
      checkTerraformAction.then((result) => {
        resolve(result);
      });
    }
  });
}

retrieveArguments();