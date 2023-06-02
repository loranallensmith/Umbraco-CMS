import { DataTypePropertyPresentationModel } from "@umbraco-cms/backoffice/backend-api";
import { UmbLitElement } from "@umbraco-cms/internal/lit-element";

// TODO => editor property should be typed, but would require libs taking a dependency on TinyMCE, which is not ideal
export class UmbTinyMcePluginBase {
    host: UmbLitElement;
    editor: any;
    configuration?: Array<DataTypePropertyPresentationModel>;

    constructor(arg: TinyMcePluginArguments) {
        this.host = arg.host;
        this.editor = arg.editor;
        this.configuration = arg.configuration;
    }
}

// TODO => editor property should be typed, but would require libs taking a dependency on TinyMCE, which is not ideal
export interface TinyMcePluginArguments {
    host: UmbLitElement;
	editor: any; 
	configuration?: Array<DataTypePropertyPresentationModel>;
}