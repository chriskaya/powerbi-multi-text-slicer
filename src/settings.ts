"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

class TextSettingsCard extends FormattingSettingsCard {
    public separator = new formattingSettings.TextInput({
        name: "separator",
        displayName: "Separator",
        value: ",",
        placeholder: ","
    });

    public placeholder = new formattingSettings.TextInput({
        name: "placeholder",
        displayName: "Placeholder",
        value: "Paste values separated by a comma…",
        placeholder: "Paste values separated by a comma…"
    });

    public name: string = "textSettings";
    public displayName: string = "Text settings";
    public slices: FormattingSettingsSlice[] = [this.separator, this.placeholder];
}

class AppearanceCard extends FormattingSettingsCard {
    public fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Font size",
        value: 12
    });

    public fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font color",
        value: { value: "#252423" }
    });

    public backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background color",
        value: { value: "#ffffff" }
    });

    public name: string = "appearance";
    public displayName: string = "Appearance";
    public slices: FormattingSettingsSlice[] = [this.fontSize, this.fontColor, this.backgroundColor];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    public textSettings = new TextSettingsCard();
    public appearance = new AppearanceCard();
    public cards = [this.textSettings, this.appearance];
}
