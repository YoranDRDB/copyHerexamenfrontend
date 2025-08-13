export default {
  log: {
    disabled: false,
  },

  jwt: {
    expirationInterval: 60 * 60, // s (1 hour)
  },
  cors: {
    origins: ["http://localhost:3306"],
    maxAge: 3 * 60 * 60,
  },
  port: 9000,
};
