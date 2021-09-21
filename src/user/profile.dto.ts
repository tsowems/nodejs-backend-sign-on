import { IsString } from 'class-validator';

class CreateProfileDto {
  @IsString()
  public company: string;
  @IsString()
  public referral: string;
}

export default CreateProfileDto;
