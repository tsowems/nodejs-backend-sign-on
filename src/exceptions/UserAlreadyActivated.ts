import HttpException from './HttpException';

class UserAlreadyActivated extends HttpException {
  constructor(email: string) {
    super(400, `Account ${email} is activated already or email is incorrect`);
  }
}

export default UserAlreadyActivated;

