import * as bcrypt from "bcrypt";
import { Request, Response, NextFunction, Router } from "express";
import * as jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import Hashids from "hashids";
import WrongCredentialsException from "../exceptions/WrongCredentialsException";
import Controller from "../interfaces/controller.interface";
import DataStoredInToken from "../interfaces/dataStoredInToken";
import TokenData from "../interfaces/tokenData.interface";
import validationMiddleware from "../middleware/validation.middleware";
import email_sender from "../middleware/email.middleware";
import CreateUserDto from "../user/user.dto";
import User from "../user/user.interface";
import userModel from "./../user/user.model";
import AuthenticationService from "./authentication.service";
import LogInDto from "./logIn.dto";
import Authorize from "./authorize.dto";
//const { OAuth2Client } = require("google-auth-library");

import _ from "lodash";

const hashids = new Hashids();
//const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
class AuthenticationController implements Controller {
  public path = "/api/auth";
  public router = Router();
  public authenticationService = new AuthenticationService();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.put(`${this.path}/forgot-password`, this.forgetPassword);
    this.router.put(`${this.path}/reset-password`, this.resetPassword);
    this.router.post(
      `${this.path}/register`,
      validationMiddleware(CreateUserDto),
      this.registration
    );
    this.router.post(`${this.path}/activate`, this.activateAccount);
    this.router.post(`${this.path}/activation-email`, this.activationEmail);
    this.router.post(`${this.path}/signin`, validationMiddleware(LogInDto), this.loggingIn);
    //this.router.post(`${this.path}/google-login`, this.googleLoggingIn);
    this.router.post(
      `${this.path}/authorize`,
      validationMiddleware(Authorize),
      this.authorizeUser
    );
    this.router.post(`${this.path}/authcode`, this.authUser);
    this.router.post(`${this.path}/refresh-token`, this.refresh_token);

