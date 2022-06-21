// Imports: core node modules.
const fs = require('fs');
const path = require('path');

// Imports: third-party packages.
const { ObjectId } = require('mongodb');

// Imports: local files.
const { Manufacturer } = require('../models');
const { ApiError } = require('../utils/classes');
const { isMode } = require('../utils/functions');
const { asyncHandler } = require('../middlewares');
const { httpCodes } = require('../config');

/**
 * @description Get all manufacturers.
 */
const getAll = asyncHandler(async (request, response, next) => {
  const { page, limit, pagination } = request.query;
  const options = { page, limit, pagination, populate: 'tools' };
  const fields = getQueryableFields();
  const query = getQueryFromFields(fields, request);

  const manufacturers = await Manufacturer.paginate(query, options);
  response.status(httpCodes.OK).json({ success: true, data: { manufacturers }, error: null });
});

/**
 * @description Get one manufacturer.
 */
const getOne = asyncHandler(async (request, response, next) => {
  const { manufacturerId } = request.params;
  const manufacturer = await Manufacturer.findOne({ _id: manufacturerId, isDeleted: false }).populate('tools');
  if (!manufacturer) {
    next(new ApiError('Manufacturer not found!', httpCodes.NOT_FOUND));
    return;
  }

  response.status(httpCodes.OK).json({ success: true, data: { manufacturer }, error: null });
});

/**
 * @description Create new manufacturer.
 */
const create = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { name, description, tools } = request.body;

  const manufacturerExists = (await Manufacturer.countDocuments({ name, isDeleted: false })) > 0;
  if (manufacturerExists) {
    next(new ApiError('Manufacturer with given name already exists!', httpCodes.BAD_REQUEST));
    return;
  }

  const payload = { name, description, tools: JSON.parse(tools), createdBy: userId };
  const manufacturer = await Manufacturer.create(payload);
  if (!manufacturer) {
    next(new ApiError('Failed to create new manufacturer!', httpCodes.INTERNAL_ERROR));
    return;
  }

  let logoResult = null;

  if (request.files && Object.keys(request.files).length && request.files['logo']) {
    logoResult = await uploadLogo(manufacturer._id, userId, request);
    if (!logoResult.success) {
      next(new ApiError(logoResult.error, httpCodes.INTERNAL_ERROR));
      return;
    }
  }

  const updatedManufacturer =
    logoResult && logoResult.success && logoResult.data ? logoResult.data.updatedManufacturer : manufacturer;
  response.status(httpCodes.CREATED).json({ success: true, data: { manufacturer: updatedManufacturer }, error: null });
});

/**
 * @description Update one manufacturer.
 */
const updateOne = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { name, description, tools } = request.body;
  const { manufacturerId } = request.params;
  const manufacturer = await Manufacturer.findOne({ _id: manufacturerId, isDeleted: false });
  if (!manufacturer) {
    next(new ApiError('Manufacturer not found!', httpCodes.NOT_FOUND));
    return;
  }

  if (name !== manufacturer.name) {
    const manufacturerExists =
      (await Manufacturer.countDocuments({ _id: { $ne: manufacturer._id }, name, isDeleted: false })) > 0;
    if (manufacturerExists) {
      next(new ApiError('Manufacturer with given name already exists!', httpCodes.BAD_REQUEST));
      return;
    }
  }

  const editedManufacturer = await Manufacturer.findOneAndUpdate(
    { _id: manufacturer._id },
    {
      $set: {
        name,
        description,
        tools: JSON.parse(tools),
        lastEditBy: userId,
        lastEditAt: new Date(Date.now()),
      },
    },
    { new: true }
  );
  if (!editedManufacturer) {
    next(new ApiError('Failed to update manufacturer!', httpCodes.INTERNAL_ERROR));
    return;
  }

  let logoResult = null;

  if (request.files && Object.keys(request.files).length && request.files['logo']) {
    logoResult = await uploadLogo(editedManufacturer._id, userId, request);
    if (!logoResult.success) {
      next(new ApiError(logoResult.error, httpCodes.INTERNAL_ERROR));
      return;
    }
  }

  const updatedManufacturer =
    logoResult && logoResult.success && logoResult.data ? logoResult.data.updatedManufacturer : editedManufacturer;
  response.status(httpCodes.OK).json({ success: true, data: { manufacturer: updatedManufacturer }, error: null });
});

/**
 * @description Delete one manufacturer.
 */
const deleteOne = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { manufacturerId } = request.params;
  const manufacturer = await Manufacturer.findOne({ _id: manufacturerId, isDeleted: false });
  if (!manufacturer) {
    next(new ApiError('Manufacturer not found!', httpCodes.NOT_FOUND));
    return;
  }

  const deletedManufacturer = await Manufacturer.findOneAndUpdate(
    { _id: manufacturer._id },
    {
      $set: {
        isDeleted: true,
        lastEditBy: userId,
        lastEditAt: new Date(Date.now()),
      },
    },
    { new: true }
  );
  if (!deletedManufacturer) {
    next(new ApiError('Failed to delete manufacturer!', httpCodes.INTERNAL_ERROR));
    return;
  }

  response.status(httpCodes.OK).json({ success: true, data: { manufacturer: deletedManufacturer }, error: null });
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
      dbField: 'tools',
      queryField: 'tools',
      type: 'array',
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

const uploadLogo = async (manufacturerId, userId, request) => {
  const targetName = 'logo';
  if (!request.files[targetName]) {
    return { success: false, data: null, error: `File name must be ${targetName}`, code: httpCodes.BAD_REQUEST };
  }

  const { data, mimetype, name, size } = request.files[targetName];

  const type = mimetype.split('/').pop();
  const allowedTypes = ['jpeg', 'jpg', 'png'];
  if (!allowedTypes.includes(type)) {
    return { success: false, data: null, error: 'Wrong image type!', code: httpCodes.BAD_REQUEST };
  }

  const manufacturer = await Manufacturer.findOne({ _id: manufacturerId });
  if (!manufacturer) {
    return {
      success: false,
      data: null,
      error: 'Manufacturer not found!',
      code: httpCodes.INTERNAL_ERROR,
    };
  }

  const fileName = `${manufacturer._id}_${Date.now()}.${type}`;
  const filePath = path.join(__dirname, `../../public/manufacturers/${fileName}`);

  try {
    fs.writeFileSync(filePath, data, { encoding: 'utf-8' });
  } catch (error) {
    return { success: false, data: null, error: 'Failed to upload logo!', code: httpCodes.INTERNAL_ERROR };
  }

  const publicURL = isMode('production') ? process.env.PUBLIC_PROD_URL : process.env.PUBLIC_DEV_URL;
  const fileURL = `${publicURL}/manufacturers/${fileName}`;

  const updatedManufacturer = await Manufacturer.findOneAndUpdate(
    { _id: manufacturer._id },
    {
      $set: {
        logo: {
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
  if (!updatedManufacturer) {
    return { success: false, data: null, error: 'Failed to upload logo!', code: httpCodes.INTERNAL_ERROR };
  }

  return { success: true, data: { updatedManufacturer }, error: null, code: null };
};
