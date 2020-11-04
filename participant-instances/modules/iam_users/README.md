# DPG - IAM Users module

This simple module creates a number of AWS IAM users,and access key/secret key pairs for these users.
The module currently only supports receiving a policy document, which gets uploaded as an IAM group's inline policy, to which the users will be added.

Please note: All access keys are stored in plain text. Do NOT use it for production and do not commit the statefile into public VCS.

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
| animal\_names | List of animal names to assign to the instances | list | `<list>` | no |
| count | Number of IAM Users to create | string | n/a | yes |
| iam\_policy | Rendered IAM Policy to associate to the IAM users | string | n/a | yes |
| stack\_name | Name of the training stack | string | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| iam\_access\_key | List of created access keys for the users |
| iam\_secret\_key | List of created secret keys for the access keys |
| iam\_usernames | List of created IAM users |
