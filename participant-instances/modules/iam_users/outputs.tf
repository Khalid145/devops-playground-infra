output "iam_usernames" {
  value       = "${aws_iam_user.playground.*.name}"
  description = "List of created IAM users"
}

output "iam_access_key" {
  value       = "${aws_iam_access_key.playground.*.id}"
  description = "List of created access keys for the users"
}

output "iam_secret_key" {
  value       = "${aws_iam_access_key.playground.*.secret}"
  description = "List of created secret keys for the access keys"
}
