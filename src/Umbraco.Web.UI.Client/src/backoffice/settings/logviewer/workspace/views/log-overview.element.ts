import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { clamp } from 'lodash-es';
import {
	LogLevel,
	UmbLogViewerWorkspaceContext,
	UMB_APP_LOG_VIEWER_CONTEXT_TOKEN,
} from '../logviewer-root/logviewer-root.context';
import { SavedLogSearchModel, PagedLogTemplateModel } from '@umbraco-cms/backend-api';
import { UmbLitElement } from '@umbraco-cms/element';

@customElement('umb-log-search-workspace-overview')
export class UmbLogSearchWorkspaceElement extends UmbLitElement {
	static styles = [
		css`
			:host {
				display: block;

				--umb-log-viewer-debug-color: var(--uui-color-default-emphasis);
				--umb-log-viewer-information-color: var(--uui-color-positive);
				--umb-log-viewer-warning-color: var(--uui-color-warning);
				--umb-log-viewer-error-color: var(--uui-color-danger);
				--umb-log-viewer-fatal-color: var(--uui-color-default);
				--umb-log-viewer-verbose-color: var(--uui-color-current);
			}

			#logviewer-layout {
				margin: 20px;
			}

			#logviewer-layout {
				height: calc(100vh - 160px);
				display: grid;
				grid-template-columns: 7fr 2fr;
				grid-template-rows: 1fr 1fr;
				gap: 20px 20px;
				grid-auto-flow: row;
				grid-template-areas:
					'saved-searches info'
					'common-messages info';
			}

			#info {
				grid-area: info;
				align-self: start;
				display: grid;
				grid-template-columns: repeat(2, 1fr);
				grid-template-rows: repeat(4, 1fr);
				gap: 20px 20px;
			}

			#time-period {
				grid-area: 1 / 1 / 2 / 3;
			}

			#date-input-container {
			}

			#errors {
				grid-area: 2 / 1 / 3 / 2;
			}

			#level {
				grid-area: 2 / 2 / 3 / 3;
			}

			#types {
				grid-area: 3 / 1 / 5 / 3;
			}

			#log-types-container {
				display: flex;
				gap: var(--uui-size-space-4);
				flex-direction: column-reverse;
				align-items: center;
				justify-content: space-between;
			}

			#saved-searches-container {
				grid-area: saved-searches;
			}

			#common-messages-container {
				grid-area: common-messages;
				--uui-box-default-padding: 0 var(--uui-size-space-5, 18px) var(--uui-size-space-5, 18px)
					var(--uui-size-space-5, 18px);
			}

			#saved-searches-container > uui-box,
			#common-messages-container > uui-box {
				height: 100%;
			}

			input {
				font-family: inherit;
				padding: var(--uui-size-1) var(--uui-size-space-3);
				font-size: inherit;
				color: inherit;
				border-radius: 0;
				box-sizing: border-box;
				border: none;
				background: none;
				width: 100%;
				text-align: inherit;
				outline: none;
			}

			ul {
				list-style: none;
				margin: 0;
				padding: 0;
				border: 0;
				font-size: 100%;
				font: inherit;
				vertical-align: baseline;
			}

			li {
				display: flex;
				align-items: center;
			}

			li uui-icon {
				margin-right: 1em;
			}

			uui-table-cell {
				padding: 10px 20px;
				height: unset;
			}

			uui-table-row {
				cursor: pointer;
			}

			uui-table-row:hover > uui-table-cell {
				background-color: var(--uui-color-surface-alt);
			}

			uui-label:nth-of-type(2) {
				display: block;
				margin-top: var(--uui-size-space-5);
			}

			button {
				all: unset;
				display: flex;
				align-items: center;
				cursor: pointer;
			}

			button:focus {
				outline: 1px solid var(--uui-color-focus);
			}

			button.active {
				text-decoration: line-through;
			}

			#chart {
				width: 150px;
				aspect-ratio: 1;
				background: radial-gradient(white 40%, transparent 41%),
					conic-gradient(
						var(--umb-log-viewer-debug-color) 0% 20%,
						var(--umb-log-viewer-information-color) 20% 40%,
						var(--umb-log-viewer-warning-color) 40% 60%,
						var(--umb-log-viewer-error-color) 60% 80%,
						var(--umb-log-viewer-fatal-color) 80% 100%
					);
				margin: 10px;
				display: inline-block;
				border-radius: 50%;
			}

			#show-more-templates-btn {
				margin-top: var(--uui-size-space-5);
			}

			a {
				display: flex;
				align-items: center;
				justify-content: space-between;
				text-decoration: none;
				color: inherit;
			}
		`,
	];

