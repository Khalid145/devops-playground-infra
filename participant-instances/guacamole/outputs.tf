output "instance_ip" {
  value = "${aws_instance.guacamole.public_ip}"
}

output "security_group_id" {
  value = "${aws_security_group.guacamole.id}"
}

output "a" {
  value = "${data.terraform_remote_state.vpc_state.vpc_id}"
}
