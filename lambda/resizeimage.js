const sharp = require('sharp');
const path = require('path');

var AWS = require('aws-sdk');

// Set the REGION
AWS.config.update({
    region: "ap-south-1"
});

var s3 = new AWS.S3();

// This Lambda function is attached to an S3 bucket. When any object is added in the S3
// busker this handler will be called. This Lambda function "assumes" that only image files
// are added in the S3 bucket. When an image file is added in the S3 bucket, this function
// creates a square thumbnail of 300px x 300px size and it also creates a cover photo of
// 800px x 800px size. It then stores the thumbnail and coverphotos back to the same S3 bucket
// at the same location as the original image file.
exports.handler = async (event, context, callback) => {

    // Print the event that we got
    console.log(JSON.stringify(event));

    var records = event.Records;

    // How many records do we have? Each record represent one object in S3
    var size = records.length;

    // Iterate over all the records for which this handler was celled
    for (var index = 0; index < size; index++) {

        var record = records[index];

        console.log(record);

        // Extract the file name, path and extension
        var fileName = path.parse(record.s3.object.key).name;
        var filePath = path.parse(record.s3.object.key).dir;
        var fileExt = path.parse(record.s3.object.key).ext;

        // Log file name, path and extension
        console.log("filePath:" + filePath + ", fileName:" + fileName + ", fileExt:" + fileExt);

        // Read the image object that was added to the S3 bucket
        var imageObjectParam = {
            Bucket: record.s3.bucket.name,
            Key: record.s3.object.key
        }

        console.log(JSON.stringify(imageObjectParam));

        var imageObject = await s3.getObject(imageObjectParam).promise();

        // Use sharp to create a 300px x 300px thumbnail
        // withMetadata() keeps the header info so rendering engine can read
        // orientation properly.
        var resizePromise1 = sharp(imageObject.Body)
                            .resize({
                                width: 300,
                                height: 300,
                                fit: sharp.fit.cover
                            })
                            .withMetadata()
                            .toBuffer();

        // Use sharp to create a 800px x 800px coverphoto
        var resizePromise2 = sharp(imageObject.Body)
                            .resize({
                                width: 800,
                                height: 800,
                                fit: sharp.fit.cover
                            })
                            .withMetadata()
                            .toBuffer();

        var promises = [];
        promises.push(resizePromise1)
        promises.push(resizePromise2)

        // Execute the resize operation - Promises offer a good way of
        // doing "parallel" work.
        var result = await Promise.all(promises);

        console.log("result:" + JSON.stringify(result));

        // Now save the thumbnail object back to the same s3 file
        // We give public read permission so that client apps can read
        // it easily.
        //
        // CAUTION - When writing a "s3 create object" handler make sure that you are
        //           not doing "put object" in the same bucket in the handler. As best practice, 
        //           always do "put object" in a seperate s3 bucket. Doing put object in the same
        //           bucket has a very high possibility of ending up in an infinite loop
        //           which will not only cost you but will end up creating thousands of
        //           objects in a matter of seconds. So remember - ALWAYS do put object in
        //           a different bucket.
        //
        //           In this example, we are writing the original object in sdsip-in-image-bucket.
        //           The processed images are written to sdsip-out-image-bucket.
        //
        var putObjectParam1 = {
            Body: result[0],
            Bucket: "sdsip-out-image-bucket",
            Key: fileName + "_thumbnail" + fileExt,
            ACL: "public-read",
            CacheControl: "max-age=3600",
            ContentType: "image/" + fileExt.substring(1)
        }

        console.log("putObjectParam1:" + JSON.stringify(putObjectParam1));

        var putResult1 = await s3.putObject(putObjectParam1).promise();

        console.log("putResult1:" + JSON.stringify(putResult1));

        // Now save the coverphoto object back to the same s3 file
        // We give public read permission so that client apps can read
        // it easily.
        var putObjectParam2 = {
            Body: result[1],
            Bucket: "sdsip-out-image-bucket",
            Key: fileName + "_coverphoto" + fileExt,
            ACL: "public-read",
            CacheControl: "max-age=3600",
            ContentType: "image/" + fileExt.substring(1)
        }

        console.log("putObjectParam2:" + JSON.stringify(putObjectParam2));

        var putResult2 = await s3.putObject(putObjectParam2).promise();

        console.log("putResult2:" + JSON.stringify(putResult2));
    }

}