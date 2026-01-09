const express = require('express');
const pino = require('pino-http');
const cors = require('cors');

const setupServer = () => {
  const app = express();

  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    })
  );

  app.use(cors()); 
  app.use(express.json()); 

  app.get('/notes', (req, res) => {
    res.status(200).json({
      message: 'Retrieved all notes',
    });
  });

  app.get('/notes/:noteId', (req, res) => {
    const { noteId } = req.params;
    res.status(200).json({
      message: `Retrieved note with ID: ${noteId}`,
    });
  });

  app.get('/test-error', (req, res) => {
    throw new Error('Simulated server error');
  });

  app.use('*', (req, res, next) => {
    res.status(404).json({
      message: 'Route not found',
    });
  });

  app.use((err, req, res, next) => {
    req.log.error(err); 
    
    res.status(500).json({
      message: 'Something went wrong',
      error: err.message, 
    });
  });

  return app;
};

module.exports = { setupServer };