import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppComponent } from "./app.component";
import { ApplicationManagementModule } from "./modules/application-management/application-management.module";
import { DonneeCreationModule } from "./modules/donnee-creation/donnee-creation.module";
import { DonneeViewModule } from "./modules/donnee-view/donnee-view.module";
import { ModelManagementModule } from "./modules/model-management/model-management.module";
import { NotFoundComponent } from "./modules/shared/components/not-found/not-found.component";
import { ServerErrorComponent } from "./modules/shared/components/server-error/server-error.component";
import { HttpRequestInterceptor } from "./modules/shared/services/http-request-interceptor";
import { SharedModule } from "./modules/shared/shared.module";
import { FlexLayoutModule } from "@angular/flex-layout";

const routes: Routes = [
  { path: "error", component: ServerErrorComponent },
  { path: "**", component: NotFoundComponent }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    SharedModule,
    ApplicationManagementModule,
    DonneeCreationModule,
    DonneeViewModule,
    ModelManagementModule,
    FlexLayoutModule
  ],
  exports: [],
  declarations: [AppComponent, NotFoundComponent, ServerErrorComponent],
  bootstrap: [AppComponent],
  entryComponents: [],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpRequestInterceptor,
      multi: true
    }
  ]
})
export class AppModule {}
