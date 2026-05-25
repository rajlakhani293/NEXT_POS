import Cookies from "js-cookie";

export const prepareHeadersWithToken = (headers: Headers) => {
  const token = Cookies.get("token");
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  headers.set("ngrok-skip-browser-warning", "true");
  return headers;
};

const getMutationBody = (body: any) => {
  return body;
};

export const postMutation = (url: string) => (body: any) => {
  return {
    url,
    method: "POST",
    body: getMutationBody(body),
  };
};

export const getMutation = (url: string, params?: Record<string, any>) => ({
    url,
    method: "GET",
    params: params,
});

export const createMutation = (url: string) => (body: any) => {
  return {
    url,
    method: "POST",
    body: getMutationBody(body),
  };
};

export const deleteMutation = (url: string) => (body: any) => {
  return {
    url,
    method: "DELETE",
    body: getMutationBody(body),
  };
};

export const patchMutation = (url: string, body: any) => {
  return {
    url,
    method: "PATCH",
    body: getMutationBody(body),
  };
};

export const putMutation = (url: string, body: any) => {
  return {
    url,
    method: "PUT",
    body: getMutationBody(body),
  };
};