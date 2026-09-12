# FreelanceHub — MERN Stack Freelance Job Marketplace

FreelanceHub is a complete, production-ready, and scalable Freelance Job Marketplace web application built using the MERN Stack (**MongoDB, Express.js, React.js, Node.js**). The platform mirrors functionalities of major marketplace platforms such as Upwork and Fiverr, providing robust user onboarding, role-based workflows (Freelancer, Client, Admin), real-time messaging, invoice payment logs, and comprehensive admin controls.

---

## 🌟 Key Features

### 🔒 Secure Authentication System
- Dedicated register pathways for **Freelancers** and **Clients**.
- JWT-based authentication using HTTP-only cookies and Bearer tokens.
- Secure email verification flow and password reset triggers using Nodemailer.
- Admin dashboard portal with separate login guard middleware.

### 🙋 Freelancer Dashboard
- **Comprehensive Overview**: Monitor total earnings, completed milestones, rating statistics, and matched job feeds.
- **Profile Customization**: Add and modify professional titles, hourly rates, location details, resumes (CV), and biography logs.
- **Portfolios Manager**: Create portfolio items with images and links to demonstrate qualifications.
- **Work History Timeline**: Detail previous employment history with start/end date details.
- **Proposals Tracker**: Submit bids on active projects specifying bid amount, cover letter, and timeline details.

### 🏢 Client Dashboard
- **Job Poster Editor**: Fill in title, category, budget, experience requirements, and deadline details.
- **Proposals Manager**: View bids on projects, review cover letters, and accept/reject/discuss bids.
- **Billing Outflows**: Audit financial transactions, billing records, and processing statuses.

### 💬 Real-Time Communication
- Real-time chat system powered by **Socket.io**.
- Instant message notifications and unread badges.
- Real-time typing indicators and read receipts.

### 🛡️ Admin Controls
- **Analytics Center**: Track Monthly signups and gross platform fee revenues via interactive charts.
- **User Audits**: Toggle suspends/bans, manually verify registrations, and audit user directories.
- **Content Moderation**: Moderate system database feedback reviews.

---

## 📁 Folder Structure

### Backend (`server/`)
- `config/`: MongoDB connection setup.
- `models/`: Mongoose schemas for Users, Projects, Applications, Messages, Notifications, Reviews, and Payments.
- `controllers/`: MVC business logic controllers.
- `routes/`: Express endpoint routing paths.
- `middleware/`: JWT verification, Role guards, centralized error processing, and Multer file uploads.
- `services/`: Nodemailer SMTP transport setup and Stripe checkout helper hooks.
- `sockets/`: Socket.io online users tracking and message routing.

### Frontend (`client/`)
- `src/components/`: Modular design components (common elements, chat, dashboard panels).
- `src/context/`: Theme switcher, Authentication store, and Socket listeners.
- `src/pages/`: Modular pages for public browse grids, auth pipelines, and dashboards.
- `src/services/`: HTTP request interceptors and API wrappers.

---

## 🚀 Running Locally

### 1. Database & Credentials setup
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_signing_secret
CLIENT_URL=http://localhost:5173

# Email alerts (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

Create a `.env.development` file in the `client/` directory:
```env
VITE_API_URL=http://localhost:5000
```

### 2. Launch the backend server
```bash
cd server
npm install
npm run dev
```

### 3. Launch the client dev server
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` on your browser to access the application.

---

## ⚡ Deployment

### Frontend (Vercel)
The root client folder contains a `vercel.json` routing fallback configuration. Build the bundle via `npm run build` and connect the directory to Vercel.

### Backend (Render / Heroku)
Deploy the Express server setting environment variables on the cloud dashboard. Ensure `CLIENT_URL` points to your production frontend address to authorize CORS operations.
