-- CreateTable
CREATE TABLE "ModelFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT,
    "fileCid" TEXT,
    "hash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModelFile_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModelFile_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ModelVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelFile_versionId_filename_path_key" ON "ModelFile"("versionId", "filename", "path");
