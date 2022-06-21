// Imports: core node modules.
const crypto = require('crypto');

// Imports: third-party packages.
const differenceInMinutes = require('date-fns/differenceInMinutes');
const bcrypt = require('bcryptjs');

// Imports: local files.
const { User, PasswordReset, UserConfirmation, Role } = require('../models');
const { ApiError } = require('../utils/classes');
const { jwt, isMode, mail } = require('../utils/functions');
const { asyncHandler } = require('../middlewares');
const { httpCodes } = require('../config');

/**
 * @description Sign a new user up.
 */
const signup = asyncHandler(async (request, response, next) => {
  const { email, password, passwordConfirm, role } = request.body;

  if (password !== passwordConfirm) {
    next(new ApiError('Password and password confirm must be same!', httpCodes.BAD_REQUEST));
    return;
  }

  const userRole = await Role.findOne({ number: role, isDeleted: false });
  if (!userRole) {
    next(new ApiError('Role not found!', httpCodes.NOT_FOUND));
    return;
  }

  const userExists = (await User.countDocuments({ email, role: userRole._id, isDeleted: false })) > 0;
  if (userExists) {
    next(new ApiError('User already exists!', httpCodes.BAD_REQUEST));
    return;
  }

  const user = await User.create({ email, password, role: userRole._id });
  if (!user) {
    next(new ApiError('Failed to create user!', httpCodes.INTERNAL_ERROR));
    return;
  }

  const userConfirmation = await UserConfirmation.create({
    user: user._id,
    code: Math.floor(100000 + Math.random() * 900000),
    token: crypto.randomBytes(32).toString('hex').toUpperCase(),
    expireDate: new Date(Date.now() + 1000 * 60 * 10),
    isUsed: false,
  });
  if (!userConfirmation) {
    next(new ApiError('Failed to create user confirmation', httpCodes.INTERNAL_ERROR));
    return;
  }

  const frontURL = isMode('development') ? process.env.FRONT_DEV_URL : process.env.FRONT_PROD_URL;

  // const confirmQuery = Buffer.from(`token=${userConfirmation.token}&code=${userConfirmation.code}&email=${user.email}`).toString('base64');
  // const confirmURL = `${frontURL}/confirm?q=${confirmQuery}`;
  // const confirmText = `Welcome to CTO App.<br></br>Please click <a href="${confirmURL}">here</a> to confirm your account!`;

  const confirmText = `Welcome to CTO App.<br></br>Token: ${userConfirmation.token}.<br></br>Code: ${userConfirmation.code}.<br></br>Make a post request to http://localhost:5000/api/authentication/confirm!`;

  const mailResult = await mail({
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject: 'Welcome to CTO App!',
    html: confirmText,
  });
  if (!mailResult.success) {
    await UserConfirmation.findOneAndUpdate(
      { _id: userConfirmation._id, isActive: true },
      { $set: { isActive: false } }
    );

    next(new ApiError('Failed to send mail!', httpCodes.INTERNAL_ERROR));
    return;
  }

  response.status(httpCodes.CREATED).json({ success: true, data: { sent: true }, error: null });
});

/**
 * @description Log an user in.
 */
const login = asyncHandler(async (request, response, next) => {
  const { email, password, remember } = request.body;

  const user = await User.findOne({ email, isDeleted: false }).select('_id email password role').populate('role');
  if (!user) {
    next(new ApiError('Invalid Credentials!', httpCodes.UNAUTHORIZED));
    return;
  }

  const samePassword = await User.comparePasswords(password, user.password);
  if (!samePassword) {
    next(new ApiError('Invalid Credentials!', httpCodes.UNAUTHORIZED));
    return;
  }

  const jwtResult = await jwt.sign({
    id: user._id,
    email: user.email,
    role: user.role.number,
    remember: remember,
  });
  if (!jwtResult.success) {
    next(new ApiError(jwtResult.error, httpCodes.INTERNAL_ERROR));
    return;
  }

  const { encoded } = jwtResult.data;
  response.status(httpCodes.CREATED).json({ success: true, data: { token: encoded }, error: null });
});

/**
 * @description Forgot password functionality.
 */
