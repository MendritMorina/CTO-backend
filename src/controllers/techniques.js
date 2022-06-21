// Imports: core node modules.
const fs = require('fs');
const path = require('path');

// Imports: third-party packages.
const { ObjectId } = require('mongodb');

// Imports: local files.
const { Technique } = require('../models');
const { ApiError } = require('../utils/classes');
const { httpCodes } = require('../config');
const { asyncHandler } = require('../middlewares');
const { isMode } = require('../utils/functions');

/**
 * @description Get all techniques.
 */
const getAll = asyncHandler(async (request, response, next) => {
  const { page, limit, pagination } = request.query;
  const fields = getQueryableFields();
  const query = getQueryFromFields(fields, request);

  const techniques = await Technique.paginate(query, { page, limit, pagination });
  response.status(httpCodes.OK).json({ success: true, data: { techniques }, error: null });
});

/**
 * @description Get one technique.
 */
const getOne = asyncHandler(async (request, response, next) => {
  const { techniqueId } = request.params;
  const technique = await Technique.findOne({ _id: techniqueId, isDeleted: false });
  if (!technique) {
    next(new ApiError('Technique not found!', httpCodes.NOT_FOUND));
    return;
  }

  response.status(httpCodes.OK).json({ success: true, data: { technique }, error: null });
});

/**
 * @description Create new technique.
 */
const create = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { name, description, achronym, informationLinks } = request.body;

  const techniqueExists = (await Technique.countDocuments({ name, isDeleted: false })) > 0;
  if (techniqueExists) {
    next(new ApiError('Technique with given name already exists!', httpCodes.BAD_REQUEST));
    return;
  }

  const payload = { name, description, achronym, informationLinks: JSON.parse(informationLinks), createdBy: userId };
  const technique = await Technique.create(payload);
  if (!technique) {
    next(new ApiError('Failed to create new technique!', httpCodes.INTERNAL_ERROR));
    return;
  }

  let photoResult = null;

  if (request.files && Object.keys(request.files).length && request.files['photo']) {
    photoResult = await uploadPhoto(technique._id, userId, request);
    if (!photoResult.success) {
      next(new ApiError(photoResult.error, httpCodes.INTERNAL_ERROR));
      return;
    }
  }

  const updatedTechnique =
    photoResult && photoResult.success && photoResult.data ? photoResult.data.updatedTechnique : technique;
  response.status(httpCodes.CREATED).json({ success: true, data: { technique: updatedTechnique }, error: null });
});

/**
 * @description Update one technique.
 */
const updateOne = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { name, description, achronym, informationLinks } = request.body;
  const { techniqueId } = request.params;
  const technique = await Technique.findOne({ _id: techniqueId, isDeleted: false });
  if (!technique) {
    next(new ApiError('Technique not found!', httpCodes.NOT_FOUND));
    return;
  }

  if (name !== technique.name) {
    const techniqueExists =
      (await Technique.countDocuments({ _id: { $ne: technique._id }, name, isDeleted: false })) > 0;
    if (techniqueExists) {
      next(new ApiError('Technique with given name already exists!', httpCodes.BAD_REQUEST));
      return;
    }
  }

  const editedTechnique = await Technique.findOneAndUpdate(
    { _id: technique._id },
    {
      $set: {
        name,
        description,
        achronym,
        informationLinks: JSON.parse(informationLinks),
        lastEditBy: userId,
        lastEditAt: new Date(Date.now()),
      },
    },
    { new: true }
  );
  if (!editedTechnique) {
    next(new ApiError('Failed to update technique!', httpCodes.INTERNAL_ERROR));
    return;
  }

  let photoResult = null;

  if (request.files && Object.keys(request.files).length && request.files['photo']) {
    photoResult = await uploadPhoto(editedTechnique._id, userId, request);
    if (!photoResult.success) {
      next(new ApiError(photoResult.error, httpCodes.INTERNAL_ERROR));
      return;
    }
  }

  const updatedTechnique =
    photoResult && photoResult.success && photoResult.data ? photoResult.data.updatedTechnique : editedTechnique;
  response.status(httpCodes.OK).json({ success: true, data: { technique: updatedTechnique }, error: null });
});

