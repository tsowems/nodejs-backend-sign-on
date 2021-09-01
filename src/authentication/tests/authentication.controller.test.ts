import mongoose from 'mongoose';
import request from 'supertest';
import App from '../../app';
import CreateUserDto from '../../user/user.dto';
import AuthenticationController from '../authentication.controller';

describe('The AuthenticationController', () => {
  describe('POST /auth/register', () => {
    describe('if the email is not taken', () => {
      it('response should have the Set-Cookie header with the Authorization token', () => {
        const userData: CreateUserDto = {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@smith.com',
          userRole: 'admin',
          userCode: 'haweyte5a0smns%43$$#',
          password: 'strongPassword123',
        };
        process.env.JWT_SECRET = 'jwt_secret';
        const authenticationController = new AuthenticationController();
        authenticationController.authenticationService.user.findOne = jest.fn().mockReturnValue(Promise.resolve(undefined));
        authenticationController.authenticationService.user.create = jest.fn().mockReturnValue({
          ...userData,
          _id: 0,
        });
        (mongoose as any).connect = jest.fn();
        const app = new App([
          authenticationController,
        ]);
        return request(app.getServer())
          .post(`${authenticationController.path}/register`)
          .send(userData)
          .expect('Set-Cookie', /^Authorization=.+/);
      });
    });
  });
});
