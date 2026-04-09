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

export type Cart = {
  __typename?: 'Cart';
  lines: Array<CartLine>;
};

export type CartLine = {
  __typename?: 'CartLine';
  cost: CartLineCost;
  merchandise: Merchandise;
  quantity: Scalars['Int']['output'];
};

export type CartLineCost = {
  __typename?: 'CartLineCost';
  amountPerQuantity: MoneyV2;
};

export type DiscountNode = {
  __typename?: 'DiscountNode';
  metafield?: Maybe<Metafield>;
};


export type DiscountNodeMetafieldArgs = {
  key: Scalars['String']['input'];
  namespace: Scalars['String']['input'];
};

export type Merchandise = OtherMerchandise | ProductVariant;

export type Metafield = {
  __typename?: 'Metafield';
  value: Scalars['String']['output'];
};

export type MoneyV2 = {
  __typename?: 'MoneyV2';
  amount: Scalars['String']['output'];
  currencyCode: Scalars['String']['output'];
};

export type OtherMerchandise = {
  __typename?: 'OtherMerchandise';
  id?: Maybe<Scalars['ID']['output']>;
};

export type Product = {
  __typename?: 'Product';
  hasAnyTag: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
};


export type ProductHasAnyTagArgs = {
  tags: Array<Scalars['String']['input']>;
};

export type ProductVariant = {
  __typename?: 'ProductVariant';
  id: Scalars['ID']['output'];
  product: Product;
};

export type Query = {
  __typename?: 'Query';
  cart: Cart;
  discountNode: DiscountNode;
};

export type RunInputQueryVariables = Exact<{ [key: string]: never; }>;


export type RunInputQuery = { __typename?: 'Query', cart: { __typename?: 'Cart', lines: Array<{ __typename?: 'CartLine', quantity: number, cost: { __typename?: 'CartLineCost', amountPerQuantity: { __typename?: 'MoneyV2', amount: string, currencyCode: string } }, merchandise: { __typename?: 'OtherMerchandise' } | { __typename?: 'ProductVariant', id: string, product: { __typename?: 'Product', id: string, hasAnyTag: boolean } } }> }, discountNode: { __typename?: 'DiscountNode', metafield?: { __typename?: 'Metafield', value: string } | null } };