	get today() {
		const today = new Date();
		const dd = String(today.getDate()).padStart(2, '0');
		const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
		const yyyy = today.getFullYear();

		return yyyy + '-' + mm + '-' + dd;
	}

	get yesterday() {
		const today = new Date();
		const dd = String(today.getDate() - 1).padStart(2, '0');
		const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
		const yyyy = today.getFullYear();

		return yyyy + '-' + mm + '-' + dd;
	}

	@state()
	private _savedSearches: SavedLogSearchModel[] = [];

	@state()
	private _messageTemplates: PagedLogTemplateModel | null = null;

	@state()
	private _totalLogCount = 0;

	@state()
	private _logLevelCountFilter: string[] = [];

	@state()
	private logLevelCount: [string, number][] = [];

	@state()
	private _logLevelCount: LogLevel | null = null;

	@state()
	private _startDate = this.yesterday;

	@state()
	private _endDate = this.today;

	#logViewerContext?: UmbLogViewerWorkspaceContext;

	setLogLevelCount() {
		this.logLevelCount = this._logLevelCount
			? Object.entries(this._logLevelCount).filter(([level, number]) => !this._logLevelCountFilter.includes(level))
			: [];
		this._totalLogCount = this._logLevelCount
			? this.logLevelCount.flatMap((arr) => arr[1]).reduce((acc, count) => acc + count, 0)
			: 0;
	}

	load(): void {
		// Not relevant for this workspace -added to prevent the error from popping up
		console.log('Loading something from somewhere');
	}

	create(): void {
		// Not relevant for this workspace
	}

	constructor() {
		super();
		this.consumeContext(UMB_APP_LOG_VIEWER_CONTEXT_TOKEN, (instance) => {
			this.#logViewerContext = instance;
			this.#observeStuff();
			this.getData();
		});
	}

	#observeStuff() {
		if (!this.#logViewerContext) return;
		this.observe(this.#logViewerContext.savedSearches, (savedSearches) => {
			this._savedSearches = savedSearches ?? [];
		});

