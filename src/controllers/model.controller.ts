import { Request, Response } from "express";
import { ModelService } from "../services/model.services";
import { PrismaClient } from "@prisma/client";
import {
  ModelFilter,
  ModelCreateDto,
  VersionCreateDto,
} from "../interfaces/model.interface";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import archiver from "archiver";

const prisma = new PrismaClient();
const modelService = new ModelService(prisma);

export class ModelController {
  async getModelReadme(req: Request, res: Response): Promise<void> {
    try {
      const { id, versionId } = req.params;

      const readmeContent = await modelService.getModelReadme(id, versionId);

      if (!readmeContent) {
        res.status(404).json({ error: "README not found for this model" });
        return;
      }

      res.json({ content: readmeContent });
    } catch (error) {
      console.error("Failed to get model README:", error);
      res.status(500).json({ error: "Failed to get model README" });
    }
  }

  async getModelConfig(req: Request, res: Response): Promise<void> {
    try {
      const { id, versionId } = req.params;

      const configContent = await modelService.getModelConfig(id, versionId);

      if (!configContent) {
        res
          .status(404)
          .json({ error: "Configuration not found for this model" });
        return;
      }

      res.json({ content: configContent });
    } catch (error) {
      console.error("Failed to get model configuration:", error);
      res.status(500).json({ error: "Failed to get model configuration" });
    }
  }

