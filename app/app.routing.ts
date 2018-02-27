import { NgModule } from "@angular/core";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { Routes } from "@angular/router";

import { StartPage } from "./views/start/start";
import { ExperimentPage } from "./views/experiment/experiment";

const routes: Routes = [
    { path: "", redirectTo: "/start", pathMatch: "full" },
    { path: "start", component: StartPage },
    { path: "experiment", component: ExperimentPage}
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }
