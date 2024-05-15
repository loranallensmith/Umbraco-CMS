import { manifest as sliderSchemaManifest } from './Umbraco.Slider.js';
import type { ManifestTypes } from '@umbraco-cms/backoffice/extension-registry';

export const manifests: Array<ManifestTypes> = [
	{
		type: 'propertyEditorUi',
		alias: 'Umb.PropertyEditorUi.Slider',
		name: 'Slider Property Editor UI',
		element: () => import('./property-editor-ui-slider.element.js'),
		meta: {
			label: 'Slider',
			propertyEditorSchemaAlias: 'Umbraco.Slider',
			icon: 'icon-navigation-horizontal',
			group: 'common',
			settings: {
				properties: [
					{
						alias: 'enableRange',
						label: 'Enable range',
						description: '',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Toggle',
					},
					{
						alias: 'initVal1',
						label: 'Initial value',
						description: '',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Integer',
					},
					{
						alias: 'initVal2',
						label: 'Initial value 2',
						description: 'Used when range is enabled',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Integer',
					},
					{
						alias: 'step',
						label: 'Step increments',
						description: '',
						propertyEditorUiAlias: 'Umb.PropertyEditorUi.Integer',
					},
				],
				defaultData: [
					{
						alias: 'initVal1',
						value: 0,
					},
					{
						alias: 'initVal2',
						value: 0,
					},
					{
						alias: 'step',
						value: 0,
					},
				],
			},
		},
	},
	sliderSchemaManifest,
];
