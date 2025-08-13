import Router from "@koa/router";
import Joi from "joi";
import * as taskService from "../service/task";
import { requireAuthentication } from "../core/auth";
import validate from "../core/validation";
import type {
  KoaRouter,
  KoaContext,
  TaakBeheerState,
  TaakBeheerContext,
} from "../types/koa";
import type {
  CreateTaskInput,
  CreateTaskResponse,
  GetAllTasksResponse,
  GetTaskByIdResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
} from "../types/task";

/**
 * @api {get} /tasks Haal alle taken op
 * @apiName GetAllTasks
 * @apiGroup Tasks
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} [project_id] ID van het project.
 *
 * @apiSuccess {Object[]} items Lijst van taken.
 * @apiSuccess {Number} items.id ID van de taak.
 * @apiSuccess {Number} items.project_id ID van het project.
 * @apiSuccess {String} items.title Titel van de taak.
 * @apiSuccess {String} [items.description] Beschrijving van de taak.
 * @apiSuccess {String} items.status Status van de taak.
 * @apiSuccess {String} items.priority Prioriteit van de taak.
 * @apiSuccess {String} [items.due_date] Vervaldatum van de taak.
 *
 * @apiError {String} code Foutcode.
 * @apiError {String} message Foutmelding.
 */
const getAllTasks = async (ctx: KoaContext<GetAllTasksResponse>) => {
  const userId = ctx.state.session.userId;
  const projectId = ctx.request.query.project_id
    ? Number(ctx.request.query.project_id)
    : undefined;
  const items = await taskService.getAllForUser(userId, projectId);
  ctx.body = { items };
};
getAllTasks.validationScheme = {
  query: {
    project_id: Joi.number().integer().positive().optional(),
  },
};

/**
 * @api {post} /tasks Creëer een nieuwe taak
 * @apiName CreateTask
 * @apiGroup Tasks
 *
 * @apiHeader {String} Authorization Bearer token.
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "Authorization": "Bearer jwt.token.here"
 *     }
 *
 * @apiParamExample {json} Request-Body:
 *     {
 *       "project_id": 123,
 *       "title": "Nieuwe taak",
 *       "description": "Dit is een testtaak",
 *       "status": "open",
 *       "priority": "high",
 *       "due_date": "2024-12-31T23:59:59.000Z"
 *     }
 *
 * @apiParam {Number} project_id ID van het project.
 * @apiParam {String} title Titel van de taak.
 * @apiParam {String} [description] Beschrijving van de taak.
 * @apiParam {String="open","in_progress","done"} [status] Status van de taak.
 * @apiParam {String="low","medium","high"} [priority] Prioriteit van de taak.
 * @apiParam {Date} [due_date] Vervaldatum van de taak.
 *
 * @apiSuccess {Number} id ID van de aangemaakte taak.
 * @apiSuccess {Number} project_id ID van het project.
 * @apiSuccess {String} title Titel van de taak.
 * @apiSuccess {String} [description] Beschrijving van de taak.
 * @apiSuccess {String="open","in_progress","done"} status Status van de taak.
 * @apiSuccess {String="low","medium","high"} priority Prioriteit van de taak.
 * @apiSuccess {Date} [due_date] Vervaldatum van de taak.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "id": 456,
 *       "project_id": 123,
 *       "title": "Nieuwe taak",
 *       "description": "Dit is een testtaak",
 *       "status": "open",
 *       "priority": "high",
 *       "due_date": "2024-12-31T23:59:59.000Z"
 *     }
 *
 * @apiError {String} code Foutcode.
 * @apiError {String} message Foutmelding.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "VALIDATION_FAILED",
 *       "message": "Het veld 'title' is verplicht."
 *     }
 */
const createTask = async (
  ctx: KoaContext<CreateTaskResponse, void, CreateTaskInput>
) => {
  const userId = ctx.state.session.userId;
  const newTask = await taskService.create(userId, ctx.request.body);
  ctx.status = 201;
  ctx.body = newTask;
};
createTask.validationScheme = {
  body: {
    project_id: Joi.number().integer().positive().required(),
    title: Joi.string().min(1).required(),
    description: Joi.string().optional(),
    status: Joi.string().valid("open", "in_progress", "done").optional(),
    priority: Joi.string().valid("low", "medium", "high").optional(),
    due_date: Joi.date().iso().optional(),
  },
};

