import { UUIBooleanInputEvent, UUIComboboxElement, UUIComboboxEvent, UUIToggleElement } from '@umbraco-ui/uui';
import { UUITextStyles } from '@umbraco-ui/uui-css';
import { css, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { UmbLanguageWorkspaceContext } from '../../language-workspace.context';
import { UmbCultureRepository } from '../../../../../cultures/repository/culture.repository';
import { UmbLitElement } from '@umbraco-cms/element';
import { CultureModel, LanguageModel } from '@umbraco-cms/backend-api';

@customElement('umb-edit-language-workspace-view')
export class UmbEditLanguageWorkspaceViewElement extends UmbLitElement {
	static styles = [
		UUITextStyles,
		css`
			:host {
				display: block;
				padding: var(--uui-size-space-6);
			}
			uui-combobox {
				width: 100%;
			}
			hr {
				border: none;
				border-bottom: 1px solid var(--uui-color-divider);
			}
			#culture-warning,
			#default-language-warning {
				padding: var(--uui-size-space-4) var(--uui-size-space-5);
				border: 1px solid;
				margin-top: var(--uui-size-space-4);
				border-radius: var(--uui-border-radius);
			}
			#culture-warning {
				background-color: var(--uui-color-danger);
				color: var(--uui-color-danger-contrast);
				border-color: var(--uui-color-danger-standalone);
			}
			#default-language-warning {
				background-color: var(--uui-color-warning);
				color: var(--uui-color-warning-contrast);
				border-color: var(--uui-color-warning-standalone);
			}
		`,
	];

	@property()
	language?: LanguageModel;

	@state()
	private _languages: LanguageModel[] = [];

	@state()
	private _cultures: CultureModel[] = [];

	@state()
	private _search = '';

	@state()
	private _startData: LanguageModel | null = null;

	#languageWorkspaceContext?: UmbLanguageWorkspaceContext;
	#cultureRepository = new UmbCultureRepository(this);

	constructor() {
		super();

		this.consumeContext<UmbLanguageWorkspaceContext>('umbWorkspaceContext', (instance) => {
			this.#languageWorkspaceContext = instance;

			this.observe(this.#languageWorkspaceContext.data, (language) => {
				this.language = language;
			});
		});
	}

	protected async firstUpdated() {
		const { data } = await this.#cultureRepository.requestCultures();
		if (data) {
			this._cultures = data.items;
		}
	}

	#handleLanguageChange(event: Event) {
		if (event instanceof UUIComboboxEvent) {
			const target = event.composedPath()[0] as UUIComboboxElement;
			const isoCode = target.value.toString();

			if (isoCode) {
				this.#languageWorkspaceContext?.setCulture(isoCode);

				// If the language name is not set, we set it to the name of the selected language.
				if (!this.language?.name) {
					const culture = this._cultures.find((culture) => culture.name === isoCode);
					if (culture && culture.englishName) {
						this.#languageWorkspaceContext?.setName(culture.englishName);
					}
				}
			} else {
				// If the isoCode is empty, we reset the value to the original value.
				// Provides a way better UX
				//TODO: Maybe the combobox should implement something similar?
				const resetFunction = () => {
					target.value = this.language?.isoCode ?? '';
				};

				target.addEventListener('close', resetFunction, { once: true });
				target.addEventListener('blur', resetFunction, { once: true });
			}
		}
	}

	#handleSearchChange(event: Event) {
		const target = event.composedPath()[0] as UUIComboboxElement;
		this._search = target.search;
	}

	#handleDefaultChange(event: UUIBooleanInputEvent) {
		if (event instanceof UUIBooleanInputEvent) {
			const target = event.composedPath()[0] as UUIToggleElement;
			this.#languageWorkspaceContext?.setDefault(target.checked);
		}
	}

	#handleMandatoryChange(event: UUIBooleanInputEvent) {
		if (event instanceof UUIBooleanInputEvent) {
			const target = event.composedPath()[0] as UUIToggleElement;
			this.#languageWorkspaceContext?.setMandatory(target.checked);
		}
	}

	#handleFallbackChange(event: UUIComboboxEvent) {
		if (event instanceof UUIComboboxEvent) {
			const target = event.composedPath()[0] as UUIComboboxElement;
			this.#languageWorkspaceContext?.setFallbackCulture(target.value.toString());
		}
	}

	get #filteredCultures(): Array<CultureModel> {
		return this._cultures.filter((culture) => {
			return culture.englishName?.toLowerCase().includes(this._search.toLowerCase());
		});
	}

	get #fallbackLanguages() {
		return this._languages.filter((language) => {
			return language.isoCode !== this.language?.isoCode;
		});
	}

	get #fallbackLanguage() {
		return this.#fallbackLanguages.find((language) => language.isoCode === this.language?.fallbackIsoCode);
	}

	get #fromAvailableCultures() {
		return this._cultures.find((culture) => culture.name === this.language?.isoCode);
	}

	#renderCultureWarning() {
		if (!this._startData?.isoCode || this._startData?.isoCode === this.language?.isoCode) return nothing;

		return html`<div id="culture-warning">
			Changing the culture for a language may be an expensive operation and will result in the content cache and indexes
			being rebuilt.
		</div>`;
	}

	#renderDefaultLanguageWarning() {
		if (this._startData?.isDefault || this.language?.isDefault !== true) return nothing;

		return html`<div id="default-language-warning">
			Switching default language may result in default content missing.
		</div>`;
	}

	render() {
		if (!this.language) return nothing;

		return html`
			<uui-box>
				<umb-workspace-property-layout label="Language">
					<div slot="editor">
						<uui-combobox
							value=${ifDefined(this.#fromAvailableCultures?.name)}
							@change=${this.#handleLanguageChange}
							@search=${this.#handleSearchChange}>
							<uui-combobox-list>
								${repeat(
									this.#filteredCultures,
									(language) => language.name,
									(language) =>
										html`
											<uui-combobox-list-option value=${ifDefined(language.name)}
												>${language.englishName}</uui-combobox-list-option
											>
										`
								)}
							</uui-combobox-list>
						</uui-combobox>
						${this.#renderCultureWarning()}
					</div>
				</umb-workspace-property-layout>
				<umb-workspace-property-layout label="ISO Code">
					<div slot="editor">${this.language.isoCode}</div>
				</umb-workspace-property-layout>
				<umb-workspace-property-layout label="Settings">
					<div slot="editor">
						<uui-toggle
							?disabled=${this._startData?.isDefault}
							?checked=${this.language.isDefault || false}
							@change=${this.#handleDefaultChange}>
							<div>
								<b>Default language</b>
								<div>An Umbraco site can only have one default language set.</div>
							</div>
						</uui-toggle>
						${this.#renderDefaultLanguageWarning()}
						<hr />
						<uui-toggle ?checked=${this.language.isMandatory || false} @change=${this.#handleMandatoryChange}>
							<div>
								<b>Mandatory language</b>
								<div>Properties on this language have to be filled out before the node can be published.</div>
							</div>
						</uui-toggle>
					</div>
				</umb-workspace-property-layout>
				<umb-workspace-property-layout
					label="Fallback language"
					description="To allow multi-lingual content to fall back to another language if not present in the requested language, select it here.">
					<uui-combobox
						slot="editor"
						value=${ifDefined(this.#fallbackLanguage?.isoCode)}
						@change=${this.#handleFallbackChange}>
						<uui-combobox-list>
							${repeat(
								this.#fallbackLanguages,
								(language) => language.isoCode,
								(language) =>
									html`
										<uui-combobox-list-option value=${ifDefined(language.isoCode)}
											>${language.name}</uui-combobox-list-option
										>
									`
							)}
						</uui-combobox-list>
					</uui-combobox>
				</umb-workspace-property-layout>
			</uui-box>
		`;
	}
}

export default UmbEditLanguageWorkspaceViewElement;

declare global {
	interface HTMLElementTagNameMap {
		'umb-edit-language-workspace-view': UmbEditLanguageWorkspaceViewElement;
	}
}
