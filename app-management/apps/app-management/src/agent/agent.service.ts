import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly agentBaseUrl: string;
  private readonly agentServiceKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.agentBaseUrl =
      this.configService.getOrThrow<string>('AGENT_SERVICE_URL');
    this.agentServiceKey =
      this.configService.getOrThrow<string>('AGENT_SERVICE_KEY');
    this.logger.log(
      `Agent service initialized with base URL: ${this.agentBaseUrl}`,
    );
  }

  /**
   * Proxy a GET request to the agent microservice
   * @param endpoint The endpoint to call on the agent service
   * @param params Query parameters to include
   * @returns The response from the agent service
   */
  async get(endpoint: string, params: Record<string, any> = {}) {
    const url = `${this.agentBaseUrl}${endpoint}`;
    this.logger.debug(`Making GET request to: ${url}`);

    try {
      const headers = this.getAuthHeaders();
      const response = await lastValueFrom(
        this.httpService.get(url, { params, headers }).pipe(
          map((res) => res.data),
          catchError((error: AxiosError) => {
            this.handleError(error, url);
            throw error;
          }),
        ),
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to make GET request to ${url}`, error);
      throw error;
    }
  }

  /**
   * Proxy a POST request to the agent microservice
   * @param endpoint The endpoint to call on the agent service
   * @param data The data to send in the request body
   * @returns The response from the agent service
   */
  async post(endpoint: string, data: any) {
    const url = `${this.agentBaseUrl}${endpoint}`;
    this.logger.debug(`Making POST request to: ${url}`);

    try {
      const headers = this.getAuthHeaders();
      const response = await lastValueFrom(
        this.httpService.post(url, data, { headers }).pipe(
          map((res) => res.data),
          catchError((error: AxiosError) => {
            this.handleError(error, url);
            throw error;
          }),
        ),
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to make POST request to ${url}`, error);
      throw error;
    }
  }

  /**
   * Proxy a PUT request to the agent microservice
   * @param endpoint The endpoint to call on the agent service
   * @param data The data to send in the request body
   * @returns The response from the agent service
   */
  async put(endpoint: string, data: any) {
    const url = `${this.agentBaseUrl}${endpoint}`;
    this.logger.debug(`Making PUT request to: ${url}`);

    try {
      const headers = this.getAuthHeaders();
      const response = await lastValueFrom(
        this.httpService.put(url, data, { headers }).pipe(
          map((res) => res.data),
          catchError((error: AxiosError) => {
            this.handleError(error, url);
            throw error;
          }),
        ),
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to make PUT request to ${url}`, error);
      throw error;
    }
  }

  /**
   * Proxy a DELETE request to the agent microservice
   * @param endpoint The endpoint to call on the agent service
   * @param params Query parameters to include
   * @returns The response from the agent service
   */
  async delete(endpoint: string, params: Record<string, any> = {}) {
    const url = `${this.agentBaseUrl}${endpoint}`;
    this.logger.debug(`Making DELETE request to: ${url}`);

    try {
      const headers = this.getAuthHeaders();
      const response = await lastValueFrom(
        this.httpService.delete(url, { params, headers }).pipe(
          map((res) => res.data),
          catchError((error: AxiosError) => {
            this.handleError(error, url);
            throw error;
          }),
        ),
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to make DELETE request to ${url}`, error);
      throw error;
    }
  }

  private handleError(error: AxiosError, url: string) {
    const status = error.response?.status;
    const message = error.response?.data || error.message;

    this.logger.error(
      `Request to ${url} failed with status ${status}: ${JSON.stringify(
        message,
      )}`,
    );
  }

  /**
   * Get headers with authentication token for agent service requests
   * @returns HTTP headers with bearer token
   */
  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.agentServiceKey}`,
    };
  }
}
