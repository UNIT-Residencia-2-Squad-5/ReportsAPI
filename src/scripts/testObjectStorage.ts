import "dotenv/config";
import { PassThrough } from "node:stream";
import { S3Storage } from "../infrastructure/object-storage/S3Storage";
import { getLogger } from "@/utils/Logger";

const LOGGER = getLogger();

(async () => {
  const s3 = new S3Storage();

  // Teste com Buffer
  const keySmall = `tests/mini_${Date.now()}.txt`;
  await s3.uploadBuffer(keySmall, Buffer.from("Hello, minio!\n"), "text/plain", {
    "source": "test",
  });
  LOGGER.info("Upload (buffer) OK:", keySmall);

  const headSmall = await s3.head(keySmall);
  LOGGER.info("Head small:", { bytes: headSmall.ContentLength, type: headSmall.ContentType });

  const url = await s3.presignGetUrl(keySmall, 120, "teste.txt");
  LOGGER.info("Presigned URL (120s):", url);

  // Teste com Stream
  const keyBig = `tests/big_${Date.now()}.csv`;
  const pass = new PassThrough();

  const upload = s3.uploadStreamMultipart(keyBig, pass, "text/csv", { "source": "test" });

  LOGGER.info("Iniciando streaming...");
  pass.write("col1,col2\n");
  pass.write("1,2\n");
  pass.end("3,4\n");

  await upload;
  LOGGER.info("Streaming (multipart) OK:", keyBig);

  const headBig = await s3.head(keyBig);
  LOGGER.info("Head big:", { bytes: headBig.ContentLength, type: headBig.ContentType });

  // // Teste de limpeza (DELETE)
  // await s3.delete(keySmall);
  // await s3.delete(keyBig);
  // LOGGER.info("Deleted:", keySmall, keyBig);

  // try {
  //   await s3.head(keySmall);
  //   LOGGER.warn("objeto small ainda existe (esperava 404).");
  // } catch {
  //   LOGGER.info("head small após delete: NOT FOUND");
  // }
  // try {
  //   await s3.head(keyBig);
  //   LOGGER.warn("objeto big ainda existe (esperava 404).");
  // } catch {
  //   LOGGER.info("head big após delete: NOT FOUND");
  // }

  LOGGER.info("Teste Object Storage finalizado com sucesso.");
})().catch((err) => {
  LOGGER.error("Erro durante o teste:", err);
  process.exit(1);
});
