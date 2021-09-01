import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import Hashids from "hashids";
import { NextFunction } from "express";
import UserWithThatEmailAlreadyExistsException from "../exceptions/UserWithThatEmailAlreadyExistsException";
import WrongCredentialsException from "../exceptions/WrongCredentialsException";
import DataStoredInToken from "../interfaces/dataStoredInToken";
import TokenData from "../interfaces/tokenData.interface";
import CreateUserDto from "../user/user.dto";
import User from "../user/user.interface";
import userModel from "./../user/user.model";
import email_sender from "../middleware/email.middleware";
import _ from "lodash";

const hashids = new Hashids();

class AuthenticationService {
  public user = userModel;

  public async register(userData: CreateUserDto, next?: NextFunction) {
    if (await this.user.findOne({ email: userData.email })) {
      throw new UserWithThatEmailAlreadyExistsException(userData.email);
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const deHyphenatedUUID = uuidv4().replace(/-/gi, "");
    const encodedId = hashids.encodeHex(deHyphenatedUUID);
    const token = jwt.sign(
      { email: userData.email, firstName: userData.firstName },
      process.env.JWT_ACCOUNT_ACTIVATION,
      {
        expiresIn: "120m",
      }
    );
    const user = await this.user.create({
      ...userData,
      password: hashedPassword,
      userCode: encodedId,
      confirmationCode: token,
    });

    const subject = `Account Activation Link`;
    const content = `
    <p>Please use the following link to activate your acccount:</p>
    <p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
    <hr />
    <p>This email may contain sensetive information</p>
          `;
    email_sender(subject, userData.email, content, "any", user.firstName);

    if (user) {
      return {
        encodedId,
      };
    } else {
      next(new WrongCredentialsException());
    }
  }
  public createCookie(tokenData: TokenData) {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}`;
  }
  public createToken(user: User): TokenData {
    const expiresIn = 60 * 60 * 24; // an hour
    const secret = process.env.JWT_SECRET;
    const refreshToken = jwt.sign(uuidv4(), secret);
    const dataStoredInToken: DataStoredInToken = {
      _id: user._id,
    };
    return {
      expiresIn,
      refreshToken,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn }),
    };
  }
}

export default AuthenticationService;
