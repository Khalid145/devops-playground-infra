# DPG - GCP Service users

This module's purpose is to create service users inside a Project in a GCP account.

## IMPORTANT

In order to use this module, the service user used by terraform have to have access to some APIs which are likely to be turned off if you're using a CloudSandpit project.

* Enable the relevant APIs: cloud resource manager api, IAM api
* Create a service account using the console and give it access to the following roles:
  * Cloud Build Service Account
  * Cloud Build Editor
  * Role Administrator
  * Service Account Admin
  * Delete Service Accounts
  * Service Account Key Admin

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
| animal\_names | List of animal names to assign to the instances | list | `<list>` | no |
| count | Number of Service accounts to be created | string | n/a | yes |
| creds\_file\_data | The contents of the file GCP credentials json file | string | `""` | no |
| gcp\_tf\_service\_user | Service account for the TF script, we're binding the new service accounts to | string | n/a | yes |
| project\_id | Project ID for GCP | string | n/a | yes |
| region | Main region to use with the GCP provider | string | `"eu-west1"` | no |
| stack\_name | Name of the training stack | string | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| service\_acc\_private\_key | Base64 encoded json block to configure gcloud |
