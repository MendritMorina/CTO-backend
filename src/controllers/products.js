// Imports: core node modules.
const fs = require('fs');
const path = require('path');

// Imports: third-party packages.
const { ObjectId } = require('mongodb');

// Imports: local files.
const { Product } = require('../models');
const { ApiError } = require('../utils/classes');
const { asyncHandler } = require('../middlewares');
const { isMode } = require('../utils/functions');
const { httpCodes } = require('../config');

/**
 * @description Get all products.
 */
const getAll = asyncHandler(async (request, response, next) => {
  const { page, limit, pagination } = request.query;
  const fields = getQueryableFields();
  const query = getQueryFromFields(fields, request);

  const products = await Product.paginate(query, { page, limit, pagination, populate: 'type manufacturer' });
  response.status(httpCodes.OK).json({ success: true, data: { products }, error: null });
});

/**
 * @description Get one product.
 */
const getOne = asyncHandler(async (request, response, next) => {
  const { productId } = request.params;
  const product = await Product.findOne({ _id: productId, isDeleted: false })
    .populate('type')
    .populate('manufacturer')
    .populate('createdBy');
  if (!product) {
    next(new ApiError('Product not found!', httpCodes.NOT_FOUND));
    return;
  }

  response.status(httpCodes.OK).json({ success: true, data: { product }, error: null });
});

/**
 * @description Create new product.
 */
const create = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { name, shortDescription, longDescription, details, informationLinks, manufacturer, type } = request.body;

  const productExists = (await Product.countDocuments({ name, isDeleted: false })) > 0;
  if (productExists) {
    next(new ApiError('Product with given name already exists!', httpCodes.BAD_REQUEST));
    return;
  }

  const payload = {
    name,
    shortDescription,
    longDescription,
    details: JSON.parse(details),
    informationLinks: JSON.parse(informationLinks),
    manufacturer,
    type,
    createdBy: userId,
  };
  const product = await Product.create(payload);
  if (!product) {
    next(new ApiError('Failed to create new product!', httpCodes.INTERNAL_ERROR));
    return;
  }

  let photoResult = null;
  let videoResult = null;

  if (request.files && Object.keys(request.files).length && request.files['photo']) {
    photoResult = await uploadFile(product._id, userId, request, 'photo');
    if (!photoResult.success) {
      next(new ApiError(photoResult.error, httpCodes.INTERNAL_ERROR));
      return;
    }
  }

  if (request.files && Object.keys(request.files).length && request.files['video']) {
    videoResult = await uploadFile(product._id, userId, request, 'video');
    if (!videoResult.success) {
      next(new ApiError(videoResult.error, httpCodes.INTERNAL_ERROR));
      return;
    }
  }

  let updatedProduct = attachFileResultToProduct(photoResult, videoResult, product);

  response.status(httpCodes.CREATED).json({ success: true, data: { product: updatedProduct }, error: null });
});

/**
 * @description Update one product.
 */
const updateOne = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { productId } = request.params;
  const { name, shortDescription, longDescription, details, informationLinks, manufacturer, type, toBeDeleted } =
    request.body;

  const product = await Product.findOne({ _id: productId, isDeleted: false });
  if (!product) {
    next(new ApiError('Product not found!', httpCodes.NOT_FOUND));
    return;
  }

  if (name !== product.name) {
    const productExists = (await Product.countDocuments({ _id: { $ne: product._id }, name, isDeleted: false })) > 0;
    if (productExists) {
      next(new ApiError('Product with given name already exists!', httpCodes.BAD_REQUEST));
      return;
    }
  }

  const payload = {
    name,
    shortDescription,
    longDescription,
    details: JSON.parse(details),
    informationLinks: JSON.parse(informationLinks),
    manufacturer,
    type,
    lastEditBy: userId,
    lastEditAt: new Date(Date.now()),
  };
  const editedProduct = await Product.findOneAndUpdate(
    { _id: product._id },
    {
      $set: payload,
    },
    { new: true }
  );
  if (!editedProduct) {
    next(new ApiError('Failed to update product!', httpCodes.INTERNAL_ERROR));
    return;
  }

  let photoResult = null;
  let videoResult = null;

  const toParse = toBeDeleted && toBeDeleted.length ? toBeDeleted : {};
  const deleteInfo = JSON.parse(toParse);
  if (deleteInfo['photo']) {
    editedProduct.photo = null;
    await editedProduct.save();
  }

  if (deleteInfo['video']) {
    editedProduct.video = null;
    await editedProduct.save();
  }

  if (request.files && Object.keys(request.files).length && request.files['photo']) {
    photoResult = await uploadFile(editedProduct._id, userId, request, 'photo');
    if (!photoResult.success) {
      next(new ApiError(photoResult.error, httpCodes.INTERNAL_ERROR));
      return;
    }
  }

  if (request.files && Object.keys(request.files).length && request.files['video']) {
    videoResult = await uploadFile(editedProduct._id, userId, request, 'video');
    if (!videoResult.success) {
      next(new ApiError(videoResult.error, httpCodes.INTERNAL_ERROR));
      return;
    }
  }

  let updatedProduct = attachFileResultToProduct(photoResult, videoResult, editedProduct);

  response.status(httpCodes.CREATED).json({ success: true, data: { product: updatedProduct }, error: null });
});

