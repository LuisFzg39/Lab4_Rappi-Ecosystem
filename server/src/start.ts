import { app } from './app';
import { initDb } from './config/initDb';
import { PORT } from './config';

const start = async () => {
  try {
    await initDb();
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log('Server running on port ' + PORT);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
