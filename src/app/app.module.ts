
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './MainComponents/login/login.component';
import { RegisterComponent } from './MainComponents/register/register.component';
import { NavbarComponent } from './MainComponents/navbar/navbar.component';

const routes : Routes = [
 { path: 'login', component: LoginComponent },
 { path: 'register', component: RegisterComponent } 
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    NavbarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
