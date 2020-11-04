variable "count" {
  default = 1
}

variable "ssh_user" {
  default = "playground"
}

variable "ssh_password" {
  default = "playground"
}

variable "instance_type" {
  default = "t2.micro"
}

# Supported flavours: "desktop", "minimal", "wetty"
variable "instance_flavour" {
  default = "desktop"
}

variable "softwares_dependency" {
  
}

variable "git_url" {

}

variable "git_username" {

}

variable "git_password" {

}

variable "api_url" {

}