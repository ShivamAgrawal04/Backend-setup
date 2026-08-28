// src/server.ts

import app from '@/app.js';
import { env } from '@/config/env.js';
import { Logger } from '@/config/logger.js';

app.listen(env.PORT, () => {
  Logger.info(`Server running on port ${env.PORT}`);
});
