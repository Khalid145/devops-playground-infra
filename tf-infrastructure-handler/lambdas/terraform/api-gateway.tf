# Deploy the API Gateway
resource "aws_api_gateway_deployment" "dpg-api-deployment" {
  rest_api_id = "${aws_api_gateway_rest_api.api.id}"
  stage_name = "dpg"
  stage_description = "${md5(file("dpg-api-definition.json"))}"
}

# Provide template of the API Gateway i.e. Swagger(JSON)
data "template_file" "swagger_api" {
  template = "${file("dpg-api-definition.json")}"
  vars {
    title = "DPG API Gateway"
    description = "The API Gateway for DPG Cloud."
    lambda_gw_role_arn = "${aws_iam_role.apigw_lambda_role.arn}"
    dpg-cloud-handler= "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${var.account_id}:function:dpg-cloud-handler/invocations"
    dpg-notification-listener= "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${var.account_id}:function:dpg-notification-listener/invocations"
    dpg-terraform-state= "arn:aws:apigateway:${var.region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.region}:${var.account_id}:function:dpg-web-handler/invocations"

  }
}

# Create API Gateway using the template_file
resource "aws_api_gateway_rest_api" "api" {
  name = "DPG API Gateway"
  description = "The API Gateway for DPG Cloud."
  body = "${data.template_file.swagger_api.rendered}"
}

# IAM Role for API Gateway
resource "aws_iam_role" "apigw_lambda_role" {
  name = "apigw_lambda_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_lambda_permission" "apigw_cloud_handler" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.cloud-handler.arn}"
  principal     = "apigateway.amazonaws.com"
  source_arn = "arn:aws:execute-api:${var.region}:${var.account_id}:${aws_api_gateway_rest_api.api.id}/*/*/"
}

resource "aws_lambda_permission" "apigw_notification_listener" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.notification-listener.arn}"
  principal     = "apigateway.amazonaws.com"
  source_arn = "arn:aws:execute-api:${var.region}:${var.account_id}:${aws_api_gateway_rest_api.api.id}/*/*/notification-listener"
}

resource "aws_lambda_permission" "apigw_web_handler" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.web-handler.arn}"
  principal     = "apigateway.amazonaws.com"
  source_arn = "arn:aws:execute-api:${var.region}:${var.account_id}:${aws_api_gateway_rest_api.api.id}/*/*/terraform-state"
}

output "deployment_invoke_url" {
  description = "Deployment invoke url"
  value       = "${aws_api_gateway_deployment.dpg-api-deployment.invoke_url}"
}