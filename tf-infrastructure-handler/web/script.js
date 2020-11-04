$(document).ready(
    function() {
        var createButton = document.getElementById('create-button');
        var destroyButton = document.getElementById('destroy-button');
        destroyButton.style.visibility = 'hidden';
        createButton.style.visibility = 'visible';
        setInterval(function() {
            retrieveEvents();
        }, 1000);
    });

const apiUrl = "https://ykbk8ixgt1.execute-api.us-east-1.amazonaws.com/dpg"

function retrieveEvents() {
    $.ajax({
        url: `${apiUrl}/terraform-state`,
        type: 'POST',
        crossDomain: true,
        data: '{"path":"event-list"}',
        dataType: 'json',
        contentType: "application/json",
        success: function(result) {
            // console.log(result.body);
            var obj = JSON.parse(result.body)
            if (obj == "error") {
                console.log("Error while retrieving events")
            } else {
                if (obj.vpc.data == undefined || obj.guacamole.data == undefined || obj.nachos.data == undefined) {
                    console.log('Unavailable data.')
                } else {
                    var vpcData = obj.vpc.data;
                    var guacamoleData = obj.guacamole.data;
                    var nachosData = obj.nachos.data;
                    populateTable(vpcData, 'vpctbody');
                    populateTable(guacamoleData, 'guacamoletbody');
                    populateTable(nachosData, 'nachostbody');
                }
            }
        }
    });
}

function populateTable(result, tableId, tableName) {
    var tableListArray = [];
    var Table = document.getElementById(tableId);
    if (result < 1) {
        Table.innerHTML = "";
        eachrow = '<tr bgcolor="#EBEBEB"; padding:"10px";>' +
            "<td></td>" +
            "<td>Checking for data</td>" +
            "</tr>";
        $(`#${tableId}`).append(eachrow);
    } else {
        for (let i = 0; i < result.length; i++) {
            const timeFormatter = new Date(result[i].run_updated_at);
            const timeDate = timeFormatter.toString();
            const formatTimeDate = timeDate.split('GMT');
            const runMessage = result[i].message;
            const runCreatedBy = result[i].run_created_by;
            const terraformMessage = result[i].run_message;
            const { trigger } = result[i];
            const { workspace_name } = result[i];
            const event = {
                'run_updated_at': formatTimeDate[0],
                'message': runMessage,
                'run_created_by': runCreatedBy,
                'terraform_message': terraformMessage,
                trigger,
                workspace_name
            }
            tableListArray.push(event);
        }

        var swapped;
        do {
            swapped = false;
            for (var i = 0; i < tableListArray.length - 1; i++) {
                if (tableListArray[i]['run_updated_at'] < tableListArray[i + 1]['run_updated_at']) {
                    var temp = tableListArray[i];
                    tableListArray[i] = tableListArray[i + 1];
                    tableListArray[i + 1] = temp;
                    swapped = true;
                }
            }
        } while (swapped);

        $.each(tableListArray, function() {
            Table.innerHTML = "";
            var createButton = document.getElementById('create-button');
            var destroyButton = document.getElementById('destroy-button');
            for (let i = 0; i < tableListArray.length; i++) {
                const latestTerraformEvent = tableListArray[0];
                if (latestTerraformEvent.workspace_name == 'playground-infra-ui-vpc' && latestTerraformEvent.trigger == 'run:completed' && latestTerraformEvent.terraform_message == 'Destroy Plan From Lambda function.') {
                    destroyButton.style.visibility = 'hidden';
                    createButton.style.visibility = 'visible';
                } else if (latestTerraformEvent.workspace_name == 'playground-infra-ui-nachos' && latestTerraformEvent.trigger == 'run:completed' && latestTerraformEvent.terraform_message == 'Apply Plan From Lambda function.') {
                    destroyButton.style.visibility = 'visible';
                    createButton.style.visibility = 'visible';
                }
                if (latestTerraformEvent.workspace_name == 'playground-infra-ui-nachos' && latestTerraformEvent.trigger == 'run:errored' && latestTerraformEvent.terraform_message == 'Apply Plan From Lambda function.') {
                    destroyButton.style.visibility = 'visible';
                    createButton.style.visibility = 'visible';
                } else if (latestTerraformEvent.trigger == 'run:errored') {
                    destroyButton.style.visibility = 'visible';
                    createButton.style.visibility = 'visible';
                } else if (latestTerraformEvent.trigger != 'run:completed') {
                    destroyButton.style.visibility = 'hidden';
                    createButton.style.visibility = 'hidden';
                }
                const result = createRow(tableListArray, i);
                $(`#${tableId}`).append(result);
            }
        });
    }
}

