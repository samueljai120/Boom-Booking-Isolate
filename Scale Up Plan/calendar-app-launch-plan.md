# Calendar App Launch Plan: MVP to Revenue

## Overview
**Goal**: Get your calendar application hosted, selling, and generating revenue within 2-3 weeks  
**Strategy**: Launch MVP with basic subscription model, then iterate based on user feedback  
**Timeline**: 2-3 weeks to launch, 3 months to optimize

---

## Phase 1: Quick Hosting & Launch (Week 1-2)

### 1.1 Choose Hosting Platform
**Recommended**: Vercel (Frontend) + Railway/Render (Backend)

**Why Vercel + Railway:**
- ✅ **Fastest deployment** (deploy in minutes)
- ✅ **Free tier available** (perfect for MVP)
- ✅ **Automatic SSL** and custom domains
- ✅ **Easy scaling** when you get customers
- ✅ **Great for React apps**

### 1.2 Database Migration (SQLite → PostgreSQL)
**Current**: SQLite (file-based)  
**Target**: PostgreSQL (cloud-hosted)

**Options:**
- **Railway PostgreSQL** (easiest, $5/month)
- **Supabase** (free tier, great for React)
- **PlanetScale** (MySQL, free tier)

### 1.3 Environment Setup
```bash
# Production environment variables
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=production
```

---

## Phase 2: Subscription Model (Week 2-3)

### 2.1 Stripe Integration
**Pricing Tiers:**
- **Free**: 1 room, 50 bookings/month
- **Basic**: $19/month - 5 rooms, 500 bookings
- **Pro**: $49/month - 20 rooms, 2000 bookings
- **Business**: $99/month - Unlimited rooms & bookings

### 2.2 Payment Flow
1. User signs up → Free trial (14 days)
2. After trial → Choose plan or downgrade to Free
3. Stripe handles billing, webhooks update user status
4. Usage limits enforced in app

### 2.3 User Management
- **Authentication**: Keep current JWT system
- **Authorization**: Add subscription status checks
- **Usage Tracking**: Count bookings per month
- **Upgrade Prompts**: Show when limits reached

---

## Phase 3: Marketing & Launch (Week 3-4)

### 3.1 Landing Page
**Simple, focused landing page:**
- **Headline**: "Smart Booking Calendar for Your Business"
- **Value Prop**: "Never double-book again. Easy scheduling for any business."
- **Features**: Visual calendar, real-time updates, mobile-friendly
- **Pricing**: Clear tiers with "Start Free Trial" buttons
- **Social Proof**: "Join 100+ businesses already using our platform"

### 3.2 Domain & Branding
- **Domain**: `yourbookingapp.com` or `smartbooking.co`
- **Logo**: Simple, professional (use Canva or hire designer)
- **Colors**: Clean, business-friendly palette
- **Tagline**: "Smart Booking Made Simple"

### 3.3 Launch Strategy
**Week 1**: Soft launch to friends/family
**Week 2**: Product Hunt launch
**Week 3**: Social media marketing
**Week 4**: Content marketing (blog posts, tutorials)

---

## Phase 4: Optimization (Month 2-3)

### 4.1 User Feedback Collection
- **In-app feedback** widget
- **Email surveys** to active users
- **Analytics tracking** (Google Analytics)
- **User interviews** (5-10 customers)

### 4.2 Feature Iteration
**Based on feedback, add:**
- **Email notifications** (booking confirmations)
- **SMS reminders** (optional)
- **Calendar integrations** (Google Calendar, Outlook)
- **Custom branding** (logos, colors)
- **API access** (for Pro/Business plans)

### 4.3 Growth Optimization
- **Referral program** (free month for referrals)
- **Content marketing** (booking tips, business advice)
- **SEO optimization** (target "booking software" keywords)
- **Partnerships** (business consultants, agencies)

---

## Technical Implementation

