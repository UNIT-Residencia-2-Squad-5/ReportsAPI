import {
  S3Client as AwsS3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
  HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";
import { Upload } from "@aws-sdk/lib-storage";

export type ObjectKey = string;

export interface UploadResult {
  bucket: string;
  key: ObjectKey;
  etag?: string;
}

export class S3Storage {
  private client: AwsS3Client;
  private bucket: string;
  private defaultTTL: number;

  constructor() {
    const endpoint = mustGetEnv("S3_ENDPOINT");
    const region = mustGetEnv("S3_REGION");
    const accessKeyId = mustGetEnv("S3_ACCESS_KEY");
    const secretAccessKey = mustGetEnv("S3_SECRET_KEY");
    const forcePathStyle = (process.env.S3_FORCE_PATH_STYLE ?? "true").trim() === "true";
    this.bucket = mustGetEnv("S3_BUCKET");
    this.defaultTTL = Number(process.env.S3_PRESIGNED_TTL_SECONDS ?? "600");
    
    this.client = new AwsS3Client({
      region,
      endpoint,
      forcePathStyle,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      requestChecksumCalculation: "WHEN_REQUIRED"
    });
  }

  async uploadBuffer(key: ObjectKey, body: Buffer, contentType: string, metadata?: Record<string, string>): Promise<UploadResult> {
    const input: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    };
    const out = await this.client.send(new PutObjectCommand(input));

    return {
      bucket: this.bucket,
      key,
      etag: out.ETag,
    };
  }

  async uploadStream(key: ObjectKey, stream: Readable, contentType: string, metadata?: Record<string, string>): Promise<UploadResult> {
      const input: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ContentType: contentType,
        Metadata: metadata,
    };
    const out = await this.client.send(new PutObjectCommand(input));
    
    return {
      bucket: this.bucket,
      key,
      etag: out.ETag,
    };
  }

  async presignGetUrl(key: ObjectKey, ttlSeconds?: number, downloadFileName?: string): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: downloadFileName ? `attachment; filename="${sanitizeFileName(downloadFileName)}"`
      : undefined,
    });
    return getSignedUrl(this.client, cmd, { expiresIn: ttlSeconds ?? this.defaultTTL });
  }
  
  async head(key: ObjectKey): Promise<HeadObjectCommandOutput> {
    return this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async delete(key: ObjectKey): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async uploadStreamMultipart(
    key: string,
    stream: Readable,
    contentType: string,
    metadata?: Record<string, string>,
    opts?: { partSize?: number; queueSize?: number }
  ) {
    const uploader = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ContentType: contentType,
        Metadata: metadata,
      },
      partSize: opts?.partSize ?? 5 * 1024 * 1024, 
      queueSize: opts?.queueSize ?? 4,             
      leavePartsOnError: false,
    });

    uploader.on("httpUploadProgress", (p) => console.log("progress:", p));

    const out = await uploader.done();
    return { bucket: this.bucket, key, etag: (out as any).ETag };
  }
}

function mustGetEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Env var ${name} is required`);
  return v.trim();
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\r\n"]/g, "_");
}