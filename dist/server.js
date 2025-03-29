"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const database_1 = __importDefault(require("./config/database"));
const PORT = env_1.default.port || 3000;
async function startServer() {
    try {
        await database_1.default.$connect();
        console.log('Connected to database');
        app_1.default.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
process.on('SIGINT', async () => {
    await database_1.default.$disconnect();
    console.log('Disconnected from database');
    process.exit(0);
});
