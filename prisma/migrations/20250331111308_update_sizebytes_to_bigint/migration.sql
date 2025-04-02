/*
  Warnings:

  - You are about to alter the column `sizeBytes` on the `ModelFile` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ModelFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT,
    "sizeBytes" BIGINT NOT NULL,
    "mimeType" TEXT,
    "fileCid" TEXT,
    "hash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ModelFile_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModelFile_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ModelVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ModelFile" ("createdAt", "fileCid", "filename", "hash", "id", "mimeType", "modelId", "path", "sizeBytes", "versionId") SELECT "createdAt", "fileCid", "filename", "hash", "id", "mimeType", "modelId", "path", "sizeBytes", "versionId" FROM "ModelFile";
DROP TABLE "ModelFile";
ALTER TABLE "new_ModelFile" RENAME TO "ModelFile";
CREATE UNIQUE INDEX "ModelFile_versionId_filename_path_key" ON "ModelFile"("versionId", "filename", "path");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
