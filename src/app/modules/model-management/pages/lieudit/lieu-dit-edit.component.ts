import { Location } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import _ from "lodash";
import {
  CoordinatesSystem,
  getCoordinates,
  GPS
} from "ouca-common/coordinates-system";
import { Departement } from "ouca-common/departement.object";
import { Lieudit } from "ouca-common/lieudit.model";
import {
  BehaviorSubject,
  combineLatest,
  merge,
  Observable,
  Subject
} from "rxjs";
import { filter, map, takeUntil } from "rxjs/operators";
import { UICommune } from "src/app/models/commune.model";
import { UILieudit } from "src/app/models/lieudit.model";
import { FormValidatorHelper } from "src/app/modules/shared/helpers/form-validator.helper";
import { CrossFieldErrorMatcher } from "src/app/modules/shared/matchers/cross-field-error.matcher";
import { AppConfigurationService } from "src/app/services/app-configuration.service";
import { CoordinatesBuilderService } from "src/app/services/coordinates-builder.service";
import { EntitiesStoreService } from "src/app/services/entities-store.service";
import { LieuditFormComponent } from "../../components/form/lieudit-form/lieudit-form.component";
import { EntiteSimpleEditAbstractComponent } from "../entite-simple/entite-simple-edit.component";

@Component({
  styleUrls: ["./lieu-dit-edit.component.scss"],
  templateUrl: "./lieu-dit-edit.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LieuDitEditComponent
  extends EntiteSimpleEditAbstractComponent<UILieudit>
  implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  public departements$: Observable<Departement[]>;

  private communes$: Observable<UICommune[]>;

  public filteredCommunes$: BehaviorSubject<UICommune[]> = new BehaviorSubject<
    UICommune[]
  >(null);

  public areCoordinatesTransformed$: BehaviorSubject<
    boolean
  > = new BehaviorSubject<boolean>(false);

  public coordinatesSystem$: Observable<CoordinatesSystem>;

  public lieuditNomErrorStateMatcher = new CrossFieldErrorMatcher(
    "alreadyExistingNom"
  );

  constructor(
    private appConfigurationService: AppConfigurationService,
    private coordinatesBuilderService: CoordinatesBuilderService,
    entitiesStoreService: EntitiesStoreService,
    route: ActivatedRoute,
    router: Router,
    location: Location
  ) {
    super(entitiesStoreService, router, route, location);
    this.departements$ = this.entitiesStoreService.getDepartements$();
    this.communes$ = this.entitiesStoreService.getCommunes$();
    this.coordinatesSystem$ = this.appConfigurationService.getAppCoordinatesSystem$();
  }

  ngOnInit(): void {
    this.initialize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected initialize(): void {
    super.initialize();

    this.getEntities$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((entities) => {
        this.updateLieuDitValidators(this.getForm(), entities);
      });

    const departementControl = this.getForm().controls.departement;
    const codeCommuneControl = this.getForm().controls.communeId;
    const nomCommuneControl = this.getForm().controls.nomCommune;

    const departmentChange$ = merge(
      departementControl.valueChanges as Observable<Departement>,
      this.getEntityToDisplay$().pipe(
        filter((lieudit) => !!lieudit?.commune?.departement),
        map((lieudit) => lieudit.commune.departement)
      )
    );

    // Filter the list of "Communes" depending on the selected "Département"
    combineLatest(
      departmentChange$,
      this.communes$,
      (selectedDepartement: Departement, communes) => {
        if (!communes || !communes.length || !selectedDepartement) {
          return [];
        }

        return communes.filter((commune) => {
          return commune.departement.id === selectedDepartement.id;
        });
      }
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe((filteredCommunes) => {
        this.filteredCommunes$.next(filteredCommunes);
      });

    codeCommuneControl.valueChanges.subscribe((selectedCommuneId: number) => {
      nomCommuneControl.setValue(selectedCommuneId, {
        emitEvent: false
      });
    });

    nomCommuneControl.valueChanges.subscribe((selectedCommuneId: number) => {
      codeCommuneControl.setValue(selectedCommuneId, {
        emitEvent: false
      });
    });

    this.coordinatesSystem$.subscribe((coordinatesSystem) => {
      // Update the coordinates validators depending on the current coordinates system
      this.coordinatesBuilderService.updateCoordinatesValidators(
        coordinatesSystem.code,
        this.getForm().controls.longitude,
        this.getForm().controls.latitude
      );

      // Set the coordinates
      // TODO
      //const coordinates = getCoordinates(lieudit, coordinatesSystem.code);
      //this.entityForm.controls.longitude.setValue(coordinates?.longitude);
      //this.entityForm.controls.latitude.setValue(coordinates?.latitude);
      //this.areCoordinatesTransformed$.next(coordinates.isTransformed);
    });
  }

  public createForm(): FormGroup {
    return new FormGroup({
      id: new FormControl("", []),
      departement: new FormControl("", [Validators.required]),
      communeId: new FormControl("", [Validators.required]),
      nomCommune: new FormControl("", [Validators.required]),
      nom: new FormControl("", [Validators.required]),
      altitude: new FormControl("", [
        Validators.required,
        this.altitudeNumberValidator()
      ]),
      longitude: new FormControl(),
      latitude: new FormControl()
    });
  }

  protected getFormValue(
    lieuDit: UILieudit
  ): {
    id: number;
    departement: Departement;
    communeId: number;
    nomCommune: number;
    nom: string;
    altitude: number;
    longitude: number;
    latitude: number;
  } {
    // TODO
    const coordinatesSystemType = GPS;
    // const coordinatesSystemType: CoordinatesSystemType = this.appConfigurationService.getAppCoordinatesSystemType();

    const coordinates = getCoordinates(lieuDit, coordinatesSystemType);

    return {
      id: lieuDit.id,
      departement: lieuDit.commune.departement,
      communeId: lieuDit.commune.id,
      nomCommune: lieuDit.commune.id,
      nom: lieuDit.nom,
      altitude: lieuDit.altitude,
      longitude: coordinates.longitude,
      latitude: coordinates.latitude
    };
  }

  getEntityFromFormValue(formValue: {
    id: number;
    departement: Departement;
    nomCommune: number;
    communeId: number;
    nom: string;
    altitude: number;
    longitude: number;
    latitude: number;
  }): Lieudit {
    // TODO
    // const coordinatesSystemType: CoordinatesSystemType = this.appConfigurationService.getAppCoordinatesSystemType();
    const coordinatesSystemType = GPS;
    const lieuDit: Lieudit = {
      id: formValue?.id ? formValue.id : null,
      communeId: formValue.communeId,
      nom: formValue.nom,
      altitude: formValue.altitude,
      coordinates: {
        longitude: formValue.longitude,
        latitude: formValue.latitude,
        system: coordinatesSystemType,
        isTransformed: false
      }
    };
    return lieuDit;
  }

  public getFormType(): typeof LieuditFormComponent {
    return LieuditFormComponent;
  }

  public getEntityName = (): string => {
    return "lieudit";
  };

  public getEntities$(): Observable<UILieudit[]> {
    return this.entitiesStoreService.getLieuxdits$();
  }

  private updateLieuDitValidators = (
    form: FormGroup,
    lieuxDits: UILieudit[]
  ): void => {
    form.setValidators([this.nomValidator(lieuxDits)]);
    form.updateValueAndValidity();
  };

  private nomValidator = (lieuxDits: UILieudit[]): ValidatorFn => {
    return (form: FormGroup): ValidationErrors | null => {
      const nom: string = form.controls.nom.value;
      const communeId: number = form.controls.communeId.value;
      const currentLieuDitId: number = form.controls.id.value;

      const matchingLieuDit: UILieudit =
        nom && communeId
          ? _.find(lieuxDits, (lieuDit) => {
              return (
                _.deburr(lieuDit.nom.trim().toLowerCase()) ===
                  _.deburr(nom.trim().toLowerCase()) &&
                lieuDit.commune.id === communeId
              );
            })
          : null;

      const valueIsAnExistingEntity: boolean =
        !!matchingLieuDit && currentLieuDitId !== matchingLieuDit.id;

      return valueIsAnExistingEntity
        ? {
            alreadyExistingNom: {
              message:
                "Il existe déjà un lieu-dit avec ce nom dans cette commune."
            }
          }
        : null;
    };
  };

  private altitudeNumberValidator(): ValidatorFn {
    return FormValidatorHelper.isAnIntegerValidator(0, 65535);
  }

  public getPageTitle = (): string => {
    return "Lieux-dits";
  };

  public getCreationTitle = (): string => {
    return "Création d'un lieu-dit";
  };

  public getEditionTitle = (): string => {
    return "Edition d'un lieu-dit";
  };
}
