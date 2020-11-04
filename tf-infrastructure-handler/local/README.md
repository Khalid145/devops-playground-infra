# How to execute locally

This node application can be executed locally and does the following:
- Creates AWS Infrastructure via Terraform Cloud.
- Destroys AWS Infrastructure via Terraform Cloud.

## Prerequisites

### Execution Structure:
```
node index.js --destroy=... --count=... --type=... --software=[...]
```
The following arguments are required when executing this script:
- **$TF_CLOUD_TEAM_KEY** = Terraform Cloud Team API Token ***(AS AN ENVIRONMENTAL VARIABLE)***.
- **destoy** = **true** is destroy infrastructure, **false** is create infrastructure.
- **count** = Numeric amount of instances to be created.
- **type** = Type of AWS instance.
- **software** = An array of the Ansible playbook filenames.

### Example execution:
```
node index.js --destroy=false --count=5 --type=t2.micro --software=[nodejs.yml,openjdk-8.yml]
```