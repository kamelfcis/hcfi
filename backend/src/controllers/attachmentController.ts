import { Response, NextFunction } from 'express';
import Attachment from '../models/Attachment';
import Correspondence from '../models/Correspondence';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';
import path from 'path';
import fs from 'fs';

/**
 * @swagger
 * /api/v1/attachments/{id}:
 *   post:
 *     summary: Upload an attachment to a correspondence
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Correspondence ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               type:
 *                 type: string
 *                 enum: [incoming, outgoing]
 *     responses:
 *       201:
 *         description: Attachment uploaded successfully
 *       400:
 *         description: No file uploaded
 *       404:
 *         description: Correspondence not found
 */
export const uploadAttachment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const correspondenceId = parseInt(req.params.id);
    const correspondence = await Correspondence.findByPk(correspondenceId);
    if (!correspondence) {
      throw new AppError('Correspondence not found', 404);
    }

    // Store relative path for easier frontend access
    // req.file.path is something like: ./uploads/incoming/filename.ext or uploads\incoming\filename.ext
    // We want to store: incoming/filename.ext (relative to uploads directory)
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    const filePath = path.resolve(req.file.path);
    let relativePath = path.relative(uploadDir, filePath);
    
    // Normalize to forward slashes and ensure it doesn't start with '..'
    relativePath = relativePath.replace(/\\/g, '/');
    
    // If path calculation failed or goes outside uploads directory, extract from req.file.path directly
    if (relativePath.startsWith('..') || !relativePath || relativePath.includes('..')) {
      // Extract path after 'uploads/' or 'incoming/' or 'outgoing/'
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      const pathParts = normalizedPath.split('/');
      const uploadIndex = pathParts.findIndex(p => p.toLowerCase() === 'uploads' || p === 'incoming' || p === 'outgoing');
      if (uploadIndex >= 0) {
        // If we found 'uploads', take everything after it; otherwise take from 'incoming'/'outgoing'
        const startIndex = pathParts[uploadIndex].toLowerCase() === 'uploads' ? uploadIndex + 1 : uploadIndex;
        relativePath = pathParts.slice(startIndex).join('/');
      } else {
        // Fallback: use directory name and filename
        const dir = req.body.type === 'outgoing' ? 'outgoing' : 'incoming';
        relativePath = `${dir}/${req.file.filename}`;
      }
    }
    
    // Final normalization: ensure no leading slashes and forward slashes only
    relativePath = relativePath.replace(/^\/+/, '').replace(/\\/g, '/');
    
    const attachment = await Attachment.create({
      correspondence_id: correspondenceId,
      file_name: req.file.filename,
      original_name: req.file.originalname,
      file_path: relativePath, // Store relative path like "incoming/filename.ext"
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_by: req.user!.id,
    });

    await logAudit(req, 'upload', 'attachment', attachment.id);

    res.status(201).json(attachment);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/attachments/{id}/download:
 *   get:
 *     summary: Download an attachment
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attachment ID
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Attachment or file not found
 */
export const downloadAttachment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    // Reconstruct full path from relative path
    // Normalize the stored path (handle both forward and backslashes)
    const normalizedPath = attachment.file_path.replace(/\\/g, '/').replace(/^\/+/, '');
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    const filePath = path.resolve(uploadDir, normalizedPath);
    
    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found', 404);
    }

    // Set proper headers for download with original filename and extension
    const encodedFilename = encodeURIComponent(attachment.original_name);
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', attachment.mime_type);
    const requestOrigin = req.headers.origin;
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:5175')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/attachments/{id}:
 *   delete:
 *     summary: Delete an attachment
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attachment ID
 *     responses:
 *       204:
 *         description: Attachment deleted successfully
 *       404:
 *         description: Attachment not found
 */
export const deleteAttachment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    if (!attachment) {
      throw new AppError('Attachment not found', 404);
    }

    // Reconstruct full path from relative path
    // Normalize the stored path (handle both forward and backslashes)
    const normalizedPath = attachment.file_path.replace(/\\/g, '/').replace(/^\/+/, '');
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    const filePath = path.resolve(uploadDir, normalizedPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await attachment.destroy();
    await logAudit(req, 'delete', 'attachment', attachment.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