function createRow(tableListArray, i) {
    var eachrow;
    if (tableListArray[i].terraform_message == "Apply Plan From Lambda function.") {
        if (tableListArray[i].trigger == 'run:completed') {
            eachrow = '<tr class="p-3 mb-2 bg-success text-white"; padding:"10px";>' +
                '<td id="vpctd" class="p-3 mb-2 bg-light text-dark" >' + tableListArray[i].run_updated_at + '</td>' +
                "<td class='text-left'>" + tableListArray[i].message + "</td>" +
                "</tr>";
            if (tableListArray[i].workspace_name == "playground-infra-ui-nachos") {
                retrieveInstances();
            }
        } else if (tableListArray[i].trigger == 'run:errored') {
            eachrow = '<tr class="p-3 mb-2 bg-warning text-dark">; padding:"10px";>' +
                "<td class='text-left' >" + tableListArray[i].run_updated_at + "</td>" +
                "<td class='text-left'>" + tableListArray[i].message + "</td>" +
                "</tr>";
        } else {
            eachrow = '<tr class="p-3 mb-2 bg-success text-white"; padding:"10px";>' +
                "<td class='text-left' >" + tableListArray[i].run_updated_at + "</td>" +
                "<td class='text-left'>" + tableListArray[i].message + "</td>" +
                "</tr>";
        }
    } else {
        if (tableListArray[i].trigger == 'run:completed') {
            eachrow = '<tr class="p-3 mb-2 bg-danger text-white"; padding:"10px";>' +
                '<td id="vpctd" class="p-3 mb-2 bg-light text-dark" >' + tableListArray[i].run_updated_at + '</td>' +
                "<td class='text-left'>" + tableListArray[i].message + "</td>" +
                "</tr>";
            retrieveInstances();
        } else if (tableListArray[i].trigger == 'run:errored') {
            eachrow = '<tr class="p-3 mb-2 bg-warning text-dark">; padding:"10px";>' +
                '<td id="vpctd" class="p-3 mb-2 bg-light text-dark" >' + tableListArray[i].run_updated_at + '</td>' +
                "<td class='text-left'>" + tableListArray[i].message + "</td>" +
                "</tr>";
        } else {
            eachrow = '<tr class="p-3 mb-2 bg-danger text-white"; padding:"10px";>' +
                "<td class='text-left' >" + tableListArray[i].run_updated_at + "</td>" +
                "<td class='text-left'>" + tableListArray[i].message + "</td>" +
                "</tr>";
        }
    }
    return eachrow;
}


function retrieveInstances() {
    $.ajax({
        url: `${apiUrl}/terraform-state`,
        type: 'POST',
        crossDomain: true,
        data: '{"path":"instances-info"}',
        dataType: 'json',
        contentType: "application/json",
        success: function(result) {
            var instanceObject = JSON.parse(result.body)
            populateInstanceTable(instanceObject, 'instancebody');
        }
    });
}

