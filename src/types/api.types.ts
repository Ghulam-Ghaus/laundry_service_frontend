export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errorCode: string | null;
  requestId: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string | null;
  display_name: string;
  avatar_url: string | null;
  roles?: string[];
  permissions?: string[];
}

export interface ServiceCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon_key: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  items?: CatalogItem[];
}

export interface CatalogItem {
  id: string;
  category_id: string;
  code: string;
  name: string;
  description: string | null;
  icon_key: string | null;
  image_url: string | null;
  unit_label: string;
  min_quantity: number;
  sort_order: number;
  is_active: boolean;
  prices?: ItemPrice[];
}

export interface ServiceOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface ItemPrice {
  id: string;
  item_id: string;
  service_option_id: string;
  currency_code: string;
  price: number;
  compare_at_price: number | null;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
}

export interface ServiceArea {
  id: string;
  code: string;
  name: string;
  city: string;
  province: string | null;
  country: string;
  is_serviceable: boolean;
  sort_order: number;
}

export interface TimeSlot {
  id: string;
  slot_type_id: string;
  label: string;
  start_time: string;
  end_time: string;
  capacity: number | null;
}

export interface OrderTotalInfo {
  subtotal: string;
  serviceFee: string;
  discountTotal: string;
  grandTotal: string;
  currencyCode: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_address_id: string | null;
  status_id: string;
  frequency_id: string | null;
  pickup_date: string | null;
  pickup_slot_id: string | null;
  delivery_date: string | null;
  delivery_slot_id: string | null;
  subtotal: number;
  service_fee: number;
  discount_total: number;
  grand_total: number;
  currency_code: string;
  special_instructions: string | null;
  is_item_selection_skipped: boolean;
  created_at: string;
  status?: {
    code: string;
    label: string;
  };
  frequency?: {
    code: string;
    label: string;
  };
  pickup_slot?: {
    id: string;
    label: string;
    start_time: string;
    end_time: string;
  };
  delivery_slot?: {
    id: string;
    label: string;
    start_time: string;
    end_time: string;
  };
  address?: {
    id: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    instructions: string | null;
  };
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  service_option_id: string;
  item_name_snapshot: string;
  service_name_snapshot: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}
