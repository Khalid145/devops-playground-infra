variable "count" {
  description = "Number of IAM Users to create"
}

variable "stack_name" {
  description = "Name of the training stack"
}

variable "animal_names" {
  description = "List of animal names to assign to the instances"
  default     = []
}

variable "iam_policy" {
  description = "Rendered IAM Policy to associate to the IAM users"
}
