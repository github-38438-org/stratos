import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, Subscription } from 'rxjs';
import { filter, first, map, startWith, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { GetAppStatsAction, GetAppSummaryAction } from '../../../../../../store/src/actions/app-metadata.actions';
import { RouterNav } from '../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../store/src/app-state';
import { applicationSchemaKey, entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { endpointEntitiesSelector } from '../../../../../../store/src/selectors/endpoint.selectors';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { UserFavorite } from '../../../../../../store/src/types/user-favorites.types';
import { IAppFavMetadata } from '../../../../cf-favourite-types';
import { IApp, IOrganization, ISpace } from '../../../../core/cf-api.types';
import { CurrentUserPermissions } from '../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../core/current-user-permissions.service';
import { EntityService } from '../../../../core/entity-service';
import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../../core/extension/extension-service';
import { safeUnsubscribe } from '../../../../core/utils.service';
import { ApplicationStateData } from '../../../../shared/components/application-state/application-state.service';
import { IHeaderBreadcrumb } from '../../../../shared/components/page-header/page-header.types';
import { GitSCMService, GitSCMType } from '../../../../shared/data-services/scm/scm.service';
import { ENTITY_SERVICE } from '../../../../shared/entity.tokens';
import { IPageSideNavTab } from '../../../dashboard/page-side-nav/page-side-nav.component';
import { ApplicationService } from '../../application.service';
import { EndpointsService } from './../../../../core/endpoints.service';

@Component({
  selector: 'app-application-tabs-base',
  templateUrl: './application-tabs-base.component.html',
  styleUrls: ['./application-tabs-base.component.scss']
})
export class ApplicationTabsBaseComponent implements OnInit, OnDestroy {
  public schema = entityFactory(applicationSchemaKey);
  public appState$: Observable<ApplicationStateData>;

  public favorite$ = this.applicationService.app$.pipe(
    filter(app => !!app),
    map(app => new UserFavorite<IAppFavMetadata, APIResource<IApp>>(
      this.applicationService.cfGuid,
      'cf',
      applicationSchemaKey,
      this.applicationService.appGuid,
      app.entity
    ))
  );

  isBusyUpdating$: Observable<{ updating: boolean }>;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.Application);

  constructor(
    public applicationService: ApplicationService,
    @Inject(ENTITY_SERVICE) private entityService: EntityService<APIResource>,
    private store: Store<AppState>,
    private endpointsService: EndpointsService,
    private ngZone: NgZone,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    scmService: GitSCMService
  ) {
    const endpoints$ = store.select(endpointEntitiesSelector);
    this.breadcrumbs$ = applicationService.waitForAppEntity$.pipe(
      withLatestFrom(
        endpoints$,
        applicationService.appOrg$,
        applicationService.appSpace$
      ),
      map(([app, endpoints, org, space]) => {
        return this.getBreadcrumbs(
          app.entity.entity,
          endpoints[app.entity.entity.cfGuid],
          org,
          space
        );
      }),
      first()
    );

    const appDoesNotHaveEnvVars$ = this.applicationService.appSpace$.pipe(
      switchMap(space => this.currentUserPermissionsService.can(CurrentUserPermissions.APPLICATION_VIEW_ENV_VARS,
        this.applicationService.cfGuid, space.metadata.guid)
      ),
      map(can => !can)
    );

    this.tabLinks = [
      { link: 'summary', label: 'Summary', matIcon: 'description' },
      { link: 'instances', label: 'Instances', matIcon: 'library_books' },
      { link: 'routes', label: 'Routes', matIconFont: 'stratos-icons', matIcon: 'network_route' },
      { link: 'log-stream', label: 'Log Stream', matIcon: 'featured_play_list' },
      { link: 'services', label: 'Services', matIconFont: 'stratos-icons', matIcon: 'service' },
      { link: 'variables', label: 'Variables', matIcon: 'list', hidden: appDoesNotHaveEnvVars$ },
      { link: 'events', label: 'Events', matIcon: 'watch_later' }
    ];

    this.endpointsService.hasMetrics(applicationService.cfGuid).subscribe(hasMetrics => {
      if (hasMetrics) {
        this.tabLinks = [
          ...this.tabLinks,
          {
            link: 'metrics',
            label: 'Metrics',
            matIcon: 'equalizer'
          }
        ];
      }
    });

    // Add any tabs from extensions
    this.tabLinks = this.tabLinks.concat(getTabsFromExtensions(StratosTabType.Application));

    // Ensure Git SCM tab gets updated if the app is redeployed from a different SCM Type
    this.stratosProjectSub = this.applicationService.applicationStratProject$
      .subscribe(stratProject => {
        if (
          stratProject &&
          stratProject.deploySource &&
          (stratProject.deploySource.type === 'github' || stratProject.deploySource.type === 'gitscm')
        ) {
          const gitscm = stratProject.deploySource.scm || stratProject.deploySource.type;
          const scm = scmService.getSCM(gitscm as GitSCMType);
          const iconInfo = scm.getIcon();
          // Add tab or update existing tab
          const tab = this.tabLinks.find(t => t.link === 'gitscm');
          if (!tab) {
            this.tabLinks.push({ link: 'gitscm', label: scm.getLabel(), matIconFont: iconInfo.fontName, matIcon: iconInfo.iconName });
          } else {
            tab.label = scm.getLabel();
            tab.matIconFont = iconInfo.fontName;
            tab.matIcon = iconInfo.iconName;
          }
          this.tabLinks = [...this.tabLinks];
        }
      });
  }

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;
  isFetching$: Observable<boolean>;
  applicationActions$: Observable<string[]>;
  summaryDataChanging$: Observable<boolean>;
  appSub$: Subscription;
  entityServiceAppRefresh$: Subscription;
  stratosProjectSub: Subscription;
  autoRefreshString = 'auto-refresh';

  autoRefreshing$ = this.entityService.updatingSection$.pipe(map(
    update => update[this.autoRefreshString] || { busy: false }
  ));

  tabLinks: IPageSideNavTab[];

  private getBreadcrumbs(
    application: IApp,
    endpoint: EndpointModel,
    org: APIResource<IOrganization>,
    space: APIResource<ISpace>
  ) {
    const baseCFUrl = `/cloud-foundry/${application.cfGuid}`;
    const baseOrgUrl = `${baseCFUrl}/organizations/${org.metadata.guid}`;

    const baseSpaceBreadcrumbs = [
      { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
      { value: org.entity.name, routerLink: `${baseOrgUrl}/spaces` }
    ];

    return [
      {
        breadcrumbs: [{ value: 'Applications', routerLink: '/applications' }]
      },
      {
        key: 'space',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.entity.name, routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/apps` }
        ]
      },
      {
        key: 'space-services',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.entity.name, routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/service-instances` }
        ]
      },
      {
        key: 'space-user-services',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.entity.name, routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/user-service-instances` }
        ]
      },
      {
        key: 'space-routes',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.entity.name, routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/routes` }
        ]
      },
      {
        key: 'marketplace-services',
        breadcrumbs: [
          { value: 'Marketplace', routerLink: `/marketplace` }
        ]
      },
      {
        key: 'service-wall',
        breadcrumbs: [
          { value: 'Services', routerLink: `/services` }
        ]
      },
      {
        key: 'space-summary',
        breadcrumbs: [
          ...baseSpaceBreadcrumbs,
          { value: space.entity.name, routerLink: `${baseOrgUrl}/spaces/${space.metadata.guid}/summary` }
        ]
      },
      {
        key: 'org',
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/organizations` },
          { value: org.entity.name, routerLink: `${baseOrgUrl}/summary` },
        ]
      },
      {
        key: 'cf',
        breadcrumbs: [
          { value: endpoint.name, routerLink: `${baseCFUrl}/summary` }
        ]
      }
    ];
  }

  private updatingSectionBusy(section: ActionState) {
    return section && section.busy;
  }

  ngOnInit() {
    const { cfGuid, appGuid } = this.applicationService;
    // Auto refresh
    this.ngZone.runOutsideAngular(() => {
      this.entityServiceAppRefresh$ = this.entityService
        .poll(10000, this.autoRefreshString).pipe(
          tap(({ resource }) => {
            this.ngZone.run(() => {
              this.store.dispatch(new GetAppSummaryAction(appGuid, cfGuid));
              if (resource && resource.entity && resource.entity.state === 'STARTED') {
                this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
              }
            });
          }))
        .subscribe();
    });

    this.appSub$ = this.entityService.entityMonitor.entityRequest$.subscribe(requestInfo => {
      if (
        requestInfo.deleting.deleted ||
        requestInfo.error
      ) {
        this.store.dispatch(new RouterNav({ path: ['applications'] }));
      }
    });

    this.isFetching$ = this.applicationService.isFetchingApp$;

    this.isBusyUpdating$ = this.entityService.updatingSection$.pipe(
      map(updatingSection => {
        const updating = this.updatingSectionBusy(updatingSection.restaging) ||
          this.updatingSectionBusy(updatingSection['Updating-Existing-Application']);
        return { updating };
      }),
      startWith({ updating: true })
    );

    const initialFetch$ = observableCombineLatest(
      this.applicationService.isFetchingApp$,
      this.applicationService.isFetchingEnvVars$,
      this.applicationService.isFetchingStats$
    ).pipe(
      map(([isFetchingApp, isFetchingEnvVars, isFetchingStats]) => {
        return isFetchingApp || isFetchingEnvVars || isFetchingStats;
      }));

    this.summaryDataChanging$ = observableCombineLatest(
      initialFetch$,
      this.applicationService.isUpdatingApp$,
      this.autoRefreshing$
    ).pipe(map(([isFetchingApp, isUpdating, autoRefresh]) => {
      if (autoRefresh.busy) {
        return false;
      }
      return !!(isFetchingApp || isUpdating);
    }));
  }

  ngOnDestroy() {
    safeUnsubscribe(this.appSub$, this.entityServiceAppRefresh$, this.stratosProjectSub);
  }
}
