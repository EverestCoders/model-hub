/*
  Warnings:

  - You are about to alter the column `sizeBytes` on the `ModelVersion` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ModelVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "filecoinCid" TEXT NOT NULL,
    "metadataCid" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "parentVersionId" TEXT,
    "commitMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txHash" TEXT,
    "sizeBytes" BIGINT,
    "parameters" INTEGER,
    CONSTRAINT "ModelVersion_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ModelVersion_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "ModelVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ModelVersion" ("commitMessage", "createdAt", "filecoinCid", "hash", "id", "metadataCid", "modelId", "parameters", "parentVersionId", "sizeBytes", "txHash", "versionNumber") SELECT "commitMessage", "createdAt", "filecoinCid", "hash", "id", "metadataCid", "modelId", "parameters", "parentVersionId", "sizeBytes", "txHash", "versionNumber" FROM "ModelVersion";
DROP TABLE "ModelVersion";
ALTER TABLE "new_ModelVersion" RENAME TO "ModelVersion";
CREATE UNIQUE INDEX "ModelVersion_filecoinCid_key" ON "ModelVersion"("filecoinCid");
CREATE UNIQUE INDEX "ModelVersion_modelId_versionNumber_key" ON "ModelVersion"("modelId", "versionNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