  async getModels(req: Request, res: Response): Promise<void> {
    try {
      const filter: ModelFilter = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
        sort: req.query.sort as string,
        order: req.query.order as "asc" | "desc",
        category: req.query.category as string,
        tag: req.query.tag as string,
        license: req.query.license as string,
        creator: req.query.creator as string,
      };

      const result = await modelService.getModels(filter);
      res.json(result);
    } catch (error) {
      console.error("Failed to get models:", error);
      res.status(500).json({ error: "Failed to get models" });
    }
  }

  async getModelById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const model = await modelService.getModelById(id);
      res.json(model);
    } catch (error) {
      console.error("Failed to get model:", error);
      if ((error as Error).message === "Model not found") {
        res.status(404).json({ error: "Model not found" });
      } else {
        res.status(500).json({ error: "Failed to get model" });
      }
    }
  }

  async createModel(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user.id;
      console.log("req body", req.body);

      console.log("req files", req.files);

      if (!Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ error: "Model file is required helllo" });
        return;
      }

      console.log("Processing model files");
      const modelFiles = req.files as Express.Multer.File[];
      const tempId = uuidv4();
      const tempDir = path.join(process.cwd(), "uploads", "temp", tempId);
      const zipDir = path.join(process.cwd(), "uploads", "zip");

      fs.mkdirSync(tempDir, { recursive: true });
      fs.mkdirSync(zipDir, { recursive: true });

      const zipPath = path.join(zipDir, `${tempId}.zip`);
      console.log("Created temp directories");

      for (const file of modelFiles) {
        const filePath = path.join(tempDir, file.originalname);
        fs.writeFileSync(filePath, file.buffer);
      }
      console.log("Wrote files to temp directory");
      console.log("Created zip file");

      const zipFile = await this.createZipFromDirectory(tempDir, zipPath);

      const modelData: ModelCreateDto = {
        name: req.body.name,
        description: req.body.description,
        licenseType: req.body.licenseType,
        commercialUse: req.body.commercialUse === "true",
        attributionRequired: req.body.attributionRequired === "true",
        royaltyPercentage: req.body.royaltyPercentage
          ? parseInt(req.body.royaltyPercentage)
          : undefined,
        category: req.body.category,
        tags: req.body.tags,
        parameters: req.body.parameters
          ? parseInt(req.body.parameters)
          : undefined,
        modelFile: req.files,
      };

      console.log("Calling model service");
      const model = await modelService.createModel(userId, modelData);
      console.log("Model created:", model);

      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.unlinkSync(zipPath);
        console.log("Cleaned up temp files");
      } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
      }
      res.status(201).json(model);
    } catch (error) {
      console.error("Failed to create model:", error);
      res.status(500).json({ error: "Failed to create model" });
    }
  }

  private createZipFromDirectory(
    sourceDir: string,
    outputPath: string
  ): Promise<Express.Multer.File> {
    return new Promise((resolve, reject) => {
      try {
        const output = fs.createWriteStream(outputPath);
        const archive = archiver("zip", {
          zlib: { level: 9 }, // Maximum compression
        });

        output.on("close", () => {
          console.log(`Archive created: ${archive.pointer()} total bytes`);

          // Read the zip file as a buffer
          const zipBuffer = fs.readFileSync(outputPath);

          // Create a virtual file object for multer
          const zipFile: Express.Multer.File = {
            fieldname: "modelFile",
            originalname: "model.zip",
            encoding: "7bit",
            mimetype: "application/zip",
            buffer: zipBuffer,
            size: zipBuffer.length,
          } as Express.Multer.File;

          resolve(zipFile);
        });

        archive.on("error", (err) => {
          reject(err);
        });

        archive.pipe(output);

        // Add the entire directory to the zip
        archive.directory(sourceDir, false);

        archive.finalize();
      } catch (error) {
        reject(error);
      }
    });
  }

  async createModelVersion(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user.id;
      const { id } = req.params;

      if (!req.file) {
        res.status(400).json({ error: "Model file is required" });
        return;
      }

      const versionData: VersionCreateDto = {
        commitMessage: req.body.commitMessage,
        parameters: req.body.parameters
          ? parseInt(req.body.parameters)
          : undefined,
        modelFile: req.file,
      };

      const version = await modelService.createModelVersion(
        id,
        userId,
        versionData
      );
      res.status(201).json(version);
    } catch (error) {
      console.error("Failed to create model version:", error);
      if ((error as Error).message === "Model not found") {
        res.status(404).json({ error: "Model not found" });
      } else if (
        (error as Error).message ===
        "You do not have permission to update this model"
      ) {
        res
          .status(403)
          .json({ error: "You do not have permission to update this model" });
      } else {
        res.status(500).json({ error: "Failed to create model version" });
      }
    }
  }

  async getModelVersions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const versions = await modelService.getModelVersions(id);
      res.json(versions);
    } catch (error) {
      console.error("Failed to get model versions:", error);
      if ((error as Error).message === "Model not found") {
        res.status(404).json({ error: "Model not found" });
      } else {
        res.status(500).json({ error: "Failed to get model versions" });
      }
    }
  }

  async downloadModel(req: Request, res: Response): Promise<void> {
    try {
      const { id, versionId } = req.params;
      const download = await modelService.downloadModel(id, versionId);
      res.json(download);
    } catch (error) {
      console.error("Failed to download model:", error);
      if (
        (error as Error).message === "Model not found" ||
        (error as Error).message === "Version not found for this model" ||
        (error as Error).message === "No versions available for this model"
      ) {
        res.status(404).json({ error: (error as Error).message });
      } else {
        res.status(500).json({ error: "Failed to download model" });
      }
    }
  }

  async rateModel(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { rating, review } = req.body;

      if (
        !rating ||
        isNaN(parseInt(rating)) ||
        parseInt(rating) < 1 ||
        parseInt(rating) > 5
      ) {
        res
          .status(400)
          .json({ error: "Rating must be a number between 1 and 5" });
        return;
      }

      const result = await modelService.rateModel(
        id,
        userId,
        parseInt(rating),
        review
      );
      res.json(result);
    } catch (error) {
      console.error("Failed to rate model:", error);
      if ((error as Error).message === "Model not found") {
        res.status(404).json({ error: "Model not found" });
      } else {
        res.status(500).json({ error: "Failed to rate model" });
      }
    }
  }
}
