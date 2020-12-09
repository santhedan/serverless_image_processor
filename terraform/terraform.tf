provider "aws" {
  profile = "default"
  region  = "ap-south-1"
}

# Layer resource - sharp nodejs module
resource "aws_lambda_layer_version" "sharplib_lambda_layer" {
  s3_bucket  = "sdsip-code-bucket"
  s3_key     = "sharplayer.zip"
  layer_name = "sharplib_lambda_layer"

  source_code_hash = filebase64sha256("../layer/sharplayer.zip")

  compatible_runtimes = ["nodejs12.x"]
}

# Role assigned to Lambda function
resource "aws_iam_role" "SDSIPLambdaRole" {
  name               = "SDSIPLambdaRole"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

# Policy assigned to Lambda function role
data "template_file" "policy" {
  template = "${file("${path.module}/policy.json")}"
}

resource "aws_iam_policy" "SDSIPLambdaPolicy" {
  name        = "SDSIPLambdaPolicy"
  path        = "/"
  description = "IAM policy for lambda functions"
  policy      = data.template_file.policy.rendered
}

# Assigning policy to role
resource "aws_iam_role_policy_attachment" "SDSIPRolePolicy" {
  role       = aws_iam_role.SDSIPLambdaRole.name
  policy_arn = aws_iam_policy.SDSIPLambdaPolicy.arn
}

# Lambda function resource
resource "aws_lambda_function" "ServerlessImageHandler" {

  function_name = "ServerlessImageHandler"

  s3_bucket = "sdsip-code-bucket"
  s3_key    = "sdsip_lambda.zip"

  handler = "resizeimage.handler"
  runtime = "nodejs12.x"

  source_code_hash = filebase64sha256("../lambda/sdsip_lambda.zip")

  layers = ["${aws_lambda_layer_version.sharplib_lambda_layer.arn}"]

  role = aws_iam_role.SDSIPLambdaRole.arn

  timeout     = "300"
  memory_size = "2048"

}
