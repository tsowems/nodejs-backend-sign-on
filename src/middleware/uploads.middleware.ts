import aws from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";
import { AWS_ACCESS_KEY, AWS_ACCESS_KEY_ID, S3_REGION, S3_BUCKET } from "../config";

aws.config.update({
  secretAccessKey: AWS_ACCESS_KEY,
  accessKeyId: AWS_ACCESS_KEY_ID,
  region: S3_REGION, // region of bucket
});

const s3 = new aws.S3();

export const pictureUpload = multer({
  storage: multerS3({
    s3,
    bucket: S3_BUCKET,
    //acl: "public-read",
    metadata(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key(req, file, cb) {
      console.log("itreach");
      const fileName = Date.now();
      const originalName = file.originalname;
      const extension = originalName.slice(originalName.lastIndexOf("."));
      const newFileName = `users/${fileName}${extension}`;
      cb(null, newFileName);
    },
  }),
});

export const destroyS3File = (filename: any, callback: any) => {
  const params = {
    Bucket: S3_BUCKET,
    Key: filename,
  };
  s3.deleteObject(params, (err, data) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
};
