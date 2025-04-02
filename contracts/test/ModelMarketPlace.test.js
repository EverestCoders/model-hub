const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ModelMarketplace", function () {
  let ModelMarketplace;
  let marketplace;
  let owner;
  let user1;
  let user2;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, ...addrs] = await ethers.getSigners();

    // Deploy the contract
    ModelMarketplace = await ethers.getContractFactory("ModelMarketplace");
    marketplace = await ModelMarketplace.deploy();
    console.log(`model contract deployed to: ${await marketplace.getAddress()}`);
  });

  describe("Model Registration", function () {
    it("Should register a new model correctly", async function () {
      const userId = "user1";
      const baseCID = "QmT1234567890abcdef";
      const metadataCID = "QmM1234567890abcdef";
      const licenseType = "MIT";
      const accessFee = ethers.parseEther("0.5");
      const isCommercial = true;
      const modelType = "base";
      const baseModelId = 0;
      const dealId = 1234567;

      await marketplace.connect(user1).registerModel(
        userId, baseCID, metadataCID, licenseType, 
        accessFee, isCommercial, modelType, baseModelId, dealId
      );

      // Check model counter
      expect(await marketplace.modelCounter()).to.equal(1);

      // Check if CID is registered
      expect(await marketplace.registeredBaseCIDs(baseCID)).to.equal(true);

      // Check model details
      const modelDetails = await marketplace.getModelDetails(1);
      expect(modelDetails[0]).to.equal(user1.address); // owner
      expect(modelDetails[1]).to.equal(baseCID); // baseCID
      expect(modelDetails[2]).to.equal(metadataCID); // metadataCID
      expect(modelDetails[4]).to.equal(licenseType); // licenseType
      expect(modelDetails[5]).to.equal(accessFee); // accessFee
      expect(modelDetails[6]).to.equal(isCommercial); // isCommercial
      expect(modelDetails[7]).to.equal(modelType); // modelType

      // Check user model association
      const userModels = await marketplace.getUserModels(userId);
      expect(userModels.length).to.equal(1);
      expect(userModels[0]).to.equal(1);
    });

    it("Should fail if CIDs are empty", async function () {
      await expect(
        marketplace.registerModel(
          "user1", "", "metadataCID", "MIT", 
          ethers.parseEther("0.5"), true, "base", 0, 12345
        )
      ).to.be.revertedWith("Base CID cannot be empty");

      await expect(
        marketplace.registerModel(
          "user1", "baseCID", "", "MIT", 
          ethers.parseEther("0.5"), true, "base", 0, 12345
        )
      ).to.be.revertedWith("Metadata CID cannot be empty");
    });
  });

  describe("Model Updates", function () {
    beforeEach(async function () {
      // Register a model first
      await marketplace.connect(user1).registerModel(
        "user1", "baseCID", "metadataCID", "MIT", 
        ethers.parseEther("0.5"), true, "base", 0, 12345
      );
    });

    it("Should update model details correctly", async function () {
      const newLicenseType = "Apache-2.0";
      const newAccessFee = ethers.parseEther("1.0");
      const newIsCommercial = false;

      await marketplace.connect(user1).updateModelDetails(
        1, newLicenseType, newAccessFee, newIsCommercial
      );

      const modelDetails = await marketplace.getModelDetails(1);
      expect(modelDetails[4]).to.equal(newLicenseType);
      expect(modelDetails[5]).to.equal(newAccessFee);
      expect(modelDetails[6]).to.equal(newIsCommercial);
    });

    it("Should fail if non-owner tries to update", async function () {
      await expect(
        marketplace.connect(user2).updateModelDetails(
          1, "Apache-2.0", ethers.parseEther("1.0"), false
        )
      ).to.be.revertedWith("Only owner can update model");
    });

    it("Should fail for invalid model ID", async function () {
      await expect(
        marketplace.connect(user1).updateModelDetails(
          999, "Apache-2.0", ethers.parseEther("1.0"), false
        )
      ).to.be.revertedWith("Invalid model ID");
    });
  });

  describe("Access Purchase", function () {
    beforeEach(async function () {
      // Register a model first
      await marketplace.connect(user1).registerModel(
        "user1", "baseCID", "metadataCID", "MIT", 
        ethers.parseEther("0.5"), true, "base", 0, 12345
      );
    });

    it("Should process purchase correctly", async function () {
        const accessFee = ethers.parseEther("0.5");
        
        // Initial balances
        const initialOwnerBalance = await marketplace.ownerBalance(user1.address);
        const initialPlatformBalance = await marketplace.platformBalance();
      
        // Purchase access
        await marketplace.connect(user2).purchaseAccess(1, {
          value: accessFee
        });
      
        // Calculate expected amounts (2% platform fee) using BigInt arithmetic
        const platformFee = (accessFee * 200n) / 10000n;
        const ownerAmount = accessFee - platformFee;
      
        // Check balances updated correctly
        expect(await marketplace.ownerBalance(user1.address)).to.equal(
          initialOwnerBalance + ownerAmount
        );
        expect(await marketplace.platformBalance()).to.equal(
          initialPlatformBalance + platformFee
        );
      
        // Check payment record
        expect(await marketplace.getModelPaymentsCount(1)).to.equal(1);
        
        const payment = await marketplace.getModelPaymentAt(1, 0);
        expect(payment[0]).to.equal(user2.address); // payer
        expect(payment[1]).to.equal(user1.address); // payee
        expect(payment[2]).to.equal(accessFee); // amount
        expect(payment[3]).to.equal(platformFee); // platformFee
        expect(payment[5]).to.equal("baseCID"); // modelBaseCID
      });

    it("Should fail if payment amount doesn't match", async function () {
      await expect(
        marketplace.connect(user2).purchaseAccess(1, {
          value: ethers.parseEther("0.4")
        })
      ).to.be.revertedWith("Payment amount must match access fee");
    });

    it("Should fail for invalid model ID", async function () {
      await expect(
        marketplace.connect(user2).purchaseAccess(999, {
          value: ethers.parseEther("0.5")
        })
      ).to.be.revertedWith("Invalid model ID");
    });
  });

  describe("Balance Withdrawal", function () {
    beforeEach(async function () {
      // Register a model
      await marketplace.connect(user1).registerModel(
        "user1", "baseCID", "metadataCID", "MIT", 
        ethers.parseEther("0.5"), true, "base", 0, 12345
      );

      // Purchase access to create balance
      await marketplace.connect(user2).purchaseAccess(1, {
        value: ethers.parseEther("0.5")
      });
    });

    it("Should withdraw balance correctly", async function () {
        const initialBalance = await ethers.provider.getBalance(user1.address);
        const withdrawableAmount = await marketplace.ownerBalance(user1.address);
      
        // Withdraw balance
        const tx = await marketplace.connect(user1).withdrawBalance();
        const receipt = await tx.wait();
        
        // Calculate gas cost using BigInt arithmetic
        const gasCost = receipt.gasUsed * receipt.effectiveGasPrice;
        // Check balance after withdrawal - convert all values to BigInt
        const finalBalance = await ethers.provider.getBalance(user1.address);
        
        expect(finalBalance.toString()).to.equal(
            (initialBalance + BigInt(withdrawableAmount) - gasCost).toString()
          );
      
        // Check balance in contract is reset
        expect(await marketplace.ownerBalance(user1.address)).to.equal(0n);
});
    it("Should fail if no balance to withdraw", async function () {
      // User with no balance
      await expect(
        marketplace.connect(user2).withdrawBalance()
      ).to.be.revertedWith("No balance to withdraw");

      // After withdrawal
      await marketplace.connect(user1).withdrawBalance();
      await expect(
        marketplace.connect(user1).withdrawBalance()
      ).to.be.revertedWith("No balance to withdraw");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Register multiple models
      await marketplace.connect(user1).registerModel(
        "user1", "baseCID1", "metadataCID1", "MIT", 
        ethers.parseEther("0.5"), true, "base", 0, 12345
      );
      
      await marketplace.connect(user1).registerModel(
        "user1", "baseCID2", "metadataCID2", "Apache", 
        ethers.parseEther("1.0"), false, "finetuned", 1, 12346
      );
      
      await marketplace.connect(user2).registerModel(
        "user2", "baseCID3", "metadataCID3", "GPL", 
        ethers.parseEther("0.2"), true, "base", 0, 12347
      );
    });

    it("Should return correct user models", async function () {
      const user1Models = await marketplace.getUserModels("user1");
      expect(user1Models.length).to.equal(2);
      expect(user1Models[0]).to.equal(1);
      expect(user1Models[1]).to.equal(2);
      
      const user2Models = await marketplace.getUserModels("user2");
      expect(user2Models.length).to.equal(1);
      expect(user2Models[0]).to.equal(3);
    });

    it("Should return correct model details", async function () {
      const model1Details = await marketplace.getModelDetails(1);
      expect(model1Details[0]).to.equal(user1.address);
      expect(model1Details[1]).to.equal("baseCID1");
      expect(model1Details[4]).to.equal("MIT");
      expect(model1Details[5]).to.equal(ethers.parseEther("0.5"));
      
      const model2Details = await marketplace.getModelDetails(2);
      expect(model2Details[0]).to.equal(user1.address);
      expect(model2Details[1]).to.equal("baseCID2");
      expect(model2Details[7]).to.equal("finetuned");
      expect(model2Details[9]).to.equal(1); // baseModelId
    });
    
    it("Should handle payments query correctly", async function () {
      // Purchase access to create payment records
      await marketplace.connect(user2).purchaseAccess(1, {
        value: ethers.parseEther("0.5")
      });
      
      // Check payment count
      expect(await marketplace.getModelPaymentsCount(1)).to.equal(1);
      expect(await marketplace.getModelPaymentsCount(2)).to.equal(0);
      
      // Check payment details
      const payment = await marketplace.getModelPaymentAt(1, 0);
      expect(payment[0]).to.equal(user2.address); // payer
      expect(payment[1]).to.equal(user1.address); // payee
      expect(payment[5]).to.equal("baseCID1"); // modelBaseCID
      
      // Should fail for invalid index
      await expect(
        marketplace.getModelPaymentAt(1, 1)
      ).to.be.revertedWith("Invalid payment index");
    });
  });
});