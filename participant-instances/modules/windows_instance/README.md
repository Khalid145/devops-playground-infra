# DPG - Windows Instace module

Creates a number of windows instances, naming them using the `animal_names` list. You can provide extra installation steps in powershell in the `custom_instal_scripts` variable.

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
| animal\_names | List of animal names to associate with the instances | list | `<list>` | no |
| count | How many EC2 instances we'd like to have | string | `"1"` | no |
| custom\_install\_scripts | Put here a rendered Powershell script without <powershell> tags that will be run as a scheduled task once. | string | `""` | no |
| default\_security\_group\_id | The VPC's default security group ID | string | n/a | yes |
| instance\_type | Type of the EC2 instance we're launching | string | `"m4.large"` | no |
| rdp\_password | Password for the RDP connection | string | `"PeoplesComputers1"` | no |
| rdp\_user | Username for the RDP connection | string | `"playground"` | no |
| ssh\_key\_name | The name of the SSH key we encrypt the Administrator password with | string | n/a | yes |
| stack\_name | Prefix for the instance names | string | n/a | yes |
| subnet\_ids | List of subnets to put the instances into. | list | n/a | yes |
| vpc\_id | VPC to put the instances into | string | n/a | yes |

## Outputs

| Name | Description |
|------|-------------|
| ip\_addresses | List of IP addresses |
| ips\_with\_admin\_passwords | Outputs a hashmap with all the IP addresses, and the corresponding admin passwords |