const forgot = asyncHandler(async (request, response, next) => {
  const { email } = request.body;

  const user = await User.findOne({ email, isDeleted: false })
    .select('_id email password role accountConfirmed')
    .populate('role');
  if (!user) {
    next(new ApiError('User not found!', httpCodes.NOT_FOUND));
    return;
  }

  if (!user.accountConfirmed) {
    next(new ApiError('Account not confirmed!', httpCodes.UNAUTHORIZED));
    return;
  }

  const passwordReset = await PasswordReset.create({
    user: user._id,
    token: crypto.randomBytes(32).toString('hex').toUpperCase(),
    expireDate: new Date(Date.now() + 1000 * 60 * 10),
    oldPassword: user.password,
  });
  if (!passwordReset) {
    next(new ApiError('Internal Error', httpCodes.INTERNAL_ERROR));
    return;
  }

  const frontURL = isMode('development') ? process.env.FRONT_DEV_URL : process.env.FRONT_PROD_URL;

  // const resetQuery = Buffer.from(`resetToken=${passwordReset.token}&email=${user.email}`).toString('base64');
  // const resetURL = `${frontURL}/reset?q=${resetQuery}`;
  // const resetText = `You've requested a password change<br></br><br></br>.Please click <a href="${resetURL}">here</a> to change your password!`;

  const resetText = `You've requested a password change.<br></br>Make a post request to http://localhost:5000/api/authentication/reset/${passwordReset.token}!`;

  const mailResult = await mail({
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject: 'Password Reset Request!',
    html: resetText,
  });
  if (!mailResult.success) {
    await PasswordReset.findOneAndUpdate({ _id: passwordReset._id, isActive: true }, { $set: { isActive: false } });

    next(new ApiError('Failed to send mail!', httpCodes.INTERNAL_ERROR));
    return;
  }

  response.status(httpCodes.OK).json({ success: true, data: { sent: true }, error: null });
});

/**
 * @description Reset password functionality.
 */
const reset = asyncHandler(async (request, response, next) => {
  const { resetToken } = request.params;
  const { email, password, passwordConfirm } = request.body;

  if (password !== passwordConfirm) {
    next(new ApiError('Password and password confirm must be same!', httpCodes.BAD_REQUEST));
    return;
  }

  const user = await User.findOne({ email, isDeleted: false }).select('_id email password role accountConfirmed');
  if (!user) {
    next(new ApiError('User not found!', httpCodes.NOT_FOUND));
    return;
  }

  if (!user.accountConfirmed) {
    next(new ApiError('Account not confirmed!', httpCodes.UNAUTHORIZED));
    return;
  }

  const samePassword = await User.comparePasswords(password, user.password);
  if (samePassword) {
    next(new ApiError('Cant use same password as before!', httpCodes.BAD_REQUEST));
    return;
  }

  const passwordReset = await PasswordReset.findOne({
    user: user._id,
    isActive: true,
    isUsed: false,
    token: resetToken,
    expireDate: { $gte: new Date(Date.now()) },
  });
  if (!passwordReset) {
    next(new ApiError('Reset token expired!', httpCodes.NOT_FOUND));
    return;
  }

  const previousResets = await PasswordReset.find({
    _id: { $nin: [passwordReset._id] },
    user: user._id,
    isUsed: true,
  });

  const previouslyUsed = await checkIfPasswordUsed(password, previousResets);
  if (previouslyUsed) {
    next(new ApiError('Already used this password!', httpCodes.BAD_REQUEST));
    return;
  }

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      isDeleted: false,
    },
    {
      $set: {
        password: hashedPassword,
        passwordChangedAt: new Date(Date.now()),
        lastEditBy: user._id,
        lastEditAt: new Date(Date.now()),
      },
    },
    { new: true }
  ).populate('role');
  if (!updatedUser) {
    next(new ApiError('Failed to update user!', httpCodes.INTERNAL_ERROR));
    return;
  }

  const updatedPasswordReset = await PasswordReset.findOneAndUpdate(
    {
      _id: passwordReset._id,
      isActive: true,
    },
    {
      $set: {
        isUsed: true,
        newPassword: hashedPassword,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedPasswordReset) {
    next(new ApiError('Failed to update password reset!', httpCodes.INTERNAL_ERROR));
    return;
  }

  const jwtResult = await jwt.sign({
    id: updatedUser._id,
    email: updatedUser.email,
    role: updatedUser.role.number,
    remember: false,
  });
  if (!jwtResult.success) {
    next(new ApiError(jwtResult.error, httpCodes.INTERNAL_ERROR));
    return;
  }

  const { encoded } = jwtResult.data;
  response.status(httpCodes.CREATED).json({ success: true, data: { token: encoded }, error: null });
});

/**
 * @description Confirm account functionality.
 */
