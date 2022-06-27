export const MIME_TYPE = {
	audio: `audio`,
	image: `image`,
	video: `video`,
};

export enum MediaType {
	unknown = "Unknown",
	audio = "Audio",
	image = "Image",
	video = "Video"
}

export class MediaTypeUtil {
	static mimeType = MIME_TYPE;
	
	public static typeFromMime(mime: string): MediaType {
		const {
			audio,
			image,
			video,
		} = MIME_TYPE;
		switch (mime.split('/')[0]) {
			case audio:
				return MediaType.audio;
			case image:
				return MediaType.image;
			case video:
				return MediaType.video;
			default:
				return MediaType.unknown;
		}
	}

	public static getMimeType(type: MediaType): string | undefined {
		switch (type) {
			case MediaType.audio:
				return MIME_TYPE.audio;
			case MediaType.image:
				return MIME_TYPE.image;
			case MediaType.video:
				return MIME_TYPE.video;
			default:
				break;
		}
	}
}