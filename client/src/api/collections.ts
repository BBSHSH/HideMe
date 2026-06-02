import { apiGet, apiPost } from "./client";
import type { Collection } from "../data/files";

export type CreateCollectionInput = {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
};

export const listCollections = () =>
  apiGet<{ items: Collection[] }>("/v1/collections");

export const createCollection = (input: CreateCollectionInput) =>
  apiPost<Collection>("/v1/collections", input);

export const updateCollection = (id: string, input: CreateCollectionInput) =>
  apiPost<{ updated: boolean }>(`/v1/collections/${id}`, input);

export const deleteCollection = (id: string) =>
  apiPost<{ deleted: boolean }>(`/v1/collections/${id}`, {});