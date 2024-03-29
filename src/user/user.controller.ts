import { Router, Request, Response, NextFunction } from "express";
import Controller from "../interfaces/controller.interface";
import authMiddleware from "../middleware/auth.middleware";
import adminAuthMiddleware from "../middleware/adminAuth.middleware";
//import { pictureUpload } from "../middleware/uploads.middleware";
import userModel from "./user.model";
import UserNotFoundException from "../exceptions/UserNotFoundException";
//import validationMiddleware from "../middleware/validation.middleware";
//import CreateProfileDto from "../user/profile.dto";

class UserController implements Controller {
  public path = "/api/users";
  public router = Router();
  private user = userModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // this.router.put(
    //   `${this.path}/updateProfile`,
    //   authMiddleware,
    //   [pictureUpload.single("file")],
    //   this.updateProfile
    // );
    this.router.get(`${this.path}/profile`, authMiddleware, this.userProfile);
    this.router.get(`${this.path}/access`, authMiddleware, this.userAccess);
    this.router.get(`${this.path}/:id`, authMiddleware, this.getUserById);
    this.router.put(`${this.path}/user_role`, adminAuthMiddleware, this.updateUserRole);
  }

  private userProfile = async (request: any, response: Response, next: NextFunction) => {
    try {
      const user_id = request.user._id;
      const user = await this.user
        .findOne({ _id: user_id })
        .select("-password")
        .select("-_id")
        .select("-userCode");

      if (user) {
        response.send({ user });
      } else {
        response.send({ message: "User not found" });
      }
    } catch {
      response.status(422).send({ message: "Unable to authenticate user" });
    }
  };

  private userAccess = async (request: any, response: Response, next: NextFunction) => {
    const user_id = request.user._id;
    const user = await this.user.findOne({ _id: user_id });

    if (user) {
      const userCode = user.userCode;
      const email = user.email;
      // console.log(user);
      response.send({ userCode, email });
    }
  };

  // private updateProfile = async (request: any, response: Response, next: NextFunction) => {
  //   const profileData: CreateProfileDto = request.body;
  //   const { company, referral } = profileData
  //   const user_id = request.user._id;
  //   const imageUrl = request.file.location;
  //   if (company && imageUrl) {
  //     const updated = await this.user.findByIdAndUpdate(
  //       user_id,
  //       {
  //         profile: {
  //           company,
  //           imageUrl,
  //           referral,
  //         },
  //       },
  //       { new: true }
  //     );
  //     if (updated) {
  //       response.send("Upload sucessful");
  //     }
  //   } else {
  //     response.send({ message: "Unable to upload at the moment" });
  //   }
  // };

  private getUserById = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;
    const userQuery = this.user.findById(id);
    if (request.query.withPosts === "true") {
      userQuery.populate("posts").exec();
    }
    const user = await userQuery;
    if (user) {
      response.send(user);
    } else {
      next(new UserNotFoundException(id));
    }
  };

  private updateUserRole = async (request: any, response: Response, next: NextFunction) => {
    try{
    //const user_id = request.user._id;
    const {email, role} = request.body;
    const user = await this.user.findOne({ email });
    await this.user.findByIdAndUpdate(
      user._id,
      {
        userRole: role
      }
    )
    return response
    .status(200)
    .send({ message: `User updated to ${role}` });
  }
    catch (err) {
      console.log(err)  
      return response
          .status(400)
          .send({ message: "Unable to Change user Role" });
  }
  }
}

export default UserController;
