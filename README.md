# Mudita Clinic POS System

A high-performance, aesthetically pleasing Point of Sale and Medical Management System built with Next.js 15+, Supabase, and Vanilla CSS.

## 🏥 Features

### 📊 Dashboard
- Real-time revenue tracking (Today's Revenue).
- Patient and Transaction statistics.
- Low-stock alerts for the pharmacy inventory.
- Quick action shortcuts for common workflows.

### 💳 Point of Sale (POS)
- **Advanced Patient Search**: Real-time lookup by name, phone, or ID.
- **Dynamic Item Entry**: Add items from Services (Consultations, Procedures) or Inventory (Medications).
- **Transaction States**: Draft, Open, Paid, and Voided.
- **Payment Methods**: Support for Cash, KPay, QR/eWallet, and Cards.
- **Discount System**: Apply direct discounts with reason tracking.
- **Receipt Printing**: Thermal-printer optimized receipt format (80mm/320px).

### 👥 Patient & Doctor Management
- **Patient Registry**: Comprehensive medical records with blood type, BP, and history tracking.
- **Doctor Directory**: Manage clinic staff, specializations, and consultation fees.
- **Transaction History**: Track all billing history per patient.

### 📦 Inventory & Services
- **Pharmacy Tracking**: Batch numbers, expiry dates, and low-stock thresholds.
- **Quick Adjustments**: One-click stock increments/decrements.
- **Service Catalog**: Manage consultation fees and procedure costs centrally.

### 📈 Reports & Analytics
- Revenue analytics with daily bar charts.
- Top-billed items and services ranking.
- Payment method distribution and status breakdown.

## 🛠 Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth & Security**: Supabase Auth + Row Level Security (RLS)
- **Styling**: Vanilla CSS (Premium Aesthetic with Sora & Fraunces fonts)
- **Icons**: Lucide React

## 🚀 Setup & Installation

### Local Development
1. **Clone the repository**
2. **Environment Variables**: Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
3. **Install Dependencies**: `npm install`
4. **Run Locally**: `npm run dev`

### Production / CI/CD (GitHub)
If you are deploying via GitHub Actions or Vercel, **do not commit your `.env.local` file**. Instead:
1. Go to your GitHub Repository **Settings** > **Secrets and Variables** > **Actions**.
2. Add the following **Repository Secrets**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. If using Vercel, add these under **Project Settings** > **Environment Variables**.

## 🎨 Design System
The system uses a custom "Blueprint" design system:
- **Surface**: Pure White & Soft Cream (`#f5f2ec`)
- **Accent**: Deep Navy (`#1a4f8a`)
- **Typography**: Sora (UI), Fraunces (Headings), DM Mono (Data).
- **Interactions**: Subtle hover states, smooth transitions, and glassmorphism elements.

---
*Built for excellence in medical administration.*

# Build Trigger
