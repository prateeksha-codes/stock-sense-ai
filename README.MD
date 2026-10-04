# StockSense AI

**AI-Assisted Smart Inventory and Logistics Management Platform for MSMEs**

A multi-business web platform that helps Micro, Small, and Medium Enterprises (MSMEs) manage inventory, orders, suppliers, and logistics — enhanced with AI-powered insights from Google Gemini.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Demo Accounts](#demo-accounts)
- [API Overview](#api-overview)
- [Testing](#testing)
- [Limitations](#limitations)
- [Future Enhancements](#future-enhancements)

---

## Features

### Core Features

- **Multi-Business Architecture** — Each MSME owner gets their own isolated workspace
- **Product Management** — Flexible product attributes for any business type (grocery, pharmacy, textile, etc.)
- **Inventory Tracking** — Complete stock audit trail with low-stock alerts
- **Order Management** — End-to-end order lifecycle: placed → confirmed → shipped → delivered
- **Supplier Management** — Track suppliers, purchase orders, and delivery performance
- **Payment Support** — Cash on Delivery + Online (Razorpay test mode)

### AI-Assisted Features (Google Gemini)

- **Stock-out Prediction** — Predicts which products may run out based on demand patterns
- **Reorder Recommendations** — Suggests quantities based on lead time and demand
- **Dead Stock Detection** — Flags products with no recent sales
- **Demand Analysis** — Identifies fast-moving and seasonal products
- **Supplier Insights** — Summarizes supplier performance

### Discovery & Customer Experience

- **Location-Based MSME Discovery** — Find nearby shops using GPS or map picker
- **Smart Product Search** — Platform-wide search across all businesses
- **Real-Time Stock Availability** — In Stock / Low Stock / Out of Stock indicators
- **Business Ratings & Reviews** — Customers rate businesses after delivered orders
- **AI Product Recommendations** — "You may also like" suggestions
- **Smart Notifications** — Real-time alerts for orders, stock, and AI insights

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router, Tailwind CSS, Chart.js, Leaflet |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0 |
| Authentication | JWT + bcryptjs |
| AI | Google Gemini API |
| Payments | Razorpay (Test Mode) |
| Maps | Leaflet + OpenStreetMap + Nominatim |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              React Frontend (Port 3000)             │
│  Public Pages | Admin | Owner | Customer            │
│              Axios + JWT Auth                       │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│              Express API (Port 5000)                │
│  Routes | Middleware | Controllers                  │
│              mysql2 pool                            │
└─────────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────────┐
│                  MySQL Database                     │
│        (19 tables, isolated by business_id)         │
└─────────────────────────────────────────────────────┘
```

---

## User Roles

Exactly **3 roles**:

1. **Super Admin** — Platform-wide management
2. **MSME Owner** — Manages their own business (products, orders, suppliers, AI)
3. **Customer** — Browses businesses, places orders, tracks deliveries

> **Note:** Suppliers are **NOT users**. They are business entities managed by owners.

---

## Project Structure

```
stock-sense-ai/
├── client/                        # React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── common/            # Reusable UI components
│       │   ├── layout/            # Layouts for each role
│       │   ├── admin/             # Admin-specific components
│       │   ├── owner/             # Owner-specific components
│       │   └── customer/          # Customer-specific components
│       ├── pages/
│       │   ├── public/            # Landing, Login, Register
│       │   ├── admin/             # Admin dashboard, businesses, users
│       │   ├── owner/             # Dashboard, products, orders, AI, reviews
│       │   └── customer/          # Home, nearby, search, cart, orders
│       ├── context/
│       │   └── AuthContext.jsx    # Global auth state
│       ├── services/
│       │   └── api.js             # Centralized API calls
│       ├── hooks/
│       ├── utils/
│       ├── App.jsx
│       ├── index.js
│       └── index.css
│
├── server/                        # Express backend
│   ├── config/                    # Database + Gemini config
│   ├── controllers/               # Business logic
│   ├── middleware/                # Auth, role, business checks
│   ├── routes/                    # API routes
│   ├── services/                  # Notification + recommendation services
│   ├── utils/                     # Helpers
│   ├── validations/               # Input validators
│   ├── migrations/                # Database migrations
│   ├── seed/                      # Seed data scripts
│   └── app.js
│
├── database/
│   ├── schema.sql                 # MySQL schema (19 tables)
│   └── seed.sql                   # Initial demo data
│
├── .env.example                   # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## Setup Instructions

### Prerequisites

- **Node.js** v18 or higher ([download](https://nodejs.org/))
- **MySQL 8.0** ([download](https://dev.mysql.com/downloads/mysql/))
- **Git** ([download](https://git-scm.com/))
- **VS Code** (recommended)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/stock-sense-ai.git
cd stock-sense-ai
```

### Step 2 — Set Up MySQL

Start MySQL, then create the database:

```bash
mysql -u root -p
```

Inside the MySQL prompt:

```sql
CREATE DATABASE stock_sense_ai;
EXIT;
```

Then import the schema:

```bash
mysql -u root -p stock_sense_ai < database/schema.sql
```

Apply migrations in order:

```bash
mysql -u root -p stock_sense_ai < server/migrations/002_add_features.sql
mysql -u root -p stock_sense_ai < server/migrations/003_add_customer_location.sql
```

### Step 3 — Configure Environment Variables

Copy the template:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
DB_PASSWORD=your_mysql_password
JWT_SECRET=any_random_long_string
GEMINI_API_KEY=optional
```

### Step 4 — Install Dependencies

```bash
# Root
npm install

# Backend
cd server
npm install
cd ..

# Frontend
cd client
npm install
cd ..
```

### Step 5 — Seed Initial Data

```bash
cd server
node seed/seed.js

# Optional: seed Komarapalayam demo businesses + products
node seed/seed_komarapalayam.js
node seed/seed_products_komarapalayam.js
cd ..
```

### Step 6 — Start the Project

**Terminal 1 — Backend:**

```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**

```bash
cd client
npm start
```

Open **http://localhost:3000**

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | MySQL host (usually `localhost`) |
| `DB_PORT` | Yes | MySQL port (usually `3306`) |
| `DB_USER` | Yes | MySQL username |
| `DB_PASSWORD` | Yes | MySQL password |
| `DB_NAME` | Yes | Database name (`stock_sense_ai`) |
| `JWT_SECRET` | Yes | Any long random string |
| `JWT_EXPIRE` | No | Token expiry (default `30d`) |
| `GEMINI_API_KEY` | No | Google Gemini API key for AI features |
| `RAZORPAY_KEY_ID` | No | Razorpay test key (for online payment) |
| `RAZORPAY_KEY_SECRET` | No | Razorpay test secret |
| `PORT` | No | Backend port (default `5000`) |

---

## Demo Accounts

After running the seed scripts:

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `admin@stocksense.com` | `admin123` |
| **Owner — FreshMart Grocery** | `rajesh@freshmart.com` | `owner123` |
| **Owner — StyleHub Textile** | `priya@stylehub.com` | `owner123` |
| **Owner — Sri Balaji Pharmacy** | `karthik@srbalaji.com` | `owner123` |
| **Owner — MedPlus Pharmacy** | `vignesh@medplus.com` | `owner123` |
| **Owner — Kumar Provision Store** | `suresh@kumarprovision.com` | `owner123` |
| **Owner — Green Leaf Supermarket** | `anitha@greenleaf.com` | `owner123` |
| **Customer — Arun Patel** | `arun@email.com` | `customer123` |
| **Customer — Meena Sundaram** | `meena@komarapalayam.com` | `customer123` |

---

## API Overview

All routes are prefixed with `/api`.

| Group | Base Path | Purpose |
|-------|-----------|---------|
| Auth | `/api/auth` | Login, register, current user |
| Admin | `/api/admin` | Platform-wide stats and management |
| Businesses | `/api/businesses` | Public business directory |
| Products | `/api/products` | Product CRUD |
| Inventory | `/api/inventory` | Stock, transactions, alerts |
| Customers | `/api/customers` | Profile, addresses, discovery location |
| Orders | `/api/orders` | Order lifecycle |
| Suppliers | `/api/suppliers` | Supplier management |
| Purchase Orders | `/api/purchase-orders` | PO management |
| Payments | `/api/payments` | COD + Razorpay integration |
| Delivery | `/api/delivery` | Order and PO tracking |
| Analytics | `/api/analytics` | Sales, inventory, product, supplier analytics |
| AI | `/api/ai` | Insights, predictions, recommendations |
| Discovery | `/api/discovery` | Nearby businesses, smart search, geocoding |
| Reviews | `/api/reviews` | Business ratings |
| Notifications | `/api/notifications` | User alerts |

---

## Testing

### Test Roles Individually

**Super Admin** — Login with `admin@stocksense.com`:

- View all businesses, owners, customers, orders
- Platform-wide analytics

**Owner** — Login with `rajesh@freshmart.com`:

- Dashboard shows only FreshMart data
- Products, inventory, orders, suppliers, AI insights
- Cannot see StyleHub's private data

**Customer** — Login with `meena@komarapalayam.com`:

- Set location → see nearby shops
- Search products across businesses
- Place orders → track → rate

### Test Multi-Business Isolation

1. Login as Owner A (`rajesh@freshmart.com`) — note product list
2. Logout, login as Owner B (`priya@stylehub.com`) — different product list
3. Confirm neither can see the other's data

---

## Limitations

- GPS tracking of delivery vehicles is not implemented (status-based tracking only)
- No IoT device integration
- Online payments use Razorpay test mode only (no real transactions)
- No dedicated supplier login (suppliers are managed by owners)
- No file upload for product images (uses external URLs)

---

## Future Enhancements

- React Native mobile app (iOS + Android)
- PWA (installable web app)
- WhatsApp/SMS notifications
- Advanced AI demand forecasting
- Multi-language support (Tamil, Hindi, English)
- Real-time chat between customer and owner
- Barcode/QR scanning
- Offline-first PWA
- Supplier self-service portal

---

## License

This project is developed as a college final-year project. Educational use only.

---

## Team

Built with love by the StockSense AI team.

For questions or contributions, open an issue or submit a pull request.