import { config as configMap } from '../config';
import { Config, Supergraph, App, validEnvironments } from './types/config';

/**
 * Resolve the configuration for the current environment and fall back to
 * the `Base` environment if no explicit configuration is found.
 */
const resolveConfig = (env: string | undefined): Config => {
  if (!env) {
    throw new Error('ENVIRONMENT not set');
  } else if (!(env in validEnvironments)) {
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
 * Convenience function for looking up relevant Supergraph configurations and setting
 * up a supergraph along with its routes.
 *
 * Example:
 * ```ts
 * setupSupergraph('router', 'lambda', supergraphRoutes, () => {
 *   const supergraphRouterLambda = new lambdaFn.Stack(this, 'MsRouterLambda', {
 *     ...props,
 *     functionName: 'ms-router',
 *     assets: 'artifacts/ms-router',
 *     billingGroup: 'ms-router',
 *     architecture: lambda.Architecture.X86_64,
 *     environment: {
 *       ...subGraphUrls,
 *     },
 *   });
 *   return cdk.Fn.select(2, cdk.Fn.split('/', supergraphRouterLambda.functionUrl));
 * });
 * ```
 */
export const setupSupergraph = (
  name: Supergraph['service'],
  runtime: Supergraph['runtime'],
  supergraphRoutes: { [key: string]: string },
  stackFn: (additionalConfig?: Supergraph) => string,
) => {
  const isMainSupergraph = config.supergraph.service === name;
  const additionalSupergraphConfig = config.experimental.additionalSupergraphs.find(
    (s) => s.service === name && s.runtime === runtime,
  );

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
 * Construct a type that becomes concrete based on which `service` is passed in. This
 * utilizes discriminated unions so that we can make the input type of `stackFn` dependent
 * on the input of `name` in the `setupApp` function.
 */
type SpecificApp<N> = Extract<App, { service: N }>;

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
export const setupApp = <N extends App['service']>(name: N, stackFn: (appConfig: SpecificApp<N>) => void) => {
  // We do a bit of type trickery here to convert our general `App` type into a specific
  // type in the union based on which `name` is passed in.
  const appConfig: SpecificApp<typeof name> | undefined = config.apps.find(
    (app) => app.service === name,
  ) as SpecificApp<typeof name>;

  if (appConfig && appConfig.service === name) {
    return stackFn(appConfig);
  }
};