function populateInstanceTable(result, tableId) {
    var tableListArray = [];
    var Table = document.getElementById(tableId);
    var guacUrlParagraph = document.getElementById("guacUrl");
    var completedCountDiv = document.getElementById("completedCount");
    var failedCountDiv = document.getElementById("failedCount");
    var waitingCountDiv = document.getElementById("waitingCount");
    var skippedCountDiv = document.getElementById("skippedCount");
    var totalCountDiv = document.getElementById("totalCount");
    if (result.message != undefined) {
        Table.innerHTML = "";
        guacUrlParagraph.innerHTML = "";
        completedCountDiv.innerHTML = "";
        failedCountDiv.innerHTML = "";
        waitingCountDiv.innerHTML = "";
        skippedCountDiv.innerHTML = "";
        totalCountDiv.innerHTML = "";
        eachrow = '<tr class="p-3 mb-2 bg-light text-dark"; padding:"10px";>' +
            "<td></td>" +
            "<td></td>" +
            "<td></td>" +
            `<td>${result.message}</td>` +
            "<td></td>" +
            "<td></td>" +
            "</tr>";
        $(`#${tableId}`).append(eachrow);
    } else {
        var unknown_ansible_status_count = 0;
        var completed_ansible_status_count = 0;
        var failed_ansible_status_count = 0;
        var skipped_ansible_status_count = 0;
        var total_instance_count = 0;
        for (let i = 0; i < result.length; i++) {
            const { instance_id } = result[i];
            const { instance_url } = result[i];
            const { allocation } = result[i];
            const { instance_root_username } = result[i];
            const { instance_root_password } = result[i];
            var ansible_status;
            if (result[i].ansible_status == undefined) {
                ansible_status = '-';
            } else {
                ansible_status = result[i].ansible_status;
            }

            const instance = {
                "instance_id": parseInt(instance_id),
                instance_url,
                ansible_status,
                instance_root_username,
                instance_root_password,
                allocation
            }
            tableListArray.push(instance);
            total_instance_count = tableListArray.length;
            if (ansible_status == "Failed") {
                failed_ansible_status_count++;
            } else if (ansible_status == "Success") {
                completed_ansible_status_count++;
            } else if (ansible_status == "Skipped") {
                skipped_ansible_status_count++;
            } else {
                unknown_ansible_status_count++;
            }
        }
        var swapped;
        do {
            swapped = false;
            for (var i = 0; i < tableListArray.length - 1; i++) {
                if (tableListArray[i]['instance_id'] > tableListArray[i + 1]['instance_id']) {
                    var temp = tableListArray[i];
                    tableListArray[i] = tableListArray[i + 1];
                    tableListArray[i + 1] = temp;
                    swapped = true;
                }
            }
        } while (swapped);

        $.each(tableListArray, function() {
            Table.innerHTML = "";
            guacUrlParagraph.innerHTML = "";
            completedCountDiv.innerHTML = "";
            failedCountDiv.innerHTML = "";
            waitingCountDiv.innerHTML = "";
            skippedCountDiv.innerHTML = "";
            totalCountDiv.innerHTML = "";
            const guacUrl = tableListArray[0].guacamole_url;
            // const allocateButton = '<button id=allocate-button type="button" class="btn btn-success openBtn" data-toggle="modal" data-target="#allocateModal">Allocate Instances</button>';
            // $(`#allocateButton`).append(allocateButton);
            $(`#guacUrl`).append('<a href="' + guacUrl + '" target="_blank">Guacamole Sign In</a>');
            $(`#completedCount`).append(completed_ansible_status_count);
            $(`#failedCount`).append(failed_ansible_status_count);
            $(`#waitingCount`).append(unknown_ansible_status_count);
            $(`#skippedCount`).append(skipped_ansible_status_count);
            $(`#totalCount`).append("Total Number of Created Instances: " + total_instance_count);
            for (let i = 0; i < tableListArray.length; i++) {
                const result = createInstanceRow(tableListArray, i);
                $(`#${tableId}`).append(result);
            }
        });
    }
}

function createInstanceRow(tableListArray, i) {
    var eachrow;
    var ansible_status_color;
    if (tableListArray[i].ansible_status == 'Success') {
        ansible_status_color = '<tr class="p-3 mb-2 bg-success text-light"; padding:"10px";>';

    } else if (tableListArray[i].ansible_status == 'Failed') {
        ansible_status_color = '<tr class="p-3 mb-2 bg-danger text-light"; padding:"10px";>';
    } else if (tableListArray[i].ansible_status == 'Skipped') {
        ansible_status_color = '<tr class="p-3 mb-2 bg-secondary text-light"; padding:"10px";>';
    } else {
        ansible_status_color = '<tr class="p-3 mb-2 bg-warning text-dark"; padding:"10px";>';
    }
    eachrow = ansible_status_color +
        "<td class='text-left'>" + tableListArray[i].instance_id + "</td>" +
        "<td class='text-left'>" + tableListArray[i].instance_url + "</td>" +
        "<td class='text-left'>" + tableListArray[i].instance_root_username + "</td>" +
        "<td class='text-left'>" + tableListArray[i].instance_root_password + "</td>" +
        "<td class='text-left'>" + tableListArray[i].ansible_status + "</td>" +
        "<td class='text-left'>" + tableListArray[i].allocation + "</td>" +
        "</tr>";
    return eachrow;
}

