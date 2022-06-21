// Imports: core node modules.
const fs = require('fs');
const path = require('path');

// Imports: third-party packages.
const { ObjectId } = require('mongodb');

// Imports: local files.
const { Tool } = require('../models');
const { ApiError } = require('../utils/classes');
const { httpCodes } = require('../config');
const { asyncHandler } = require('../middlewares');
const { isMode } = require('../utils/functions');

/**
 * @description Get all tools.
 */
const getAll = asyncHandler(async (request, response, next) => {
  const { page, limit, pagination } = request.query;
  const fields = getQueryableFields();
  const query = getQueryFromFields(fields, request);

  const tools = await Tool.paginate(query, { page, limit, pagination });
  response.status(httpCodes.OK).json({ success: true, data: { tools }, error: null });
});

/**
 * @description Get one tool.
 */
const getOne = asyncHandler(async (request, response, next) => {
  const { toolId } = request.params;
  const tool = await Tool.findOne({ _id: toolId, isDeleted: false });
  if (!tool) {
    next(new ApiError('Tool not found!', httpCodes.NOT_FOUND));
    return;
  }

  response.status(httpCodes.OK).json({ success: true, data: { tool }, error: null });
});

/**
 * @description Create new tool.
 */
const create = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { name, description, informationLinks } = request.body;

  const toolExists = (await Tool.countDocuments({ name, isDeleted: false })) > 0;
  if (toolExists) {
    next(new ApiError('Tool with given name already exists!', httpCodes.BAD_REQUEST));
    return;
  }

  const payload = { name, description, informationLinks: JSON.parse(informationLinks), createdBy: userId };
  const tool = await Tool.create(payload);
  if (!tool) {
    next(new ApiError('Failed to create new tool!', httpCodes.INTERNAL_ERROR));
    return;
  }

  let photoResult = null;

  if (request.files && Object.keys(request.files).length && request.files['photo']) {
    photoResult = await uploadPhoto(tool._id, userId, request);
    if (!photoResult.success) {
      next(new ApiError(photoResult.error, httpCodes.INTERNAL_ERROR));
      return;
    }
  }

  const updatedTool = photoResult && photoResult.success && photoResult.data ? photoResult.data.updatedTool : tool;
  response.status(httpCodes.CREATED).json({ success: true, data: { tool: updatedTool }, error: null });
});

/**
 * @description Update one tool.
 */
const updateOne = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { name, description, informationLinks } = request.body;
  const { toolId } = request.params;
  const tool = await Tool.findOne({ _id: toolId, isDeleted: false });
  if (!tool) {
    next(new ApiError('Tool not found!', httpCodes.NOT_FOUND));
    return;
  }

  if (name !== tool.name) {
    const toolExists = (await Tool.countDocuments({ _id: { $ne: tool._id }, name, isDeleted: false })) > 0;
    if (toolExists) {
      next(new ApiError('Tool with given name already exists!', httpCodes.BAD_REQUEST));
      return;
    }
  }

  const editedTool = await Tool.findOneAndUpdate(
    { _id: tool._id },
    {
      $set: {
        name,
        description,
        informationLinks: JSON.parse(informationLinks),
        lastEditBy: userId,
        lastEditAt: new Date(Date.now()),
      },
    },
    { new: true }
  );
  if (!editedTool) {
    next(new ApiError('Failed to update tool!', httpCodes.INTERNAL_ERROR));
    return;
  }

  let photoResult = null;

  if (request.files && Object.keys(request.files).length && request.files['photo']) {
    photoResult = await uploadPhoto(editedTool._id, userId, request);
    if (!photoResult.success) {
      next(new ApiError(photoResult.error, httpCodes.INTERNAL_ERROR));
      return;
    }
  }

  const updatedTool =
    photoResult && photoResult.success && photoResult.data ? photoResult.data.updatedTool : editedTool;
  response.status(httpCodes.OK).json({ success: true, data: { tool: updatedTool }, error: null });
});

/**
 * @description Delete one tool.
 */
const deleteOne = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { toolId } = request.params;
  const tool = await Tool.findOne({ _id: toolId, isDeleted: false });
  if (!tool) {
    next(new ApiError('Tool not found!', httpCodes.NOT_FOUND));
    return;
  }

  const deletedTool = await Tool.findOneAndUpdate(
    { _id: tool._id },
    {
      $set: {
        isDeleted: true,
        lastEditBy: userId,
        lastEditAt: new Date(Date.now()),
      },
    },
    { new: true }
  );
  if (!deletedTool) {
    next(new ApiError('Failed to delete tool!', httpCodes.INTERNAL_ERROR));
    return;
  }

  response.status(httpCodes.OK).json({ success: true, data: { tool: deletedTool }, error: null });
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

const uploadPhoto = async (toolId, userId, request) => {
  const targetName = 'photo';
  if (!request.files[targetName]) {
    return { success: false, data: null, error: `File name must be ${targetName}`, code: httpCodes.BAD_REQUEST };
  }

  const { data, mimetype, name, size } = request.files[targetName];

  const type = mimetype.split('/').pop();
  const allowedTypes = ['jpeg', 'jpg', 'png'];
  if (!allowedTypes.includes(type)) {
    return { success: false, data: null, error: 'Wrong image type!', code: httpCodes.BAD_REQUEST };
  }

  const tool = await Tool.findOne({ _id: toolId });
  if (!tool) {
    return {
      success: false,
      data: null,
      error: 'Tool not found!',
      code: httpCodes.INTERNAL_ERROR,
    };
  }

  const fileName = `${tool._id}_${Date.now()}.${type}`;
  const filePath = path.join(__dirname, `../../public/tools/${fileName}`);

  try {
    fs.writeFileSync(filePath, data, { encoding: 'utf-8' });
  } catch (error) {
    return { success: false, data: null, error: 'Failed to upload photo!', code: httpCodes.INTERNAL_ERROR };
  }

  const publicURL = isMode('production') ? process.env.PUBLIC_PROD_URL : process.env.PUBLIC_DEV_URL;
  const fileURL = `${publicURL}/tools/${fileName}`;

  const updatedTool = await Tool.findOneAndUpdate(
    { _id: tool._id },
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
  if (!updatedTool) {
    return { success: false, data: null, error: 'Failed to upload photo!', code: httpCodes.INTERNAL_ERROR };
  }

  return { success: true, data: { updatedTool }, error: null, code: null };
};
