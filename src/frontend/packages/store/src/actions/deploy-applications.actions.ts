import { Action } from '@ngrx/store';

import { GitSCM } from '../../../core/src/shared/data-services/scm/scm';
import { gitBranchesSchemaKey, gitCommitSchemaKey } from '../helpers/entity-factory';
import { GitAppDetails, OverrideAppDetails, SourceType } from '../types/deploy-application.types';
import { GitBranch, GitCommit } from '../types/git.types';
import { PaginatedAction } from '../types/pagination.types';
import { IRequestAction } from '../types/request.types';

export const SET_APP_SOURCE_DETAILS = '[Deploy App] Application Source';
export const CHECK_PROJECT_EXISTS = '[Deploy App] Check Projet exists';
export const PROJECT_DOESNT_EXIST = '[Deploy App] Project Doesn\'t exist';
export const PROJECT_FETCH_FAILED = '[Deploy App] Project Fetch Failed';
export const PROJECT_EXISTS = '[Deploy App] Project exists';
export const FETCH_BRANCHES_FOR_PROJECT = '[Deploy App] Fetch branches';
export const SAVE_APP_DETAILS = '[Deploy App] Save app details';
export const SAVE_APP_OVERRIDE_DETAILS = '[Deploy App] Save app override details';
export const FETCH_COMMIT = '[Deploy App] Fetch commit';
export const FETCH_COMMITS = '[Deploy App] Fetch commits';
export const SET_DEPLOY_CF_SETTINGS = '[Deploy App] Set CF Settings';
export const DELETE_DEPLOY_APP_SECTION = '[Deploy App] Delete section';
export const SET_BRANCH = '[Deploy App] Set branch';
export const SET_DEPLOY_BRANCH = '[Deploy App] Set deploy branch';
export const SET_DEPLOY_COMMIT = '[Deploy App] Set deploy commit';
export const DELETE_COMMIT = '[Deploy App] Delete commit';

export const FETCH_BRANCH_START = '[GitHub] Fetch branch start';
export const FETCH_BRANCH_SUCCESS = '[GitHub] Fetch branch succeeded';
export const FETCH_BRANCH_FAILED = '[GitHub] Fetch branch failed';

export class SetAppSourceDetails implements Action {
  constructor(public sourceType: SourceType) { }
  type = SET_APP_SOURCE_DETAILS;
}

export class CheckProjectExists implements Action {
  constructor(public scm: GitSCM, public projectName: any) { }
  type = CHECK_PROJECT_EXISTS;
}

export class ProjectDoesntExist implements Action {
  constructor(public projectName: string) { }
  type = PROJECT_DOESNT_EXIST;
}

export class ProjectFetchFail implements Action {
  constructor(public projectName: string, public error: string) { }
  type = PROJECT_FETCH_FAILED;
}

export class ProjectExists implements Action {
  constructor(public projectName: string, public projectData: any) { }
  type = PROJECT_EXISTS;
}

export class FetchBranchesForProject implements PaginatedAction {
  constructor(public scm: GitSCM, public projectName: string) { }
  actions = [
    FETCH_BRANCH_START,
    FETCH_BRANCH_SUCCESS,
    FETCH_BRANCH_FAILED
  ];
  type = FETCH_BRANCHES_FOR_PROJECT;
  entityKey = gitBranchesSchemaKey;
  paginationKey: 'branches';
}

export class SaveAppDetails implements Action {
  constructor(public appDetails: GitAppDetails) { }
  type = SAVE_APP_DETAILS;
}

export class SaveAppOverrides implements Action {
  constructor(public appOverrideDetails: OverrideAppDetails) { }
  type = SAVE_APP_OVERRIDE_DETAILS;
}

export class FetchCommit implements IRequestAction {
  commit: GitCommit;

  constructor(public scm: GitSCM, public commitSha: string, public projectName: string) { }
  type = FETCH_COMMIT;
  entityKey = gitCommitSchemaKey;
}

export class FetchCommits implements PaginatedAction {

  /**
   * Creates an instance of FetchCommits.
   * @param projectName For example `cloudfoundry-incubator/stratos`
   * @param sha Branch name, tag, etc
   */
  constructor(public scm: GitSCM, public projectName: string, public sha: string) {
    this.paginationKey = scm.getType() + projectName + sha;
  }
  actions = [
    '[Deploy App] Fetch commits start',
    '[Deploy App] Fetch commits success',
    '[Deploy App] Fetch commits failed',
  ];
  type = FETCH_COMMITS;
  entityKey = gitCommitSchemaKey;
  paginationKey: string;
  initialParams = {
    'order-direction': 'asc',
    'order-direction-field': 'date',
  };
}

export class StoreCFSettings implements Action {
  constructor(public cloudFoundryDetails: any) { }
  type = SET_DEPLOY_CF_SETTINGS;
}

export class DeleteDeployAppSection implements Action {
  constructor() { }
  type = DELETE_DEPLOY_APP_SECTION;
}

export class SetBranch implements Action {
  constructor(private branch: GitBranch) { }
  type = SET_BRANCH;
}

export class SetDeployBranch implements Action {
  constructor(private branch: string) { }
  type = SET_DEPLOY_BRANCH;
}

export class SetDeployCommit implements Action {
  constructor(private commit: string) { }
  type = SET_DEPLOY_COMMIT;
}
