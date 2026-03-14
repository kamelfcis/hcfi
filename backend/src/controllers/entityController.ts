import { Response, NextFunction } from 'express';
import Entity from '../models/Entity';
import { createEntitySchema, updateEntitySchema } from '../validators/entity';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { Op } from 'sequelize';

/**
 * @swagger
 * /api/v1/entities:
 *   get:
 *     summary: Get all entities with filtering and pagination
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [قيادة_عامة, فرع_رئيسي, قيادة_استراتيجية, هيئة_رئيسية, إدارة_رئيسية, جهة_تابعة]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of entities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Entity'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '10', type, is_active, search } = req.query;
    const where: any = {};

    if (type) where.type = type;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    if (search) {
      where[Op.or] = [
        { name_ar: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows } = await Entity.findAndCountAll({
      where,
      limit: parseInt(limit as string),
      offset,
      order: [['name_ar', 'ASC']],
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(count / parseInt(limit as string)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/entities/{id}:
 *   get:
 *     summary: Get entity by ID
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Entity details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Entity'
 *       404:
 *         description: Entity not found
 */
export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entity = await Entity.findByPk(req.params.id);
    if (!entity) {
      throw new AppError('Entity not found', 404);
    }
    res.json(entity);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/entities:
 *   post:
 *     summary: Create a new entity
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name_ar
 *               - type
 *             properties:
 *               name_ar:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [قيادة_عامة, فرع_رئيسي, قيادة_استراتيجية, هيئة_رئيسية, إدارة_رئيسية, جهة_تابعة]
 *               contact_person:
 *                 type: string
 *               contact_email:
 *                 type: string
 *                 format: email
 *               contact_phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entity created successfully
 *       400:
 *         description: Validation error
 */
export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createEntitySchema.parse(req.body);
    const entity = await Entity.create(validated);
    await logAudit(req, 'create', 'entity', entity.id);
    res.status(201).json(entity);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/entities/{id}:
 *   put:
 *     summary: Update an entity
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name_ar:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [قيادة_عامة, فرع_رئيسي, قيادة_استراتيجية, هيئة_رئيسية, إدارة_رئيسية, جهة_تابعة]
 *               contact_person:
 *                 type: string
 *               contact_email:
 *                 type: string
 *                 format: email
 *               contact_phone:
 *                 type: string
 *               address:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Entity updated successfully
 *       404:
 *         description: Entity not found
 */
export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entity = await Entity.findByPk(req.params.id);
    if (!entity) {
      throw new AppError('Entity not found', 404);
    }

    const validated = updateEntitySchema.parse(req.body);
    await entity.update(validated);
    await logAudit(req, 'update', 'entity', entity.id);
    res.json(entity);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/entities/{id}:
 *   delete:
 *     summary: Delete an entity
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Entity deleted successfully
 *       404:
 *         description: Entity not found
 */
export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const entity = await Entity.findByPk(req.params.id);
    if (!entity) {
      throw new AppError('Entity not found', 404);
    }

    await entity.destroy();
    await logAudit(req, 'delete', 'entity', entity.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

