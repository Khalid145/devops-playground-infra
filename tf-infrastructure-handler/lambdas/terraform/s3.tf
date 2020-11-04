resource "aws_s3_bucket_object" "index_html" {
  bucket = "${aws_s3_bucket.dpg-tf-cloud-web.bucket}"
  #acl    = "private"
  key = "index.html"
  source = "../../web/index.html"
  content_type = "text/html"
  etag = "${md5(file("../../web/index.html"))}"
}

resource "aws_s3_bucket_object" "script_js" {
  bucket = "${aws_s3_bucket.dpg-tf-cloud-web.bucket}"
  #acl    = "private"
  key = "script.js"
  source = "../../web/script.js"
  content_type = "text/html"
  etag = "${md5(file("../../web/script.js"))}"
}

resource "aws_s3_bucket" "dpg-tf-cloud-web" {
  bucket = "console-dpg-infrastructure"
  acl    = "public-read"

  website {
    index_document = "index.html"
    error_document = "index.html"

  }

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}