function destroyInfrastructure() {
    var x = confirm("Are you sure you want to destroy?");
    if (x) {
        const jsonObject = {
            "path": "destroy-infrastructure"
        };
        sendRequestToHandler(jsonObject);
        alert('Request Successfully Sent.')
    } else {
        console.log('not confirmed');
        return false;
    }
}

function createInfrastructure() {
    const instanceQuantity = document.getElementById('instance-quantity').value
    const instanceType = document.getElementById('instance-type').value
    var softwareDependency = $('#software-dependency').val();
    const giturl = document.getElementById('git-url').value
    if (instanceQuantity == "" || instanceType == "") {
        alert("All input fields are required.");
    } else {
        var x = confirm("Are you sure you want to create?");
        if (x) {
            const jsonObject = {
                "path": "create-infrastructure",
                "data": {
                    instanceQuantity,
                    instanceType,
                    softwareDependency,
                    giturl
                }
            };
            sendRequestToHandler(jsonObject);
            alert('Request Successfully Sent.')

            const message = '<div class="alert alert-warning fade show"><strong>Warning!</strong> It may take up to <strong>30 seconds</strong> before any Terraform history starts appearing!</div>'
            $(`#userInfoPopup`).append(message);
            setInterval(function() {
                var userInfoPopUp = document.getElementById('userInfoPopup');
                userInfoPopUp.innerHTML = "";
            }, 25000);
        }
    }
}

function addNewSoftwareDependency() {
    const ymlFileName = document.getElementById('yml-filename').value
    if (ymlFileName == "") {
        alert("All input fields are required.");
    } else {
        var x = confirm("Are you sure you want to add?");
        if (x) {

            const jsonObject = {
                "path": "add-software-dependency",
                "data": {
                    "fileName": ymlFileName,
                }
            };
            sendRequestToHandler(jsonObject);
            alert('Request Successfully Sent.')
        }
    }
}

function getSoftwareDependency() {
    var softwareSelectorArray = [];
    const jsonObject = {
        "path": "get-software-dependency",
    };
    const sendRequestToHandlerResult = sendRequestToHandler(jsonObject);;
    sendRequestToHandlerResult.then((result) => {
        const body = JSON.parse(result.body);
        if (body == "error") {
            console.log('Error while retrieving list of software dependencies');
            alert('Unable to retrive software dependencies');
        } else {
            const filenameArray = body;
            var selectors = document.getElementById('software-dependency');
            selectors.innerHTML = "";
            for (let i = 0; i < filenameArray.length; i++) {
                const { filename } = filenameArray[i];
                softwareSelectorArray.push(filename);
                eachrow = '<option>' + filename + '</option>';
                $(`#software-dependency`).append(eachrow);
            }
        }
    });
}

function sendRequestToHandler(body) {
    return new Promise((resolve) => {
        const jsonResponse = (JSON.stringify(body));
        $.ajax({
            url: `${apiUrl}/terraform-state`,
            type: 'POST',
            crossDomain: true,
            data: jsonResponse,
            dataType: 'json',
            contentType: "application/json",
            success: function(result) {
                resolve(result);
            }
        });
    })
};

// function allocateInstance() {
//     return new Promise((resolve) => {
//         const participantName = document.getElementById('participant-name').value
//         const participantEmail = document.getElementById('participant-email').value

//         var jsonObject = {
//             "path": "allocate-instance",
//             "data": {
//                 participantName,
//                 participantEmail,
//             }
//         };

//         console.log(jsonObject);
//         const jsonResponse = (JSON.stringify(jsonObject));
//         $.ajax({
//             url: `${apiUrl}/terraform-state`,
//             type: 'POST',
//             crossDomain: true,
//             data: jsonResponse,
//             dataType: 'json',
//             contentType: "application/json",
//             success: function(result) {
//                 resolve(result);
//             }
//         });
//     })
// }