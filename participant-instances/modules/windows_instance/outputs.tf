output "ip_addresses" {
  value       = "${aws_instance.windows_instances.*.public_ip}"
  description = "List of IP addresses"
}

output "ips_with_admin_passwords" {
  value       = "${zipmap(aws_instance.windows_instances.*.public_ip,aws_instance_windows_instances.*.password_data)}"
  description = "Outputs a hashmap with all the IP addresses, and the corresponding admin passwords"
}
