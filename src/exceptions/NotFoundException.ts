import HttpException from './HttpException';

class NotFoundException extends HttpException {
  constructor(id: string) {
    super(404, `Not found or deleted already`);
  }
}

export default NotFoundException;
