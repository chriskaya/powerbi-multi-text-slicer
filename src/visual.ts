"use strict";

import powerbi from "powerbi-visuals-api";
import { BasicFilter, IFilterColumnTarget, IFilter } from "powerbi-models";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";

import DataView = powerbi.DataView;
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import FilterAction = powerbi.FilterAction;

import { VisualFormattingSettingsModel } from "./settings";

const FILTER_OBJECT_NAME = "general";
const FILTER_PROPERTY_NAME = "filter";

export class Visual implements IVisual {
    private readonly host: IVisualHost;
    private readonly root: HTMLElement;
    private readonly textarea: HTMLTextAreaElement;
    private readonly status: HTMLDivElement;

    private readonly formattingSettingsService: FormattingSettingsService;
    private formattingSettings: VisualFormattingSettingsModel;

    private filterTarget: IFilterColumnTarget | null = null;
    private separator: string = ",";
    private restoredFromState: boolean = false;

    constructor(options?: VisualConstructorOptions) {
        if (!options) {
            throw new Error("VisualConstructorOptions is required");
        }
        this.host = options.host;
        this.root = options.element;
        this.formattingSettingsService = new FormattingSettingsService();

        this.root.classList.add("multi-text-slicer");

        this.textarea = document.createElement("textarea");
        this.textarea.classList.add("multi-text-slicer__input");
        this.textarea.setAttribute("aria-label", "Filter values");
        this.textarea.spellcheck = false;
        this.textarea.autocomplete = "off";
        this.root.appendChild(this.textarea);

        this.status = document.createElement("div");
        this.status.classList.add("multi-text-slicer__status");
        this.root.appendChild(this.status);

        this.textarea.addEventListener("input", () => this.applyFilter());
    }

    public update(options: VisualUpdateOptions): void {
        const dataView: DataView | undefined = options.dataViews && options.dataViews[0];

        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel,
            dataView
        );

        const previousSeparator = this.separator;
        this.separator = this.formattingSettings.textSettings.separator.value || ",";
        this.textarea.placeholder = this.formattingSettings.textSettings.placeholder.value || "";

        this.applyAppearance();
        this.updateFilterTarget(dataView);
        this.restoreStateOnce(dataView);

        if (previousSeparator !== this.separator) {
            // Re-apply with the new separator (the textarea content stays as the user typed it).
            this.applyFilter();
        }

        this.refreshStatus();
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }

    private applyAppearance(): void {
        const fontSize = this.formattingSettings.appearance.fontSize.value;
        const fontColor = this.formattingSettings.appearance.fontColor.value.value;
        const backgroundColor = this.formattingSettings.appearance.backgroundColor.value.value;

        this.textarea.style.fontSize = `${fontSize}px`;
        this.textarea.style.color = fontColor;
        this.textarea.style.backgroundColor = backgroundColor;
        this.root.style.backgroundColor = backgroundColor;
    }

    private updateFilterTarget(dataView: DataView | undefined): void {
        const category = dataView
            && dataView.categorical
            && dataView.categorical.categories
            && dataView.categorical.categories[0];

        if (!category || !category.source || !category.source.queryName) {
            this.filterTarget = null;
            return;
        }

        const queryName = category.source.queryName;
        const firstDot = queryName.indexOf(".");
        if (firstDot <= 0 || firstDot === queryName.length - 1) {
            this.filterTarget = null;
            return;
        }

        this.filterTarget = {
            table: queryName.substring(0, firstDot),
            column: queryName.substring(firstDot + 1)
        };
    }

    private restoreStateOnce(dataView: DataView | undefined): void {
        if (this.restoredFromState) {
            return;
        }
        this.restoredFromState = true;

        const objects = dataView && dataView.metadata && dataView.metadata.objects;
        const general = objects && (objects as any)[FILTER_OBJECT_NAME];
        const persisted = general && general[FILTER_PROPERTY_NAME];

        if (!persisted) {
            return;
        }

        const values: unknown = (persisted as any).values;
        if (Array.isArray(values) && values.length > 0) {
            this.textarea.value = values
                .map(v => (v == null ? "" : String(v)))
                .join(this.separator);
        }
    }

    private parseValues(): string[] {
        const raw = this.textarea.value || "";
        if (!this.separator) {
            const trimmed = raw.trim();
            return trimmed.length > 0 ? [trimmed] : [];
        }
        return raw
            .split(this.separator)
            .map(v => v.trim())
            .filter(v => v.length > 0);
    }

    private applyFilter(): void {
        if (!this.filterTarget) {
            this.refreshStatus();
            return;
        }

        const values = this.parseValues();

        if (values.length === 0) {
            this.host.applyJsonFilter(
                null as unknown as IFilter,
                FILTER_OBJECT_NAME,
                FILTER_PROPERTY_NAME,
                FilterAction.merge
            );
            this.refreshStatus();
            return;
        }

        const filter = new BasicFilter(this.filterTarget, "In", values);
        this.host.applyJsonFilter(
            filter as unknown as IFilter,
            FILTER_OBJECT_NAME,
            FILTER_PROPERTY_NAME,
            FilterAction.merge
        );
        this.refreshStatus();
    }

    private refreshStatus(): void {
        if (!this.filterTarget) {
            this.status.textContent = "Add a column to the \"Column\" field to enable filtering.";
            this.status.classList.add("multi-text-slicer__status--warn");
            return;
        }

        const count = this.parseValues().length;
        this.status.classList.remove("multi-text-slicer__status--warn");
        this.status.textContent = count === 0
            ? "Filter disabled (no values)"
            : `Filtering on ${count} value${count > 1 ? "s" : ""}`;
    }
}
