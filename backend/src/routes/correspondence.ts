import { Router } from 'express';
import {
  getAll,
  getById,
  create,
  update,
  remove,
  addReply,
  deleteReply,
  updateStatus,
  review,
} from '../controllers/correspondenceController';
import { authenticate, requirePermission } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, requirePermission('correspondence:read'), getAll);
router.get('/:id', authenticate, requirePermission('correspondence:read'), getById);
router.post('/', authenticate, requirePermission('correspondence:create'), create);
router.put('/:id', authenticate, requirePermission('correspondence:update'), update);
router.delete('/:id', authenticate, requirePermission('correspondence:delete'), remove);
router.post('/:id/reply', authenticate, requirePermission('correspondence:update'), addReply);
router.delete('/:correspondenceId/reply/:replyId', authenticate, requirePermission('correspondence:update'), deleteReply);
router.patch('/:id/status', authenticate, requirePermission('correspondence:update'), updateStatus);
router.post('/:id/review', authenticate, requirePermission('correspondence:review'), review);

export default router;

