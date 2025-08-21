import {S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getLogger } from '@/utils/Logger';
import "dotenv/config";

const LOGGER = getLogger();
const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION;
const bucket = process.env.S3_BUCKET;
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
const ttl = Number(process.env.S3_PRESIGNED_TTL_SECONDS || 600);

async function main() {
  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });

  const key = `test/hello_${Date.now()}.txt`;
  const body = Buffer.from('hello, minio!');
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'text/plain',
    Metadata: { "author" : "reports-api" }
  }));
  LOGGER.info(`Upload OK -> s3://${bucket}/${key}`);

  const url = await getSignedUrl(client , new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }), { expiresIn: ttl });

  LOGGER.info(`Presigned URL (${ttl}s):\n${url}`);
  LOGGER.info("Abra a URL no navegador para baixar o arquivo.");
}

main().catch((err) => {
  LOGGER.error("Erro no teste MinIO:", err);
  process.exit(1);
})