import "dotenv/config";
import App from "./app";
import AuthenticationController from "./authentication/authentication.controller";
import IntegrationsController from "./integrations/integrations.controller";
import UsersController from "./user/user.controller";
import validateEnv from "./utils/validateEnv";

validateEnv();

const app = new App([
  new UsersController(),
  new IntegrationsController(),
  new AuthenticationController(),
]);

app.listen();
