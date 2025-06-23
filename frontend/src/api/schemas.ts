export interface ProfileOut {
  id: number;
  email: string;
  avatar?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  favorite_colors?: string[];
  favorite_brands?: string[];
  is_admin?: boolean;
}

export interface TokensOut {
  access_token: string;
  token_type?: string;
  refresh_token: string;
}

export interface TokensUserOut {
  access_token: string;
  token_type?: string;
  refresh_token: string;
  user: ProfileOut;
}

export interface UserOut {
  id: number;
  email: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface UserCreate {
  email: string;
  password: string;
}

export interface UserCreateAdmin {
  email: string;
  password: string;
  is_admin?: boolean;
  is_active?: boolean;
}

export interface UserUpdateAdmin {
  email?: string;
  password?: string;
  is_admin?: boolean;
  is_active?: boolean;
}

export interface VariantOut {
  size?: string;
  color?: string;
  sku?: string;
  stock?: number;
  price?: number;
  id: number;
}

export interface ItemOut {
  name: string;
  brand?: string;
  color?: string;
  image_url?: string;
  description?: string;
  price?: number;
  category?: string;
  clothing_type?: string;
  article?: string;
  size?: string;
  style?: string;
  collection?: string;
  id: number;
  created_at?: string;
  updated_at?: string;
  image_urls?: string[];
  variants?: VariantOut[];
  is_favorite?: boolean;
}

export interface OutfitItemBase {
  id: number;
  name: string;
  brand?: string;
  image_url?: string;
  price?: number;
}



export interface ProfileUpdate {
  avatar?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  favorite_colors?: string[];
  favorite_brands?: string[];
}

export interface CartItemOut {
  item_id: number;
  variant_id: number;
  name: string;
  brand?: string;
  image_url?: string;
  size?: string;
  color?: string;
  sku?: string;
  quantity: number;
  price?: number;
}

export interface CartStateOut {
  items: CartItemOut[];
  total_items: number;
  total_price: number;
}

export interface OutfitItemCreate {
  item_id: number;
  variant_id?: number;
  category: string; // top, bottom, footwear, accessory, fragrance
  notes?: string;
}

export interface OutfitCreate {
  name: string;
  style: string;
  description?: string;
  outfit_type?: string;
  is_public?: boolean;
  tags?: string[];
  season?: string;
  occasion?: string;
  collection?: string;
  items: OutfitItemCreate[];
}

export interface OutfitUpdate {
  name?: string;
  style?: string;
  description?: string;
  outfit_type?: string;
  is_public?: boolean;
  is_featured?: boolean;
  tags?: string[];
  season?: string;
  occasion?: string;
  collection?: string;
  items?: OutfitItemCreate[];
}

export interface OutfitOut {
  id: number;
  name: string;
  style: string;
  description?: string;
  owner_id: number;
  created_at?: string;
  updated_at?: string;
  collection?: string;
  items: { [key: string]: any[] };
  total_price?: number;
  model_config?: any;
}

export interface OutfitCommentCreate {
  content: string;
  rating?: number;
}

export interface OutfitCommentOut {
  content: string;
  rating?: number;
  id: number;
  user_id: number;
  created_at: string;
  likes?: number;
}

export interface ItemUpdate {
  name?: string;
  brand?: string;
  color?: string;
  image_url?: string;
  description?: string;
  price?: number;
  category?: string;
  clothing_type?: string;
  article?: string;
  size?: string;
  style?: string;
  collection?: string;
}

export interface CommentCreate {
  content: string;
  rating?: number;
}

export interface CommentOut {
  content: string;
  rating?: number;
  id: number;
  user_id: number;
  created_at: string;
  likes?: number;
}

export interface VariantCreate {
  size?: string;
  color?: string;
  sku?: string;
  stock?: number;
  price?: number;
}

export interface VariantUpdate {
  size?: string;
  color?: string;
  sku?: string;
  stock?: number;
  price?: number;
}

export interface Body_create_item_api_items__post {
  name: string;
  brand?: string;
  description?: string;
  price?: number;
  category?: string;
  article?: string;
  style?: string;
  collection?: string;
  images?: File[];
  image_url?: string;
}

export interface Body_login_api_auth_token_post {
  grant_type?: string;
  username: string;
  password: string;
  scope?: string;
  client_id?: string;
  client_secret?: string;
}

export interface Body_logout_api_auth_logout_post {
  body: RefreshTokenIn;
}

export interface QuantityUpdate {
  quantity: number;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface CartItemCreate {
  variant_id: number;
  quantity?: number;
  notes?: string;
}

export interface CartItemUpdate {
  quantity?: number;
  notes?: string;
}

export interface VariantInfo {
  id: number;
  size?: string;
  color?: string;
  sku?: string;
  price?: number;
  discount_price?: number;
  available_stock?: number;
  display_name?: string;
  actual_price?: number;
}

export interface ItemInfo {
  id: number;
  name: string;
  brand?: string;
  article?: string;
  slug?: string;
  image_urls?: string[];
}

export interface CartItemResponse {
  id: number;
  variant_id: number;
  quantity: number;
  price_at_time?: number;
  subtotal?: number;
  is_available?: boolean;
  is_reserved?: boolean;
  reserved_until?: string;
  notes?: string;
  added_at: string;
  updated_at?: string;
  variant: VariantInfo;
  item: ItemInfo;
}

export interface CartSummary {
  total?: number;
  total_items?: number;
  items_count?: number;
  has_unavailable?: boolean;
  unavailable_items?: any[];
}

export interface CartResponse {
  items: CartItemResponse[];
  summary: CartSummary;
}

export interface RefreshTokenIn {
  refresh_token: string;
} 