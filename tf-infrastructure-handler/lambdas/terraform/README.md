This Terraform script will spin up all of the resources needed for the Playground MeetUp Infrastructure Console.

Please note: If the Playground MeetUp Infrastructure Console has been completely destroyed by Terraform, once a fresh apply has been made, you will need to grab the API URL from the terraform output and place it in the following:

- Terraform Cloud Workspace Notifications ( you will need to edit this webhook url to the updated API Gateway URL for the VPC, Nachos & Guacamole workspaces).

- Static Webpage Javascript Script ( there is one variable named *apiUrl* that needs to be updated).