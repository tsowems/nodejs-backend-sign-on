import { NextFunction, Response } from "express";
import * as jwt from "jsonwebtoken";
import AuthenticationTokenMissingException from "../exceptions/AuthenticationTokenMissingException";
import WrongAuthenticationTokenException from "../exceptions/WrongAuthenticationTokenException";
import NotAuthorizedException from "../exceptions/NotAuthorizedException";
import DataStoredInToken from "../interfaces/dataStoredInToken";
import RequestWithUser from "../interfaces/requestWithUser.interface";
import userModel from "../user/user.model";

async function authMiddleware(request: RequestWithUser, response: Response, next: NextFunction) {
  const cookies = request.headers;
  const bearerHeader = request.headers["authorization"];
  const bearer = bearerHeader.split(" ");
  const bearerToken = bearer[1];
  if (cookies && bearerToken) {
    const secret = process.env.JWT_SECRET;
    try {
      const verificationResponse = jwt.verify("" + bearerToken, secret) as DataStoredInToken;
      const id = verificationResponse._id;
      const user = await userModel.findById(id).select("-password");
      if (user.userRole == 'Admin') {
        request.user = user;
        next();
      } else {
        next(new NotAuthorizedException());
      }
    } catch (error) {
      next(new WrongAuthenticationTokenException());
    }
  } else {
    next(new AuthenticationTokenMissingException());
  }
}

export default authMiddleware;
