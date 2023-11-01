import { config as configMap } from '../config';
import { Config } from './types/config';

const resolveConfig = (env: string | undefined): Config => {
  if (!env) {
    throw new Error('ENVIRONMENT not set');
  } else if (env in configMap) {
    return configMap[env];
  }
  return configMap['Base'];
};

export const config: Config = resolveConfig(process.env.ENVIRONMENT);

export const has = (key: string): boolean => {
  return key in config;
};
