import { Router, Request, Response, NextFunction } from "express";
import NotFoundException from "../exceptions/NotFoundException";
import Controller from "../interfaces/controller.interface";
import CreateIntegrationDto from "./integration.dto";
import authMiddleware from "../middleware/auth.middleware";
import integrationsModel from "./integrations.model";
import validationMiddleware from "../middleware/validation.middleware";



import axios from "axios";

class IntegrationController implements Controller {
  public path = "/api/integrations";
  public router = Router();
  private integrations = integrationsModel;

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/getAuthorized`, this.getAuthorized);
    this.router.get(`${this.path}/allowfinaccess`, this.allowAccess);
    this.router.post(`${this.path}/newIntegration`, authMiddleware,validationMiddleware(CreateIntegrationDto), this.createIntegration);
    this.router.post(`${this.path}/allIntegrations`, authMiddleware, this.allIntegration);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.deleteIntegration);
  }

  private getAuthorized = async (request: Request, response: Response, next: NextFunction) => {
    response.redirect(
      `https://webflow.com/oauth/authorize?client_id=${process.env.WEBFLOW_CLIENT_ID}&response_type=code`
    );
  };

  private allowAccess = async (request: Request, response: Response, next: NextFunction) => {
    const code = request.query.code;
    response.send({ code });
  };

  private createIntegration = async (request: any, response: Response, next: NextFunction) => {
    try {
      const user_id = request.user._id;
      const integrationData: CreateIntegrationDto = request.body;
      const { code, alias } = integrationData;

      const client_id = process.env.WEBFLOW_CLIENT_ID;
      const client_secret = process.env.WEBFLOW_CLIENT_SECRET;
      if (code && alias) {
        const payload = {
          client_id,
          client_secret,
          code,
          grant_type: "authorization_code",
        };
        const res = await axios.post("https://api.webflow.com/oauth/access_token", payload);
        const data = res.data;

        if (data) {
          try {
            const integrationData: CreateIntegrationDto = request.body;
            const createdIntegration = new this.integrations({
              ...integrationData,
              client_id,
              client_secret,
              access_token: data.access_token,
              user_id: user_id,
              service: "webflow",
              createdAt: new Date(),
            });
            await createdIntegration.save();
            response.send({ data: data, code: code, alias: alias });
          } catch {
            response.status(422).send({ message: "Failed to save Integration" });
          }
        } else {
          response.status(422).send({ message: "Integration Already Exit" });
        }
      }
      response.send({ message: "incomplete info" });
    } catch {
      response.status(422).send({ message: "Integration creation failed, invalid webflow code" });
    }
  };

  private allIntegration = async (request: any, response: Response, next: NextFunction) => {
    const user_id = request.user._id;
    try {
      const integrations = await this.integrations.find({ user_id: user_id });
      if (!integrations.length) {
        response.send({ message: "Integration no available" });
      } else {
        response.send(integrations);
      }
    } catch {
      response.status(422).send({ message: "Fetching Integration Failed" });
    }
  };

  private deleteIntegration = async (request: Request, response: Response, next: NextFunction) => {
    const id = request.params.id;

    const successResponse = await this.integrations.findByIdAndDelete(id);
    if (successResponse) {
      response.send({ message: "Integration Deleted" });
    } else {
      next(new NotFoundException(id));
    }
  };
}

export default IntegrationController;
