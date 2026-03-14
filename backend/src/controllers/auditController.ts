import { Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { Op } from 'sequelize';

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: Get audit logs with filtering and pagination
 *     tags: [Audit Logs]
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
 *           default: 20
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of audit logs
 */
export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '20',
      action,
      resource,
      user_id,
      start_date,
      end_date,
    } = req.query;

    const where: any = {};

    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (user_id) where.user_id = user_id;

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date as string);
      if (end_date) where.created_at[Op.lte] = new Date(end_date as string);
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'full_name_ar', 'email'],
        },
      ],
      limit: parseInt(limit as string),
      offset,
      order: [['created_at', 'DESC']],
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
 * /api/v1/audit-logs/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit Logs]
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
 *         description: Audit log details
 *       404:
 *         description: Audit log not found
 */
export const getAuditLogById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const auditLog = await AuditLog.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'full_name_ar', 'email'],
        },
      ],
    });

    if (!auditLog) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json(auditLog);
  } catch (error) {
    next(error);
  }
};

