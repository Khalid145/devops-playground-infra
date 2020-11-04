data "terraform_remote_state" "vpc_state" {
  backend = "remote"
  config = {
    organization = "ECSD-DPG"

    workspaces {
      name = "playground-infra-ui-vpc"
    }
  }
}

data "terraform_remote_state" "guac_state" {
  backend = "remote"
  config = {
    organization = "ECSD-DPG"

    workspaces {
      name = "playground-infra-ui-guacamole"
    }
  }
}


#data "terraform_remote_state" "vpc_state" {
#  backend = "local"

#  config = {
#    path = "${path.module}/../vpc/terraform.tfstate"
#  }
#}

#data "terraform_remote_state" "guac_state" {
#  backend = "local"

#  config = {
#    path = "${path.module}/../guacamole/terraform.tfstate"
#  }
#}