    this.router.post(`${this.path}/logout`, this.loggingOut);
    this.router.get(`${this.path}/signout`, this.loggingOut);
  }

  private findOrigin(allowed: any, redirect_url: string) {
    return allowed.indexOf(redirect_url);
  }

  private registration = async (request: Request, response: Response, next: NextFunction) => {
    const origin = process.env.ALLOWED_ORIGIN;
    const userData: CreateUserDto = request.body;
    const redirect_url = request.body.redirect_url;
    const allowed = origin.split(",");
    const domainresp = this.findOrigin(allowed, redirect_url);

    try {
      if ((redirect_url && domainresp >= 0) || !redirect_url) {
        const { encodedId } = await this.authenticationService.register(userData);
        response.send({
          userCode: encodedId,
          redirect_url: redirect_url,
          email: request.body.email,
        });
      } else {
        response.send({
          message: "You are not Authorized",
        });
      }
    } catch (error) {
    console.log(error)
      return response.status(400).send({ message: "Unable to register user, email already exist" });
    }
  };

  private loggingIn = async (request: Request, response: Response, next: NextFunction) => {
    const origin = process.env.ALLOWED_ORIGIN;
    const redirect_url = request.body.redirect_url;
    const allowed = origin.split(",");
    const domainresp = this.findOrigin(allowed, redirect_url);
    
    if ((redirect_url && domainresp >= 0) || !redirect_url) {
      const logInData: LogInDto = request.body;
      const user = await this.user.findOne({ email: logInData.email });
      if (user) {
        if (user.status == "Active") {
          const isPasswordMatching = await bcrypt.compare(
            logInData.password,
            user.get("password", null, { getters: false })
          );
          if (isPasswordMatching) {
            const deHyphenatedUUID = uuidv4().replace(/-/gi, "");
            const encodedId = hashids.encodeHex(deHyphenatedUUID);
            const updated = await this.user.findByIdAndUpdate(
              user._id,
              { userCode: encodedId },
              { new: true }
            );
            if (updated) {
              response.send({
                userCode: encodedId,
                email: logInData.email,
                redirect_url: redirect_url ? redirect_url : "",
              });
            }
          } else {
            next(new WrongCredentialsException());
          }
        } else {
          response.send({
            message: "Please activate your account or click for new confirmation email",
          });
        }
      } else {
        next(new WrongCredentialsException());
      }
    } else {
      response.send({
        message: "You are not Authorized",
      });
    }
  };

  private activateAccount = async (request: any, response: Response, next: NextFunction) => {
    try{
    const token = request.body.token;
    if (token) {
      jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (err: Error, decoded: any) {
        if (err) {
          return response.status(401).json({
            error: "Expired link. Signup again",
          });
        }
        userModel.findOne({ confirmationCode: token }, (err: Error, user: any) => {
          if (err || !user) {
            return response.status(401).json({
              error: "Something went wrong. Possible you've verified account already. Try to login",
            });
          }
          const updatedFields = {
            status: "Active",
            confirmationCode: "",
          };

          user = _.extend(user, updatedFields);

          user.save((err: Error, result: any) => {
            if (err) {
              return response.status(400).json({
                error: "Cannot activate account at the moment",
              });
            }
            response.json({
              message: "Great, account activated",
            });
          });
        });
      });
    }
  } catch (err) {
    return response.status(400).send({ message: "unable to activate account" });
  }
}

  private authorizeUser = async (request: Request, response: Response, next: NextFunction) => {
    const { code, email } = request.body;
    const user = await this.user.findOne({ email, userCode: code });
    if (user) {
      const token = this.createToken(user);
      await this.user.findByIdAndUpdate(user._id, {
        refreshToken: token.refreshToken,
      });
      response.setHeader("Set-Cookie", [this.createCookie(token)]);
      response.send({ user, token });
    } else {
      next(new WrongCredentialsException());
    }
  };

  private authUser = async (request: Request, response: Response, next: NextFunction) => {
    const { code } = request.body;
    const user = await this.user.findOne({ userCode: code });
    if (user) {
      const token = this.createToken(user);
      await this.user.findByIdAndUpdate(user._id, {
        refreshToken: token.refreshToken,
      });
      response.setHeader("Set-Cookie", [this.createCookie(token)]);
      response.send({ user, token });
    } else {
      next(new WrongCredentialsException());
    }
  };

  private loggingOut = (request: Request, response: Response) => {
    response.setHeader("Set-Cookie", ["Authorization=;Max-age=0"]);
    response.send(200);
  };

  // private googleLoggingIn = (req: any, res: any) => {
  //   const idToken = req.body.tokenId;
  //   const redirect_url = req.body.redirect_url;

  //   client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID }).then(
  //     (respo: {
  //       payload: {
  //         email_verified: any;
  //         familyName: any;
  //         name: any;
  //         email: any;
  //         givenName: any;
  //         picture: any;
  //         jti: any;
  //       };
  //     }) => {
  //       const { email_verified, email, name, picture, jti } = respo.payload;
  //       const fullname = name.split(/[ ,]+/);
  //       const givenName = fullname[0];
  //       const familyName = fullname[1];
  //       if (email_verified) {
  //         this.user.findOne({ email }).exec(async (err, user) => {
  //           if (user) {
  //             const deHyphenatedUUID = uuidv4().replace(/-/gi, "");
  //             const encodedId = hashids.encodeHex(deHyphenatedUUID);
  //             const updated = await this.user.findByIdAndUpdate(
  //               user._id,
  //               { userCode: encodedId },
  //               { new: true }
  //             );
  //             if (updated) {
  //               res.send({
  //                 userCode: encodedId,
  //                 email: email,
  //                 redirect_url: redirect_url ? redirect_url : "",
  //               });
  //             }
  //             res.send({ message: "Unable to login at the moment" });
  //           } else {
  //             const password = jti;
  //             user = new this.user({
  //               firstName: givenName,
  //               lastName: familyName,
  //               email,
  //               password,
  //               status: "Active",
  //               profile: {
  //                 imageUrl: picture,
  //               },
  //             });
  //             user.save(async (err: any, data: any) => {
  //               if (err) {
  //                 return res.status(400).json({
  //                   message: "An error occured",
  //                 });
  //               }
  //               const deHyphenatedUUID = uuidv4().replace(/-/gi, "");
  //               const encodedId = hashids.encodeHex(deHyphenatedUUID);
  //               const updated = await this.user.findByIdAndUpdate(user._id, {
  //                 userCode: encodedId,
  //               });
  //               if (updated) {
  //                 res.send({
  //                   userCode: encodedId,
  //                   email: email,
  //                   redirect_url: redirect_url ? redirect_url : "",
  //                 });
  //               }
  //             });
  //           }
  //         }); //end of find user
  //       } else {
  //         return res.status(400).json({
  //           error: "Google login failed. Try again.",
  //         });
  //       }
  //       //end of if verified email
  //     }
  //   ); //end of client verification
  // };

  private createCookie(tokenData: TokenData) {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}`;
  }

  private createToken(user: User): TokenData {
    const expiresIn = 60 * 60 * 24;
    const secret = process.env.JWT_SECRET;
    const refresh = process.env.JWT_REFRESH;

    const dataStoredInToken: DataStoredInToken = {
      _id: user._id,
    };
    const refreshToken = jwt.sign(dataStoredInToken, refresh);
    return {
      expiresIn,
      refreshToken,
      token: jwt.sign(dataStoredInToken, secret, { expiresIn }),
    };
  }

  private refresh_token = async (request: Request, response: Response) => {
    const refresh_token = request.body.refreshToken;
    const user = await this.user.findOne({ refreshToken: refresh_token });
    if (user) {
      const token = this.createToken(user);
      await this.user.findByIdAndUpdate(user._id, {
        refreshToken: token.refreshToken,
      });
      response.setHeader("Set-Cookie", [this.createCookie(token)]);
      response.send({ user, token });
    }
  };

  private forgetPassword = async (request: Request, response: Response) => {
    const email = request.body.email;
    const user = await this.user.findOne({ email: email });
    if (!user) {
      return response.status(401).json({
        message: "User with that email does not exist",
      });
    }
    const token = jwt.sign({ _id: user.firstName }, process.env.JWT_RESET_PASSWORD, {
      expiresIn: "10m",
    });

    const subject = "Password reset link";
    const content = `
              <p>Please click the link below to reset your password:</p>
              <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
              <hr />
              <p>This email may contain sensetive information</p>
              <p></p>
          `;
    const update = await this.user.findOneAndUpdate(
      { _id: user._id },
      { resetPasswordLink: token },
      { new: true }
    );
    if (!update) {
      return response.json({ message: "Not successful" });
    } else {
      email_sender(subject, email, content);
      return response.json({
        message: `Email has been sent to ${email}. Follow the instructions to reset your password. Link expires in 10min.`,
      });
    }
  };

  private resetPassword = async (request: Request, response: Response, next: NextFunction) => {
    const { resetPasswordLink, newPassword } = request.body;
    const updatedPassword = await bcrypt.hash(newPassword, 10);
    if (resetPasswordLink) {
      jwt.verify(
        resetPasswordLink,
        process.env.JWT_RESET_PASSWORD,
        function (err: Error, decoded: string) {
          if (err) {
            return response.status(401).json({
              error: "Expired link. Try again",
            });
          }
          userModel.findOne({ resetPasswordLink }, (err: Error, user: any) => {
            if (err || !user) {
              return response.status(401).json({
                error: "Something went wrong. Try later",
              });
            }
            const updatedFields = {
              password: updatedPassword,
              resetPasswordLink: "",
            };

            user = _.extend(user, updatedFields);

            user.save((err: Error, result: any) => {
              if (err) {
                return response.status(400).json({
                  error: "Cannot update passowrd",
                });
              }
              response.json({
                message: "Great! Now you can login with your new password",
              });
            });
          });
        }
      );
    }
  };

  private activationEmail = async (request: Request, response: Response, next: NextFunction) => {
    try {
    const email = request.body.email;
    await this.authenticationService.activationEmail(email);
  }
  catch (error) {
    next(error);
  }
}
}

export default AuthenticationController;
