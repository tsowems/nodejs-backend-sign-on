import { IsOptional, IsString, ValidateNested } from 'class-validator';
import CreateProfileDto from './profile.dto';

class CreateUserDto {
  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;

  @IsString()
  public email: string;

  @IsString()
  public password: string;
  
  @IsOptional()
  @IsString()
  public userRole: string;

  @IsOptional()
  @IsString()
  public userCode: string;

  @IsOptional()
  @ValidateNested()
  public profile?: CreateProfileDto;
}

export default CreateUserDto;
