import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function clearModelData() {
    try {
      // 1. First delete models that only depend on others
      console.log("Deleting Download records...");
      await prisma.download.deleteMany({});
      
      console.log("Deleting Rating records...");
      await prisma.rating.deleteMany({});
      
      console.log("Deleting ModelTag records...");
      await prisma.modelTag.deleteMany({});
      
      // 2. Delete models that are in the middle of dependency chains
      console.log("Deleting ModelFile records...");
      await prisma.modelFile.deleteMany({});
      
      console.log("Deleting StorageDeal records...");
      await prisma.storageDeal.deleteMany({});
      
      // 3. Delete ModelVersion after its dependents
      console.log("Deleting ModelVersion records...");
      await prisma.modelVersion.deleteMany({});
      
      // 4. Finally delete Model records (which have many dependents)
      console.log("Deleting Model records...");
      await prisma.model.deleteMany({});
      
      console.log("All records deleted successfully!");
    } catch (error) {
      console.error("Error during deletion:", error);
      throw error;
    }
  }

// Execute the function and handle errors
clearModelData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })