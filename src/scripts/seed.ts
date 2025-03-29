// scripts/seed.ts

import { PrismaClient, User, Model, ModelVersion, StorageDeal, Rating } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create sample users
  const users = await createUsers();
  console.log(`Created ${users.length} users`);

  // Create sample models with versions
  const models = await createModels(users);
  console.log(`Created ${models.length} models with versions`);

  // Create storage deals
  const storageDeals = await createStorageDeals(models);
  console.log(`Created ${storageDeals.length} storage deals`);

  // Create ratings
  const ratings = await createRatings(models, users);
  console.log(`Created ${ratings.length} ratings`);

  console.log('Database seeding completed successfully!');
}

async function createUsers(): Promise<User[]> {
  // Check if users already exist
  const existingCount = await prisma.user.count();
  
  if (existingCount > 0) {
    console.log('Users already exist, skipping user creation');
    return prisma.user.findMany();
  }

  const userData = [
    {
      walletAddress: '0x' + crypto.randomBytes(20).toString('hex'),
      username: 'alice',
      bio: 'AI researcher focusing on diffusion models'
    },
    {
      walletAddress: '0x' + crypto.randomBytes(20).toString('hex'),
      username: 'bob',
      bio: 'Computer vision specialist working on multimodal models'
    },
    {
      walletAddress: '0x' + crypto.randomBytes(20).toString('hex'),
      username: 'charlie',
      bio: 'NLP researcher specializing in large language models'
    }
  ];

  const users: User[] = [];
  
  for (const user of userData) {
    users.push(await prisma.user.create({
      data: user
    }));
  }
  
  return users;
}

type ModelWithVersions = Model & {
  versions: ModelVersion[];
};

async function createModels(users: User[]): Promise<ModelWithVersions[]> {
  // Check if models already exist
  const existingCount = await prisma.model.count();
  
  if (existingCount > 0) {
    console.log('Models already exist, skipping model creation');
    return prisma.model.findMany({
      include: {
        versions: true
      }
    });
  }

  const modelData = [
    {
      name: 'StableDiffusion XL',
      description: 'High-resolution diffusion model for image generation',
      licenseType: 'CreativeML Open RAIL-M',
      commercialUse: true,
      attributionRequired: true,
      royaltyPercentage: 0,
      category: 'diffusion',
      tags: ['text-to-image', 'high-resolution', 'generative']
    },
    {
      name: 'LLaMA 3 8B',
      description: 'Efficient large language model with 8 billion parameters',
      licenseType: 'MIT',
      commercialUse: true,
      attributionRequired: true,
      royaltyPercentage: 0,
      category: 'language',
      tags: ['text-generation', 'embeddings', 'nlp']
    },
    {
      name: 'CV-NeRF',
      description: 'Computer vision neural radiance fields model',
      licenseType: 'Apache 2.0',
      commercialUse: true,
      attributionRequired: true,
      royaltyPercentage: 0,
      category: '3d',
      tags: ['3d-reconstruction', 'computer-vision', 'neural-rendering']
    },
    {
      name: 'AudioGen Pro',
      description: 'Generative model for high-quality audio synthesis',
      licenseType: 'CC BY-NC 4.0',
      commercialUse: false,
      attributionRequired: true,
      royaltyPercentage: 0,
      category: 'audio',
      tags: ['text-to-audio', 'music-generation', 'speech-synthesis']
    },
    {
      name: 'VideoFlow',
      description: 'Video generation model based on flow matching',
      licenseType: 'BSD-3',
      commercialUse: true,
      attributionRequired: true,
      royaltyPercentage: 0,
      category: 'video',
      tags: ['text-to-video', 'motion-synthesis', 'animation']
    }
  ];

  const models: ModelWithVersions[] = [];
  
  for (let i = 0; i < modelData.length; i++) {
    const model = modelData[i];
    const creator = users[i % users.length];
    
    // Create model
    const createdModel = await prisma.model.create({
      data: {
        name: model.name,
        description: model.description,
        creatorId: creator.id,
        licenseType: model.licenseType,
        commercialUse: model.commercialUse,
        attributionRequired: model.attributionRequired,
        royaltyPercentage: model.royaltyPercentage,
        category: model.category,
        downloadCount: Math.floor(Math.random() * 1000)
      }
    });
    
    // Add tags
    for (const tag of model.tags) {
      await prisma.modelTag.create({
        data: {
          modelId: createdModel.id,
          tag
        }
      });
    }
    
    // Create initial version
    const versionCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 versions
    let parentVersionId: string | null = null;
    
    for (let v = 1; v <= versionCount; v++) {
      const filecoinCid = 'bafy' + crypto.randomBytes(30).toString('hex');
      const metadataCid = 'bafy' + crypto.randomBytes(30).toString('hex');
      const hash = crypto.randomBytes(32).toString('hex');
      const parameters = [70000000, 125000000, 180000000][Math.floor(Math.random() * 3)];
      const sizeBytes = parameters * 4;
      
      const modelVersion: ModelVersion = await prisma.modelVersion.create({
        data: {
          modelId: createdModel.id,
          versionNumber: v,
          filecoinCid,
          metadataCid,
          hash,
          parentVersionId,
          commitMessage: v === 1 ? 'Initial release' : `Improved ${model.category} capabilities (v${v})`,
          txHash: '0x' + crypto.randomBytes(32).toString('hex'),
          sizeBytes,
          parameters
        }
      });
      
      // Update parent for next version
      parentVersionId = modelVersion.id;
      
      // Set latest version on the model
      if (v === versionCount) {
        await prisma.model.update({
          where: { id: createdModel.id },
          data: { latestVersionId: modelVersion.id }
        });
      }
    }
    
    // Get the complete model with versions
    const modelWithVersions = await prisma.model.findUnique({
      where: { id: createdModel.id },
      include: {
        versions: true
      }
    });
    
    if (modelWithVersions) {
      models.push(modelWithVersions);
    }
  }
  
  return models;
}

