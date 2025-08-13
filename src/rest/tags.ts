import Router from "@koa/router";
import Joi from "joi";
import * as tagService from "../service/tag";
import type {
  KoaRouter,
  KoaContext,
  TaakBeheerState,
  TaakBeheerContext,
} from "../types/koa";
import type {
  CreateTagRequest,
  CreateTagResponse,
  GetAllTagsResponse,
  GetTagByIdResponse,
  UpdateTagRequest,
  UpdateTagResponse,
} from "../types/tag";
import { requireAuthentication } from "../core/auth";
import validate from "../core/validation";

/**
 * @api {get} /tags Retrieve all tags
 * @apiName GetAllTags
 * @apiGroup Tags
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiSuccess {Object[]} items List of tags.
 * @apiSuccess {Number} items.id Tag ID.
 * @apiSuccess {String} items.name Tag name.
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 */
const getAllTags = async (ctx: KoaContext<GetAllTagsResponse>) => {
  const items = await tagService.getAll();
  ctx.body = { items };
};
getAllTags.validationScheme = null;

/**
 * @api {post} /tags Create a new tag
 * @apiName CreateTag
 * @apiGroup Tags
 *
 * @apiHeader {String} Authorization Bearer token.
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "Authorization": "Bearer jwt.token.here"
 *     }
 *
 * @apiParamExample {json} Request-Body:
 *     {
 *       "name": "Important"
 *     }
 *
 * @apiSuccess {Number} id ID of the created tag.
 * @apiSuccess {String} name Name of the created tag.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "id": 1,
 *       "name": "Important"
 *     }
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "VALIDATION_FAILED",
 *       "message": "The tag name is required."
 *     }
 */
const createTag = async (
  ctx: KoaContext<CreateTagResponse, void, CreateTagRequest>
) => {
  const newTag = await tagService.create(ctx.request.body);
  ctx.status = 201;
  ctx.body = newTag;
};
createTag.validationScheme = {
  body: {
    name: Joi.string().min(1).required(),
  },
};

/**
 * @api {get} /tags/:id Retrieve a tag by ID
 * @apiName GetTagById
 * @apiGroup Tags
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID of the tag.
 *
 * @apiSuccess {Number} id ID of the tag.
 * @apiSuccess {String} name Name of the tag.
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 */
const getTagById = async (
  ctx: KoaContext<GetTagByIdResponse, { id: number }>
) => {
  const tag = await tagService.getById(ctx.params.id);
  ctx.body = tag;
};
getTagById.validationScheme = {
  params: { id: Joi.number().integer().positive().required() },
};

/**
 * @api {put} /tags/:id Update a tag by ID
 * @apiName UpdateTag
 * @apiGroup Tags
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID of the tag.
 * @apiParam {String} [name] New name for the tag.
 *
 * @apiSuccess {Number} id ID of the updated tag.
 * @apiSuccess {String} name Name of the updated tag.
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 */
const updateTag = async (
  ctx: KoaContext<UpdateTagResponse, { id: number }, UpdateTagRequest>
) => {
  const tag = await tagService.updateById(ctx.params.id, ctx.request.body);
  ctx.body = tag;
};
updateTag.validationScheme = {
  params: { id: Joi.number().integer().positive().required() },
  body: { name: Joi.string().min(1).optional() },
};

/**
 * @api {delete} /tags/:id Delete a tag by ID
 * @apiName DeleteTag
 * @apiGroup Tags
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID of the tag.
 *
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 204 No Content
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 */
const deleteTag = async (ctx: KoaContext<void, { id: number }>) => {
  await tagService.deleteById(ctx.params.id);
  ctx.status = 204;
};
deleteTag.validationScheme = {
  params: { id: Joi.number().integer().positive().required() },
};

/**
 * Registers all tag-related routes on the given parent router.
 *
 * @param {KoaRouter} parent The parent router to register the routes on.
 */
export default (parent: KoaRouter) => {
  const router = new Router<TaakBeheerState, TaakBeheerContext>({
    prefix: "/tags",
  });

  router.use(requireAuthentication);

  router.get("/", validate(getAllTags.validationScheme), getAllTags);
  router.post("/", validate(createTag.validationScheme), createTag);
  router.get("/:id", validate(getTagById.validationScheme), getTagById);
  router.put("/:id", validate(updateTag.validationScheme), updateTag);
  router.delete("/:id", validate(deleteTag.validationScheme), deleteTag);
  parent.use(router.routes()).use(router.allowedMethods());
};
