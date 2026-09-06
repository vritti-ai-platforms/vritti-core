export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
  /** Arbitrary JSON value (used for Select option `additionals`). */
  JSON: { input: unknown; output: unknown; }
};

export type ChangePasswordInput = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};

export type CostCategory = {
  __typename?: 'CostCategory';
  canDelete: Scalars['Boolean']['output'];
  code: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isSystem: Scalars['Boolean']['output'];
  kind: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type CreateCostCategoryInput = {
  code: Scalars['String']['input'];
  kind: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type CreateInventoryItemInput = {
  categoryId: Scalars['String']['input'];
  code: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  hsnCode?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  pickStrategy?: InputMaybe<Scalars['String']['input']>;
  purchaseTaxGroupId: Scalars['String']['input'];
  tracking: Scalars['String']['input'];
  type: Scalars['String']['input'];
  uomId: Scalars['String']['input'];
};

export type CreateInventoryItemLocationInput = {
  locationId: Scalars['ID']['input'];
  reorderLevel: Scalars['Float']['input'];
};

export type CreateInventoryItemUomConversionInput = {
  primaryUomQty: Scalars['Int']['input'];
  uomId: Scalars['String']['input'];
  uomQty: Scalars['Int']['input'];
};

export type CreateTaxGroupInput = {
  name: Scalars['String']['input'];
  taxRates: Array<TaxRateInput>;
};

export type CreateUomDimensionInput = {
  code: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateUomInput = {
  allowDecimal?: InputMaybe<Scalars['Boolean']['input']>;
  baseUnitId?: InputMaybe<Scalars['ID']['input']>;
  baseUomQty?: InputMaybe<Scalars['Int']['input']>;
  dimensionId: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  symbol: Scalars['String']['input'];
  uomQty?: InputMaybe<Scalars['Int']['input']>;
};

export type FeedFilterInput = {
  field: Scalars['String']['input'];
  operator: Scalars['String']['input'];
  value: Array<Scalars['String']['input']>;
};

export type FeedSearchInput = {
  columnId: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type FeedSortInput = {
  direction: Scalars['String']['input'];
  field: Scalars['String']['input'];
};

export type GoodsReceipt = {
  __typename?: 'GoodsReceipt';
  createdAt: Scalars['String']['output'];
  exchangeRate: Scalars['Float']['output'];
  grNumber: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  po?: Maybe<GoodsReceiptPo>;
  publishedAt?: Maybe<Scalars['String']['output']>;
  receivedDate: Scalars['String']['output'];
  status: Scalars['String']['output'];
  supplierCurrencyCode: Scalars['String']['output'];
  supplierId: Scalars['String']['output'];
  supplierName: Scalars['String']['output'];
};

export type GoodsReceiptConnection = {
  __typename?: 'GoodsReceiptConnection';
  edges: Array<GoodsReceiptEdge>;
  pageInfo: GoodsReceiptPageInfo;
};

export type GoodsReceiptEdge = {
  __typename?: 'GoodsReceiptEdge';
  cursor: Scalars['String']['output'];
  node: GoodsReceipt;
};

export type GoodsReceiptMoney = {
  __typename?: 'GoodsReceiptMoney';
  currency: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type GoodsReceiptPageInfo = {
  __typename?: 'GoodsReceiptPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type GoodsReceiptPo = {
  __typename?: 'GoodsReceiptPo';
  expectedBy?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  orderDate: Scalars['String']['output'];
  poNumber: Scalars['String']['output'];
  totalAmount: GoodsReceiptMoney;
};

export type InventoryItem = {
  __typename?: 'InventoryItem';
  canDelete: Scalars['Boolean']['output'];
  categoryId: Scalars['String']['output'];
  categoryName?: Maybe<Scalars['String']['output']>;
  code: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  hsnCode?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  pickStrategy: Scalars['String']['output'];
  purchaseTaxGroupId?: Maybe<Scalars['String']['output']>;
  tracking: Scalars['String']['output'];
  type: Scalars['String']['output'];
  uomId: Scalars['String']['output'];
  uomSymbol?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type InventoryItemConnection = {
  __typename?: 'InventoryItemConnection';
  edges: Array<InventoryItemEdge>;
  pageInfo: InventoryItemPageInfo;
};

export type InventoryItemEdge = {
  __typename?: 'InventoryItemEdge';
  cursor: Scalars['String']['output'];
  node: InventoryItem;
};

export type InventoryItemLedgerConnection = {
  __typename?: 'InventoryItemLedgerConnection';
  edges: Array<InventoryItemLedgerEdge>;
  pageInfo: InventoryItemLedgerPageInfo;
};

export type InventoryItemLedgerEdge = {
  __typename?: 'InventoryItemLedgerEdge';
  cursor: Scalars['String']['output'];
  node: InventoryItemLedgerEntry;
};

export type InventoryItemLedgerEntry = {
  __typename?: 'InventoryItemLedgerEntry';
  balanceAfter?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  quantity: Scalars['Float']['output'];
  referenceId?: Maybe<Scalars['ID']['output']>;
  referenceType?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type InventoryItemLedgerPageInfo = {
  __typename?: 'InventoryItemLedgerPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type InventoryItemLocation = {
  __typename?: 'InventoryItemLocation';
  id: Scalars['ID']['output'];
  inventoryItemId: Scalars['ID']['output'];
  locationId: Scalars['ID']['output'];
  locationName?: Maybe<Scalars['String']['output']>;
  locationPath?: Maybe<Scalars['String']['output']>;
  reorderLevel: Scalars['Float']['output'];
};

export type InventoryItemLocationConnection = {
  __typename?: 'InventoryItemLocationConnection';
  edges: Array<InventoryItemLocationEdge>;
  pageInfo: InventoryItemLocationPageInfo;
};

export type InventoryItemLocationEdge = {
  __typename?: 'InventoryItemLocationEdge';
  cursor: Scalars['String']['output'];
  node: InventoryItemLocation;
};

export type InventoryItemLocationPageInfo = {
  __typename?: 'InventoryItemLocationPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type InventoryItemPageInfo = {
  __typename?: 'InventoryItemPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type InventoryItemQuant = {
  __typename?: 'InventoryItemQuant';
  availableQuantity: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  expiryDate?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  locationId: Scalars['ID']['output'];
  locationName?: Maybe<Scalars['String']['output']>;
  locationPath?: Maybe<Scalars['String']['output']>;
  lotId?: Maybe<Scalars['ID']['output']>;
  lotNumber?: Maybe<Scalars['String']['output']>;
  manufacturingDate?: Maybe<Scalars['String']['output']>;
  quantity: Scalars['Float']['output'];
  reservedQuantity: Scalars['Float']['output'];
};

export type InventoryItemQuantConnection = {
  __typename?: 'InventoryItemQuantConnection';
  edges: Array<InventoryItemQuantEdge>;
  pageInfo: InventoryItemQuantPageInfo;
};

export type InventoryItemQuantEdge = {
  __typename?: 'InventoryItemQuantEdge';
  cursor: Scalars['String']['output'];
  node: InventoryItemQuant;
};

export type InventoryItemQuantPageInfo = {
  __typename?: 'InventoryItemQuantPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type InventoryItemStockLevel = {
  __typename?: 'InventoryItemStockLevel';
  availableQuantity: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  locationId: Scalars['ID']['output'];
  locationName?: Maybe<Scalars['String']['output']>;
  locationPath?: Maybe<Scalars['String']['output']>;
  reorderLevel?: Maybe<Scalars['Float']['output']>;
  reservedQuantity: Scalars['Float']['output'];
  stockedQuantity: Scalars['Float']['output'];
};

export type InventoryItemStockLevelConnection = {
  __typename?: 'InventoryItemStockLevelConnection';
  edges: Array<InventoryItemStockLevelEdge>;
  pageInfo: InventoryItemStockLevelPageInfo;
};

export type InventoryItemStockLevelEdge = {
  __typename?: 'InventoryItemStockLevelEdge';
  cursor: Scalars['String']['output'];
  node: InventoryItemStockLevel;
};

export type InventoryItemStockLevelPageInfo = {
  __typename?: 'InventoryItemStockLevelPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type InventoryItemSupplier = {
  __typename?: 'InventoryItemSupplier';
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isPreferred: Scalars['Boolean']['output'];
  leadTimeDays?: Maybe<Scalars['Int']['output']>;
  minOrderQuantity?: Maybe<Scalars['Float']['output']>;
  supplierCode?: Maybe<Scalars['String']['output']>;
  supplierId: Scalars['ID']['output'];
  supplierItemCode?: Maybe<Scalars['String']['output']>;
  supplierName?: Maybe<Scalars['String']['output']>;
  unitPrice?: Maybe<SupplierUnitPrice>;
  uomId: Scalars['ID']['output'];
  uomSymbol: Scalars['String']['output'];
};

export type InventoryItemSupplierConnection = {
  __typename?: 'InventoryItemSupplierConnection';
  edges: Array<InventoryItemSupplierEdge>;
  pageInfo: InventoryItemSupplierPageInfo;
};

export type InventoryItemSupplierEdge = {
  __typename?: 'InventoryItemSupplierEdge';
  cursor: Scalars['String']['output'];
  node: InventoryItemSupplier;
};

export type InventoryItemSupplierPageInfo = {
  __typename?: 'InventoryItemSupplierPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type InventoryItemUomConversion = {
  __typename?: 'InventoryItemUomConversion';
  canDelete: Scalars['Boolean']['output'];
  canEdit: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  inventoryItemId: Scalars['ID']['output'];
  primaryUomQty: Scalars['Int']['output'];
  toPrimaryConversionFactor: Scalars['Float']['output'];
  toUomConversionFactor: Scalars['Float']['output'];
  uomId: Scalars['ID']['output'];
  uomName: Scalars['String']['output'];
  uomQty: Scalars['Int']['output'];
  uomSymbol: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type LookupOrganization = {
  __typename?: 'LookupOrganization';
  id: Scalars['ID']['output'];
  logoDarkUrl?: Maybe<Scalars['String']['output']>;
  logoLightUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  subdomain: Scalars['String']['output'];
};

export type MessageResponse = {
  __typename?: 'MessageResponse';
  message: Scalars['String']['output'];
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type MobileAuthSession = {
  __typename?: 'MobileAuthSession';
  accessToken?: Maybe<Scalars['String']['output']>;
  expiresIn?: Maybe<Scalars['Int']['output']>;
  isAuthenticated?: Maybe<Scalars['Boolean']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
};

export type MobileLoginInput = {
  email: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  password: Scalars['String']['input'];
};

export type MobileRefreshInput = {
  refreshToken: Scalars['String']['input'];
};

export type MobileTokens = {
  __typename?: 'MobileTokens';
  accessToken: Scalars['String']['output'];
  expiresIn: Scalars['Int']['output'];
  refreshToken: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  changePassword: MessageResponse;
  createCostCategory: CostCategory;
  createInventoryItem: InventoryItem;
  createInventoryItemLocation: InventoryItemLocation;
  createInventoryItemUomConversion: InventoryItemUomConversion;
  createTaxGroup: TaxGroup;
  createUom: Uom;
  createUomDimension: UomDimension;
  deleteCostCategory: MutationResult;
  deleteInventoryItem: MutationResult;
  deleteInventoryItemLocation: MutationResult;
  deleteInventoryItemUomConversion: MutationResult;
  deleteTaxGroup: MutationResult;
  deleteUom: MutationResult;
  deleteUomDimension: MutationResult;
  mobileLogin: MobileAuthSession;
  mobileLogout: MessageResponse;
  mobileRefreshTokens: MobileTokens;
  revokeAllSessions: MessageResponse;
  revokeSession: MessageResponse;
  updateCostCategory: CostCategory;
  updateInventoryItem: InventoryItem;
  updateInventoryItemLocation: MutationResult;
  updateInventoryItemUomConversion: MutationResult;
  updateTaxGroup: TaxGroup;
  updateUom: Uom;
  updateUomDimension: UomDimension;
};


export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
};


export type MutationCreateCostCategoryArgs = {
  input: CreateCostCategoryInput;
};


export type MutationCreateInventoryItemArgs = {
  input: CreateInventoryItemInput;
};


export type MutationCreateInventoryItemLocationArgs = {
  input: CreateInventoryItemLocationInput;
  inventoryItemId: Scalars['ID']['input'];
};


export type MutationCreateInventoryItemUomConversionArgs = {
  input: CreateInventoryItemUomConversionInput;
  inventoryItemId: Scalars['ID']['input'];
};


export type MutationCreateTaxGroupArgs = {
  input: CreateTaxGroupInput;
};


export type MutationCreateUomArgs = {
  input: CreateUomInput;
};


export type MutationCreateUomDimensionArgs = {
  input: CreateUomDimensionInput;
};


export type MutationDeleteCostCategoryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteInventoryItemArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteInventoryItemLocationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteInventoryItemUomConversionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteTaxGroupArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUomArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUomDimensionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMobileLoginArgs = {
  input: MobileLoginInput;
};


export type MutationMobileRefreshTokensArgs = {
  input: MobileRefreshInput;
};


export type MutationRevokeSessionArgs = {
  sessionId: Scalars['ID']['input'];
};


export type MutationUpdateCostCategoryArgs = {
  id: Scalars['ID']['input'];
  input: UpdateCostCategoryInput;
};


export type MutationUpdateInventoryItemArgs = {
  id: Scalars['ID']['input'];
  input: UpdateInventoryItemInput;
};


export type MutationUpdateInventoryItemLocationArgs = {
  id: Scalars['ID']['input'];
  input: UpdateInventoryItemLocationInput;
};


export type MutationUpdateInventoryItemUomConversionArgs = {
  id: Scalars['ID']['input'];
  input: UpdateInventoryItemUomConversionInput;
};


export type MutationUpdateTaxGroupArgs = {
  id: Scalars['ID']['input'];
  input: UpdateTaxGroupInput;
};


export type MutationUpdateUomArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUomInput;
};


export type MutationUpdateUomDimensionArgs = {
  id: Scalars['ID']['input'];
  input: UpdateUomDimensionInput;
};

export type MutationResult = {
  __typename?: 'MutationResult';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Person = {
  __typename?: 'Person';
  displayName: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
};

export type PersonCommunication = {
  __typename?: 'PersonCommunication';
  channel: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  isPrimary: Scalars['Boolean']['output'];
  value: Scalars['String']['output'];
};

export type Profile = {
  __typename?: 'Profile';
  createdAt: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  email: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  hasPassword: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  lastLoginAt?: Maybe<Scalars['String']['output']>;
  locale: Scalars['String']['output'];
  profilePictureUrl?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  timezone: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  categoriesOptions: SelectOptions;
  costCategories: Array<CostCategory>;
  costCategoriesOptions: SelectOptions;
  customersOptions: SelectOptions;
  goodsReceipt: GoodsReceipt;
  goodsReceiptsFeed: GoodsReceiptConnection;
  inventoryItem: InventoryItem;
  inventoryItemLedger: InventoryItemLedgerConnection;
  inventoryItemLocations: InventoryItemLocationConnection;
  inventoryItemLotsOptions: SelectOptions;
  inventoryItemQuants: InventoryItemQuantConnection;
  inventoryItemQuantsOptions: SelectOptions;
  inventoryItemSerialsOptions: SelectOptions;
  inventoryItemStockLevels: InventoryItemStockLevelConnection;
  inventoryItemSuppliers: InventoryItemSupplierConnection;
  inventoryItemUomConversions: Array<InventoryItemUomConversion>;
  inventoryItems: InventoryItemConnection;
  inventoryItemsOptions: SelectOptions;
  locationsOptions: SelectOptions;
  organizationsByEmail: Array<LookupOrganization>;
  profile: Profile;
  purchaseOrderItemsOptions: SelectOptions;
  purchaseOrdersOptions: SelectOptions;
  sessions: Array<UserSession>;
  supplierItemsOptions: SelectOptions;
  suppliersOptions: SelectOptions;
  taxGroups: Array<TaxGroup>;
  taxGroupsOptions: SelectOptions;
  uom: Uom;
  uomDimension: UomDimension;
  uomDimensions: Array<UomDimension>;
  uomOptions: SelectOptions;
  uomsFeed: UomConnection;
};


export type QueryCategoriesOptionsArgs = {
  input?: InputMaybe<SelectOptionsInput>;
};


export type QueryCostCategoriesArgs = {
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryCostCategoriesOptionsArgs = {
  input?: InputMaybe<SelectOptionsInput>;
};


export type QueryCustomersOptionsArgs = {
  input?: InputMaybe<SelectOptionsInput>;
};


export type QueryGoodsReceiptArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGoodsReceiptsFeedArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<FeedSearchInput>;
};


export type QueryInventoryItemArgs = {
  id: Scalars['ID']['input'];
};


export type QueryInventoryItemLedgerArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  inventoryItemId: Scalars['ID']['input'];
};


export type QueryInventoryItemLocationsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  inventoryItemId: Scalars['ID']['input'];
};


export type QueryInventoryItemLotsOptionsArgs = {
  input?: InputMaybe<SelectOptionsInput>;
  inventoryItemId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryInventoryItemQuantsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  inventoryItemId: Scalars['ID']['input'];
};


export type QueryInventoryItemQuantsOptionsArgs = {
  input?: InputMaybe<SelectOptionsInput>;
  inventoryItemId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryInventoryItemSerialsOptionsArgs = {
  input?: InputMaybe<SelectOptionsInput>;
  quantId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryInventoryItemStockLevelsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  inventoryItemId: Scalars['ID']['input'];
};


export type QueryInventoryItemSuppliersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  inventoryItemId: Scalars['ID']['input'];
};


export type QueryInventoryItemUomConversionsArgs = {
  inventoryItemId: Scalars['ID']['input'];
};


export type QueryInventoryItemsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filters?: InputMaybe<Array<FeedFilterInput>>;
  first?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<FeedSearchInput>;
  sort?: InputMaybe<Array<FeedSortInput>>;
};


export type QueryInventoryItemsOptionsArgs = {
  excludeOnSupplierId?: InputMaybe<Scalars['ID']['input']>;
  input?: InputMaybe<SelectOptionsInput>;
};


export type QueryLocationsOptionsArgs = {
  excludeUsedOnGoodsReceiptItemId?: InputMaybe<Scalars['ID']['input']>;
  goodsReceiptLotId?: InputMaybe<Scalars['ID']['input']>;
  input?: InputMaybe<SelectOptionsInput>;
  inventoryItemId?: InputMaybe<Scalars['ID']['input']>;
  locationRoles?: InputMaybe<Scalars['String']['input']>;
};


export type QueryOrganizationsByEmailArgs = {
  email: Scalars['String']['input'];
};


export type QueryPurchaseOrderItemsOptionsArgs = {
  excludeOnGoodsReceiptId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<SelectOptionsInput>;
  purchaseOrderId: Scalars['String']['input'];
};


export type QueryPurchaseOrdersOptionsArgs = {
  input?: InputMaybe<SelectOptionsInput>;
  status?: InputMaybe<Scalars['String']['input']>;
  supplierId?: InputMaybe<Scalars['ID']['input']>;
};


export type QuerySupplierItemsOptionsArgs = {
  excludeOnGoodsReceiptId?: InputMaybe<Scalars['String']['input']>;
  excludeOnPurchaseOrderId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<SelectOptionsInput>;
  supplierId?: InputMaybe<Scalars['String']['input']>;
};


export type QuerySuppliersOptionsArgs = {
  input?: InputMaybe<SelectOptionsInput>;
};


export type QueryTaxGroupsArgs = {
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryTaxGroupsOptionsArgs = {
  input?: InputMaybe<SelectOptionsInput>;
};


export type QueryUomArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUomDimensionArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUomDimensionsArgs = {
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUomOptionsArgs = {
  baseOnly?: InputMaybe<Scalars['Boolean']['input']>;
  derivedOnly?: InputMaybe<Scalars['Boolean']['input']>;
  dimensionId?: InputMaybe<Scalars['ID']['input']>;
  input?: InputMaybe<SelectOptionsInput>;
};


export type QueryUomsFeedArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  dimensionId: Scalars['ID']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type SelectGroup = {
  __typename?: 'SelectGroup';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type SelectOption = {
  __typename?: 'SelectOption';
  additionals?: Maybe<Scalars['JSON']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  groupId?: Maybe<Scalars['String']['output']>;
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type SelectOptions = {
  __typename?: 'SelectOptions';
  groups?: Maybe<Array<SelectGroup>>;
  hasMore: Scalars['Boolean']['output'];
  options: Array<SelectOption>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type SelectOptionsInput = {
  additionalKeys?: InputMaybe<Scalars['String']['input']>;
  descriptionKey?: InputMaybe<Scalars['String']['input']>;
  excludeIds?: InputMaybe<Scalars['String']['input']>;
  groupIdKey?: InputMaybe<Scalars['String']['input']>;
  labelKey?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderByKey?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  valueKey?: InputMaybe<Scalars['String']['input']>;
  values?: InputMaybe<Scalars['String']['input']>;
};

export type SendSmsOtpResult = {
  __typename?: 'SendSmsOtpResult';
  expiresAt: Scalars['DateTime']['output'];
  resendAvailableAt: Scalars['DateTime']['output'];
  sent: Scalars['Boolean']['output'];
};

export type SendWhatsappOtpResult = {
  __typename?: 'SendWhatsappOtpResult';
  expiresAt: Scalars['DateTime']['output'];
  resendAvailableAt: Scalars['DateTime']['output'];
  sent: Scalars['Boolean']['output'];
};

export type SupplierUnitPrice = {
  __typename?: 'SupplierUnitPrice';
  currency: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type TaxGroup = {
  __typename?: 'TaxGroup';
  canDelete: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  taxRates: Array<TaxRate>;
};

export type TaxRate = {
  __typename?: 'TaxRate';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  rate: Scalars['Float']['output'];
  sortOrder: Scalars['Int']['output'];
};

export type TaxRateInput = {
  name: Scalars['String']['input'];
  rate: Scalars['Float']['input'];
};

export type Uom = {
  __typename?: 'Uom';
  baseUnitId?: Maybe<Scalars['ID']['output']>;
  baseUnitSymbol?: Maybe<Scalars['String']['output']>;
  baseUomQty: Scalars['Int']['output'];
  canDelete: Scalars['Boolean']['output'];
  canEdit: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  dimensionId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
  uomQty: Scalars['Int']['output'];
};

export type UomConnection = {
  __typename?: 'UomConnection';
  edges: Array<UomEdge>;
  pageInfo: UomPageInfo;
};

export type UomDimension = {
  __typename?: 'UomDimension';
  canDelete?: Maybe<Scalars['Boolean']['output']>;
  canEdit?: Maybe<Scalars['Boolean']['output']>;
  code: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

export type UomEdge = {
  __typename?: 'UomEdge';
  cursor: Scalars['String']['output'];
  node: Uom;
};

export type UomPageInfo = {
  __typename?: 'UomPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type UpdateCostCategoryInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInventoryItemInput = {
  categoryId?: InputMaybe<Scalars['String']['input']>;
  code?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  hsnCode?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  pickStrategy?: InputMaybe<Scalars['String']['input']>;
  purchaseTaxGroupId: Scalars['String']['input'];
  type?: InputMaybe<Scalars['String']['input']>;
  uomId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateInventoryItemLocationInput = {
  reorderLevel: Scalars['Float']['input'];
};

export type UpdateInventoryItemUomConversionInput = {
  primaryUomQty: Scalars['Int']['input'];
  uomQty: Scalars['Int']['input'];
};

export type UpdateTaxGroupInput = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  taxRates?: InputMaybe<Array<TaxRateInput>>;
};

export type UpdateUomDimensionInput = {
  code?: InputMaybe<Scalars['String']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUomInput = {
  allowDecimal?: InputMaybe<Scalars['Boolean']['input']>;
  baseUnitId?: InputMaybe<Scalars['ID']['input']>;
  baseUomQty?: InputMaybe<Scalars['Int']['input']>;
  dimensionId?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  symbol?: InputMaybe<Scalars['String']['input']>;
  uomQty?: InputMaybe<Scalars['Int']['input']>;
};

export type UserSession = {
  __typename?: 'UserSession';
  device: Scalars['String']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  isCurrent: Scalars['Boolean']['output'];
  lastActive: Scalars['String']['output'];
  sessionId: Scalars['ID']['output'];
};

export type VerifySmsOtpResult = {
  __typename?: 'VerifySmsOtpResult';
  verified: Scalars['Boolean']['output'];
};

export type VerifyWhatsappOtpResult = {
  __typename?: 'VerifyWhatsappOtpResult';
  verified: Scalars['Boolean']['output'];
};
