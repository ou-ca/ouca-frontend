import { ChangeDetectionStrategy, Component } from "@angular/core";
import { Observable } from "rxjs";
import { Sexe } from 'src/app/model/types/sexe.object';
import { EntitiesStoreService } from "src/app/services/entities-store.service";
import { EntiteAvecLibelleTableComponent } from "../entite-avec-libelle-table/entite-avec-libelle-table.component";

@Component({
  selector: "sexe-table",
  styleUrls: [
    "../entite-avec-libelle-table/entite-avec-libelle-table.component.scss"
  ],
  templateUrl:
    "../entite-avec-libelle-table/entite-avec-libelle-table.tpl.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SexeTableComponent extends EntiteAvecLibelleTableComponent<Sexe> {
  constructor(private entitiesStoreService: EntitiesStoreService) {
    super();
  }

  ngOnInit(): void {
    this.initialize();
  }

  public getEntities$ = (): Observable<Sexe[]> => {
    return this.entitiesStoreService.getSexes$();
  };
}
