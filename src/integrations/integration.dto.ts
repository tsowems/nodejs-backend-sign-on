import { IsString } from 'class-validator';

class CreateIntegrationDto {
  @IsString()
  public alias: string;

  @IsString()
  public code: string;
}

export default CreateIntegrationDto;
