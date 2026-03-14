import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Correspondence Management System API',
      version: '1.0.0',
      description: 'Official Correspondence & Letters Management System API Documentation',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Correspondence: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            reference_number: { type: 'string' },
            correspondence_number: { type: 'string', nullable: true },
            type: { type: 'string', enum: ['incoming', 'outgoing'] },
            correspondence_method: { type: 'string', enum: ['hand', 'computer'], nullable: true },
            subject: { type: 'string' },
            description: { type: 'string' },
            specialized_branch: { type: 'string', nullable: true },
            responsible_person: { type: 'string', nullable: true },
            sender_entity_id: { type: 'integer' },
            receiver_entity_id: { type: 'integer' },
            correspondence_date: { type: 'string', format: 'date-time' },
            review_status: { type: 'string', enum: ['reviewed', 'not_reviewed'] },
            current_status: { type: 'string', enum: ['draft', 'sent', 'received', 'under_review', 'replied', 'closed'] },
            storage_location: { type: 'string', nullable: true },
            created_by: { type: 'integer' },
            reviewed_by: { type: 'integer', nullable: true },
            reviewed_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Entity: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name_ar: { type: 'string' },
            type: { type: 'string', enum: ['قيادة_عامة', 'فرع_رئيسي', 'قيادة_استراتيجية', 'هيئة_رئيسية', 'إدارة_رئيسية', 'جهة_تابعة'] },
            contact_person: { type: 'string', nullable: true },
            contact_email: { type: 'string', format: 'email', nullable: true },
            contact_phone: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            full_name_ar: { type: 'string' },
            role_id: { type: 'integer' },
            is_active: { type: 'boolean' },
            last_login: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Attachment: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            correspondence_id: { type: 'integer' },
            file_name: { type: 'string' },
            original_name: { type: 'string' },
            file_path: { type: 'string' },
            file_size: { type: 'integer' },
            mime_type: { type: 'string' },
            uploaded_by: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

