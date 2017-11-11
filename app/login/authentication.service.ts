import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Rx";
import { User } from "./user";
import * as http from "tns-core-modules/http";
import { config } from "../app.config";

import * as tnsOAuthModule from 'nativescript-oauth';

let qs = require('qs');

@Injectable()
export class AuthenticationService {
    private loggedIn: boolean = false;
    public user: User;

    private accessToken: string;

    constructor(
    ) { }

    login(): Observable<any> {
        this.clearData.apply(this);
        let tokenRequestObservable = Observable.fromPromise(tnsOAuthModule.ensureValidToken())
        let userDataObservable = tokenRequestObservable
            .flatMap(this.fetchUserData)
            .flatMap((user) => this.onLoginSuccess.apply(this, [user]));
        tokenRequestObservable.subscribe(token => this.accessToken = token,
                                         error => this.clearData.apply(this));
        return userDataObservable;
    }

    logout(): void {
        Observable.fromPromise(tnsOAuthModule.logout()).subscribe();
        this.clearData.apply(this);
    }

    isLoggedIn?(): boolean {
        return this.loggedIn;
    }

    // private fakeLogin(): Observable<any> {
    //     this.user = new User('12345', 'Piotr Kaczmarek');
    //     this.isLoggedIn = true;
    //     this.accessToken = 'abcd';
    //     return Observable.create(observer => observer.next());
    // }

    private onLoginSuccess(user): Observable<any> {
        if(user.hasOwnProperty('error')) { return Observable.throw(new Error(user.error['message'])); }

        this.user = user;
        this.loggedIn = true;
        return Observable.create(observer => observer.next());
    }

    private fetchUserData(accessToken): Observable<any> {
        let query = qs.stringify({
            access_token: accessToken,
            fields: ['id', 'first_name', 'age_range', 'cover', 'email', 'picture'].join(',')
        }, { encode: false });
        let url: string = `${config.FACEBOOK_GRAPH_API_URL}/me?${query}`

        return Observable.fromPromise(http.getJSON(url));
    }

    private clearData(): void {
        this.loggedIn = false;
        this.accessToken = null;
        this.user = null;
    }
}
