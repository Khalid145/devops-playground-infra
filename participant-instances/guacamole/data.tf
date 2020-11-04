data "terraform_remote_state" "vpc_state" {
  backend = "remote"
  config = {
    organization = "ECSD-DPG"

    workspaces {
      name = "playground-infra-ui-vpc"
    }
  }
}

data "aws_caller_identity" "current_user" {}

#data "terraform_remote_state" "vpc_state" {
#  backend = "local"

#  config = {
#    path = "${path.module}/../vpc/terraform.tfstate"
#  }
#}