import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const updateUserAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createHttpError(400, 'No file');
    }

    const { secure_url } = await saveFileToCloudinary(req.file);

    await User.findByIdAndUpdate(req.user._id, { avatar: secure_url });

    res.status(200).json({
      status: 200,
      message: 'Successfully updated avatar!',
      data: {
        url: secure_url,
      },
    });
  } catch (error) {
    next(error);
  }
};