/**
 * @description Delete one technique.
 */
const deleteOne = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { techniqueId } = request.params;
  const technique = await Technique.findOne({ _id: techniqueId, isDeleted: false });
  if (!technique) {
    next(new ApiError('Technique not found!', httpCodes.NOT_FOUND));
    return;
  }

  const deletedTechnique = await Technique.findOneAndUpdate(
    { _id: technique._id },
    {
      $set: {
        isDeleted: true,
        lastEditBy: userId,
        lastEditAt: new Date(Date.now()),
      },
    },
    { new: true }
  );
  if (!deletedTechnique) {
    next(new ApiError('Failed to delete technique!', httpCodes.INTERNAL_ERROR));
    return;
  }

  response.status(httpCodes.OK).json({ success: true, data: { technique: deletedTechnique }, error: null });
});

// Exports of this file.
module.exports = { getAll, getOne, create, updateOne, deleteOne };

// Helpers for this controller.
const getQueryableFields = () => {
  return [
    {
      dbField: 'isActive',
      queryField: 'active',
      type: 'boolean',
    },
    {
      dbField: 'isDeleted',
      queryField: 'deleted',
      type: 'boolean',
    },
    {
      dbField: 'name',
      queryField: 'name',
      type: 'string',
      shouldRegex: true,
    },
  ];
};

const getQueryFromFields = (fields, request) => {
  const query = { isDeleted: false, isActive: true };

  fields.forEach((field) => {
    const { type, dbField, queryField, shouldRegex } = field;
    switch (true) {
      case type === 'string':
        if (request.query[queryField]) {
          if (shouldRegex) query[dbField] = { $regex: request.query[queryField], $options: 'i' };
          else query[dbField] = request.query[queryField];
        }
        break;
      case type === 'boolean':
        if (request.query[queryField] === 0) query[dbField] = false;
        else if (request.query[queryField] === 1) query[dbField] = true;
        break;
      case type === 'array':
        if (request.query[queryField] && request.query[queryField].length) {
          const transformedArray = request.query[queryField].map((element) => ObjectId(element));
          query[dbField] = { $in: transformedArray };
        }
        break;
      default:
        break;
    }
  });

  return query;
};

const uploadPhoto = async (techniqueId, userId, request) => {
  const targetName = 'photo';
  if (!request.files[targetName]) {
    return { success: false, data: null, error: `File name must be ${targetName}`, code: httpCodes.BAD_REQUEST };
  }

  const { data, mimetype, size, name } = request.files[targetName];

  const type = mimetype.split('/').pop();
  const allowedTypes = ['jpeg', 'jpg', 'png'];
  if (!allowedTypes.includes(type)) {
    return { success: false, data: null, error: 'Wrong image type!', code: httpCodes.BAD_REQUEST };
  }

  const technique = await Technique.findOne({ _id: techniqueId });
  if (!technique) {
    return {
      success: false,
      data: null,
      error: 'Technique not found!',
      code: httpCodes.INTERNAL_ERROR,
    };
  }

  const fileName = `${technique._id}_${Date.now()}.${type}`;
  const filePath = path.join(__dirname, `../../public/techniques/${fileName}`);

  try {
    fs.writeFileSync(filePath, data, { encoding: 'utf-8' });
  } catch (error) {
    return { success: false, data: null, error: 'Failed to upload photo!', code: httpCodes.INTERNAL_ERROR };
  }

  const publicURL = isMode('production') ? process.env.PUBLIC_PROD_URL : process.env.PUBLIC_DEV_URL;
  const fileURL = `${publicURL}/techniques/${fileName}`;

  const updatedTechnique = await Technique.findOneAndUpdate(
    { _id: technique._id },
    {
      $set: {
        photo: {
          url: fileURL,
          name: name,
          mimetype: mimetype,
          size: size,
        },
        lastEditBy: userId,
        lastEditAt: new Date(Date.now()),
      },
    },
    { new: true }
  );
  if (!updatedTechnique) {
    return { success: false, data: null, error: 'Failed to upload photo!', code: httpCodes.INTERNAL_ERROR };
  }

  return { success: true, data: { updatedTechnique }, error: null, code: null };
};
