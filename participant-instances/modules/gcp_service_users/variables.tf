variable "count" {
  description = "Number of Service accounts to be created"
}

variable "stack_name" {
  description = "Name of the training stack"
}

variable "animal_names" {
  description = "List of animal names to assign to the instances"
  default     = []
}

variable "project_id" {
  description = "Project ID for GCP"
}

variable "gcp_tf_service_user" {
  description = "Service account for the TF script, we're binding the new service accounts to"
}

variable "region" {
  default     = "eu-west1"
  description = "Main region to use with the GCP provider"
}

variable "creds_file_data" {
  description = "The contents of the file GCP credentials json file"
  default     = ""
}
