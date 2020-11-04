output "service_acc_private_key" {
  value       = "${google_service_account_key.mykey.*.private_key}"
  description = "Base64 encoded json block to configure gcloud"
}
