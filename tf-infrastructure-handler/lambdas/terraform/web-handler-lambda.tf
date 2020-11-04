# IAM Role for cloud-handler Lambda function
resource "aws_iam_role" "web-handler" {
  name = "dpg-web-handler"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# IAM Role Policy for cloud-handler lambda logs
resource "aws_iam_role_policy" "web-handler-logs" {
  name = "dpg-web-handler-lambda_log_policy"
  role = "${aws_iam_role.web-handler.id}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "logs:GetLogEvents",
                "logs:FilterLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}

# IAM Role Policy for Alexa Lambda Logs
resource "aws_iam_role_policy" "web-handler-dynamo" {
  name = "web-handler_dynamo_policy"
  role = "${aws_iam_role.web-handler.id}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "dynamodb:BatchWriteItem",
                "dynamodb:UntagResource",
                "dynamodb:PutItem",
                "dynamodb:ListTables",
                "dynamodb:DeleteItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteTable",
                "dynamodb:CreateTable",
                "dynamodb:TagResource",
                "dynamodb:DescribeTable",
                "dynamodb:GetItem",
                "dynamodb:UpdateTable",
                "dynamodb:GetRecords"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}


# Create cloud-handler Lambda function
data "archive_file" "web-handler" {
  type = "zip"
  source_dir = "../web-handler/"
  output_path = "web-handler.zip"
}

resource "aws_lambda_function" "web-handler" {
  filename         = "${data.archive_file.web-handler.output_path}"
  function_name    = "dpg-web-handler"
  description      = "Handlers all requests made from the website."
  role             = "${aws_iam_role.web-handler.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("${data.archive_file.web-handler.output_path}"))}"
  runtime          = "nodejs8.10"
  timeout          = 45
  memory_size      = 2048
  environment {
    variables = {
      TF_CLOUD_TEAM_KEY = "${var.TF_CLOUD_TEAM_KEY}",
      API_GATEWAY_URL = "${aws_api_gateway_deployment.dpg-api-deployment.invoke_url}",
      EVENT_DB_TABLE_NAME = "${aws_dynamodb_table.events.id}",
      SOFTWARE_DEPENDENCY_DB_TABLE_NAME = "${aws_dynamodb_table.software-dependency.id}",
      INSTANCE_DB_TABLE_NAME = "dpg_cloud_instance"
    }
  }
}
