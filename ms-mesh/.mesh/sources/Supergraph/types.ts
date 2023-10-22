// @ts-nocheck

import { InContextSdkMethod } from '@graphql-mesh/types';
import { MeshContext } from '@graphql-mesh/runtime';

export namespace SupergraphTypes {
  export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Query = {
  product: Product;
  products: Array<Product>;
  review: Review;
  reviews: Array<Review>;
  me: User;
  users: Array<User>;
};


export type QueryproductArgs = {
  id: Scalars['ID']['input'];
};


export type QueryreviewArgs = {
  id: Scalars['ID']['input'];
};

/** Define the Product entity so that we can extend it. */
export type Product = {
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  price: Scalars['String']['output'];
  reviews: Array<Review>;
};

/** Define the User entity so that we can extend it. */
export type User = {
  id: Scalars['ID']['output'];
  purchases: Array<Product>;
  reviews: Array<Review>;
  name: Scalars['String']['output'];
};

export type Review = {
  id: Scalars['ID']['output'];
  body: Scalars['String']['output'];
  author: User;
  product: Product;
};

  export type QuerySdk = {
      /** undefined **/
  product: InContextSdkMethod<Query['product'], QueryproductArgs, MeshContext>,
  /** undefined **/
  products: InContextSdkMethod<Query['products'], {}, MeshContext>,
  /** undefined **/
  review: InContextSdkMethod<Query['review'], QueryreviewArgs, MeshContext>,
  /** undefined **/
  reviews: InContextSdkMethod<Query['reviews'], {}, MeshContext>,
  /** undefined **/
  me: InContextSdkMethod<Query['me'], {}, MeshContext>,
  /** undefined **/
  users: InContextSdkMethod<Query['users'], {}, MeshContext>
  };

  export type MutationSdk = {
    
  };

  export type SubscriptionSdk = {
    
  };

  export type Context = {
      ["Supergraph"]: { Query: QuerySdk, Mutation: MutationSdk, Subscription: SubscriptionSdk },
      
    };
}
