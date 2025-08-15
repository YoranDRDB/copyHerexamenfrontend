import Router from "@koa/router";
import Joi from "joi";
import * as projectService from "../service/project";
import type {
  KoaRouter,
  KoaContext,
  TaakBeheerState,
  TaakBeheerContext,
} from "../types/koa";
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  GetAllProjectsResponse,
  GetProjectByIdResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
} from "../types/project";
import validate from "../core/validation";
import { requireAuthentication } from "../core/auth";

/**
 * @api {get} /projects Haal alle projecten op
 * @apiName GetAllProjects
 * @apiGroup Projects
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiSuccess {Object[]} items Lijst van projecten.
 * @apiSuccess {Number} items.id ID van het project.
 * @apiSuccess {String} items.name Naam van het project.
 * @apiSuccess {String} [items.description] Beschrijving van het project.
 *
 * @apiError {String} code Foutcode.
 * @apiError {String} message Foutmelding.
 */
const getAllProjects = async (ctx: KoaContext<GetAllProjectsResponse>) => {
  const userId = ctx.state.session.userId;
  const items = await projectService.getAllForUser(userId);
  ctx.body = { items };
};
getAllProjects.validationScheme = null;

/**
 * @api {post} /projects Creëer een nieuw project
 * @apiName CreateProject
 * @apiGroup Projects
 *
 * @apiHeader {String} Authorization Bearer token.
 * @apiHeader {String} Content-Type application/json.
 *
 * @apiParam {String} name Naam van het project.
 * @apiParam {String} [description] Beschrijving van het project.
 * @apiParamExample {json} Request-Body:
 *     {
 *       "name": "Nieuw Project",
 *       "description": "Beschrijving van het nieuwe project"
 *     }
 * @apiSuccess {Number} id ID van het aangemaakte project.
 * @apiSuccess {String} name Naam van het project.
 * @apiSuccess {String} [description] Beschrijving van het project.
 * @apiSuccessExample {json} Succesrespons:
 *     HTTP/1.1 201 Created
 *     {
 *       "id": 123,
 *       "name": "Nieuw Project",
 *       "description": "Beschrijving van het nieuwe project"
 *     }
 * @apiError {String} code Foutcode.
 * @apiError {String} message Foutmelding.
 * @apiErrorExample {json} Foutrespons:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "VALIDATION_FAILED",
 *       "message": "Naam van het project is verplicht."
 *     }
 */

const createProject = async (
  ctx: KoaContext<CreateProjectResponse, void, CreateProjectRequest>
) => {
  const userId = ctx.state.session.userId;
  const newProject = await projectService.create(userId, ctx.request.body);
  ctx.status = 201;
  ctx.body = newProject;
};
createProject.validationScheme = {
  body: {
    name: Joi.string().required(),
    description: Joi.string().allow(null, ""),
  },
};

/**
 * @api {get} /projects/:id Haal een specifiek project op
 * @apiName GetProjectById
 * @apiGroup Projects
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID van het project.
 *
 * @apiSuccess {Number} id ID van het project.
 * @apiSuccess {String} name Naam van het project.
 * @apiSuccess {String} [description] Beschrijving van het project.
 *
 * @apiError {String} code Foutcode.
 * @apiError {String} message Foutmelding.
 */
const getProjectById = async (
  ctx: KoaContext<GetProjectByIdResponse, { id: number }>
) => {
  const userId = ctx.state.session.userId;
  const project = await projectService.getByIdForUser(ctx.params.id, userId);
  ctx.body = project;
};
getProjectById.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {put} /projects/:id Update een specifiek project
 * @apiName UpdateProject
 * @apiGroup Projects
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID van het project.
 * @apiParam {String} [name] Naam van het project.
 * @apiParam {String} [description] Beschrijving van het project.
 *
 * @apiSuccess {Number} id ID van het project.
 * @apiSuccess {String} name Naam van het project.
 * @apiSuccess {String} [description] Beschrijving van het project.
 *
 * @apiError {String} code Foutcode.
 * @apiError {String} message Foutmelding.
 */
const updateProject = async (
  ctx: KoaContext<UpdateProjectResponse, { id: number }, UpdateProjectRequest>
) => {
  const { userId, role } = ctx.state.session;
  const project = await projectService.updateById(
    ctx.params.id,
    userId,
    role,
    ctx.request.body
  );
  ctx.body = project;
};
updateProject.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
  body: {
    name: Joi.string().optional(),
    description: Joi.string().optional(),
  },
};

/**
 * @api {delete} /projects/:id Verwijder een specifiek project
 * @apiName DeleteProject
 * @apiGroup Projects
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID van het project.
 *
 * @apiSuccessExample {json} Succesrespons:
 *     HTTP/1.1 204 No Content
 *
 * @apiError {String} code Foutcode.
 * @apiError {String} message Foutmelding.
 */
const deleteProject = async (ctx: KoaContext<void, { id: number }>) => {
  const { userId, role } = ctx.state.session;
  await projectService.deleteById(ctx.params.id, userId, role);
  ctx.status = 204;
};
deleteProject.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
};

export default (parent: KoaRouter) => {
  const router = new Router<TaakBeheerState, TaakBeheerContext>({
    prefix: "/projects",
  });

  router.use(requireAuthentication);

  router.get("/", validate(getAllProjects.validationScheme), getAllProjects);
  router.post("/", validate(createProject.validationScheme), createProject);
  router.get("/:id", validate(getProjectById.validationScheme), getProjectById);
  router.put("/:id", validate(updateProject.validationScheme), updateProject);
  router.delete(
    "/:id",
    validate(deleteProject.validationScheme),
    deleteProject
  );

  parent.use(router.routes()).use(router.allowedMethods());
};
