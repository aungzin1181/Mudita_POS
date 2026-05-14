export type Role = 'cashier' | 'doctor' | 'nurse' | 'admin' | 'manager';

export type TransactionStatus = 'draft' | 'open' | 'paid' | 'voided';

export type PaymentMethod = 'cash' | 'qr_ewallet' | 'kpay' | 'card' | 'split';

export type ItemType = 'consultation' | 'procedure' | 'medication';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type Gender = 'male' | 'female' | 'other';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Patient {
  id: string;
  patient_no: string;
  full_name: string;
  gender: Gender;
  date_of_birth: string | null;
  address: string | null;
  phone_no: string | null;
  blood_type: BloodType | null;
  blood_pressure: string | null;
  weight: number | null;
  spo2: number | null;
  age: number | null;
  medical_history: string | null;
  created_at: string;
}

export interface PatientVital {
  id: string;
  patient_id: string;
  blood_pressure: string | null;
  weight: number | null;
  spo2: number | null;
  temperature: number | null;
  pulse_rate: number | null;
  notes: string | null;
  diagnosis: string | null;
  treatments: string | null;
  recorded_at: string;
}

export interface Doctor {
  id: string;
  doctor_no: string;
  full_name: string;
  address: string | null;
  phone_no: string | null;
  license_no: string | null;
  specialization: string | null;
  consultation_fee: number;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  patient_id: string;
  doctor_id?: string | null;
  created_by: string;
  updated_by: string;
  invoice_no: string;
  status: TransactionStatus;
  payment_method: PaymentMethod | null;
  subtotal: number;
  discount_amount: number;
  discount_reason: string | null;
  total_amount: number;
  amount_paid: number | null;
  change_amount: number | null;
  void_reason: string | null;
  voided_by: string | null;
  voided_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  item_type: ItemType;
  service_id: string | null;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_removed: boolean;
  created_at: string;
}

export interface UpdateItemPayload {
  quantity?: number;
  is_removed?: boolean;
}

export interface Service {
  id: string;
  name: string;
  type: 'consultation' | 'procedure';
  default_price: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  stock_qty: number;
  is_active: boolean;
  category?: string;
  batch_no?: string | null;
  expiry_date?: string | null;
  low_stock_threshold?: number;
  unit?: string;
  updated_at?: string;
}
