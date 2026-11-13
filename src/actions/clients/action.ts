"use server";

import { baseApi } from "../baseApi";

// The API returns the company's whole client list and ignores query
// parameters (no search, no pagination), so this takes none: one URL, one
// read, for the table and the project wizard's picker alike.
export const getClients = async () => {
  return await baseApi(`/clients`, {
    tag: "clients",
  });
};

export const addClient = async (data: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}) => {
  return await baseApi(`/clients`, {
    method: "POST",
    body: data,
    tag: "clients",
  });
};

export const editClient = async ({
  data,
  id,
}: {
  data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  id: number | undefined;
}) => {
  return await baseApi(`/clients/${id}`, {
    method: "PATCH",
    body: data,
    tag: "clients",
  });
};

export const deleteClient = async (id: number | undefined) => {
  return await baseApi(`/clients/${id}`, {
    method: "DELETE",
    tag: "clients",
  });
};
