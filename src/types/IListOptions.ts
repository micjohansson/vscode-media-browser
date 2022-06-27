import { MediaType } from '.';

export interface IListOptions {
	searchTerm: string | undefined;
	caseInsensitiveSearch: boolean;
	omit: Set<MediaType>;
}
