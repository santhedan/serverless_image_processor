#
# This batch file requires one argument - AWS CLI profile name
#
# This batch file creates an S3 bucket in ap-south-1 region
#
# This batch file will zip the sharp nodejs module and upload it to the
# given s3 bucket (sdsip-code-bucket). Since bucket names have to be unique
# you will have to change to your own bucket name before running the script
#
rm -rf ./sdsip_lambda.zip
zip ./sdsip_lambda.zip *.js
/usr/local/bin/aws2 --profile $1 s3api create-bucket --bucket=sdsip-code-bucket --region=ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1
/usr/local/bin/aws2 --profile $1 s3 cp ./sdsip_lambda.zip s3://sdsip-code-bucket/sdsip_lambda.zip