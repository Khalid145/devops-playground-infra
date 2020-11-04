output "ip_addresses" {
  value       = "${aws_instance.linux_instances.*.public_ip}"
  description = "List of IP addresses for the linux instances"
}

output "private_ip_addresses" {
  value       = "${aws_instance.linux_instances.*.private_ip}"
  description = "List of IP private addresses for the linux instances"
}
