import { MediaTypeUtil } from "../types";

export function useMimeTypeRegex() {
	const {
		audio, image, video,
	} = MediaTypeUtil.mimeType;
	return new RegExp(`^(${audio}|${image}|${video})`);
}