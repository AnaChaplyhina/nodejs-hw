import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars'; 
import path from 'node:path';
import fs from 'node:fs/promises';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      throw createHttpError(409, 'Email in use');
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
      throw createHttpError(404, 'User not found');
    }

    const resetToken = jwt.sign(
      {
        sub: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m',
      },
    );

    const resetPasswordTemplatePath = path.resolve(
      'src',
      'templates',
      'reset-password-email.html',
    );

    const templateSource = await fs.readFile(
      resetPasswordTemplatePath,
      'utf-8',
    );

    const template = handlebars.compile(templateSource);

    const html = template({
      name: user.username,
      link: `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`,
    });

    await sendEmail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your password',
      html,
    });

    res.json({
      message: 'Reset password email was successfully sent!',
      status: 200,
      data: {},
    });
  } catch (error) {
    if (error.status === 404) {
       return res.json({
          message: 'Reset password email was successfully sent!',
          status: 200,
          data: {},
        });
    }
    next(
      createHttpError(500, 'Failed to send the email, please try again later.'),
    );
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    let decoded;
    try {
      decoded = jwt.verify(req.body.token, process.env.JWT_SECRET);
    } catch (err) {
      throw createHttpError(401, 'Token is expired or invalid.');
    }

    const user = await User.findOne({
      _id: decoded.sub,
      email: decoded.email,
    });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const encryptedPassword = await bcrypt.hash(req.body.password, 10);

    await User.updateOne(
      { _id: user._id },
      { password: encryptedPassword },
    );

    res.json({
      message: 'Password was successfully reset!',
      status: 200,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
