variable "count" {
  default     = 1
  description = "How many EC2 instances we'd like to have"
}

variable "custom_install_scripts" {
  description = "Put here a rendered Powershell script without <powershell> tags that will be run as a scheduled task once."
  default     = ""
}

variable "rdp_user" {
  default     = "playground"
  description = "Username for the RDP connection"
}

variable "rdp_password" {
  default     = "PeoplesComputers1"
  description = "Password for the RDP connection"
}

variable "animal_names" {
  default     = []
  description = "List of animal names to associate with the instances"
}

variable "vpc_id" {
  description = "VPC to put the instances into"
}

variable "subnet_ids" {
  type        = "list"
  description = "List of subnets to put the instances into."
}

variable "default_security_group_id" {
  description = "The VPC's default security group ID"
}

variable "instance_type" {
  default     = "m4.large"
  description = "Type of the EC2 instance we're launching"
}

variable "stack_name" {
  description = "Prefix for the instance names"
}

variable "ssh_key_name" {
  description = "The name of the SSH key we encrypt the Administrator password with"
}
