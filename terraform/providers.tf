provider "aws" {
  version = "~> 2.13"
  region = "ap-southeast-2"
  profile = "alexpls"
}

# SSL certs need to be provisioned in us-east-1 in order to
# work with CloudFront distributions.
provider "aws" {
  alias = "us-east-1"
  version = "~> 2.13"
  region = "us-east-1"
  profile = "alexpls"
}
