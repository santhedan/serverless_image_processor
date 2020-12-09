# This script takes AWS CLI profile name as argument
# Since s3 bucket names are unique, you will have to change the bucket name
/usr/local/bin/aws2 --profile $1 s3 cp ./test_image1.jpg s3://sdsip-in-image-bucket/test_image1.jpg
/usr/local/bin/aws2 --profile $1 s3 cp ./test_image2.jpg s3://sdsip-in-image-bucket/test_image2.jpg
/usr/local/bin/aws2 --profile $1 s3 cp ./test_image3.jpg s3://sdsip-in-image-bucket/test_image3.jpg