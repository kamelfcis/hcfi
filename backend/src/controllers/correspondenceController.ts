import { Response, NextFunction } from 'express';
import Correspondence from '../models/Correspondence';
import Entity from '../models/Entity';
import User from '../models/User';
import Attachment from '../models/Attachment';
import StatusHistory from '../models/StatusHistory';
import CorrespondenceReply from '../models/CorrespondenceReply';
import { generateReferenceNumber } from '../utils/referenceNumber';
import { createCorrespondenceSchema, updateCorrespondenceSchema, replySchema, statusUpdateSchema } from '../validators/correspondence';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import { Op } from 'sequelize';

/**
 * @swagger
 * /api/v1/correspondences:
 *   get:
 *     summary: Get all correspondences with filtering and pagination
 *     tags: [Correspondences]
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
 *           enum: [incoming, outgoing]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, received, under_review, replied, closed]
 *       - in: query
 *         name: review_status
 *         schema:
 *           type: string
 *           enum: [reviewed, not_reviewed]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sender_entity_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: receiver_entity_id
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
 *         description: List of correspondences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Correspondence'
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
    const {
      page = '1',
      limit = '10',
      type,
      status,
      review_status,
      search,
      sender_entity_id,
      receiver_entity_id,
      start_date,
      end_date,
    } = req.query;

    const where: any = {};

    if (type) where.type = type;
    if (status) where.current_status = status;
    if (review_status) where.review_status = review_status;
    if (sender_entity_id) where.sender_entity_id = sender_entity_id;
    if (receiver_entity_id) where.receiver_entity_id = receiver_entity_id;

    if (search) {
      where[Op.or] = [
        { subject: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { reference_number: { [Op.like]: `%${search}%` } },
      ];
    }

    if (start_date || end_date) {
      where.correspondence_date = {};
      if (start_date) where.correspondence_date[Op.gte] = start_date;
      if (end_date) where.correspondence_date[Op.lte] = end_date;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { count, rows } = await Correspondence.findAndCountAll({
      where,
      include: [
        { model: Entity, as: 'senderEntity' },
        { model: Entity, as: 'receiverEntity' },
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name_ar'] },
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

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id, {
      include: [
        { model: Entity, as: 'senderEntity' },
        { model: Entity, as: 'receiverEntity' },
        { model: User, as: 'creator', attributes: ['id', 'username', 'full_name_ar'] },
        { model: Attachment, as: 'attachments' },
        { model: StatusHistory, as: 'statusHistory', include: [{ model: User, as: 'changedBy', attributes: ['id', 'username', 'full_name_ar'] }] },
        {
          model: CorrespondenceReply,
          as: 'replies',
          include: [{ model: User, as: 'creator', attributes: ['id', 'username', 'full_name_ar'] }],
        },
      ],
    });

    if (!correspondence) {
      throw new AppError('Correspondence not found', 404);
    }

    res.json(correspondence);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/correspondences:
 *   post:
 *     summary: Create a new correspondence
 *     tags: [Correspondences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - subject
 *               - description
 *               - sender_entity_id
 *               - receiver_entity_id
 *               - correspondence_date
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [incoming, outgoing]
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               sender_entity_id:
 *                 type: integer
 *               receiver_entity_id:
 *                 type: integer
 *               correspondence_date:
 *                 type: string
 *                 format: date-time
 *               current_status:
 *                 type: string
 *                 enum: [draft, sent, received, under_review, replied, closed]
 *               storage_location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Correspondence created successfully
 *       400:
 *         description: Validation error
 */
