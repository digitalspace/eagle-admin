import { Injectable } from '@angular/core';
import { JwtUtil } from 'app/jwt-util';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { ConfigService } from './config.service';

declare var Keycloak: any;

@Injectable()
export class KeycloakService {
  private keycloakAuth: any;
  private keycloakEnabled: boolean;
  private keycloakUrl: string;
  private keycloakRealm: string;
  private loggedOut: string;

  constructor(private configService: ConfigService) { }

  isKeyCloakEnabled(): boolean {
    return this.keycloakEnabled;
  }

  private getParameterByName(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) {
      return null;
    }
    if (!results[2]) {
      return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  async init() {
    // Load up the config service data
    this.keycloakEnabled = this.configService.config['KEYCLOAK_ENABLED'];
    this.keycloakUrl = this.configService.config['KEYCLOAK_URL'];
    this.keycloakRealm = this.configService.config['KEYCLOAK_REALM'];

    this.loggedOut = this.getParameterByName('loggedout');

    const self = this;
    if (this.keycloakEnabled) {
      // Bootup KC
      const keycloak_client_id = this.configService.config['KEYCLOAK_CLIENT_ID'];

      return new Promise((resolve, reject) => {
        const config = {
          url: this.keycloakUrl,
          realm: this.keycloakRealm,
          clientId: !keycloak_client_id ? 'eagle-admin-console' : keycloak_client_id
        };

        // console.log('KC Auth init.');

        self.keycloakAuth = new Keycloak(config);

        self.keycloakAuth.onAuthSuccess = function () {
          // console.log('onAuthSuccess');
        };

        self.keycloakAuth.onAuthError = function () {
          console.log('onAuthError');
        };

        self.keycloakAuth.onAuthRefreshSuccess = function () {
          // console.log('onAuthRefreshSuccess');
        };

        self.keycloakAuth.onAuthRefreshError = function () {
          console.log('onAuthRefreshError');
          self.keycloakAuth.login({ idpHint: 'idir' });
        };

        self.keycloakAuth.onAuthLogout = function () {
          // console.log('onAuthLogout');
        };

        // Try to get refresh tokens in the background
        self.keycloakAuth.onTokenExpired = function () {
          self.keycloakAuth.updateToken(180)
            .success(function (refreshed) {
              console.log('KC refreshed token?:', refreshed);
            })
            .error((err) => {
              console.log('onTokenExpired:KC refresh error:', err);
              self.keycloakAuth.login({ idpHint: 'idir' });
            });
        };

        // Initialize.
        self.keycloakAuth.init({})
          .success((auth) => {
            // console.log('KC Refresh Success?:', self.keycloakAuth.authServerUrl);
            console.log('KC Success:', auth);
            if (!auth) {
              if (this.loggedOut === 'true') {
                // Don't do anything, they wanted to remain logged out.
                resolve();
              } else {
                self.keycloakAuth.login({ idpHint: 'idir' });
              }
            } else {
              resolve();
            }
          })
          .error((err) => {
            console.log('KC error2:', err);
            reject();
          });
      });
    }
  }

  isValidForSite() {
    if (!this.getToken()) {
      return false;
    }
    const jwt = new JwtUtil().decodeToken(this.getToken());

    if (jwt && jwt.realm_access && jwt.realm_access.roles) {
      return jwt.realm_access.roles.includes('sysadmin');
    } else {
      return false;
    }
  }

  /**
   * Returns the current keycloak auth token.
   *
   * @returns {string} keycloak auth token.
   * @memberof KeycloakService
   */
  getToken(): string {
    if (!this.keycloakEnabled) {
      // return the local storage token
      const currentUser = JSON.parse(window.localStorage.getItem('currentUser'));
      return currentUser ? currentUser.token : null;
    }

    return this.keycloakAuth && this.keycloakAuth.token;
  }

  getUserRoles() {
    const jwt = new JwtUtil().decodeToken(this.keycloakAuth.token);
    if (jwt && jwt.realm_access && jwt.realm_access.roles) {
      return jwt.realm_access.roles;
    } else {
      return null;
    }
  }

  /**
   * Returns an observable that emits when the auth token has been refreshed.
   * Call {@link KeycloakService#getToken} to fetch the updated token.
   *
   * @returns {Observable<string>}
   * @memberof KeycloakService
   */
  refreshToken(): Observable<any> {
    return new Observable(observer => {
      this.keycloakAuth
        .updateToken(30)
        .success(function (refreshed) {
          console.log('KC refreshed token?:', refreshed);
          observer.next();
          observer.complete();
        })
        .error(err => {
          console.log('KC refresh error:', err);
          observer.error();
        });

      return { unsubscribe() { } };
    });
  }

  getLogoutURL(): string {
    if (this.keycloakEnabled) {
      return this.keycloakAuth.authServerUrl + '/realms/' + this.keycloakRealm + '/protocol/openid-connect/logout?redirect_uri=' + window.location.origin + '/not-authorized?loggedout=true';
    } else {
      // go to the /login page
      return window.location.origin + '/login';
    }
  }
}
