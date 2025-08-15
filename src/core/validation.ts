// src/core/validation.ts
import type { Middleware } from "koa";
import Joi from "joi";
import type { KoaContext } from "../types/koa";

interface ValidationScheme {
  params?: Record<string, Joi.Schema>;
  query?: Record<string, Joi.Schema>;
  body?: Record<string, Joi.Schema>;
}

const JOI_OPTIONS: Joi.ValidationOptions = {
  abortEarly: true, // Stop bij de eerste fout
  allowUnknown: false, // Sta geen onbekende velden toe
  convert: true, // Converteer waarden naar hun types (number, Date, ...)
  presence: "required", // Vereis standaard alle velden
};

// Functie om Joi-fouten schoon te maken
const cleanupJoiError = (error: Joi.ValidationError) => {
  const errorDetails = error.details.reduce(
    (resultObj, { message, path, type }) => {
      const joinedPath = path.join(".") || "value";

      // Gebruik een tijdelijke variabele om de array te beheren
      let errorsAtPath = resultObj.get(joinedPath);
      if (!errorsAtPath) {
        errorsAtPath = [];
        resultObj.set(joinedPath, errorsAtPath);
      }
      errorsAtPath.push({
        type,
        message,
      });

      return resultObj;
    },
    new Map<string, Array<{ type: string; message: string }>>()
  );

  return Object.fromEntries(errorDetails);
};

function validate(schema: ValidationScheme | null): Middleware<KoaContext> {
  return async (ctx, next) => {
    if (!schema) return next();

    // Correcte destructurering van params, query en body
    const { params } = ctx;
    const { query, body } = ctx.request;

    const errors = new Map<string, any>();

    // Validatie van params
    if (schema.params) {
      const { error, value } = Joi.object(schema.params).validate(
        params,
        JOI_OPTIONS
      );
      if (error) {
        errors.set("params", cleanupJoiError(error));
      } else {
        ctx.params = value;
      }
    }

    // Validatie van query
    if (schema.query) {
      const { error, value } = Joi.object(schema.query).validate(
        query,
        JOI_OPTIONS
      );
      if (error) {
        errors.set("query", cleanupJoiError(error));
      } else {
        ctx.request.query = value;
      }
    }

    // Validatie van body
    if (schema.body) {
      const { error, value } = Joi.object(schema.body).validate(
        body,
        JOI_OPTIONS
      );
      if (error) {
        errors.set("body", cleanupJoiError(error));
      } else {
        ctx.request.body = value;
      }
    }

    // Als er fouten zijn, gooi dan een 400 fout met details
    if (errors.size > 0) {
      // pick the first message from Joi details
      const first = [...errors.values()][0];
      let message = "Validation failed";
      if (Array.isArray(first) && first[0]?.message) message = first[0].message;
      else if (typeof first === "string") message = first;

      ctx.throw(400, message, {
        code: "VALIDATION_FAILED",
        details: Object.fromEntries(errors),
      });
    }

    return next();
  };
}

export default validate;
