import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";
const FOLDER_PATH = process.env.SKIN_DISEASES_HISTORY_FOLDER_PATH || "";
const LIMPING_FOLDER_PATH =
  process.env.LIMPING_DETECTION_HISTORY_FOLDER_PATH || "";

// Get S3 client with proper configuration
function getS3Client() {
  const region = process.env.NEXT_AWS_REGION || "ap-southeast-2";

  return new S3Client({
    region: region,
    credentials: {
      accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
    },
    // Force path style can help with region redirects
    forcePathStyle: false,
  });
}

/**
 * Upload a video buffer to S3
 * @param buffer - The video file buffer
 * @param filename - The filename to use in S3
 * @param contentType - The MIME type of the video
 * @returns The S3 URL of the uploaded video
 */
export async function uploadVideoToS3(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  // Construct the S3 key (path) for the video using limping folder path
  const s3Key = LIMPING_FOLDER_PATH
    ? `${LIMPING_FOLDER_PATH.replace(/^\/+|\/+$/g, "")}/${filename}`
    : filename;

  const s3Client = getS3Client();
  const region = process.env.NEXT_AWS_REGION || "ap-southeast-2";

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Construct and return the S3 URL
    const s3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;

    return s3Url;
  } catch (error: any) {
    // Handle PermanentRedirect error - bucket is in a different region
    if (
      error?.Code === "PermanentRedirect" ||
      error?.name === "PermanentRedirect"
    ) {
      const endpoint = error?.Endpoint || "";
      const regionMatch = endpoint.match(/\.s3\.([^.]+)\.amazonaws\.com/);
      const actualRegion = regionMatch ? regionMatch[1] : null;

      if (actualRegion && actualRegion !== region) {
        try {
          const correctS3Client = new S3Client({
            region: actualRegion,
            credentials: {
              accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
            },
            forcePathStyle: false,
          });

          const retryCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: contentType,
          });

          await correctS3Client.send(retryCommand);

          const s3Url = `https://${BUCKET_NAME}.s3.${actualRegion}.amazonaws.com/${s3Key}`;
          return s3Url;
        } catch (retryError: any) {
          console.error(
            "Error uploading video to S3 after region retry:",
            retryError,
          );
          throw new Error(
            `Failed to upload video to S3: ${retryError?.message || retryError?.Code || "Unknown error"}`,
          );
        }
      }
    }

    console.error("Error uploading video to S3:", error);
    throw new Error(
      `Failed to upload video to S3: ${error?.message || error?.Code || "Unknown error"}`,
    );
  }
}

/**
 * Upload an image buffer to S3
 * @param buffer - The image file buffer
 * @param filename - The filename to use in S3
 * @param contentType - The MIME type of the image
 * @returns The S3 URL of the uploaded image
 */
export async function uploadImageToS3(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  // Construct the S3 key (path) for the image
  const s3Key = FOLDER_PATH
    ? `${FOLDER_PATH.replace(/^\/+|\/+$/g, "")}/${filename}`
    : filename;

  const s3Client = getS3Client();
  const region = process.env.NEXT_AWS_REGION || "ap-southeast-2";

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      // Note: ACL is optional. If your bucket has ACL disabled, remove this line
      // and ensure your bucket policy allows public read access if needed
      // ACL: "public-read",
    });

    await s3Client.send(command);

    // Construct and return the S3 URL
    // Use the region from env, or try to detect from the actual bucket location
    const s3Url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${s3Key}`;

    return s3Url;
  } catch (error: any) {
    // Handle PermanentRedirect error - bucket is in a different region
    if (
      error?.Code === "PermanentRedirect" ||
      error?.name === "PermanentRedirect"
    ) {
      // Extract region from error endpoint if available
      const endpoint = error?.Endpoint || "";
      const regionMatch = endpoint.match(/\.s3\.([^.]+)\.amazonaws\.com/);
      const actualRegion = regionMatch ? regionMatch[1] : null;

      if (actualRegion && actualRegion !== region) {
        // Silently retry with the correct region (this is expected behavior)
        try {
          const correctS3Client = new S3Client({
            region: actualRegion,
            credentials: {
              accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
            },
            forcePathStyle: false,
          });

          const retryCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: contentType,
          });

          await correctS3Client.send(retryCommand);

          // Return URL with correct region
          const s3Url = `https://${BUCKET_NAME}.s3.${actualRegion}.amazonaws.com/${s3Key}`;
          return s3Url;
        } catch (retryError: any) {
          // If retry also fails, log and throw
          console.error(
            "Error uploading to S3 after region retry:",
            retryError,
          );
          throw new Error(
            `Failed to upload image to S3: ${retryError?.message || retryError?.Code || "Unknown error"}`,
          );
        }
      }
    }

    // Log and throw for other errors
    console.error("Error uploading to S3:", error);
    throw new Error(
      `Failed to upload image to S3: ${error?.message || error?.Code || "Unknown error"}`,
    );
  }
}

