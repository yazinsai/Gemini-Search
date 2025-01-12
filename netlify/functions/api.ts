import express from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../../server/routes";

const app = express();
app.use(express.json());

// Register your routes
registerRoutes(app);

// Export the serverless handler
export const handler = serverless(app);