### Database Migration Script
```javascript
// migrate-to-postgres.js
const { Pool } = require('pg');
const sqlite3 = require('sqlite3');

// Connect to both databases
const sqlite = new sqlite3.Database('./data/database.sqlite');
const pg = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Migration logic
async function migrate() {
  // Create PostgreSQL tables
  await pg.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      subscription_tier VARCHAR(50) DEFAULT 'free',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  
  // Migrate data from SQLite to PostgreSQL
  // ... migration code
}

migrate().catch(console.error);
```

### Stripe Integration
```javascript
// routes/billing.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create subscription
app.post('/api/create-subscription', async (req, res) => {
  const { priceId, customerId } = req.body;
  
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
  
  res.json({
    subscriptionId: subscription.id,
    clientSecret: subscription.latest_invoice.payment_intent.client_secret
  });
});
```

### Usage Tracking
```javascript
// middleware/usageTracking.js
const checkUsageLimits = (req, res, next) => {
  const user = req.user;
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // Check booking count for current month
  const bookingCount = await getBookingCount(user.id, currentMonth);
  const limit = getSubscriptionLimit(user.subscription_tier);
  
  if (bookingCount >= limit) {
    return res.status(403).json({
      error: 'Usage limit reached',
      upgradeRequired: true,
      currentUsage: bookingCount,
      limit: limit
    });
  }
  
  next();
};
```

---

## Hosting Setup Instructions

### Step 1: Deploy Backend to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Add PostgreSQL database
railway add postgresql

# Deploy
railway up
```

### Step 2: Deploy Frontend to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add STRIPE_SECRET_KEY
```

### Step 3: Configure Domain
1. **Buy domain** (Namecheap, GoDaddy, etc.)
2. **Point DNS** to Vercel
3. **Enable SSL** (automatic with Vercel)
4. **Update API URLs** in frontend

---

## Launch Checklist

### Pre-Launch (Week 1)
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Migrate database to PostgreSQL
- [ ] Set up Stripe account and webhooks
- [ ] Configure custom domain and SSL
- [ ] Test all functionality in production

### Launch Week (Week 2)
- [ ] Create landing page
- [ ] Set up Google Analytics
- [ ] Launch on Product Hunt
- [ ] Share on social media
- [ ] Email friends and family
- [ ] Monitor for bugs and issues

### Post-Launch (Week 3-4)
- [ ] Collect user feedback
- [ ] Fix any critical bugs
- [ ] Optimize based on analytics
- [ ] Plan next feature releases
- [ ] Start content marketing

---

## Success Metrics

### Week 1-2 (Launch)
- **Goal**: 10 signups, 0 revenue
- **Focus**: Technical stability, user onboarding

### Month 1
- **Goal**: 50 signups, $500 MRR
- **Focus**: User feedback, feature iteration

### Month 2
- **Goal**: 100 signups, $1,500 MRR
- **Focus**: Growth optimization, retention

### Month 3
- **Goal**: 200 signups, $3,000 MRR
- **Focus**: Scale preparation, VenueIQ planning

---

## Revenue Projections (Calendar App)

| Month | Users | Paid Users | MRR | ARR |
|-------|-------|------------|-----|-----|
| 1 | 50 | 5 | $100 | $1,200 |
| 2 | 100 | 15 | $300 | $3,600 |
| 3 | 200 | 30 | $600 | $7,200 |
| 6 | 500 | 75 | $1,500 | $18,000 |
| 12 | 1,000 | 150 | $3,000 | $36,000 |

**This revenue funds the VenueIQ platform development!**

---

## Next Steps

1. **This Week**: Deploy to Railway + Vercel
2. **Next Week**: Add Stripe billing
3. **Week 3**: Launch and start marketing
4. **Month 2-3**: Optimize and gather feedback
5. **Month 4+**: Begin VenueIQ platform development

**Ready to get started?** Let's deploy your calendar app and start generating revenue!
