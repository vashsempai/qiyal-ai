import { server, PORT } from './server.js';
import logger from './src/utils/logger.js';

server.listen(PORT, () => {
  logger.info(`🚀 Qiyal.ai Backend running on port ${PORT}`);
});