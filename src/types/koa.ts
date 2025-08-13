// src/types/koa.ts
import type { ParameterizedContext } from "koa";
import type Application from "koa";
import type Router from "@koa/router";
import type { SessionInfo } from "./auth";

export interface TaakBeheerState {
  session: SessionInfo;
}

export interface TaakBeheerContext<
  Params = unknown,
  RequestBody = unknown,
  Query = unknown
> {
  request: {
    body: RequestBody;
    query: Query;
  };
  params: Params;
}

export type KoaContext<
  ResponseBody = unknown,
  Params = unknown,
  RequestBody = unknown,
  Query = unknown
> = ParameterizedContext<
  TaakBeheerState,
  TaakBeheerContext<Params, RequestBody, Query>,
  ResponseBody
>;
export interface KoaApplication
  extends Application<TaakBeheerState, TaakBeheerContext> {}

export interface KoaRouter extends Router<TaakBeheerState, TaakBeheerContext> {}
