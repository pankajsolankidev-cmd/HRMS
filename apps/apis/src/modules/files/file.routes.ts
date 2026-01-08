import { FastifyInstance } from "fastify";
import fs from "fs";
import path from "path";

export default async function fileRoutes(app: FastifyInstance) {
  app.post("/files/upload", async (request, reply) => {
    const data = await request.file(); 

    if (!data) {
      return reply.status(400).send({ error: "File is required" });
    }

    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const filePath = path.join(uploadDir, data.filename);

    await fs.promises.writeFile(filePath, await data.toBuffer());

    return reply.send({
      message: "File uploaded successfully",
      path: `/uploads/${data.filename}`,
    });
  });
}