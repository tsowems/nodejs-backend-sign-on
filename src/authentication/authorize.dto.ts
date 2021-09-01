import { IsString } from 'class-validator';

class AuthorizeDto {
  @IsString()
  public code: string;

  @IsString()
  public email: string;
}

export default AuthorizeDto;