export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createCorrespondenceSchema.parse(req.body);
    const referenceNumber = generateReferenceNumber(validated.type);

    const correspondence = await Correspondence.create({
      ...validated,
      reference_number: referenceNumber,
      created_by: req.user!.id,
      correspondence_date: validated.correspondence_date ? new Date(validated.correspondence_date) : new Date(),
    });

    await StatusHistory.create({
      correspondence_id: correspondence.id,
      old_status: 'none',
      new_status: correspondence.current_status,
      changed_by: req.user!.id,
    });

    await logAudit(req, 'create', 'correspondence', correspondence.id);

    const created = await Correspondence.findByPk(correspondence.id, {
      include: [
        { model: Entity, as: 'senderEntity' },
        { model: Entity, as: 'receiverEntity' },
        { model: User, as: 'creator' },
      ],
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/correspondences/{id}:
 *   put:
 *     summary: Update a correspondence
 *     tags: [Correspondences]
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
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               sender_entity_id:
 *                 type: integer
 *               receiver_entity_id:
 *                 type: integer
 *               correspondence_date:
 *                 type: string
 *                 format: date-time
 *               current_status:
 *                 type: string
 *                 enum: [draft, sent, received, under_review, replied, closed]
 *               review_status:
 *                 type: string
 *                 enum: [reviewed, not_reviewed]
 *               storage_location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Correspondence updated successfully
 *       404:
 *         description: Correspondence not found
 */
export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id);
    if (!correspondence) {
      throw new AppError('Correspondence not found', 404);
    }

    const validated = updateCorrespondenceSchema.parse(req.body);
    const oldStatus = correspondence.current_status;

    await correspondence.update({
      ...validated,
      correspondence_date: validated.correspondence_date ? new Date(validated.correspondence_date) : correspondence.correspondence_date,
    });

    if (validated.current_status && validated.current_status !== oldStatus) {
      await StatusHistory.create({
        correspondence_id: correspondence.id,
        old_status: oldStatus,
        new_status: validated.current_status,
        changed_by: req.user!.id,
      });
    }

    await logAudit(req, 'update', 'correspondence', correspondence.id);

    const updated = await Correspondence.findByPk(correspondence.id, {
      include: [
        { model: Entity, as: 'senderEntity' },
        { model: Entity, as: 'receiverEntity' },
        { model: User, as: 'creator' },
      ],
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/correspondences/{id}:
 *   delete:
 *     summary: Delete a correspondence
 *     tags: [Correspondences]
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
 *         description: Correspondence deleted successfully
 *       404:
 *         description: Correspondence not found
 */
export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id);
    if (!correspondence) {
      throw new AppError('Correspondence not found', 404);
    }

    await correspondence.destroy();
    await logAudit(req, 'delete', 'correspondence', correspondence.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/correspondences/{id}/reply:
 *   post:
 *     summary: Add a reply to a correspondence
 *     tags: [Correspondences]
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
 *             required:
 *               - subject
 *               - body
 *             properties:
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *               parent_reply_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Reply added successfully
 *       404:
 *         description: Correspondence not found
 */
export const addReply = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id);
    if (!correspondence) {
      throw new AppError('Correspondence not found', 404);
    }

    const validated = replySchema.parse(req.body);

    const reply = await CorrespondenceReply.create({
      ...validated,
      correspondence_id: correspondence.id,
      created_by: req.user!.id,
    });

    await correspondence.update({ current_status: 'replied' });

    await StatusHistory.create({
      correspondence_id: correspondence.id,
      old_status: correspondence.current_status,
      new_status: 'replied',
      changed_by: req.user!.id,
      notes: 'Reply added',
    });

    await logAudit(req, 'create', 'reply', reply.id);

    const created = await CorrespondenceReply.findByPk(reply.id, {
      include: [{ model: User, as: 'creator' }],
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/correspondences/{correspondenceId}/reply/{replyId}:
 *   delete:
 *     summary: Delete a reply from a correspondence
 *     tags: [Correspondences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: correspondenceId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Reply deleted successfully
 *       404:
 *         description: Reply not found
 */
export const deleteReply = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { correspondenceId, replyId } = req.params;

    const reply = await CorrespondenceReply.findOne({
      where: {
        id: replyId,
        correspondence_id: correspondenceId,
      },
    });

    if (!reply) {
      throw new AppError('Reply not found', 404);
    }

    await reply.destroy();

    await logAudit(req, 'delete', 'reply', reply.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/correspondences/{id}/status:
 *   patch:
 *     summary: Update correspondence status
 *     tags: [Correspondences]
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, sent, received, under_review, replied, closed]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: Correspondence not found
 */
export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id);
    if (!correspondence) {
      throw new AppError('Correspondence not found', 404);
    }

    const validated = statusUpdateSchema.parse(req.body);
    const oldStatus = correspondence.current_status;

    await correspondence.update({ current_status: validated.status });

    await StatusHistory.create({
      correspondence_id: correspondence.id,
      old_status: oldStatus,
      new_status: validated.status,
      changed_by: req.user!.id,
      notes: validated.notes,
    });

    await logAudit(req, 'update_status', 'correspondence', correspondence.id);

    res.json(correspondence);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/correspondences/{id}/review:
 *   post:
 *     summary: Mark correspondence as reviewed
 *     tags: [Correspondences]
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
 *         description: Correspondence reviewed successfully
 *       404:
 *         description: Correspondence not found
 */
export const review = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const correspondence = await Correspondence.findByPk(req.params.id);
    if (!correspondence) {
      throw new AppError('Correspondence not found', 404);
    }

    await correspondence.update({
      review_status: 'reviewed',
      reviewed_by: req.user!.id,
      reviewed_at: new Date(),
    });

    await logAudit(req, 'review', 'correspondence', correspondence.id);

    res.json(correspondence);
  } catch (error) {
    next(error);
  }
};

