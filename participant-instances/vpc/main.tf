provider "aws" {
  version = "~> 2.0"
  region  = "eu-west-1"
}

terraform {
  required_version = ">= 0.11.14, < 0.12.0"
}

# Some local variables
locals {
  stack = "dpg-builder-vpc"
}

# Summoning the VPC module. Creating a VPC with default settings.
module "vpc" {
  source = "../modules/vpc/"
  name   = "${local.stack}"
}
