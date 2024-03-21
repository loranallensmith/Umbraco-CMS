import type { UmbRoutableWorkspaceContext } from '../../workspace/contexts/routable-workspace-context.interface.js';
import type { UmbWorkspaceContextInterface } from '../../workspace/contexts/workspace-context.interface.js';
import type { UmbControllerHostElement } from '@umbraco-cms/backoffice/controller-api';
import type { ManifestElementAndApi } from '@umbraco-cms/backoffice/extension-api';

// TODO: Missing Extension API Interface:
export interface ManifestWorkspace<
	MetaType extends MetaWorkspace = MetaWorkspace,
	ElementType extends UmbControllerHostElement = UmbControllerHostElement,
	ApiType extends UmbWorkspaceContextInterface = UmbWorkspaceContextInterface,
> extends ManifestElementAndApi<ElementType, ApiType> {
	type: 'workspace';
	meta: MetaType;
}

export interface MetaWorkspace {
	entityType: string;
}

export interface ManifestWorkspaceRoutableKind
	extends ManifestWorkspace<MetaWorkspaceRoutableKind, UmbControllerHostElement, UmbRoutableWorkspaceContext> {
	type: 'workspace';
	kind: 'routable';
}

export interface MetaWorkspaceRoutableKind extends MetaWorkspace {}
