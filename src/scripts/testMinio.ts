import {S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import "dotenv/config";

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION;
const bucket = process.env.S3_BUCKET;
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
const ttl = Number(process.env.S3_PRESIGNED_TTL_SECONDS || 600);