const confirm = asyncHandler(async (request, response, next) => {
  const { email, code, token } = request.body;

  const user = await User.findOne({ email, isDeleted: false });
  if (!user) {
    next(new ApiError('User not found!', httpCodes.NOT_FOUND));
    return;
  }

  if (user.accountConfirmed) {
    next(new ApiError('Account already confirmed!', httpCodes.BAD_REQUEST));
    return;
  }

  const userConfirmation = await UserConfirmation.findOne({
    user: user._id,
    code,
    token,
    isUsed: false,
    isActive: true,
    expireDate: { $gte: new Date(Date.now()) },
  });
  if (!userConfirmation) {
    next(new ApiError('Wrong/expired code!', httpCodes.BAD_REQUEST));
    return;
  }

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      isDeleted: false,
    },
    {
      $set: {
        accountConfirmed: true,
        lastEditBy: user._id,
        lastEditAt: new Date(Date.now()),
      },
    },
    {
      new: true,
    }
  ).populate('role');
  if (!updatedUser) {
    next(new ApiError('Failed to update user!', httpCodes.INTERNAL_ERROR));
    return;
  }

  const updatedConfirmation = await UserConfirmation.findOneAndUpdate(
    { _id: userConfirmation._id, isUsed: false, isActive: true },
    {
      $set: {
        isActive: false,
        isUsed: true,
      },
    },
    { new: true }
  );
  if (!updatedConfirmation) {
    next(new ApiError('Failed to update confirmation', httpCodes.INTERNAL_ERROR));
    return;
  }

  const jwtResult = await jwt.sign({
    id: updatedUser._id,
    email: updatedUser.email,
    role: updatedUser.role.number,
    remember: false,
  });
  if (!jwtResult.success) {
    next(new ApiError(jwtResult.error, httpCodes.INTERNAL_ERROR));
    return;
  }

  const { encoded } = jwtResult.data;
  response.status(httpCodes.OK).json({ success: true, data: { token: encoded }, error: null });
});

/**
 * @description Resend confirmation code functionality.
 */
const resend = asyncHandler(async (request, response, next) => {
  const { email } = request.body;

  const user = await User.findOne({ email: email, isDeleted: false });
  if (!user) {
    next(new ApiError('User not found!', 'NOT_FOUND', httpCodes.NOT_FOUND));
    return;
  }

  if (user.accountConfirmed) {
    next(new ApiError('Account already confirmed!', httpCodes.BAD_REQUEST));
    return;
  }

  const previousConfirmation = await UserConfirmation.find({ user: user._id, isActive: true }).sort('-_id').limit(1);
  if (previousConfirmation && checkIfCodeSpam(previousConfirmation[0])) {
    next(new ApiError('Can get new code every 3 minutes!', httpCodes.BAD_REQUEST));
    return;
  }

  const userConfirmation = await UserConfirmation.create({
    user: user._id,
    code: Math.floor(100000 + Math.random() * 900000),
    token: crypto.randomBytes(32).toString('hex').toUpperCase(),
    expireDate: new Date(Date.now() + 1000 * 60 * 10),
    isUsed: false,
  });
  if (!userConfirmation) {
    next(new ApiError('Failed to create user confirmation', httpCodes.INTERNAL_ERROR));
    return;
  }

  const frontURL = isMode('development') ? process.env.FRONT_DEV_URL : process.env.FRONT_PROD_URL;

  // const confirmQuery = Buffer.from(`token=${userConfirmation.token}&code=${userConfirmation.code}&email=${user.email}`).toString('base64');
  // const confirmURL = `${frontURL}/confirm?q=${confirmQuery}`;
  // const confirmText = `Welcome to CTO App.<br></br>Please click <a href="${confirmURL}">here</a> to confirm your account!`;

  const confirmText = `Welcome to CTO App.<br></br>Token: ${userConfirmation.token}.<br></br>Code: ${userConfirmation.code}.<br></br>Make a post request to http://localhost:5000/api/authentication/confirm!`;

  const mailResult = await mail({
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject: 'Welcome to CTO App!',
    html: confirmText,
  });
  if (!mailResult.success) {
    await UserConfirmation.findOneAndUpdate(
      { _id: userConfirmation._id, isActive: true },
      { $set: { isActive: false } }
    );

    next(new ApiError('Failed to send mail!', httpCodes.INTERNAL_ERROR));
    return;
  }

  await UserConfirmation.updateMany({ _id: { $ne: userConfirmation._id } }, { $set: { isActive: false } });

  response.status(httpCodes.CREATED).json({ success: true, data: { sent: true }, error: null });
});

// Exports of this file.
module.exports = { signup, login, forgot, reset, confirm, resend };

// Helpers.
const checkIfPasswordUsed = async (newPassword, previousResets) => {
  let previouslyUsed = false;

  for (const reset of previousResets) {
    const passwordUsed = await User.comparePasswords(newPassword, reset.oldPassword);
    if (passwordUsed) {
      previouslyUsed = true;
      break;
    }
  }

  return previouslyUsed;
};

const checkIfCodeSpam = (previousConfirmation) => {
  if (previousConfirmation && previousConfirmation.createdAt) {
    const now = new Date(Date.now());
    const previousConfirmationSent = new Date(previousConfirmation.createdAt);

    return differenceInMinutes(now, previousConfirmationSent) <= 3;
  }

  return false;
};
