import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Role from '../models/Role';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';
import { loginSchema, refreshTokenSchema } from '../validators/auth';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     full_name_ar:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    const user = await User.findOne({
      where: { username: validated.username },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || !user.is_active) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await comparePassword(validated.password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    await user.update({ last_login: new Date() });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await logAudit(req as AuthRequest, 'login', 'auth', user.id);

    const userWithRole = user as User & { role: Role };

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name_ar: user.full_name_ar,
        role: userWithRole.role.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid refresh token
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = refreshTokenSchema.parse(req.body);
    const decoded = verifyToken(validated.refreshToken);
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = generateAccessToken(user.id);
    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 full_name_ar:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.user!.id, {
      include: [{ model: Role, as: 'role' }],
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const userWithRole = user as User & { role: Role };

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      full_name_ar: user.full_name_ar,
      role: userWithRole.role.name,
    });
  } catch (error) {
    next(error);
  }
};

