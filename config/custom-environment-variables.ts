export default {
  env: "NODE_ENV",
  auth: {
    jwt: {
      secret: "AUTH_JWT_SECRET",
      audience: "AUTH_JWT_AUDIENCE",
      issuer: "AUTH_JWT_ISSUER",
      expirationInterval: "AUTH_JWT_EXPIRATION",
    },
  },
  port: "PORT",
  cors: { origins: "CORS_ORIGINS" },
};
