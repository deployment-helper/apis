import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from 'octokit';

@Injectable()
export class GitHubService {
  private logger = new Logger('GitHubService');
  private octokit: any;

  constructor(private readonly config: ConfigService) {
    const githubToken = this.config.getOrThrow('GITHUB_TOKEN');
    this.octokit = new Octokit({ auth: githubToken });
  }

  // Trigger a workflow in a GitHub repository

  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: string,
    branch: string,
    inputs: {
      branch_name: string;
      title: string;
      desc: string;
      thumbnail_url: string;
      video_url: string;
      video_id: string;
    },
  ) {
    this.logger.log(`Triggering workflow ${workflowId} in ${owner}/${repo}`);
    return this.octokit.request(
      'POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches',
      {
        owner: owner,
        repo: repo,
        workflow_id: workflowId,
        ref: branch,
        inputs: inputs,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );
  }
}
