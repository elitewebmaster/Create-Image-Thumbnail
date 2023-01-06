'use strict';

const AWS = require('aws-sdk'),
    Sharp = require('sharp'),
    S3 = new AWS.S3();


function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth = 122, maxHeight = 91){ 
  srcWidth = Math.round(srcWidth);
  srcHeight = Math.round(srcHeight);
  var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return { width: Math.round(srcWidth*ratio), height: Math.round(srcHeight*ratio) };
}    

exports.handler = function(event, context, callback) {
  var key = decodeURIComponent(event.Records[0].s3.object.key), 
      bucket = process.env.S3_BUCKET_NAME;

  S3.getObject({Bucket: bucket, Key: key}).promise()
    .then(data => Sharp(data.Body).metadata()
      .then(info => {
        const calcDimension = calculateAspectRatioFit(info.width, info.height);

        Sharp(data.Body).resize(calcDimension.width, calcDimension.height).toBuffer()
        .then(buffer => S3.putObject({
          ACL: process.env.S3_BUCKET_ACL,
          Body: buffer,
          Bucket: bucket,
          ContentType: 'image/' + info.format,
          Key: "ImageThumbnail" + key.slice(key.indexOf("/"), key.length),
        }).promise())
        .catch(err => console.log(err));
      })
    )
    .catch(err => console.log(err));    
}
