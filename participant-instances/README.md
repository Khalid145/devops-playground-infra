
### Summary

This set of Terraform scripts has been designed in order to facilitate an easier spin-up of DevOps Playground infrastructure. The infrastructure doesn't require any installation on customer machines, since the created instances can be accessed directly from an internet browser.  

---

# Requirements  
In order to run the script, the following criteria must be satisfied:  
- You must have SSH access to all the `ECSD` GitHub organization projects  
- Your AWS account IAM permissions should include the following:  
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "ec2:AssociateRouteTable",
                "ec2:AttachInternetGateway",
                "ec2:AuthorizeSecurityGroup*",
                "ec2:CreateInternetGateway",
                "ec2:CreateRoute",
                "ec2:CreateRouteTable",
                "ec2:CreateSecurityGroup",
                "ec2:CreateSubnet",
                "ec2:CreateTags",
                "ec2:CreateVpc",
                "ec2:DeleteInternetGateway",
                "ec2:DeleteKeyPair",
                "ec2:DeleteRoute",
                "ec2:DeleteRouteTable",
                "ec2:DeleteSecurityGroup",
                "ec2:DeleteSubnet",
                "ec2:DeleteVpc",
                "ec2:Describe*",
                "ec2:DetachInternetGateway",
                "ec2:DisassociateRouteTable",
                "ec2:ImportKeyPair",
                "ec2:ModifySubnetAttribute",
                "ec2:ModifyVpcAttribute",
                "ec2:RevokeSecurityGroup*",
                "ec2:RunInstances",
                "ec2:TerminateInstances",
                "route53:ChangeResourceRecordSets",
                "route53:Get*",
                "route53:List*",
                "sts:GetCallerIdentity"
            ],
            "Resource": "*"
        }
    ]
}
```
# Customising the client-facing instances  

The "nachos", or the Instances that run your DevOps Playground infrastructure can be easily customised before you build your infrastructure. In order to do that:  

1. Navigate to the `./nachos/scripts` directory.  
2. Using **bash**, edit the `install_playground_tools.sh` script to choose what to install onto the instances. This script will be automatically ran at the instance boot time.  
   
## Optional
3. Navigate to the `variables.tf` file in `./guacamole` directory and perform the following:  
   1. Change the `instance_type` to support the desired Playground infrastructure size  
   2. Change the `hosted_zone_id` to represent your desired domain name  
4. Navigate to the `variables.tf` file in `./nachos` directory and perform the following:  
   1. Change the `instance_type` as required by your `install_playground_tools.sh` script  
   2. Change the `count` to specify how many `EC2 instances` are required for the Playground  
   3. Change the `hosted_zone_id` to represent your desired domain name  
   4. Modify the installation type by changing the `instance_flavour` variable  



# How to build this environment

**To build the infrastructure:**  

Execute `./up.sh` and follow the instructions.  

Alternatively:  

1. Ensure that the environment has **access to required the AMI images** (see the table below for details on the AMIs)  
2. Navigate to the guacamole folder `cd guacamole`  
3. `terraform init -out guacamole.plan`  
4. `terraform apply "guacamole.plan"`  
5. Navigate to the nachos folder `cd ../nachos`  
6. **If terraform-provider-guacamole is not in the nachos folder:** Download guacamole provider from [https://github.com/mdanidl/terraform-provider-guacamole](https://github.com/mdanidl/terraform-provider-guacamole)  
7. `terraform init -out nachos.plan`  
8. `terraform apply "nachos.plan"`  
9. To tear down the environment, just do `terraform destroy` in the respective directories  

**To destroy the infrastructure:**
Execute `./down.sh` and confirm you want to destroy the environments.  

Alternatively, to tear down the environments, execute `terraform destroy` in the respective directories.  

---

## AMI's  

The following AMI's need to be available on your AWS account in order to run the scripts. Keep in mind that these can be re-baked using [packer](https://www.packer.io/intro/getting-started/build-image.html).  

| Script directory   | Machine name                    | Packer script location                                                      |
| ------------------ | ------------------------------- | --------------------------------------------------------------------------- |
|  ./guacamole       |  `"^guacamole-ubuntu-.*"`       |  https://github.ecs-digital.co.uk/daniel-meszaros/holly                     |
|  ./nachos          |  `"*playground-base-ubuntu-*"`  |  https://github.ecs-digital.co.uk/devops-playground/playground-base-ubuntu  |


---

### TODO:
Please refer to the following Jira board for more details: https://foresttechnologies.atlassian.net/jira/software/projects/CWE/boards/102