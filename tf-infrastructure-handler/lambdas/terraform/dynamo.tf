resource "aws_dynamodb_table" "software-dependency" {
  name           = "dpg_cloud_software_dependency"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "filename"

  attribute {
    name = "filename"
    type = "S"
  }
}

resource "aws_dynamodb_table" "events" {
  name           = "dpg_cloud_events"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "run_id"
  range_key = "run_updated_at"

  attribute {
    name = "run_id"
    type = "S"
  }

  attribute {
    name = "run_updated_at"
    type = "S"
  }
}