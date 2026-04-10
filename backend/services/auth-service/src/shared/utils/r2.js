import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME || !process.env.R2_ACCOUNT_ID) {
    console.warn('R2 credentials not set');
}
export const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});
export const generateSignedUploadUrl = async (key, contentType, maxSize) => {
    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ...(maxSize && { ContentLength: maxSize }),
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    return { signedUrl, publicUrl };
};
export const uploadFile = async (key, body, contentType) => {
    const command = new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    });
    return s3Client.send(command);
};
//# sourceMappingURL=r2.js.map