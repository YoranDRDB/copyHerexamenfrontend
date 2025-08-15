import type supertest from "supertest";

type Credentials = {
  email: string;
  password: string;
};

const loginWithCredentials = async (
  supertestAgent: supertest.Agent,
  credentials: Credentials
): Promise<string> => {
  const response = await supertestAgent.post("/api/sessions").send(credentials);

  if (response.statusCode !== 200) {
    throw new Error(response.body.message || "Unknown error occurred");
  }

  return `Bearer ${response.body.token}`;
};
export const login = async (supertestAgent: supertest.Agent): Promise<string> =>
  loginWithCredentials(supertestAgent, {
    email: "test.user@hogent.be",
    password: "12345678",
  });

export const loginAdmin = async (
  supertestAgent: supertest.Agent
): Promise<string> =>
  loginWithCredentials(supertestAgent, {
    email: "admin.user@hogent.be",
    password: "12345678",
  });
