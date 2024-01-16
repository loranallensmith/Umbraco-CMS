import { UmbStylesheetDetailModel } from '../index.js';
import { UmbStylesheetTreeRepository } from '../tree/index.js';
import { UmbStylesheetServerDataSource } from './sources/stylesheet.server.data.js';
import { UmbStylesheetFolderServerDataSource } from './sources/stylesheet.folder.server.data.js';
import { UmbBaseController } from '@umbraco-cms/backoffice/class-api';
import { type UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import {
	DataSourceResponse,
	UmbDataSourceErrorResponse,
	UmbDetailRepository,
	UmbFolderRepository,
} from '@umbraco-cms/backoffice/repository';
import {
	CreateFolderRequestModel,
	CreateStylesheetRequestModel,
	ExtractRichTextStylesheetRulesRequestModel,
	ExtractRichTextStylesheetRulesResponseModel,
	FolderResponseModel,
	InterpolateRichTextStylesheetRequestModel,
	InterpolateRichTextStylesheetResponseModel,
	PagedStylesheetOverviewResponseModel,
	ProblemDetails,
	RichTextStylesheetRulesResponseModel,
	UpdateStylesheetRequestModel,
	UpdateTextFileViewModelBaseModel,
} from '@umbraco-cms/backoffice/backend-api';
import { UmbApi } from '@umbraco-cms/backoffice/extension-api';
import { UmbId } from '@umbraco-cms/backoffice/id';

export class UmbStylesheetRepository
	extends UmbBaseController
	implements
		UmbDetailRepository<CreateStylesheetRequestModel, string, UpdateStylesheetRequestModel, UmbStylesheetDetailModel>,
		UmbFolderRepository,
		UmbApi
{
	#dataSource;
	#folderDataSource;

	// TODO: temp solution until it is automated
	#treeRepository = new UmbStylesheetTreeRepository(this);

	constructor(host: UmbControllerHost) {
		super(host);

		// TODO: figure out how spin up get the correct data source
		this.#dataSource = new UmbStylesheetServerDataSource(this);
		this.#folderDataSource = new UmbStylesheetFolderServerDataSource(this);
	}

	//#region FOLDER:

	createFolderScaffold(parentId: string | null) {
		const data: FolderResponseModel = {
			id: UmbId.new(),
			name: '',
			parentId,
		};
		return Promise.resolve({ data, error: undefined });
	}

	async createFolder(folderRequest: CreateFolderRequestModel) {
		const req = {
			parentPath: folderRequest.parentId,
			name: folderRequest.name,
		};
		const promise = this.#folderDataSource.create(req);
		await promise;
		this.#treeRepository.requestTreeItemsOf(folderRequest.parentId ? folderRequest.parentId : null);
		return promise;
	}

	async requestFolder(unique: string) {
		return this.#folderDataSource.read(unique);
	}

	updateFolder(): any {
		throw new Error('Method not implemented.');
	}

	async deleteFolder(path: string): Promise<{ error?: ProblemDetails | undefined }> {
		const { data } = await this.requestFolder(path);
		const promise = this.#folderDataSource.delete(path);
		await promise;
		this.#treeRepository.requestTreeItemsOf(data?.parentPath ? data?.parentPath : null);
		return promise;
	}

	//#endregion

	//#region DETAIL:

	createScaffold(): any {
		throw new Error('Method not implemented.');
	}

	async requestById(id: string) {
		if (!id) throw new Error('id is missing');
		return this.#dataSource.read(id);
	}

	byId(id: string): any {
		throw new Error('Method not implemented.');
	}

	async create(data: CreateStylesheetRequestModel) {
		const promise = this.#dataSource.create(data);
		await promise;
		this.#treeRepository.requestTreeItemsOf(data.parentPath ? data.parentPath : null);
		return promise;
	}

	save(id: string, data: UpdateTextFileViewModelBaseModel) {
		return this.#dataSource.update(id, data);
	}

	delete(id: string): Promise<UmbDataSourceErrorResponse> {
		const promise = this.#dataSource.delete(id);
		const parentPath = id.substring(0, id.lastIndexOf('/'));
		this.#treeRepository.requestTreeItemsOf(parentPath ? parentPath : null);
		return promise;
	}

	async getAll(skip?: number, take?: number): Promise<DataSourceResponse<PagedStylesheetOverviewResponseModel>> {
		return this.#dataSource.getAll(skip, take);
	}

	getStylesheetRules(
		path: string,
	): Promise<DataSourceResponse<RichTextStylesheetRulesResponseModel | ExtractRichTextStylesheetRulesResponseModel>> {
		return this.#dataSource.getStylesheetRichTextRules(path);
	}
	/**
	 * Existing content + array of rules => new content string
	 *
	 * @param {InterpolateRichTextStylesheetRequestModel} data
	 * @return {*}  {Promise<DataSourceResponse<InterpolateRichTextStylesheetResponseModel>>}
	 * @memberof UmbStylesheetRepository
	 */
	interpolateStylesheetRules(
		data: InterpolateRichTextStylesheetRequestModel,
	): Promise<DataSourceResponse<InterpolateRichTextStylesheetResponseModel>> {
		return this.#dataSource.postStylesheetRichTextInterpolateRules(data);
	}
	/**
	 * content string => array of rules
	 *
	 * @param {ExtractRichTextStylesheetRulesRequestModel} data
	 * @return {*}  {Promise<DataSourceResponse<ExtractRichTextStylesheetRulesResponseModel>>}
	 * @memberof UmbStylesheetRepository
	 */
	extractStylesheetRules(
		data: ExtractRichTextStylesheetRulesRequestModel,
	): Promise<DataSourceResponse<ExtractRichTextStylesheetRulesResponseModel>> {
		return this.#dataSource.postStylesheetRichTextExtractRules(data);
	}

	//#endregion
}