/**
 * @api {get} /tasks/:id Haal een specifieke taak op
 * @apiName GetTaskById
 * @apiGroup Tasks
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID van de taak.
 *
 * @apiSuccess {Number} id ID van de taak.
 * @apiSuccess {Number} project_id ID van het project.
 * @apiSuccess {String} title Titel van de taak.
 * @apiSuccess {String} [description] Beschrijving van de taak.
 * @apiSuccess {String} status Status van de taak.
 * @apiSuccess {String} priority Prioriteit van de taak.
 * @apiSuccess {String} [due_date] Vervaldatum van de taak.
 *
 * @apiError {String} code Foutcode.
 * @apiError {String} message Foutmelding.
 */
const getTaskById = async (
  ctx: KoaContext<GetTaskByIdResponse, { id: number }>
) => {
  const userId = ctx.state.session.userId;
  const task = await taskService.getByIdForUser(ctx.params.id, userId);
  ctx.body = task;
};
getTaskById.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
};

/**
 * @api {put} /tasks/:id Update een specifieke taak
 * @apiName UpdateTask
 * @apiGroup Tasks
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID van de taak.
 * @apiParam {String} [title] Nieuwe titel van de taak.
 * @apiParam {String} [description] Nieuwe beschrijving van de taak.
 * @apiParam {String} [status] Nieuwe status van de taak (open, in_progress, done).
 * @apiParam {String} [priority] Nieuwe prioriteit van de taak (low, medium, high).
 * @apiParam {Date} [due_date] Nieuwe vervaldatum van de taak.
 *
 * @apiSuccess {Number} id ID van de taak.
 * @apiSuccess {Number} project_id ID van het project.
 * @apiSuccess {String} title Titel van de taak.
 * @apiSuccess {String} [description] Beschrijving van de taak.
 * @apiSuccess {String} status Status van de taak.
 * @apiSuccess {String} priority Prioriteit van de taak.
 * @apiSuccess {String} [due_date] Vervaldatum van de taak.
 *
 * @apiError {String} code Foutcode.
 * @apiError {String} message Foutmelding.
 */
const updateTask = async (
  ctx: KoaContext<UpdateTaskResponse, { id: number }, UpdateTaskRequest>
) => {
  const { userId, role } = ctx.state.session;
  const task = await taskService.updateById(
    ctx.params.id,
    userId,
    role,
    ctx.request.body
  );
  ctx.body = task;
};
updateTask.validationScheme = {
  params: { id: Joi.number().integer().positive().required() },
  body: {
    title: Joi.string().min(1).optional(),
    description: Joi.string().optional(),
    status: Joi.string().valid("open", "in_progress", "done").optional(),
    priority: Joi.string().valid("low", "medium", "high").optional(),
    due_date: Joi.date().iso().optional(),
  },
};

/**
 * @api {delete} /tasks/:id Verwijder een specifieke taak
 * @apiName DeleteTask
 * @apiGroup Tasks
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID van de taak.
 *
 * @apiSuccessExample {json} Succesrespons:
 *     HTTP/1.1 204 No Content
 *
 * @apiError {String} code Foutcode.
 * @apiError {String} message Foutmelding.
 */
const deleteTask = async (ctx: KoaContext<void, { id: number }>) => {
  const { userId, role } = ctx.state.session;
  await taskService.deleteById(ctx.params.id, userId, role);
  ctx.status = 204;
};
deleteTask.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
};

export default (parent: KoaRouter) => {
  const router = new Router<TaakBeheerState, TaakBeheerContext>({
    prefix: "/tasks",
  });
  router.use(requireAuthentication);
  router.get("/", validate(getAllTasks.validationScheme), getAllTasks);
  router.post("/", validate(createTask.validationScheme), createTask);
  router.get("/:id", validate(getTaskById.validationScheme), getTaskById);
  router.put("/:id", validate(updateTask.validationScheme), updateTask);
  router.delete("/:id", validate(deleteTask.validationScheme), deleteTask);

  parent.use(router.routes()).use(router.allowedMethods());
};
