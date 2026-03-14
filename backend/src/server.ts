import dotenv from 'dotenv';
// Load environment variables FIRST before anything else
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';
// Import sequelize from TypeScript file
import sequelize from './config/database';

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

const getAllowedOrigins = () => {
  const configuredOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configuredOrigins.length === 0) {
    return DEFAULT_DEV_ORIGINS;
  }

  if (process.env.NODE_ENV !== 'production') {
    return [...new Set([...configuredOrigins, ...DEFAULT_DEV_ORIGINS])];
  }

  return configuredOrigins;
};

// Security middleware - configure Helmet to allow iframe embedding for static files
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  frameguard: false, // Disable frameguard globally, we'll set it per route
  contentSecurityPolicy: false, // Disable CSP globally, we'll set it per route
}));

// Re-enable frameguard for non-static routes only
app.use((req, res, next) => {
  // Only apply frameguard to non-static routes
  if (!req.path.startsWith('/uploads')) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  }
  next();
});
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = getAllowedOrigins();
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
});
app.use('/api/', limiter);

// Auth-specific rate limiter: 30 login attempts per 5 minutes
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: { error: 'Too many login attempts. Please try again later.' },
});
app.use('/api/v1/auth/login', authLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files (attachments) with CORS headers
// IMPORTANT: This must come BEFORE Helmet's frameguard middleware
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for static files
  const origin = req.headers.origin;
  const allowed = getAllowedOrigins();
  const matchedOrigin = origin && allowed.includes(origin) ? origin : null;
  if (matchedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', matchedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  // CRITICAL: Remove X-Frame-Options to allow iframe embedding
  res.removeHeader('X-Frame-Options');
  // Set permissive CSP for iframe embedding
  const cspOrigins = allowed.join(' ');
  res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${cspOrigins}`);
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // Set proper content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const cspOrigins = getAllowedOrigins().join(' ');
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      // CRITICAL: Remove X-Frame-Options to allow PDF embedding in iframes
      res.removeHeader('X-Frame-Options');
      // Set permissive CSP
      res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${cspOrigins}`);
    } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      res.setHeader('Content-Type', `image/${ext.slice(1)}`);
      res.removeHeader('X-Frame-Options');
    } else if (['.doc', '.docx'].includes(ext)) {
      res.removeHeader('X-Frame-Options');
      res.setHeader('Content-Security-Policy', `frame-ancestors 'self' ${cspOrigins}`);
    }
  },
}));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes will be added after models are loaded

// Error handling
app.use(errorHandler);

// Serve frontend static files in production
// This must be AFTER API routes are set up (they are added dynamically in startServer)
// We add a fallback handler after all other routes
const serveFrontend = () => {
  const frontendPath = path.join(__dirname, '../public');
  const fs = require('fs');
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    // SPA fallback - serve index.html for all non-API, non-file routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads') && !req.path.startsWith('/api-docs')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
      }
    });
    console.log('Frontend static files served from /public');
  }
};

