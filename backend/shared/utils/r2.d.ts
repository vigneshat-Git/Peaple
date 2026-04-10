/// <reference types="node" />
/// <reference types="node" />
import { S3Client } from '@aws-sdk/client-s3';
export declare const s3Client: S3Client;
export declare const generateSignedUploadUrl: (key: string, contentType: string, maxSize?: number) => Promise<{
    signedUrl: string;
    publicUrl: string;
}>;
export declare const uploadFile: (key: string, body: Buffer | Uint8Array | string, contentType: string) => Promise<import("@aws-sdk/client-s3").PutObjectCommandOutput>;
//# sourceMappingURL=r2.d.ts.map