async function createStorageDeals(models: ModelWithVersions[]): Promise<StorageDeal[]> {
  // Check if storage deals already exist
  const existingCount = await prisma.storageDeal.count();
  
  if (existingCount > 0) {
    console.log('Storage deals already exist, skipping deal creation');
    return prisma.storageDeal.findMany();
  }

  const storageDeals: StorageDeal[] = [];
  
  for (const model of models) {
    for (const version of model.versions) {
      // Create 1-3 storage deals per version
      const dealCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < dealCount; i++) {
        const now = new Date();
        const startTime = new Date(now);
        startTime.setDate(startTime.getDate() - Math.floor(Math.random() * 30)); // Random start date in the past 30 days
        
        const endTime = new Date(startTime);
        endTime.setDate(endTime.getDate() + 180); // 180 days deal
        
        const deal = await prisma.storageDeal.create({
          data: {
            modelVersionId: version.id,
            dealId: 1000000 + Math.floor(Math.random() * 9000000),
            providerId: 'f0' + Math.floor(Math.random() * 1000000),
            startTime,
            endTime,
            status: 'active',
            txHash: '0x' + crypto.randomBytes(32).toString('hex'),
          }
        });
        
        storageDeals.push(deal);
      }
    }
  }
  
  return storageDeals;
}

async function createRatings(models: ModelWithVersions[], users: User[]): Promise<Rating[]> {
  // Check if ratings already exist
  const existingCount = await prisma.rating.count();
  
  if (existingCount > 0) {
    console.log('Ratings already exist, skipping rating creation');
    return prisma.rating.findMany();
  }

  const ratings: Rating[] = [];
  
  for (const model of models) {
    // Each model gets 0-5 ratings
    const ratingCount = Math.floor(Math.random() * 6);
    const ratingUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, ratingCount);
    
    for (const user of ratingUsers) {
      // Skip if the user is the creator
      if (user.id === model.creatorId) continue;
      
      const rating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
      const reviewTexts = [
        'Great model, works as expected!',
        'Decent results, but needs more fine-tuning.',
        'Excellent performance on my specific use case.',
        'The accuracy could be better.',
        'This model saved me so much time. Highly recommended!',
        null // Some ratings have no review
      ];
      
      const ratingObj = await prisma.rating.create({
        data: {
          modelId: model.id,
          userId: user.id,
          rating,
          review: reviewTexts[Math.floor(Math.random() * reviewTexts.length)]
        }
      });
      
      ratings.push(ratingObj);
    }
    
    // Update model rating average
    if (ratings.length > 0) {
      const modelRatings = await prisma.rating.findMany({
        where: { modelId: model.id }
      });
      
      if (modelRatings.length > 0) {
        const ratingSum = modelRatings.reduce((sum, r) => sum + r.rating, 0);
        const ratingAvg = ratingSum / modelRatings.length;
        
        await prisma.model.update({
          where: { id: model.id },
          data: { ratingAvg }
        });
      }
    }
  }
  
  return ratings;
}

// Run the seeding function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });