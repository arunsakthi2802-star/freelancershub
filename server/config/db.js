const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const dns = require('dns');
require('colors');

// On Windows or restricted local network configs, Node's DNS resolver may default to 127.0.0.1
// which fails SRV lookups for MongoDB Atlas clusters. Ensure valid DNS servers are configured.
try {
  const currentServers = dns.getServers();
  if (currentServers.length === 1 && currentServers[0] === '127.0.0.1') {
    dns.setServers(['10.189.232.193', '8.8.8.8', '1.1.1.1']);
  }
} catch (e) {
  // Ignore if unable to set DNS servers
}

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return mongoose.connection;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is not defined in environment variables!'.red.bold);
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });

    isConnected = true;
    console.log(`\n🍃 MongoDB Atlas Connected: ${conn.connection.host}`.cyan.bold);
    console.log(`📦 Database: ${conn.connection.name}`.green);

    // Run initial seed if collections are empty
    await seedDatabase(conn.connection.db);

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Atlas Connection Error: ${error.message}`.red.bold);
    // If SRV lookup failed, try DNS server override and retry once
    if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
      try {
        console.log('🔄 Retrying Atlas connection with DNS fallback...'.yellow);
        dns.setServers(['10.189.232.193', '8.8.8.8', '1.1.1.1']);
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 15000,
        });
        isConnected = true;
        console.log(`🍃 MongoDB Atlas Connected (Fallback): ${conn.connection.host}`.cyan.bold);
        await seedDatabase(conn.connection.db);
        return conn;
      } catch (retryErr) {
        console.error(`❌ MongoDB Atlas Retry Failed: ${retryErr.message}`.red.bold);
      }
    }
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('⚠️ MongoDB Atlas disconnected.'.yellow);
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('🔄 MongoDB Atlas reconnected.'.green);
});

// Seed default admin, categories, skills, and CMS settings
const seedDatabase = async (dbInstance) => {
  try {
    const db = dbInstance || mongoose.connection.db;
    if (!db) return;

    // 1. Seed Admin User
    const usersCol = db.collection('users');
    const existingAdmin = await usersCol.findOne({ email: 'admin@freelancehub.com' });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123', 12);
      await usersCol.insertOne({
        id: '00000000-0000-0000-0000-000000000000',
        full_name: 'System Administrator',
        email: 'admin@freelancehub.com',
        password_hash: passwordHash,
        role: 'admin',
        is_email_verified: true,
        is_active: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('👑 Admin user initialized (admin@freelancehub.com / admin123)'.green);
    }

    const existingClient = await usersCol.findOne({ email: 'client@freelancehub.com' });
    if (!existingClient) {
      const passwordHash = await bcrypt.hash('password123', 12);
      await usersCol.insertOne({
        id: '11111111-1111-1111-1111-111111111111',
        full_name: 'Acme Corp (Client)',
        email: 'client@freelancehub.com',
        password_hash: passwordHash,
        role: 'client',
        company_name: 'Acme Corporation',
        company_website: 'https://acme.example.com',
        is_email_verified: true,
        is_active: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('🏢 Demo Client initialized (client@freelancehub.com / password123)'.green);
    }

    const existingFreelancer = await usersCol.findOne({ email: 'freelancer@freelancehub.com' });
    if (!existingFreelancer) {
      const passwordHash = await bcrypt.hash('password123', 12);
      await usersCol.insertOne({
        id: '22222222-2222-2222-2222-222222222222',
        full_name: 'Alex Rivera (Freelancer)',
        email: 'freelancer@freelancehub.com',
        password_hash: passwordHash,
        role: 'freelancer',
        title: 'Senior Full Stack Developer',
        hourly_rate: 65,
        skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
        is_email_verified: true,
        is_active: true,
        is_banned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('💻 Demo Freelancer initialized (freelancer@freelancehub.com / password123)'.green);
    }

    // 2. Seed Categories
    const categoriesCol = db.collection('categories');
    const categoryCount = await categoriesCol.countDocuments();
    if (categoryCount === 0) {
      const categories = [
        { id: '1', name: 'Web Development', icon: 'code', project_count: 0, created_at: new Date().toISOString() },
        { id: '2', name: 'Mobile Apps', icon: 'smartphone', project_count: 0, created_at: new Date().toISOString() },
        { id: '3', name: 'Design & Creative', icon: 'palette', project_count: 0, created_at: new Date().toISOString() },
        { id: '4', name: 'Writing & Translation', icon: 'edit', project_count: 0, created_at: new Date().toISOString() },
        { id: '5', name: 'Marketing & Sales', icon: 'trending-up', project_count: 0, created_at: new Date().toISOString() }
      ];
      await categoriesCol.insertMany(categories);
      console.log('📁 Default marketplace categories seeded'.green);
    }

    // 3. Seed Skills
    const skillsCol = db.collection('skills');
    const skillCount = await skillsCol.countDocuments();
    if (skillCount === 0) {
      const skills = [
        'React', 'Node.js', 'JavaScript', 'Python', 'UI/UX Design', 'TypeScript',
        'MongoDB', 'Express', 'Tailwind CSS', 'Next.js', 'Flutter', 'Graphic Design'
      ].map((sk, idx) => ({
        id: String(idx + 1),
        name: sk,
        created_at: new Date().toISOString()
      }));
      await skillsCol.insertMany(skills);
      console.log('⚡ Default marketplace skills seeded'.green);
    }
  } catch (err) {
    console.error('⚠️ Database seeding notice:', err.message);
  }
};

/**
 * MongoDB Query Builder
 * Provides fluent interface executing queries directly on MongoDB Atlas
 */
class MongoQueryBuilder {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.mongoFilter = {};
    this.sortObj = {};
    this.limitVal = null;
    this.skipVal = 0;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.isHead = false;
    this.selectedFields = null;
  }

  select(fields, options = {}) {
    if (options.head) {
      this.isHead = true;
    }
    return this;
  }

  eq(col, val) {
    let mongoField = col;
    if (col === 'id') {
      this.mongoFilter.$or = [{ id: String(val) }, { _id: String(val) }];
      return this;
    }
    if (col.includes('->>')) {
      const [parent, child] = col.split('->>');
      mongoField = `${parent}.${child}`;
    }
    this.mongoFilter[mongoField] = val;
    return this;
  }

  neq(col, val) {
    let mongoField = col;
    if (col === 'id') {
      this.mongoFilter.id = { $ne: String(val) };
      return this;
    }
    this.mongoFilter[mongoField] = { $ne: val };
    return this;
  }

  gt(col, val) {
    let mongoField = col;
    if (col.includes('->>')) {
      const [parent, child] = col.split('->>');
      mongoField = `${parent}.${child}`;
    }
    const parsed = isNaN(val) ? new Date(val) : parseFloat(val);
    this.mongoFilter[mongoField] = { $gt: parsed };
    return this;
  }

  gte(col, val) {
    let mongoField = col;
    if (col.includes('->>')) {
      const [parent, child] = col.split('->>');
      mongoField = `${parent}.${child}`;
    }
    const parsed = isNaN(val) ? new Date(val) : parseFloat(val);
    this.mongoFilter[mongoField] = { $gte: parsed };
    return this;
  }

  lte(col, val) {
    let mongoField = col;
    if (col.includes('->>')) {
      const [parent, child] = col.split('->>');
      mongoField = `${parent}.${child}`;
    }
    const parsed = isNaN(val) ? new Date(val) : parseFloat(val);
    this.mongoFilter[mongoField] = { $lte: parsed };
    return this;
  }

  overlaps(col, array) {
    if (Array.isArray(array)) {
      this.mongoFilter[col] = { $in: array };
    }
    return this;
  }

  or(expr) {
    const clauses = expr.split(',').map((part) => {
      const subparts = part.split('.');
      const colName = subparts[0];
      const op = subparts[1];
      const matchVal = subparts.slice(2).join('.');

      if (op === 'eq') {
        return { [colName]: matchVal };
      }
      if (op === 'ilike') {
        const cleanVal = matchVal.replace(/%/g, '');
        return { [colName]: { $regex: cleanVal, $options: 'i' } };
      }
      if (op === 'cs') {
        const cleanVal = matchVal.replace(/[{""}]/g, '');
        return { [colName]: cleanVal };
      }
      return { [colName]: matchVal };
    });

    if (this.mongoFilter.$or) {
      this.mongoFilter.$and = [{ $or: this.mongoFilter.$or }, { $or: clauses }];
      delete this.mongoFilter.$or;
    } else {
      this.mongoFilter.$or = clauses;
    }
    return this;
  }

  order(col, options = {}) {
    const isAsc = options.ascending !== false;
    let field = col;
    if (col === 'created_at' || col === 'createdAt') field = 'created_at';
    this.sortObj[field] = isAsc ? 1 : -1;
    return this;
  }

  limit(val) {
    this.limitVal = parseInt(val, 10);
    return this;
  }

  range(start, end) {
    this.skipVal = parseInt(start, 10);
    this.limitVal = parseInt(end, 10) - parseInt(start, 10) + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async getCollection() {
    if (!mongoose.connection.db) {
      await connectDB();
    }
    return mongoose.connection.db.collection(this.collectionName);
  }

  insert(records) {
    const dataList = Array.isArray(records) ? records : [records];
    const created = dataList.map((r) => ({
      id: r.id || crypto.randomUUID(),
      created_at: r.created_at || new Date().toISOString(),
      updated_at: r.updated_at || new Date().toISOString(),
      ...r
    }));

    const executeInsert = async () => {
      const col = await this.getCollection();
      if (created.length === 1) {
        await col.insertOne(created[0]);
      } else {
        await col.insertMany(created);
      }
      return { data: Array.isArray(records) ? created : created[0], error: null };
    };

    return {
      select: () => ({
        single: async () => {
          const res = await executeInsert();
          return { data: Array.isArray(records) ? res.data[0] : res.data, error: null };
        },
        maybeSingle: async () => {
          const res = await executeInsert();
          return { data: Array.isArray(records) ? res.data[0] : res.data, error: null };
        },
        then: (resolve, reject) => executeInsert().then(resolve, reject)
      }),
      then: (resolve, reject) => executeInsert().then(resolve, reject)
    };
  }

  update(updates) {
    const executeUpdate = async () => {
      const col = await this.getCollection();
      const payload = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      await col.updateMany(this.mongoFilter, { $set: payload });
      const updatedDocs = await col.find(this.mongoFilter).toArray();
      return { data: updatedDocs, error: null };
    };

    return {
      eq: (col, val) => {
        this.eq(col, val);
        return this.update(updates);
      },
      select: () => ({
        single: async () => {
          const res = await executeUpdate();
          return { data: res.data[0] || null, error: null };
        },
        maybeSingle: async () => {
          const res = await executeUpdate();
          return { data: res.data[0] || null, error: null };
        },
        then: (resolve, reject) => executeUpdate().then(resolve, reject)
      }),
      then: (resolve, reject) => executeUpdate().then(resolve, reject)
    };
  }

  delete() {
    const executeDelete = async () => {
      const col = await this.getCollection();
      const docsToDelete = await col.find(this.mongoFilter).toArray();
      await col.deleteMany(this.mongoFilter);
      return { data: docsToDelete, error: null };
    };

    return {
      eq: (col, val) => {
        this.eq(col, val);
        return this.delete();
      },
      select: () => ({
        single: async () => {
          const res = await executeDelete();
          return { data: res.data[0] || null, error: null };
        },
        then: (resolve, reject) => executeDelete().then(resolve, reject)
      }),
      then: (resolve, reject) => executeDelete().then(resolve, reject)
    };
  }

  // Populate related foreign documents (emulating relational joins)
  async populateRelations(docs, db) {
    if (!docs || docs.length === 0) return docs;
    const usersCol = db.collection('users');
    const projectsCol = db.collection('projects');

    return Promise.all(
      docs.map(async (doc) => {
        const item = { ...doc };

        // Ensure id property is always present
        if (!item.id && item._id) {
          item.id = String(item._id);
        }

        if (item.client_id) {
          item.client = (await usersCol.findOne({ $or: [{ id: item.client_id }, { _id: item.client_id }] })) || null;
        }
        if (item.assigned_freelancer_id) {
          item.assignedFreelancer = (await usersCol.findOne({ $or: [{ id: item.assigned_freelancer_id }, { _id: item.assigned_freelancer_id }] })) || null;
        }
        if (item.freelancer_id) {
          item.freelancer = (await usersCol.findOne({ $or: [{ id: item.freelancer_id }, { _id: item.freelancer_id }] })) || null;
        }
        if (item.project_id) {
          item.project = (await projectsCol.findOne({ $or: [{ id: item.project_id }, { _id: item.project_id }] })) || null;
          if (item.project && item.project.client_id) {
            item.project.client = (await usersCol.findOne({ $or: [{ id: item.project.client_id }, { _id: item.project.client_id }] })) || null;
          }
        }
        if (item.reviewer_id) {
          item.reviewer = (await usersCol.findOne({ $or: [{ id: item.reviewer_id }, { _id: item.reviewer_id }] })) || null;
        }
        if (item.reviewee_id) {
          item.reviewee = (await usersCol.findOne({ $or: [{ id: item.reviewee_id }, { _id: item.reviewee_id }] })) || null;
        }
        if (item.author_id) {
          item.author = (await usersCol.findOne({ $or: [{ id: item.author_id }, { _id: item.author_id }] })) || null;
        }

        return item;
      })
    );
  }

  async then(resolve, reject) {
    try {
      const col = await this.getCollection();
      const db = mongoose.connection.db;

      // Count exact matches
      const totalCount = await col.countDocuments(this.mongoFilter);

      if (this.isHead) {
        return resolve({ data: [], count: totalCount, error: null });
      }

      let cursor = col.find(this.mongoFilter);

      if (Object.keys(this.sortObj).length > 0) {
        cursor = cursor.sort(this.sortObj);
      }

      if (this.skipVal > 0) {
        cursor = cursor.skip(this.skipVal);
      }

      if (this.limitVal !== null && this.limitVal > 0) {
        cursor = cursor.limit(this.limitVal);
      }

      let docs = await cursor.toArray();
      docs = await this.populateRelations(docs, db);

      if (this.isSingle) {
        if (!docs || docs.length === 0) {
          return resolve({ data: null, count: 0, error: { message: 'Document not found', code: 'PGRST116' } });
        }
        return resolve({ data: docs[0], count: totalCount, error: null });
      }

      if (this.isMaybeSingle) {
        return resolve({ data: docs[0] || null, count: totalCount, error: null });
      }

      return resolve({ data: docs, count: totalCount, error: null });
    } catch (err) {
      console.error('MongoQueryBuilder execution error:', err);
      reject(err);
    }
  }
}

class MongoDbClient {
  from(collectionName) {
    return new MongoQueryBuilder(collectionName);
  }

  async rpc(fn, params) {
    const db = mongoose.connection.db;
    if (!db) await connectDB();

    if (fn === 'get_project_stats_by_category') {
      const projectsCol = mongoose.connection.db.collection('projects');
      const stats = await projectsCol.aggregate([
        { $match: { is_active: { $ne: false } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      return { data: stats, error: null };
    }
    return { data: null, error: { message: `RPC ${fn} not implemented` } };
  }
}

const db = new MongoDbClient();

// Map database snake_case fields back to original Mongoose camelCase format
const mapUser = (user) => {
  if (!user) return null;
  return {
    ...user,
    _id: user.id || String(user._id),
    name: user.full_name,
    avatar: user.profile_image,
    companyName: user.company_name,
    companySize: user.company_size,
    companyWebsite: user.company_website,
    companyDescription: user.company_description,
    hourlyRate: user.hourly_rate ? parseFloat(user.hourly_rate) : undefined,
    rating: {
      average: user.rating_average ? parseFloat(user.rating_average) : 0,
      count: user.rating_count || 0
    },
    totalEarnings: user.total_earnings ? parseFloat(user.total_earnings) : 0,
    totalSpent: user.total_spent ? parseFloat(user.total_spent) : 0,
    completedProjects: user.completed_projects || 0,
    activeProjects: user.active_projects || 0,
    isEmailVerified: user.is_email_verified,
    isActive: user.is_active,
    isBanned: user.is_banned,
    emailVerificationToken: user.email_verification_token,
    emailVerificationExpire: user.email_verification_expire,
    resetPasswordToken: user.reset_password_token,
    resetPasswordExpire: user.reset_password_expire,
    notificationSettings: user.notification_settings,
    lastSeen: user.last_seen,
    isOnline: user.is_online
  };
};

// Map camelCase fields back to database snake_case format
const mapUserToDb = (fields) => {
  const dbFields = {};
  if (fields.name !== undefined) dbFields.full_name = fields.name;
  if (fields.email !== undefined) dbFields.email = fields.email;
  if (fields.password !== undefined) dbFields.password_hash = fields.password;
  if (fields.role !== undefined) dbFields.role = fields.role;
  if (fields.phone !== undefined) dbFields.phone = fields.phone;
  if (fields.avatar !== undefined) dbFields.profile_image = fields.avatar;
  if (fields.bio !== undefined) dbFields.bio = fields.bio;
  if (fields.skills !== undefined) dbFields.skills = fields.skills;
  if (fields.experience !== undefined) dbFields.experience = fields.experience;
  if (fields.education !== undefined) dbFields.education = fields.education;
  if (fields.portfolio !== undefined) dbFields.portfolio = fields.portfolio;
  if (fields.resume !== undefined) dbFields.resume = fields.resume;
  if (fields.companyName !== undefined) dbFields.company_name = fields.companyName;
  if (fields.companySize !== undefined) dbFields.company_size = fields.companySize;
  if (fields.industry !== undefined) dbFields.industry = fields.industry;
  if (fields.companyWebsite !== undefined) dbFields.company_website = fields.companyWebsite;
  if (fields.companyDescription !== undefined) dbFields.company_description = fields.companyDescription;
  if (fields.hourlyRate !== undefined) dbFields.hourly_rate = fields.hourlyRate;
  if (fields.availability !== undefined) dbFields.availability = fields.availability;
  if (fields.isEmailVerified !== undefined) dbFields.is_email_verified = fields.isEmailVerified;
  if (fields.isActive !== undefined) dbFields.is_active = fields.isActive;
  if (fields.isBanned !== undefined) dbFields.is_banned = fields.isBanned;
  if (fields.emailVerificationToken !== undefined) dbFields.email_verification_token = fields.emailVerificationToken;
  if (fields.emailVerificationExpire !== undefined) dbFields.email_verification_expire = fields.emailVerificationExpire;
  if (fields.resetPasswordToken !== undefined) dbFields.reset_password_token = fields.resetPasswordToken;
  if (fields.resetPasswordExpire !== undefined) dbFields.reset_password_expire = fields.resetPasswordExpire;
  if (fields.notificationSettings !== undefined) dbFields.notification_settings = fields.notificationSettings;
  if (fields.lastSeen !== undefined) dbFields.last_seen = fields.lastSeen;
  if (fields.isOnline !== undefined) dbFields.is_online = fields.isOnline;
  return dbFields;
};

module.exports = {
  connectDB,
  db,
  supabase: db, // alias for backwards compatibility
  mapUser,
  mapUserToDb,
  mongoose
};
