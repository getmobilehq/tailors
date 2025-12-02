# ✅ TailorSpace Database Setup Complete

Your database schema is ready to deploy!

## 📦 What's Included in the Schema

### Tables Created (9 tables)

1. **users** - User accounts with roles (customer, runner, tailor, admin)
2. **services** - 23 pre-loaded alteration services with pricing
3. **orders** - Customer orders with full tracking
4. **order_items** - Individual items within orders
5. **payments** - Stripe payment records
6. **runner_profiles** - Runner capacity and ratings
7. **tailor_profiles** - Tailor specializations and capacity
8. **messages** - Order-related messaging
9. **reviews** - Customer reviews and ratings

### Services Pre-loaded (23 services)

#### Trousers (4 services)
- Trouser Hemming - £14
- Trouser Waist Adjustment - £18
- Trouser Tapering - £22
- Zip Replacement (Trousers) - £16

#### Shirts (4 services)
- Shirt Sleeve Shortening - £14
- Shirt Darting - £18
- Button Replacement - £8
- Shirt Collar Repair - £14

#### Dresses (4 services)
- Dress Hemming - £18
- Dress Taking In - £25
- Zip Replacement (Dress) - £18
- Dress Strap Adjustment - £12

#### Suits (4 services)
- Suit Jacket Sleeve Shortening - £18
- Suit Jacket Taking In - £28
- Suit Trouser Package - £28
- Full Suit Alteration - £55

#### Coats (4 services)
- Coat Sleeve Shortening - £22
- Coat Hemming - £25
- Coat Lining Repair - £35
- Coat Zip Replacement - £22

#### Other (3 services)
- Basic Repair - £12
- Patch Application - £15
- Custom Alteration - Quote required

### Security Features

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Role-based policies** for customers, runners, tailors, admins
✅ **Automatic timestamp** updates
✅ **Order number generation** (format: TS250129XXXX)
✅ **Data validation** at database level

### Indexes Created

- User role and email lookups
- Service category and status
- Order customer, runner, tailor relationships
- Order status tracking
- Payment lookups
- Message threading

### Triggers Configured

- `update_updated_at` - Auto-update timestamps on all tables
- `generate_order_number` - Auto-generate unique order numbers

## 🚀 Next Steps

### 1. Run the Schema

```bash
# In Supabase SQL Editor
1. Copy /supabase/schema.sql
2. Paste into SQL Editor
3. Run the query
4. Verify success message
```

### 2. Create Your First Admin

```bash
# Start the app
npm install
npm run dev

# Sign up at http://localhost:3000/signup
# Then in Supabase, run:
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 3. Create Test Users

See `/supabase/useful-queries.sql` for helpful queries to:
- Create runner profiles
- Create tailor profiles
- Manage orders
- View analytics

## 📊 Database Schema Diagram

```
users (auth & profiles)
  ├── runner_profiles (1:1)
  ├── tailor_profiles (1:1)
  └── orders (1:many)
        ├── order_items (1:many)
        │     └── services (many:1)
        ├── payments (1:many)
        ├── messages (1:many)
        └── reviews (1:1)
```

## 🔐 RLS Policies Overview

### Customers can:
- ✅ View their own profile
- ✅ View active services
- ✅ Create and view their own orders
- ✅ View their payments
- ✅ Create reviews for their orders

### Runners can:
- ✅ View their profile
- ✅ View available and assigned orders
- ✅ Update orders they're assigned to
- ✅ Accept unassigned jobs

### Tailors can:
- ✅ View their profile
- ✅ View orders assigned to them
- ✅ Update order items they're working on

### Admins can:
- ✅ View and manage all users
- ✅ View and manage all orders
- ✅ Manage services
- ✅ Assign runners and tailors

## 💾 Backup & Maintenance

### Regular Backups
Supabase automatically backs up your database. Additional manual backups recommended for:
- User data
- Order history
- Service configurations

### Useful Queries
See `/supabase/useful-queries.sql` for:
- User management
- Runner/Tailor assignment
- Order tracking
- Analytics queries
- Performance monitoring

## 🔧 Troubleshooting

### Schema Issues

**Problem**: "relation already exists"
**Solution**: Tables already exist. Drop them first or skip creation.

**Problem**: "permission denied"
**Solution**: Check RLS policies are correctly configured.

**Problem**: "foreign key violation"
**Solution**: Ensure parent records exist before creating child records.

### Performance Issues

**Problem**: Slow queries
**Solution**: Indexes are pre-configured. Monitor with Supabase Performance tab.

**Problem**: Connection errors
**Solution**: Check connection pooling in Supabase project settings.

## 📝 Schema Version

- **Version**: 1.0.0
- **Created**: 2024
- **Last Updated**: 2024
- **Tables**: 9
- **Indexes**: 14
- **Triggers**: 8
- **RLS Policies**: 25+

## 🎯 Database Best Practices

1. **Never expose service role key** - Keep it server-side only
2. **Use RLS policies** - Don't bypass them in production
3. **Monitor query performance** - Use Supabase dashboard
4. **Regular backups** - Download manual backups monthly
5. **Audit logs** - Enable in Supabase for production
6. **Connection pooling** - Enable for high traffic

## 📚 Additional Resources

- `/supabase/schema.sql` - Full database schema
- `/supabase/useful-queries.sql` - Helpful SQL queries
- `/SETUP_GUIDE.md` - Complete setup instructions
- `/QUICK_START.md` - 5-minute quickstart guide

## ✅ Verification Checklist

Before going to production, verify:

- [ ] All 9 tables created successfully
- [ ] 23 services loaded in services table
- [ ] RLS enabled on all tables
- [ ] Indexes created properly
- [ ] Triggers functioning correctly
- [ ] Order number generation working
- [ ] Admin user created and role assigned
- [ ] Test order created successfully
- [ ] Stripe webhook configured
- [ ] Payment flow tested

## 🎉 Ready to Launch!

Your database is production-ready with:
- ✅ Proper security (RLS)
- ✅ Performance optimization (indexes)
- ✅ Data integrity (constraints)
- ✅ Automatic auditing (timestamps)
- ✅ Scalable schema design

**You're all set to start building your clothing alterations marketplace!**

---

Need help? Check the troubleshooting section or review the useful queries file.
