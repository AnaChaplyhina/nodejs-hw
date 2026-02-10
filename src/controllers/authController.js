import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

export const registerUser = async (req, res, next) => {

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (user) {
          throw createHttpError(400, 'Email in use');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
          ...req.body,
          password: hashedPassword,
        });

        const session = await createSession(newUser._id);

        setSessionCookies(res, session);

        res.status(201).json({
          status: 201,
          message: 'Successfully registered a user!',
          data: newUser,
        });
      } catch (error) {
        next(error);
      }
};
export const loginUser = async (req, res, next) => {
    // ... твій старий код
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
          throw createHttpError(401, 'Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          throw createHttpError(401, 'Invalid credentials');
        }

        await Session.deleteOne({ userId: user._id });

        const session = await createSession(user._id);

        setSessionCookies(res, session);

        res.status(200).json({
          status: 200,
          message: 'Successfully logged in an user!',
          data: user,
        });
      } catch (error) {
        next(error);
      }
};
export const refreshUserSession = async (req, res, next) => {
    // ... твій старий код
    try {
        const { sessionId, refreshToken } = req.cookies;

        const session = await Session.findOne({ _id: sessionId, refreshToken });

        if (!session) {
          throw createHttpError(401, 'Session not found');
        }

        if (new Date() > session.refreshTokenValidUntil) {
          throw createHttpError(401, 'Session token expired');
        }

        await Session.deleteOne({ _id: sessionId });

        const newSession = await createSession(session.userId);

        setSessionCookies(res, newSession);

        res.status(200).json({
          status: 200,
          message: 'Session refreshed',
          data: {
            accessToken: newSession.accessToken,
          },
        });
      } catch (error) {
        next(error);
      }
};
export const logoutUser = async (req, res, next) => {
    try {
        const { sessionId } = req.cookies;

        if (sessionId) {
          await Session.deleteOne({ _id: sessionId });
        }

        res.clearCookie('sessionId');
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(204).send();
      } catch (error) {
        next(error);
      }
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: 'Password reset email sent successfully',
        status: 200,
      });
    }

    const resetToken = jwt.sign(
      { sub: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

    const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Reset your password',
      template: 'reset-password-email',
      context: {
        name: user.username,
        resetLink,
      },
    });

    res.status(200).json({
      message: 'Password reset email sent successfully',
      status: 200,
    });
  } catch (error) {
    if (error.status === 500) {
        next(error);
        return;
    }
    next(createHttpError(500, 'Failed to send the email, please try again later.'));
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw createHttpError(401, 'Invalid or expired token');
    }

    const user = await User.findOne({ _id: decoded.sub, email: decoded.email });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.updateOne({ _id: user._id }, { password: hashedPassword });

    res.status(200).json({
      message: 'Password reset successfully',
      status: 200,
    });
  } catch (error) {
    next(error);
  }
};
