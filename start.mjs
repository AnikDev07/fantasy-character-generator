// Set production mode for the compiled server, then start it.
process.env.NODE_ENV ??= 'production';
await import('./dist/server.js');
