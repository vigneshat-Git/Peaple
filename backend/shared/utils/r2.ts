import { S3 } from 'aws-sdk';

if (!process.env.CLOUDFLARE_R2_ACCESS_KEY || !process.env.CLOUDFLARE_R2_SECRET || !process.env.CLOUDFLARE_R2_BUCKET) {
  // we don't throw here because some services might not use R2
}

export const s3 = new S3({
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET,
  endpoint: 'https://<accountid>.r2.cloudflarestorage.com', // placeholder, user must replace
  s3ForcePathStyle: true,
});

export const uploadFile = async (key: string, body: Buffer | Uint8Array | string, contentType: string) => {
  const params = {
    Bucket: process.env.CLOUDFLARE_R2_BUCKET as string,
    Key: key,
    Body: body,
    ContentType: contentType,
  };
  return s3.upload(params).promise();
};
