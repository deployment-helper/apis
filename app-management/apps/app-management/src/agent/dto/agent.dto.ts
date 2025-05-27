import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * DTO for general agent requests that may contain any payload
 */
export class AgentRequestDto {
  @IsObject()
  payload: Record<string, any>;
}

/**
 * DTO for agent requests that require a specific action
 */
export class AgentActionDto {
  @IsString()
  action: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
