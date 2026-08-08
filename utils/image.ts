import { File } from 'expo-file-system'

/**
 * Converts a local image file into a base64-encoded string.
 *
 * @param uri - `file://` URI of the image, e.g. the one returned by
 *   `expo-camera`'s `takePictureAsync()`.
 * @returns The raw base64 string of the image contents — pass it as
 *   `image_base64` when calling the backend's `POST /meals/create` endpoint.
 */
export async function imageToBase64(uri: string): Promise<string> {
    if (!uri) {
        throw new Error('imageToBase64: an image URI is required')
    }
    const file = new File(uri)
    return await file.base64()
}