// Database connection and server start
const startServer = async () => {
  try {
    // First, authenticate the database connection
    // This ensures the Sequelize instance is fully ready
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // CRITICAL: Import models BEFORE routes
    // Routes import controllers, which import models
    // Models must be loaded after sequelize.authenticate() but before routes
    await import('./models');
    console.log('Models loaded successfully.');

    // Now import routes - controllers can safely use models now
    const routes = (await import('./routes')).default;
    app.use('/api/v1', routes);
    console.log('Routes loaded successfully.');

    // Serve frontend after API routes are registered
    serveFrontend();

    // Sync models - create tables if they don't exist
    {
      await sequelize.sync({ alter: false });
      console.log('Database models synchronized.');

      // Ensure new columns exist (SQLite ALTER TABLE fallback)
      const qi = sequelize.getQueryInterface();
      const corrCols = await qi.describeTable('correspondences');
      if (!corrCols['storage_location']) {
        await sequelize.query('ALTER TABLE correspondences ADD COLUMN storage_location VARCHAR(255)');
        console.log('  - Added storage_location column to correspondences.');
      }
      if (!corrCols['correspondence_number']) {
        await sequelize.query('ALTER TABLE correspondences ADD COLUMN correspondence_number VARCHAR(100)');
        console.log('  - Added correspondence_number column to correspondences.');
      }
      if (!corrCols['specialized_branch']) {
        await sequelize.query('ALTER TABLE correspondences ADD COLUMN specialized_branch VARCHAR(255)');
        console.log('  - Added specialized_branch column to correspondences.');
      }
      if (!corrCols['responsible_person']) {
        await sequelize.query('ALTER TABLE correspondences ADD COLUMN responsible_person VARCHAR(255)');
        console.log('  - Added responsible_person column to correspondences.');
      }
      if (!corrCols['correspondence_method']) {
        await sequelize.query('ALTER TABLE correspondences ADD COLUMN correspondence_method VARCHAR(50)');
        console.log('  - Added correspondence_method column to correspondences.');
      }

      // Auto-seed initial data if database is empty
      const { Role, Permission, RolePermission, User, Entity } = await import('./models');
      const roleCount = await Role.count();
      if (roleCount === 0) {
        console.log('Empty database detected. Seeding initial data...');
        const bcrypt = await import('bcryptjs');

        // 1. Seed Roles
        const roles = await Role.bulkCreate([
          { name: 'admin', name_ar: 'مدير', description: 'Full system administrator', description_ar: 'مدير النظام الكامل' },
          { name: 'reviewer', name_ar: 'مراجع', description: 'Can review and approve correspondences', description_ar: 'يمكنه مراجعة والموافقة على المكاتبات' },
          { name: 'employee', name_ar: 'موظف', description: 'Can create and manage correspondences', description_ar: 'يمكنه إنشاء وإدارة المكاتبات' },
          { name: 'viewer', name_ar: 'مشاهد', description: 'Read-only access', description_ar: 'صلاحية القراءة فقط' },
        ] as any[]);
        const roleMap: Record<string, number> = {};
        roles.forEach((r: any) => { roleMap[r.name] = r.id; });
        console.log('  - Roles seeded.');

        // 2. Seed Permissions
        const permData = [
          { name: 'correspondence:create', name_ar: 'إنشاء مكاتبة', resource: 'correspondence', action: 'create' },
          { name: 'correspondence:read', name_ar: 'قراءة مكاتبة', resource: 'correspondence', action: 'read' },
          { name: 'correspondence:update', name_ar: 'تعديل مكاتبة', resource: 'correspondence', action: 'update' },
          { name: 'correspondence:delete', name_ar: 'حذف مكاتبة', resource: 'correspondence', action: 'delete' },
          { name: 'correspondence:review', name_ar: 'مراجعة مكاتبة', resource: 'correspondence', action: 'review' },
          { name: 'user:create', name_ar: 'إنشاء مستخدم', resource: 'user', action: 'create' },
          { name: 'user:read', name_ar: 'قراءة مستخدم', resource: 'user', action: 'read' },
          { name: 'user:update', name_ar: 'تعديل مستخدم', resource: 'user', action: 'update' },
          { name: 'user:delete', name_ar: 'حذف مستخدم', resource: 'user', action: 'delete' },
          { name: 'entity:create', name_ar: 'إنشاء جهة', resource: 'entity', action: 'create' },
          { name: 'entity:read', name_ar: 'قراءة جهة', resource: 'entity', action: 'read' },
          { name: 'entity:update', name_ar: 'تعديل جهة', resource: 'entity', action: 'update' },
          { name: 'entity:delete', name_ar: 'حذف جهة', resource: 'entity', action: 'delete' },
          { name: 'report:read', name_ar: 'قراءة التقارير', resource: 'report', action: 'read' },
        ];
        const perms = await Permission.bulkCreate(permData as any[]);
        const permMap: Record<string, number> = {};
        perms.forEach((p: any) => { permMap[p.name] = p.id; });
        console.log('  - Permissions seeded.');

        // 3. Seed Role-Permissions
        const rpData: { role_id: number; permission_id: number }[] = [
          // Admin gets all permissions
          ...perms.map((p: any) => ({ role_id: roleMap['admin'], permission_id: p.id })),
          // Reviewer
          { role_id: roleMap['reviewer'], permission_id: permMap['correspondence:read'] },
          { role_id: roleMap['reviewer'], permission_id: permMap['correspondence:review'] },
          { role_id: roleMap['reviewer'], permission_id: permMap['report:read'] },
          { role_id: roleMap['reviewer'], permission_id: permMap['entity:read'] },
          // Employee
          { role_id: roleMap['employee'], permission_id: permMap['correspondence:create'] },
          { role_id: roleMap['employee'], permission_id: permMap['correspondence:read'] },
          { role_id: roleMap['employee'], permission_id: permMap['correspondence:update'] },
          { role_id: roleMap['employee'], permission_id: permMap['entity:read'] },
          // Viewer
          { role_id: roleMap['viewer'], permission_id: permMap['correspondence:read'] },
          { role_id: roleMap['viewer'], permission_id: permMap['entity:read'] },
        ];
        await RolePermission.bulkCreate(rpData as any[]);
        console.log('  - Role-Permissions seeded.');

        // 4. Seed Users
        const passwordHash = await bcrypt.hash('admin123', 10);
        await User.bulkCreate([
          { username: 'admin', email: 'admin@example.com', password_hash: passwordHash, full_name_ar: 'مدير النظام', role_id: roleMap['admin'], is_active: true },
          { username: 'reviewer1', email: 'reviewer@example.com', password_hash: passwordHash, full_name_ar: 'مراجع أول', role_id: roleMap['reviewer'], is_active: true },
          { username: 'employee1', email: 'employee@example.com', password_hash: passwordHash, full_name_ar: 'موظف أول', role_id: roleMap['employee'], is_active: true },
        ] as any[]);
        console.log('  - Users seeded.');

        // 5. Seed Entities - Egyptian Armed Forces
        await Entity.bulkCreate([
          // قيادة عامة
          { name_ar: 'القوات المسلحة المصرية', type: 'قيادة_عامة', is_active: true },
          { name_ar: 'القيادة العامة للقوات المسلحة', type: 'قيادة_عامة', is_active: true },
          { name_ar: 'وزير الدفاع والإنتاج الحربي', type: 'قيادة_عامة', is_active: true },
          { name_ar: 'رئيس أركان حرب القوات المسلحة', type: 'قيادة_عامة', is_active: true },
          // فرع رئيسي
          { name_ar: 'القوات البرية المصرية', type: 'فرع_رئيسي', is_active: true },
          { name_ar: 'القوات الجوية المصرية', type: 'فرع_رئيسي', is_active: true },
          { name_ar: 'القوات البحرية المصرية', type: 'فرع_رئيسي', is_active: true },
          { name_ar: 'قوات الدفاع الجوي المصرية', type: 'فرع_رئيسي', is_active: true },
          // قيادة استراتيجية
          { name_ar: 'قيادة الجيش الثاني الميداني', type: 'قيادة_استراتيجية', is_active: true },
          { name_ar: 'قيادة الجيش الثالث الميداني', type: 'قيادة_استراتيجية', is_active: true },
          { name_ar: 'المنطقة المركزية العسكرية', type: 'قيادة_استراتيجية', is_active: true },
          { name_ar: 'المنطقة الشمالية العسكرية', type: 'قيادة_استراتيجية', is_active: true },
          { name_ar: 'المنطقة الغربية العسكرية', type: 'قيادة_استراتيجية', is_active: true },
          { name_ar: 'المنطقة الجنوبية العسكرية', type: 'قيادة_استراتيجية', is_active: true },
          // هيئة رئيسية
          { name_ar: 'هيئة العمليات', type: 'هيئة_رئيسية', is_active: true },
          { name_ar: 'هيئة التدريب', type: 'هيئة_رئيسية', is_active: true },
          { name_ar: 'هيئة الإمداد والتموين', type: 'هيئة_رئيسية', is_active: true },
          { name_ar: 'هيئة التسليح', type: 'هيئة_رئيسية', is_active: true },
          { name_ar: 'هيئة التنظيم والإدارة', type: 'هيئة_رئيسية', is_active: true },
          { name_ar: 'هيئة الشئون المالية', type: 'هيئة_رئيسية', is_active: true },
          { name_ar: 'هيئة القضاء العسكري', type: 'هيئة_رئيسية', is_active: true },
          { name_ar: 'هيئة التفتيش', type: 'هيئة_رئيسية', is_active: true },
          { name_ar: 'هيئة البحوث العسكرية', type: 'هيئة_رئيسية', is_active: true },
          { name_ar: 'هيئة التعليم العسكري', type: 'هيئة_رئيسية', is_active: true },
          // إدارة رئيسية
          { name_ar: 'إدارة المخابرات الحربية والاستطلاع', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة الشئون المعنوية', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة الشرطة العسكرية', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة المهندسين العسكريين', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة الإشارة', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة الأسلحة والذخيرة', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة المركبات', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة المشاة', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة المدرعات', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة المدفعية', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة الحرب الكيماوية', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة الحرب الإلكترونية', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة المساحة العسكرية', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة الخدمات الطبية للقوات المسلحة', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة الوقود', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة النقل', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة المياه', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة الأشغال العسكرية', type: 'إدارة_رئيسية', is_active: true },
          { name_ar: 'إدارة الدفاع الشعبي والعسكري', type: 'إدارة_رئيسية', is_active: true },
          // جهة تابعة
          { name_ar: 'جهاز مشروعات الخدمة الوطنية', type: 'جهة_تابعة', is_active: true },
          { name_ar: 'الكليات والمعاهد العسكرية', type: 'جهة_تابعة', is_active: true },
          { name_ar: 'الأكاديمية العسكرية المصرية', type: 'جهة_تابعة', is_active: true },
        ] as any[]);
        console.log('  - Entities seeded (46 military entities).');

        console.log('Database seeding completed successfully!');
      }
    }  // end sync block

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

