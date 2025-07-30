import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Import action files
import { placeActions } from './actions/places.js';
import { mapActions } from './actions/maps.js';
import { routeActions } from './actions/routes.js';

// Create Express server
const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Define MCP server metadata
const serverMetadata = {
  name: 'grabmaps',
  description: 'GrabMaps API integration for Model Context Protocol',
  version: '1.0.0'
};

// Register routes for each action
app.get('/', (req, res) => {
  res.json({
    ...serverMetadata,
    actions: [
      ...Object.keys(placeActions).map(key => ({ name: key })),
      ...Object.keys(mapActions).map(key => ({ name: key })),
      ...Object.keys(routeActions).map(key => ({ name: key }))
    ]
  });
});

// Register place actions
Object.entries(placeActions).forEach(([name, handler]: [string, (params: any) => Promise<any>]) => {
  app.post(`/${name}`, async (req, res) => {
    try {
      const result = await handler(req.body);
      res.json(result);
    } catch (error) {
      console.error(`Error in ${name}:`, error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
});

// Register map actions
Object.entries(mapActions).forEach(([name, handler]: [string, (params: any) => Promise<any>]) => {
  app.post(`/${name}`, async (req, res) => {
    try {
      const result = await handler(req.body);
      res.json(result);
    } catch (error) {
      console.error(`Error in ${name}:`, error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
});

// Register route actions
Object.entries(routeActions).forEach(([name, handler]: [string, (params: any) => Promise<any>]) => {
  app.post(`/${name}`, async (req, res) => {
    try {
      const result = await handler(req.body);
      res.json(result);
    } catch (error) {
      console.error(`Error in ${name}:`, error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
});

// Start server
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`GrabMaps MCP server running on port ${port}`);
});

