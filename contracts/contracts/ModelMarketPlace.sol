// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "filecoin-solidity-api/contracts/v0.8/MarketAPI.sol";
import "filecoin-solidity-api/contracts/v0.8/types/CommonTypes.sol";
import "filecoin-solidity-api/contracts/v0.8/types/MarketTypes.sol";



contract ModelMarketplace {
    struct ModelInfo {
        address owner;
        string baseCID;         // CID of the model file
        string metadataCID;     // CID of the metadata JSON
        uint256 creationTime;
        string licenseType;
        uint256 accessFee;      // Fee in FIL (0 for free models)
        bool isCommercial;
        string modelType;       // "base" or "finetuned"
        uint256 version;
        uint256 baseModelId;  
        uint64 dealId;  // ID of parent model (if this is a version update)
    }

    struct UserModel {
        uint256[] modelIds;     // Array of model IDs owned by a user
    }

    struct Payment {
        address payer;
        address payee;
        uint256 amount;
        uint256 platformFee;
        uint256 timestamp;
        string modelBaseCID;    // CID of the model file for which payment was made
    }

    mapping(uint256 => ModelInfo) public models;
    mapping(string => UserModel) private userModels;  // Maps user_id to model IDs
    mapping(address => uint256) public ownerBalance;
    uint256 public platformBalance;
    uint256 public platformFeePercentage = 200;  // 2% = 200 (in basis points)
    uint256 public modelCounter = 0;
    address public platformAdmin;
    mapping(string => bool) public registeredBaseCIDs;  // To track registered model CIDs
    mapping(uint256 => Payment[]) public modelPayments;  // Track payments for each model

    event ModelRegistered(uint256 indexed modelId, string userId, address owner, string baseCID);
    event ModelUpdated(uint256 indexed modelId, uint256 accessFee, bool isCommercial);
    event AccessPurchased(uint256 indexed modelId, address indexed user, uint256 amount, string modelBaseCID);
    event BalanceWithdrawn(address indexed owner, uint256 amount);
    
    function getUserModelIds(string memory _userId) public view returns (uint256[] memory) {
    return userModels[_userId].modelIds;
   }

  function verifyModelStorage(uint256 _modelId) public view returns (bool, uint64) {
    require(_modelId <= modelCounter && _modelId > 0, "Invalid model ID");
    ModelInfo storage model = models[_modelId];
    
    // Call the MarketAPI directly with the raw deal ID
    (int256 exit_code, MarketTypes.GetDealDataCommitmentReturn memory commitment) = 
        MarketAPI.getDealDataCommitment(model.dealId);
    
    // Check if the call was successful
    require(exit_code == 0, "Failed to get deal commitment");
    return (true, commitment.size);
}


    constructor() {
        platformAdmin = msg.sender;
    }


    function registerModel(
        string memory _userId,
        string memory _baseCID,
        string memory _metadataCID,
        string memory _licenseType,
        uint256 _accessFee,
        bool _isCommercial,
        string memory _modelType,
        uint256 _baseModelId,
        uint64 _dealId
    ) public returns (uint256) {
        require(bytes(_baseCID).length > 0, "Base CID cannot be empty");
        require(bytes(_metadataCID).length > 0, "Metadata CID cannot be empty");
        
        // Increment model counter
        modelCounter++;
        uint256 newModelId = modelCounter;
        
        // Create new model
        models[newModelId] = ModelInfo({
            owner: msg.sender,
            baseCID: _baseCID,
            metadataCID: _metadataCID,
            creationTime: block.timestamp,
            licenseType: _licenseType,
            accessFee: _accessFee,
            isCommercial: _isCommercial,
            modelType: _modelType,
            version: 1,
            baseModelId: _baseModelId,
            dealId: _dealId

        });
        
        // Associate model with user
        userModels[_userId].modelIds.push(newModelId);
        
        // Mark CID as registered
        registeredBaseCIDs[_baseCID] = true;
        
        emit ModelRegistered(newModelId, _userId, msg.sender, _baseCID);
        
        return newModelId;
    }
    
    function updateModelDetails(
        uint256 _modelId,
        string memory _licenseType,
        uint256 _accessFee,
        bool _isCommercial
    ) public {
        require(_modelId <= modelCounter && _modelId > 0, "Invalid model ID");
        require(models[_modelId].owner == msg.sender, "Only owner can update model");
        
        ModelInfo storage model = models[_modelId];
        model.licenseType = _licenseType;
        model.accessFee = _accessFee;
        model.isCommercial = _isCommercial;
        
        emit ModelUpdated(_modelId, _accessFee, _isCommercial);
    }
    
    function purchaseAccess(uint256 _modelId) public payable {
        require(_modelId <= modelCounter && _modelId > 0, "Invalid model ID");
        
        ModelInfo storage model = models[_modelId];
        require(msg.value == model.accessFee, "Payment amount must match access fee");
        
        // Calculate platform fee
        uint256 platformFee = 0;
        uint256 ownerAmount = msg.value;
        
        if (model.isCommercial) {
            platformFee = (msg.value * platformFeePercentage) / 10000; // Calculate 2%
            ownerAmount = msg.value - platformFee;
        }
        
        // Update balances
        ownerBalance[model.owner] += ownerAmount;
        platformBalance += platformFee;
        
        // Record payment
        Payment memory newPayment = Payment({
            payer: msg.sender,
            payee: model.owner,
            amount: msg.value,
            platformFee: platformFee,
            timestamp: block.timestamp,
            modelBaseCID: model.baseCID
        });
        
        modelPayments[_modelId].push(newPayment);
        
        emit AccessPurchased(_modelId, msg.sender, msg.value, model.baseCID);
    }
    
    function withdrawBalance() public {
        uint256 amount = ownerBalance[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        // Reset balance before transfer to prevent re-entrancy
        ownerBalance[msg.sender] = 0;
        
        // Transfer funds
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit BalanceWithdrawn(msg.sender, amount);
    }
    
    function getUserModels(string memory _userId) public view returns (uint256[] memory) {
        return userModels[_userId].modelIds;
    }
    
    function getModelDetails(uint256 _modelId) public view returns (
        address, string memory, string memory, uint256, string memory, 
        uint256, bool, string memory, uint256, uint256
    ) {
        require(_modelId <= modelCounter && _modelId > 0, "Invalid model ID");
        ModelInfo storage model = models[_modelId];
        
        return (
            model.owner,
            model.baseCID,
            model.metadataCID,
            model.creationTime,
            model.licenseType,
            model.accessFee,
            model.isCommercial,
            model.modelType,
            model.version,
            model.baseModelId
        );
    }
    
    function getModelPaymentsCount(uint256 _modelId) public view returns (uint256) {
        return modelPayments[_modelId].length;
    }
    
    function getModelPaymentAt(uint256 _modelId, uint256 _index) public view returns (
        address, address, uint256, uint256, uint256, string memory
    ) {
        require(_modelId <= modelCounter && _modelId > 0, "Invalid model ID");
        require(_index < modelPayments[_modelId].length, "Invalid payment index");
        
        Payment storage payment = modelPayments[_modelId][_index];
        
        return (
            payment.payer,
            payment.payee,
            payment.amount,
            payment.platformFee,
            payment.timestamp,
            payment.modelBaseCID
        );
    }
}