# Furniture Studio

![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)
**Live Demo:** [https://furniture-studio-app.vercel.app](https://furniture-studio-app.vercel.app)

A modern full-stack web application designed for a premium furniture showroom. This platform allows customers to browse the catalog, design custom furniture using AI generation, and enables showroom admins to manage inventory, incoming orders, and custom inquiries seamlessly.

## 🌟 Key Features

* **Showroom Catalog:** Browse an elegant collection of premium furniture with filters by category, price sorting, and search functionality. Add items to an interactive cart to place an order inquiry.
* **3D/AI Customizer (Custom AI Studio):** Customers can specify materials, dimensions, and special features to generate instant, photorealistic 3D renders of their custom furniture using generative AI. Customers can also sketch a rough idea and get a live price estimate before submitting an inquiry or downloading a PDF quotation.
* **Admin Dashboard:** A secure administrative portal to manage the showroom. Track inventory, update stock and prices, process incoming catalog orders, and respond to custom AI studio inquiries.
* **Printable QR Standee:** Dynamically generates a high-contrast, perfectly-formatted (A5/A4) QR code standee ready for physical printing. Ideal for placing on showroom tables to let walk-in customers seamlessly access the 3D Customizer.

## 🛠️ Tech Stack

This project is built using modern, robust web technologies:

* **Frontend:**
  * **React & Vite:** Fast, modern UI development.
  * **Tailwind CSS:** Utility-first framework for premium, responsive styling.
  * **React Router:** Client-side routing.
  * **Lucide React:** Beautiful, consistent iconography.
  * **Axios:** Streamlined API requests.

* **Backend:**
  * **Node.js & Express:** Lightweight, fast backend server.
  * **SQLite (better-sqlite3):** High-performance embedded SQL database for inventory, orders, and inquiries.
  * **CORS & Proxying:** Handles cross-origin resource sharing and image proxying for PDF generation.

* **Integrations:**
  * **Pollinations AI:** For instant, prompt-based 3D furniture rendering.
  * **jsPDF:** Client-side generation of elegant PDF quotations and order receipts.
  * **qrcode.react:** Dynamic QR code generation for the physical standee.

## 🚀 Local Installation & Run Instructions

To run this project locally on your machine, follow these steps:

### Prerequisites

* Node.js (v18 or higher recommended)
* npm (Node Package Manager)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shubhamsavaliya-dev/furniture-studio-app.git
   cd furniture-studio-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   The project uses `concurrently` to start both the Vite frontend and Express backend with a single command.
   ```bash
   npm run dev
   ```

4. **Access the application:**
   * Frontend (Vite): [http://localhost:5173] (or the port specified in your terminal)
   * Backend API: [http://localhost:3001]
     

## 📦 Deployment

The frontend of this application is deployed and hosted on **Vercel**, while the backend is deployed on **Render** (`https://furniture-studio-app.onrender.com`).
Vercel's SPA routing configuration is handled via the included `vercel.json` file.