/**
 * Get the S3 URL for an image (useful for constructing URLs from stored keys)
 * @param s3Key - The S3 key (path) of the image
 * @returns The full S3 URL
 */
export function getS3Url(s3Key: string, region?: string): string {
  const bucketRegion =
    region || process.env.NEXT_AWS_REGION || "ap-southeast-2";
  const bucket = process.env.S3_BUCKET_NAME || "";
  return `https://${bucket}.s3.${bucketRegion}.amazonaws.com/${s3Key}`;
}

/**
 * Extract S3 key from an S3 URL
 * @param s3Url - The full S3 URL
 * @returns The S3 key (path) or null if not a valid S3 URL
 */
export function extractS3KeyFromUrl(s3Url: string): string | null {
  if (!s3Url || typeof s3Url !== "string") return null;

  // Match S3 URL pattern: https://bucket.s3.region.amazonaws.com/key
  const s3UrlPattern = /https?:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/;
  const match = s3Url.match(s3UrlPattern);

  if (match && match[3]) {
    return decodeURIComponent(match[3]);
  }

  // Also handle path-style URLs: https://s3.region.amazonaws.com/bucket/key
  const pathStylePattern =
    /https?:\/\/s3\.([^.]+)\.amazonaws\.com\/([^\/]+)\/(.+)/;
  const pathMatch = s3Url.match(pathStylePattern);

  if (pathMatch && pathMatch[3]) {
    return decodeURIComponent(pathMatch[3]);
  }

  return null;
}

/**
 * Check if a URL is an S3 URL
 * @param url - The URL to check
 * @returns True if it's an S3 URL
 */
export function isS3Url(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return url.includes(".s3.") && url.includes(".amazonaws.com");
}

/**
 * Delete an object from S3
 * @param s3Key - The S3 key (path) of the object to delete
 * @returns True if successful
 */
export async function deleteFromS3(s3Key: string): Promise<boolean> {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  if (!s3Key) {
    return false;
  }

  const s3Client = getS3Client();
  const region = process.env.NEXT_AWS_REGION || "ap-southeast-2";

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    // Handle PermanentRedirect error - bucket is in a different region
    if (
      error?.Code === "PermanentRedirect" ||
      error?.name === "PermanentRedirect"
    ) {
      const endpoint = error?.Endpoint || "";
      const regionMatch = endpoint.match(/\.s3\.([^.]+)\.amazonaws\.com/);
      const actualRegion = regionMatch ? regionMatch[1] : null;

      if (actualRegion && actualRegion !== region) {
        try {
          const correctS3Client = new S3Client({
            region: actualRegion,
            credentials: {
              accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
            },
            forcePathStyle: false,
          });

          const retryCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
          });

          await correctS3Client.send(retryCommand);
          return true;
        } catch (retryError: any) {
          console.error(
            "Error deleting from S3 after region retry:",
            retryError,
          );
          return false;
        }
      }
    }

    console.error("Error deleting from S3:", error);
    return false;
  }
}

/**
 * Delete an object from S3 by URL
 * @param s3Url - The full S3 URL of the object to delete
 * @returns True if successful
 */
export async function deleteFromS3ByUrl(s3Url: string): Promise<boolean> {
  const s3Key = extractS3KeyFromUrl(s3Url);
  if (!s3Key) {
    console.warn(`Could not extract S3 key from URL: ${s3Url}`);
    return false;
  }
  return deleteFromS3(s3Key);
}

/**
 * Delete multiple objects from S3
 * @param s3Keys - Array of S3 keys to delete
 * @returns Number of successfully deleted objects
 */
export async function deleteMultipleFromS3(s3Keys: string[]): Promise<number> {
  if (!s3Keys || s3Keys.length === 0) return 0;

  const deletePromises = s3Keys.map((key) => deleteFromS3(key));
  const results = await Promise.allSettled(deletePromises);

  return results.filter((r) => r.status === "fulfilled" && r.value === true)
    .length;
}

/**
 * Delete multiple objects from S3 by URLs
 * @param s3Urls - Array of S3 URLs to delete
 * @returns Number of successfully deleted objects
 */
export async function deleteMultipleFromS3ByUrls(
  s3Urls: string[],
): Promise<number> {
  if (!s3Urls || s3Urls.length === 0) return 0;

  const s3Keys = s3Urls
    .map((url) => extractS3KeyFromUrl(url))
    .filter((key): key is string => key !== null);

  return deleteMultipleFromS3(s3Keys);
}
