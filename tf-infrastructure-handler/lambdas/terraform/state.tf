terraform {
  backend "remote" {
    hostname = "app.terraform.io"
    organization = "ECSD-DPG"

    workspaces {
      name = " playground-infra-managing-console"
    }
  }
}
