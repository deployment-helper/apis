import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
  All,
} from '@nestjs/common';
import { AuthGuard } from '@apps/app-management/auth/auth.guard';
import { AgentService } from './agent.service';

@Controller('agent')
@UseGuards(AuthGuard)
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {}

  /**
   * Proxy GET requests to the agent microservice
   * @param path The path to the agent endpoint
   * @param query Any query parameters to include
   * @returns The response from the agent service
   */
  @Get(':path*')
  async proxyGet(
    @Param('path') path: string,
    @Query() query: Record<string, any>,
  ) {
    try {
      this.logger.log(`Proxying GET request to agent service: /${path}`);
      return await this.agentService.get(`/${path}`, query);
    } catch (error) {
      this.logger.error(`Error proxying GET request: ${error.message}`);
      throw new HttpException(
        error.response?.data || 'Failed to proxy request to agent service',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Proxy POST requests to the agent microservice
   * @param path The path to the agent endpoint
   * @param body The request body
   * @returns The response from the agent service
   */
  @Post(':path*')
  async proxyPost(@Param('path') path: string, @Body() body: any) {
    try {
      this.logger.log(`Proxying POST request to agent service: /${path}`);
      return await this.agentService.post(`/${path}`, body);
    } catch (error) {
      this.logger.error(`Error proxying POST request: ${error.message}`);
      throw new HttpException(
        error.response?.data || 'Failed to proxy request to agent service',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Proxy PUT requests to the agent microservice
   * @param path The path to the agent endpoint
   * @param body The request body
   * @returns The response from the agent service
   */
  @Put(':path*')
  async proxyPut(@Param('path') path: string, @Body() body: any) {
    try {
      this.logger.log(`Proxying PUT request to agent service: /${path}`);
      return await this.agentService.put(`/${path}`, body);
    } catch (error) {
      this.logger.error(`Error proxying PUT request: ${error.message}`);
      throw new HttpException(
        error.response?.data || 'Failed to proxy request to agent service',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Proxy DELETE requests to the agent microservice
   * @param path The path to the agent endpoint
   * @param query Any query parameters to include
   * @returns The response from the agent service
   */
  @Delete(':path*')
  async proxyDelete(
    @Param('path') path: string,
    @Query() query: Record<string, any>,
  ) {
    try {
      this.logger.log(`Proxying DELETE request to agent service: /${path}`);
      return await this.agentService.delete(`/${path}`, query);
    } catch (error) {
      this.logger.error(`Error proxying DELETE request: ${error.message}`);
      throw new HttpException(
        error.response?.data || 'Failed to proxy request to agent service',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
