import { config as configMap } from '../config';
import { App, Config, Supergraph, validEnvironments } from './types';

/**
 * Resolve the configuration for the current environment and fall back to
 * the `Base` environment if no explicit configuration is found.
 */
const resolveConfig = (env: string | undefined): Config => {
  if (!env) {
    throw new Error('ENVIRONMENT not set');
  } else if (!validEnvironments.includes(env as any)) {
    throw new Error(`ENVIRONMENT '${env}' is not a valid option. Possible values ${validEnvironments.join(', ')}`);
  } else if (env in configMap) {
    return configMap[env];
  }
  return configMap['Base'];
};

/**
 * The configuration for the current environment.
 */
export const config: Config = resolveConfig(process.env.ENVIRONMENT);

/**
 * Construct a type that becomes concrete based on which record is passed in. This
 * utilizes discriminated unions so that we can make the input type of `stackFn` dependent
 * on the input of e.g. `name` and/or `runtime` in the `setupSupergraph`/`setupApp` functions.
 *
 * Example:
 * ```ts
 * const setupApp = <N extends App['service']>(name: N, stackFn: (appConfig: Specific<App, { service: N }>) => void) => {
 *   // ..
 * }
 * ```
 */
type Specific<S, R> = Extract<S, R>;

/**
 * Convenience function for looking up relevant Supergraph configurations and setting
 * up a supergraph along with its routes.
 *
 * Example:
 * ```ts
 * setupSupergraph('router', 'lambda', supergraphRoutes, (config) => {
 *   const supergraph = new lambdaFn.Stack(this, 'MsRouterLambda', {
 *     ...props,
 *     functionName: 'ms-router',
 *     assets: 'artifacts/ms-router',
 *     billingGroup: 'ms-router',
 *     architecture: lambda.Architecture.X86_64,
 *     environment: {
 *       ...subGraphUrls,
 *     },
 *   });
 *   // ..
 *   return config?.pinToVersionedApi ? supergraph.aliasUrlParameterName : supergraph.latestUrlParameterName;
 * });
 * ```
 */
export const setupSupergraph = <N extends Supergraph['service'], R extends Supergraph['runtime']>(
  name: N,
  runtime: R,
  supergraphRoutes: { [key: string]: string },
  stackFn: (additionalConfig?: Specific<Supergraph, { service: N; runtime: R }>) => string,
) => {
  const isMainSupergraph = config.supergraph.service === name && config.supergraph.runtime === runtime;
  // We cast our result to `undefined | Specific` to narrow down the type.
  const additionalSupergraphConfig = config.experimental?.additionalSupergraphs?.find(
    (s) => s.service === name && s.runtime === runtime,
  ) as undefined | Specific<Supergraph, { service: N; runtime: R }>;

  // If the supergraph is the main one, or if it's an additional supergraph, set up the stack.
  if (isMainSupergraph || additionalSupergraphConfig) {
    const url = stackFn(additionalSupergraphConfig);
    if (isMainSupergraph) {
      supergraphRoutes[config.supergraph.path] = url;
    }
    if (additionalSupergraphConfig) {
      supergraphRoutes[additionalSupergraphConfig.path] = url;
    }
  }
};

/**
 * Convenience function for looking up relevant App configurations and setting
 * up the App stack.
 *
 * Example:
 * ```ts
 * setupApp('internal', (appConfig) => {
 *   new s3Website.Stack(this, 'WebsiteUiInternal', {
 *     ...props,
 *     assets: 'artifacts/ui-internal',
 *     index: 'index.html',
 *     error: 'index.html',
 *     domain: `${appConfig.subdomain}.${props.domain}`,
 *     hostedZone: props.domain,
 *     certificateArn: props.certificateArn,
 *     billingGroup: 'ui-internal',
 *     redirectPathToUrl: supergraphRoutes,
 *   });
 * });
 * ```
 */
export const setupApp = <N extends App['service']>(
  name: N,
  stackFn: (appConfig: Specific<App, { service: N }>) => void,
) => {
  // We cast our result to `undefined | Specific` to narrow down the type.
  const appConfig = config.apps.find((app) => app.service === name) as undefined | Specific<App, { service: N }>;

  if (appConfig && appConfig.service === name) {
    return stackFn(appConfig);
  }
};
