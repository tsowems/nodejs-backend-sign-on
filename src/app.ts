import * as bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import express from "express";
import path from "path";
import mongoose from "mongoose";
import Controller from "./interfaces/controller.interface";
import errorMiddleware from "./middleware/error.middleware";
import cors from "cors";

class App {
  public app: express.Application;

  constructor(controllers: Controller[]) {
    this.app = express();
    this.connectToTheDatabase();
    this.initializeMiddlewares();
    this.initializeControllers(controllers);
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(process.env.PORT, () => {
      console.log(`App listening on the port ${process.env.PORT}`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(express.json());
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(cookieParser());
    this.app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeControllers(controllers: Controller[]) {
    controllers.forEach((controller) => {
      this.app.use(express.json());
      this.app.set("views", path.join(__dirname, "views"));
      this.app.set("view engine", "ejs");
      this.app.use("/", controller.router);
    });
  }
  private connectToTheDatabase() {
    mongoose.connect("mongodb://127.0.0.1:27017/sso");
  }
}

export default App;
