import jwt from "jsonwebtoken";
import ServiceError from "../core/serviceError";
import { prisma } from "../data";
import { hashPassword, verifyPassword } from "../core/password";
import { generateJWT, verifyJWT } from "../core/jwt";
import { getLogger } from "../core/logging";
import Role from "../core/roles";
import type {
  User,
  UserCreateInput,
  UserUpdateInput,
  PublicUser,
} from "../types/user";
import type { SessionInfo } from "../types/auth";
import handleDBError from "./_handleDBError";

const makeExposedUser = ({ id, username, email }: User): PublicUser => ({
  id,
  username,
  email,
});

export const checkAndParseSession = async (
  authHeader?: string
): Promise<SessionInfo> => {
  if (!authHeader) {
    throw ServiceError.unauthorized("You need to be signed in");
  }

  if (!authHeader.startsWith("Bearer ")) {
    throw ServiceError.unauthorized("Invalid authentication token");
  }

  const authToken = authHeader.substring(7);

  try {
    const { role, sub } = await verifyJWT(authToken);

    return {
      userId: Number(sub),
      role,
    };
  } catch (error: any) {
    getLogger().error(error.message, { error });

    if (error instanceof jwt.TokenExpiredError) {
      throw ServiceError.unauthorized("The token has expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw ServiceError.unauthorized(
        `Invalid authentication token: ${error.message}`
      );
    } else {
      throw ServiceError.unauthorized(error.message);
    }
  }
};

export const checkRole = (requiredRole: string, userRole: string): void => {
  // Eenvoudige check of de userRole overeenkomt met requiredRole
  if (userRole !== requiredRole) {
    throw ServiceError.forbidden(
      "Je hebt niet de juiste rechten voor deze actie"
    );
  }
};

export const login = async (
  email: string,
  password: string
): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Geef geen specifieke info prijs over email of password
    throw ServiceError.unauthorized(
      "The given email and password do not match"
    );
  }

  const passwordValid = await verifyPassword(password, user.passwordhash);

  if (!passwordValid) {
    throw ServiceError.unauthorized(
      "The given email and password do not match"
    );
  }

  return await generateJWT(user);
};

export const register = async ({
  username,
  email,
  password,
}: UserCreateInput): Promise<string> => {
  try {
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordhash: passwordHash,
        role: Role.USER,
      },
    });

    if (!user) {
      throw ServiceError.internalServerError(
        "An unexpected error occured when creating the user"
      );
    }

    return await generateJWT(user);
  } catch (error: any) {
    throw handleDBError(error);
  }
};

export const getAll = async (): Promise<PublicUser[]> => {
  const users = await prisma.user.findMany();
  return users.map(makeExposedUser);
};

export const getById = async (id: number): Promise<PublicUser> => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw ServiceError.notFound("No user with this id exists");
  }

  return makeExposedUser(user);
};

export const updateById = async (
  id: number,
  changes: UserUpdateInput
): Promise<PublicUser> => {
  try {
    const data: Record<string, any> = { ...changes };

    // Als password moet worden aangepast, eerst hashen
    if (changes.password) {
      data.passwordhash = await hashPassword(changes.password);
      delete data.password; // password niet direct saven
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });
    return makeExposedUser(user);
  } catch (error) {
    throw handleDBError(error);
  }
};

export const deleteById = async (id: number): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id } });
  } catch (error) {
    throw handleDBError(error);
  }
};