/**
 * @description Delete one product.
 */
const deleteOne = asyncHandler(async (request, response, next) => {
  const { _id: userId } = request.user;
  const { productId } = request.params;
  const product = await Product.findOne({ _id: productId, isDeleted: false });
  if (!product) {
    next(new ApiError('Product not found!', httpCodes.NOT_FOUND));
    return;
  }

  const deletedProduct = await Product.findOneAndUpdate(
    { _id: product._id },
    {
      $set: {
        isDeleted: true,
        lastEditBy: userId,
        lastEditAt: new Date(Date.now()),
      },
    },
    { new: true }
  );
  if (!deletedProduct) {
    next(new ApiError('Failed to delete product!', httpCodes.INTERNAL_ERROR));
    return;
  }

  response.status(httpCodes.OK).json({ success: true, data: { product: deletedProduct }, error: null });
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
    {
      dbField: 'type',
      queryField: 'type',
      type: 'array',
    },
    {
      dbField: 'manufacturer',
      queryField: 'manufacturer',
      type: 'array',
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

const attachFileResultToProduct = (photoResult, videoResult, product) => {
  let updatedProduct = null;
  if (photoResult && photoResult.success)
    updatedProduct = photoResult && photoResult.success && photoResult.data ? photoResult.data.updatedProduct : product;
  else if (videoResult && videoResult.success)
    updatedProduct = videoResult && videoResult.success && videoResult.data ? videoResult.data.updatedProduct : product;
  else updatedProduct = product;

  return updatedProduct;
};

const uploadFile = async (productId, userId, request, fileType) => {
  if (!request.files[fileType]) {
    return { success: false, data: null, error: `File name must be ${fileType}`, code: httpCodes.BAD_REQUEST };
  }

  const { data, mimetype, name, size } = request.files[fileType];

  const type = mimetype.split('/').pop();

  let allowedTypes = [];
  if (fileType === 'photo') allowedTypes = ['jpeg', 'jpg', 'png'];
  else if (fileType === 'video')
    allowedTypes = ['x-flv', 'mp4', 'x-mpegURL', 'MP2T', '3gpp', 'quicktime', 'x-msvideo', 'x-ms-wmv'];

  if (!allowedTypes.includes(type)) {
    return { success: false, data: null, error: `Wrong ${fileType} type!`, code: httpCodes.BAD_REQUEST };
  }

  const product = await Product.findOne({ _id: productId });
  if (!product) {
    return {
      success: false,
      data: null,
      error: 'Product not found!',
      code: httpCodes.INTERNAL_ERROR,
    };
  }

  if (product[fileType] && product[fileType].name === name) {
    return { success: true, data: { updatedProduct: product }, error: null, code: null };
  }

  const fileName = `${product._id}_${fileType}_${Date.now()}.${type}`;
  const filePath = path.join(__dirname, `../../public/products/${fileName}`);

  try {
    fs.writeFileSync(filePath, data, { encoding: 'utf-8' });
  } catch (error) {
    return { success: false, data: null, error: `Failed to upload ${fileType}!`, code: httpCodes.INTERNAL_ERROR };
  }

  const publicURL = isMode('production') ? process.env.PUBLIC_PROD_URL : process.env.PUBLIC_DEV_URL;
  const fileURL = `${publicURL}/products/${fileName}`;

  const updatedProduct = await Product.findOneAndUpdate(
    { _id: product._id },
    {
      $set: {
        [fileType]: {
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
  if (!updatedProduct) {
    return { success: false, data: null, error: `Failed to upload ${fileType}!`, code: httpCodes.INTERNAL_ERROR };
  }

  return { success: true, data: { updatedProduct }, error: null, code: null };
};