		this.observe(this.#logViewerContext.logCount, (logLevel) => {
			this._logLevelCount = logLevel ?? null;

			this.setLogLevelCount();
		});

		this.observe(this.#logViewerContext.messageTemplates, (templates) => {
			this._messageTemplates = templates ?? null;
		});
	}

	async getData() {
		if (!this.#logViewerContext) return;

		try {
			await Promise.all([
				this.#logViewerContext.getSavedSearches(),
				this.#logViewerContext.getLogCount(this.today, this.yesterday),
				this.#logViewerContext.getMessageTemplates(0, 10),
			]);
		} catch (e) {
			console.error(e);
		}
	}

	protected willUpdate(_changedProperties: Map<PropertyKey, unknown>): void {
		if (_changedProperties.has('_logLevelCountFilter')) {
			this.setLogLevelCount();
			this._totalLogCount = this._logLevelCount
				? this.logLevelCount.flatMap((arr) => arr[1]).reduce((acc, count) => acc + count, 0)
				: 0;
		}
	}

	#calculatePercentage(partialValue: number) {
		if (this._totalLogCount === 0) return 0;
		const percent = Math.round((100 * partialValue) / this._totalLogCount);
		return clamp(percent, 0, 99);
	}

	#setDates(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.id === 'start-date') {
			this._startDate = target.value;
		} else if (target.id === 'end-date') {
			this._endDate = target.value;
		}
		console.log('start date: ' + this._startDate);
	}

	#renderSearchItem(searchListItem: SavedLogSearchModel) {
		return html` <li>
			<uui-button
				label="${searchListItem.name}"
				title="${searchListItem.name}"
				href=${'/section/settings/logviewer/search?lq=' + searchListItem.query}
				><uui-icon name="umb:search"></uui-icon>${searchListItem.name}</uui-button
			>
		</li>`;
	}

	#setCountFilter(level: string) {
		if (this._logLevelCountFilter.includes(level)) {
			this._logLevelCountFilter = this._logLevelCountFilter.filter((item) => item !== level);
			return;
		}

		this._logLevelCountFilter = [...this._logLevelCountFilter, level];
	}

	render() {
		return html` 

			<div id="logviewer-layout">
				<div id="info">

					<uui-box id="time-period" headline="Time Period">
						<div id="date-input-container" @input=${this.#setDates}>
							<uui-label for="start-date">From:</uui-label> 
							<input 
								id="start-date" 
								type="date" 
								label="From" 
								max="${this.today}"
								.value=${this._startDate}>
							</input>
							<uui-label for="end-date">To: </uui-label>
							<input 
								id="end-date" 
								type="date" 
								label="To" 
								max="${this.today}" 
								.value=${this._endDate}>
							</input>
						</div>
					</uui-box>

					<uui-box id="errors" headline="Number of Errors"></uui-box>

					<uui-box id="level" headline="Log level"></uui-box>

					<uui-box id="types" headline="Log types">
						<div id="log-types-container">
							<div id="legend">
								<ul>
									${
										this._logLevelCount
											? Object.keys(this._logLevelCount).map(
													(level) =>
														html`<li>
															<button
																@click=${(e: Event) => {
																	(e.target as HTMLElement)?.classList.toggle('active');
																	this.#setCountFilter(level);
																}}>
																<uui-icon
																	name="umb:record"
																	style="color: var(--umb-log-viewer-${level.toLowerCase()}-color);"></uui-icon
																>${level}
															</button>
														</li>`
											  )
											: ''
									}
								</ul>
							</div>
							<umb-donut-chart>
							${
								this._logLevelCount
									? this.logLevelCount.map(
											([level, number]) =>
												html`<umb-donut-slice
													.name=${level}
													.amount=${number}
													.percent=${this.#calculatePercentage(number)}
													.color="${`var(--umb-log-viewer-${level.toLowerCase()}-color)`}"></umb-donut-slice> `
									  )
									: ''
							}
							</umb-donut-chart>
						</div>
					</uui-box>
				</div>

				<div id="saved-searches-container">
					<uui-box id="saved-searches" headline="Saved searches">
						<ul>${this._savedSearches.map(this.#renderSearchItem)}</ul>
					</uui-box>
				</div>

				<div id="common-messages-container">
					<uui-box headline="Common Log Messages" id="saved-searches">
						<p style="font-style: italic;">Total Unique Message types: ${this._messageTemplates?.total}</p>
					<uui-table>
					${
						this._messageTemplates
							? this._messageTemplates.items.map(
									(template) =>
										html`<uui-table-row
											><uui-table-cell>
												<a
													href=${'/section/settings/logviewer/search?lg=@MessageTemplate%3D' +
													template.messageTemplate}>
													<span>${template.messageTemplate}</span> <span>${template.count}</span>
												</a>
											</uui-table-cell>
										</uui-table-row>`
							  )
							: ''
					}
			</uui-table>
					<uui-button id="show-more-templates-btn" look="primary">Show more</uui-button>
					</uui-box>
				</div>
			</div>
`;
	}
}

export default UmbLogSearchWorkspaceElement;

declare global {
	interface HTMLElementTagNameMap {
		'umb-log-search-workspace-overview': UmbLogSearchWorkspaceElement;
	}
}
